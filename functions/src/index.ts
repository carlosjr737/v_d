// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";

import { initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import Stripe from "stripe";

// -------------------------------------------------------
// Opções globais (região + secrets para TODAS as functions)
// -------------------------------------------------------
setGlobalOptions({
  region: "southamerica-east1",
  secrets: [
    "STRIPE_SECRET_KEY",
    "STRIPE_PRICE_ID_ANNUAL",
    "STRIPE_PRICE_ID_MONTHLY",
    "STRIPE_SUCCESS_URL",
    "STRIPE_CANCEL_URL",
    "STRIPE_WEBHOOK_SECRET",
  ],
});

// -------------------------------------------------------
// Firebase Admin / Firestore / Stripe
// -------------------------------------------------------
initializeApp();
const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const DEFAULT_PRICE_IDS = {
  annual: "price_1SIVeBKFaEtennkkBmuMbWUQ",
  monthly: "price_1SIVa2KFaEtennkkgNcgdsny",
} as const;

function extractPriceIds(raw: string | undefined, fallback: string): string[] {
  const candidates = (raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (!candidates.length) {
    candidates.push(fallback);
  }

  return candidates;
}

const ANNUAL_PRICE_IDS = extractPriceIds(process.env.STRIPE_PRICE_ID_ANNUAL, DEFAULT_PRICE_IDS.annual);
const MONTHLY_PRICE_IDS = extractPriceIds(process.env.STRIPE_PRICE_ID_MONTHLY, DEFAULT_PRICE_IDS.monthly);

const KNOWN_ANNUAL_PRICE_IDS = new Set(ANNUAL_PRICE_IDS);
const KNOWN_MONTHLY_PRICE_IDS = new Set(MONTHLY_PRICE_IDS);

type ActivePlan = "annual" | "monthly";

const ACTIVE_PRICE_CACHE = new Map<ActivePlan, string>();

async function resolveActivePriceId(plan: ActivePlan): Promise<string> {
  const cached = ACTIVE_PRICE_CACHE.get(plan);
  if (cached) {
    return cached;
  }

  const candidates = plan === "annual" ? ANNUAL_PRICE_IDS : MONTHLY_PRICE_IDS;

  for (const candidate of candidates) {
    try {
      const price = await stripe.prices.retrieve(candidate);
      if (price.active) {
        ACTIVE_PRICE_CACHE.set(plan, candidate);
        return candidate;
      }
      logger.warn("resolveActivePriceId: price inactive", { plan, priceId: candidate });
    } catch (err) {
      logger.warn("resolveActivePriceId: failed to retrieve price", {
        plan,
        priceId: candidate,
        error: (err as Error)?.message,
      });
    }
  }

  throw new Error(`no-active-price-${plan}`);
}

function inferPlanFromPrice(priceId?: string | null): Plan {
  if (!priceId) return null;
  if (KNOWN_ANNUAL_PRICE_IDS.has(priceId)) return "annual";
  if (KNOWN_MONTHLY_PRICE_IDS.has(priceId)) return "monthly";
  return null;
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
type ReqLite = {
  method: string;
  headers: Record<string, unknown>;
  body?: unknown;
  rawBody?: Buffer;
};
type ResLite = {
  setHeader(name: string, value: string): void;
  status(code: number): ResLite;
  send(body?: string): void;
  json(body: unknown): void;
};

const ALLOWED_ORIGINS = new Set<string>([
  "https://v-d-sigma.vercel.app",
  "http://localhost:5173",
]);

function applyCors(req: ReqLite, res: ResLite): void {
  const originHeader = req.headers["origin"];
  const origin = typeof originHeader === "string" ? originHeader : "";
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Firebase-AppCheck, Stripe-Signature"
  );
}

async function verifyBearer(req: ReqLite): Promise<DecodedIdToken> {
  const authHeader = req.headers["authorization"];
  const hdr = typeof authHeader === "string" ? authHeader : "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) throw new Error("missing-token");
  return getAuth().verifyIdToken(token);
}

type Plan = "annual" | "monthly" | null;

// -------------------------------------------------------
// GET protegido – retorna { active } (o que o front espera)
// -------------------------------------------------------
export const checkEntitlement = onRequest(async (req, res) => {
  applyCors(req as any, res as any);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const decoded = await verifyBearer(req as any);
    const uid = decoded.uid;

    const snap = await db.collection("users").doc(uid).get();
    const entitlement = (snap.exists ? (snap.data() as any)?.entitlement : null) ?? {};

    const active = !!entitlement.active;
    const plan = ((entitlement.plan ?? null) as Plan) || null;
    const currentPeriodEnd =
      typeof entitlement.currentPeriodEnd === "number" ? entitlement.currentPeriodEnd : null;
    const expiresAt =
      typeof currentPeriodEnd === "number"
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null;

    res.json({ active, plan, currentPeriodEnd, expiresAt });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    logger.error("checkEntitlement error", msg);
    res.status(msg === "missing-token" ? 401 : 400).json({ error: msg });
  }
});

// -------------------------------------------------------
// POST – cria sessão do Stripe Checkout
// -------------------------------------------------------
export const createCheckoutSession = onRequest(async (req, res) => {
  applyCors(req as any, res as any);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method-not-allowed" });
      return;
    }

    const decoded = await verifyBearer(req as any);
    const uid = decoded.uid;
    const email = decoded.email ?? undefined;

    const body = (req.body ?? {}) as Partial<{
      plan: "annual" | "monthly";
      promoCode?: string | null;
    }>;
    const plan = body.plan ?? "monthly";

    const priceId = await resolveActivePriceId(plan);

    if (!priceId) {
      res.status(500).json({ error: "missing-price-id" });
      return;
    }

    // customer por usuário
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    let customerId = (snap.exists
      ? (snap.data() as any)?.stripeCustomerId
      : undefined) as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUID: uid },
      });
      customerId = customer.id;
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }


    const successUrl = process.env.STRIPE_SUCCESS_URL as string;
    const cancelUrl = process.env.STRIPE_CANCEL_URL as string;
    if (!successUrl || !cancelUrl) {
      res.status(500).json({ error: "missing-success-or-cancel-url" });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      payment_method_types: ["card", "boleto"],
      locale: "pt-BR",
      success_url: successUrl, // {CHECKOUT_SESSION_ID} será substituído pelo Stripe
      cancel_url: cancelUrl,
      metadata: { firebaseUID: uid, plan },
      subscription_data: { metadata: { firebaseUID: uid, plan } },
    });

    res.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    logger.error("createCheckoutSession error", msg);
    const status =
      msg === "missing-token" ? 401 : msg.startsWith("no-active-price") ? 500 : 400;
    res.status(status).json({ error: msg });
  }
});

// -------------------------------------------------------
// POST – Webhook do Stripe (sincroniza Firestore)
// -------------------------------------------------------
export const stripeWebhook = onRequest(async (req, res) => {
  try {
    const sig = (req.headers["stripe-signature"] as string) || "";
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    const event = stripe.webhooks.constructEvent(
      (req as any as ReqLite).rawBody as Buffer,
      sig,
      whSecret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.firebaseUID;
        const plan = (session.metadata?.plan as Plan) ?? null;
        if (uid) {
          await db.collection("users").doc(uid).set(
            {
              entitlement: {
                active: true,
                plan,
                currentPeriodEnd: null,
                subscriptionId: null,
              },
            },
            { merge: true }
          );
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        // recuperar uid
        let uid: string | null = null;
        if (sub.metadata && (sub.metadata as any).firebaseUID) {
          uid = (sub.metadata as any).firebaseUID as string;
        } else {
          let customerId: string | null = null;
          if (typeof sub.customer === "string") customerId = sub.customer;
          else if (!("deleted" in sub.customer) || !sub.customer.deleted) {
            customerId = sub.customer.id;
          }
          if (customerId) {
            try {
              const cust = await stripe.customers.retrieve(customerId);
              if (!("deleted" in cust)) {
                uid = (cust as Stripe.Customer).metadata?.firebaseUID ?? null;
              }
            } catch (err) {
              logger.warn("stripeWebhook: retrieve customer failed", {
                customerId,
                err: (err as Error)?.message,
              });
            }
          }
        }

        const active = ["active", "trialing", "past_due"].includes(sub.status);
        const plan: Plan = inferPlanFromPrice(sub.items.data[0]?.price?.id) ?? "monthly";

        if (uid) {
          await db.collection("users").doc(uid).set(
            {
              entitlement: {
                active,
                plan,
                currentPeriodEnd: sub.current_period_end ?? null,
                subscriptionId: sub.id,
              },
            },
            { merge: true }
          );
        }
        break;
      }

      default:
        // ignore
        break;
    }

    res.json({ received: true });
  } catch (err) {
    logger.error("stripeWebhook error", err);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }
});

// -------------------------------------------------------
// POST – Refresh imediato (chamado em /pay/success)
// -------------------------------------------------------
export const refreshEntitlement = onRequest(async (req, res) => {
  applyCors(req as any, res as any);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method-not-allowed" });
      return;
    }

    const decoded = await verifyBearer(req as any);
    const uid = decoded.uid;

    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const customerId = (snap.exists
      ? (snap.data() as any)?.stripeCustomerId
      : undefined) as string | undefined;

    if (!customerId) {
      await userRef.set(
        {
          entitlement: {
            active: false,
            plan: null,
            currentPeriodEnd: null,
            subscriptionId: null,
          },
        },
        { merge: true }
      );
      res.json({ entitled: false, reason: "no-customer" });
      return;
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.items"],
    });

    const sub =
      subs.data.find((s) => ["active", "trialing", "past_due"].includes(s.status)) ||
      null;

    const active = !!sub;
    const priceId = sub?.items.data[0]?.price?.id;
    const plan: Plan = inferPlanFromPrice(priceId) ?? (priceId ? "monthly" : null);
    const currentPeriodEnd = sub?.current_period_end ?? null;
    const subscriptionId = sub?.id ?? null;

    await userRef.set(
      { entitlement: { active, plan, currentPeriodEnd, subscriptionId } },
      { merge: true }
    );

    res.json({ entitled: active, plan, currentPeriodEnd, subscriptionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    logger.error("refreshEntitlement error", msg);
    res.status(400).json({ error: msg });
  }
});

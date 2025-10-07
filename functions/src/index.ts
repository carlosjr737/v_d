// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";
import { setGlobalOptions } from "firebase-functions/v2";
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

initializeApp();
const db = getFirestore();

// ===== Stripe =====
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// ===== Tipos “lite” =====

type ReqLite = {
  method: string;
  headers: {
    origin?: unknown;
    authorization?: unknown;

    "stripe-signature"?: unknown; // webhook
  };
  body?: unknown;
  rawBody?: Buffer; // necessário para webhook

};
type ResLite = {
  setHeader(name: string, value: string): void;
  status(code: number): ResLite;

  send(body?: string): void;
  json(body: unknown): void;
};

// ===== CORS =====
const ALLOWED_ORIGINS = new Set<string>([
  "https://v-d-sigma.vercel.app",
  "http://localhost:5173",
  // adicione aqui outros domínios (produção e previews) quando precisar

]);

function applyCors(req: ReqLite, res: ResLite): void {
  const originHeader = req.headers.origin;
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

// ===== Auth Bearer =====
async function verifyBearer(req: ReqLite): Promise<DecodedIdToken> {
  const authHeader = req.headers.authorization;
  const hdr = typeof authHeader === "string" ? authHeader : "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) throw new Error("missing-token");
  return getAuth().verifyIdToken(token);
}

// ===== Tipos de plano =====
type Plan = "annual" | "monthly";
interface CreateCheckoutBody {
  plan: Plan;
  promoCode?: string | null;
}

/** GET protegido de exemplo (mantido) */
export const checkEntitlement = onRequest(
  { region: "southamerica-east1" },
  async (req, res) => {
    applyCors(req as unknown as ReqLite, res as unknown as ResLite);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const decoded = await verifyBearer(req as unknown as ReqLite);
      logger.info("checkEntitlement", { uid: decoded.uid });
      // TODO: lógica real (sincronizar com Stripe/Firestore se quiser)
      res.json({ entitled: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      logger.error("checkEntitlement error", msg);
      res.status(msg === "missing-token" ? 401 : 400).json({ error: msg });
    }
  }
);

/** POST para criar sessão de Checkout (Stripe) */
export const createCheckoutSession = onRequest(
  { region: "southamerica-east1" },
  async (req, res) => {
    applyCors(req as unknown as ReqLite, res as unknown as ResLite);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      if (req.method !== "POST") {
        res.status(405).json({ error: "method-not-allowed" });
        return;
      }

      const decoded = await verifyBearer(req as unknown as ReqLite);
      logger.info("createCheckoutSession", { uid: decoded.uid });

      const body = (req.body ?? {}) as Partial<CreateCheckoutBody>;
      const plan = body.plan ?? "monthly";
      if (plan !== "annual" && plan !== "monthly") {
        res.status(400).json({ error: "plan-required" });
        return;
      }

      // mapear plano -> priceId (via env)
      const priceId =
        plan === "annual"
          ? (process.env.STRIPE_PRICE_ID_ANNUAL as string)
          : (process.env.STRIPE_PRICE_ID_MONTHLY as string);

      if (!priceId) {
        res.status(500).json({ error: "missing-price-id" });
        return;
      }

      // customer vinculado ao usuário Firebase
      const uid = decoded.uid;
      const email = decoded.email ?? undefined;
      const userRef = db.collection("users").doc(uid);
      const snap = await userRef.get();
      let customerId = (snap.exists ? (snap.data() as any)?.stripeCustomerId : undefined) as string | undefined;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { firebaseUID: uid },
        });
        customerId = customer.id;
        await userRef.set({ stripeCustomerId: customerId }, { merge: true });
      }

      const successUrl = (process.env.STRIPE_SUCCESS_URL as string) || "";
      const cancelUrl = (process.env.STRIPE_CANCEL_URL as string) || "";
      if (!successUrl || !cancelUrl) {
        res.status(500).json({ error: "missing-success-or-cancel-url" });
        return;
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        payment_method_types: ["card", "boleto"], // BR: cartão + boleto (habilite no Dashboard)
        locale: "pt-BR",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { firebaseUID: uid, plan },
        subscription_data: { metadata: { firebaseUID: uid, plan } },
      });

      res.json({ url: session.url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      logger.error("createCheckoutSession error", msg);

      res.status(msg === "missing-token" ? 401 : 400).json({ error: msg });
    }
  }
);


/** Webhook Stripe (não usa CORS/bearer; precisa do rawBody) */
export const stripeWebhook = onRequest(
  { region: "southamerica-east1" },
  async (req, res) => {
    try {
      const sig = (req.headers["stripe-signature"] as string) || "";
      const whSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

      const event = stripe.webhooks.constructEvent(
        (req as unknown as ReqLite).rawBody as Buffer,
        sig,
        whSecret
      );

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const uid = session.metadata?.firebaseUID;
          const plan = (session.metadata?.plan as Plan | undefined) ?? null;
          if (uid) {
            await db.collection("users").doc(uid).set(
              {
                entitlement: {
                  active: true,
                  plan,
                  currentPeriodEnd: null, // atualiza no evento de subscription
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

          // ======= FIX DO UID (sem acessar .metadata de DeletedCustomer) =======
          let uid: string | null = null;

          // 1) Tenta via metadata da própria subscription
          if (sub.metadata && (sub.metadata as any).firebaseUID) {
            uid = (sub.metadata as any).firebaseUID as string;
          } else {
            // 2) Se não veio, tenta via customer (string ou expandido)
            let customerId: string | null = null;

            if (typeof sub.customer === "string") {
              customerId = sub.customer;
            } else {
              // sub.customer é Customer | DeletedCustomer
              const custObj = sub.customer as Stripe.Customer | Stripe.DeletedCustomer;
              if (!("deleted" in custObj) || !custObj.deleted) {
                // só usa se NÃO for DeletedCustomer
                customerId = custObj.id;
              }
            }

            if (customerId) {
              try {
                const cust = await stripe.customers.retrieve(customerId);
                if (!("deleted" in cust)) {
                  uid = (cust as Stripe.Customer).metadata?.firebaseUID ?? null;
                }
              } catch (err) {
                logger.warn("stripeWebhook: falha ao recuperar customer", {
                  customerId,
                  err: (err as Error)?.message,
                });
              }
            }
          }
          // ======= /FIX DO UID =======

          const active = ["active", "trialing", "past_due"].includes(sub.status);
          const plan =
            sub.items.data[0]?.price?.id === process.env.STRIPE_PRICE_ID_ANNUAL
              ? ("annual" as Plan)
              : ("monthly" as Plan);

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
          // ignore outros eventos
          break;
      }

      res.json({ received: true });
    } catch (err) {
      logger.error("stripeWebhook error", err);
      res.status(400).send(`Webhook Error: ${(err as Error).message}`);

    }
  }
);

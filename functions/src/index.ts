// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import Stripe from "stripe";

initializeApp();

/** Tipos “lite” para evitar dependências e conflitos de versões */
type ReqLite = {
  method: string;
  headers: {
    origin?: unknown;
    authorization?: unknown;
  };
  body?: unknown;
};
type ResLite = {
  setHeader(name: string, value: string): void;
  status(code: number): ResLite;
  send(body: string): void;
  json(body: unknown): void;
};

const ALLOWED_ORIGINS = new Set<string>([
  "https://v-d-sigma.vercel.app",
  "http://localhost:5173",
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
    "Content-Type, Authorization, X-Firebase-AppCheck"
  );
}

async function verifyBearer(req: ReqLite): Promise<DecodedIdToken> {
  const authHeader = req.headers.authorization;
  const hdr = typeof authHeader === "string" ? authHeader : "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) throw new Error("missing-token");
  return getAuth().verifyIdToken(token);
}

type Plan = "annual" | "monthly";
interface CreateCheckoutBody {
  plan: Plan;
  promoCode?: string;
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

const STRIPE_PRICE_IDS: Record<Plan, string | undefined> = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  annual: process.env.STRIPE_ANNUAL_PRICE_ID,
};

const SUCCESS_URL = process.env.APP_SUCCESS_URL;
const CANCEL_URL = process.env.APP_CANCEL_URL;

function resolveStripeConfig(plan: Plan): { stripe: Stripe; priceId: string } {
  if (!stripeClient) {
    throw new Error("stripe-secret-key-missing");
  }
  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    throw new Error(`stripe-price-id-missing:${plan}`);
  }
  if (!SUCCESS_URL || !CANCEL_URL) {
    throw new Error("checkout-redirect-url-missing");
  }
  return { stripe: stripeClient, priceId };
}

/** GET/POST protegido para teste de autenticação */
export const checkEntitlement = onRequest(
  { region: "southamerica-east1" },
  // CORREÇÃO: Removidos os tipos explícitos de 'req' e 'res'.
  // O TypeScript irá inferir os tipos corretos a partir de 'onRequest'.
  async (req, res) => {
    // Usa helpers “lite” com assertions (sem any)
    applyCors(req as unknown as ReqLite, res as unknown as ResLite);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const decoded = await verifyBearer(req as unknown as ReqLite);
      logger.info("checkEntitlement", { uid: decoded.uid });
      // TODO: lógica real
      res.json({ entitled: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      logger.error("checkEntitlement error", msg);
      res.status(msg === "missing-token" ? 401 : 400).json({ error: msg });
    }
  }
);

export const createCheckoutSession = onRequest(
  { region: "southamerica-east1" },
  // CORREÇÃO: Removidos os tipos explícitos de 'req' e 'res' aqui também.
  async (req, res) => {
    applyCors(req as unknown as ReqLite, res as unknown as ResLite);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const decoded = await verifyBearer(req as unknown as ReqLite);
      logger.info("createCheckoutSession", { uid: decoded.uid });

      const body = (req.body ?? {}) as Partial<CreateCheckoutBody>;
      if (body.plan !== "annual" && body.plan !== "monthly") {
        res.status(400).json({ error: "plan-required" });
        return;
      }

      const { stripe, priceId } = resolveStripeConfig(body.plan);
      const promoCode =
        typeof body.promoCode === "string" && body.promoCode.trim().length > 0
          ? body.promoCode.trim()
          : undefined;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL,
        metadata: {
          uid: decoded.uid,
          plan: body.plan,
        },
        subscription_data: {
          metadata: {
            uid: decoded.uid,
            plan: body.plan,
          },
        },
        allow_promotion_codes: true,
        discounts: promoCode
          ? [
              {
                promotion_code: promoCode,
              },
            ]
          : undefined,
        customer_email: decoded.email ?? undefined,
      });

      if (!session.url) {
        throw new Error("stripe-session-missing-url");
      }

      res.json({ url: session.url, id: session.id, plan: body.plan });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      logger.error("createCheckoutSession error", msg);
      res.status(msg === "missing-token" ? 401 : 400).json({ error: msg });
    }
  }
);

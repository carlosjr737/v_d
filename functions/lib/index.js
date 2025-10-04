"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.createCheckoutSession = exports.checkEntitlement = void 0;
// functions/src/index.ts
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const stripe_1 = __importDefault(require("stripe"));
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// ===== Stripe =====
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
});
// ===== CORS =====
const ALLOWED_ORIGINS = new Set([
    "https://v-d-sigma.vercel.app",
    "http://localhost:5173",
    // adicione aqui outros domínios (produção e previews) quando precisar
]);
function applyCors(req, res) {
    const originHeader = req.headers.origin;
    const origin = typeof originHeader === "string" ? originHeader : "";
    if (ALLOWED_ORIGINS.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Firebase-AppCheck, Stripe-Signature");
}
// ===== Auth Bearer =====
async function verifyBearer(req) {
    const authHeader = req.headers.authorization;
    const hdr = typeof authHeader === "string" ? authHeader : "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token)
        throw new Error("missing-token");
    return (0, auth_1.getAuth)().verifyIdToken(token);
}
/** GET protegido de exemplo (mantido) */
exports.checkEntitlement = (0, https_1.onRequest)({ region: "southamerica-east1" }, async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    try {
        const decoded = await verifyBearer(req);
        logger.info("checkEntitlement", { uid: decoded.uid });
        // TODO: lógica real (sincronizar com Stripe/Firestore se quiser)
        res.json({ entitled: true });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : "error";
        logger.error("checkEntitlement error", msg);
        res.status(msg === "missing-token" ? 401 : 400).json({ error: msg });
    }
});
/** POST para criar sessão de Checkout (Stripe) */
exports.createCheckoutSession = (0, https_1.onRequest)({ region: "southamerica-east1" }, async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    try {
        if (req.method !== "POST") {
            res.status(405).json({ error: "method-not-allowed" });
            return;
        }
        const decoded = await verifyBearer(req);
        logger.info("createCheckoutSession", { uid: decoded.uid });
        const body = (req.body ?? {});
        const plan = body.plan ?? "monthly";
        if (plan !== "annual" && plan !== "monthly") {
            res.status(400).json({ error: "plan-required" });
            return;
        }
        // mapear plano -> priceId (via env)
        const priceId = plan === "annual"
            ? process.env.STRIPE_PRICE_ID_ANNUAL
            : process.env.STRIPE_PRICE_ID_MONTHLY;
        if (!priceId) {
            res.status(500).json({ error: "missing-price-id" });
            return;
        }
        // customer vinculado ao usuário Firebase
        const uid = decoded.uid;
        const email = decoded.email ?? undefined;
        const userRef = db.collection("users").doc(uid);
        const snap = await userRef.get();
        let customerId = (snap.exists ? snap.data()?.stripeCustomerId : undefined);
        if (!customerId) {
            const customer = await stripe.customers.create({
                email,
                metadata: { firebaseUID: uid },
            });
            customerId = customer.id;
            await userRef.set({ stripeCustomerId: customerId }, { merge: true });
        }
        const successUrl = process.env.STRIPE_SUCCESS_URL || "";
        const cancelUrl = process.env.STRIPE_CANCEL_URL || "";
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
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : "error";
        logger.error("createCheckoutSession error", msg);
        res.status(msg === "missing-token" ? 401 : 400).json({ error: msg });
    }
});
/** Webhook Stripe (não usa CORS/bearer; precisa do rawBody) */
exports.stripeWebhook = (0, https_1.onRequest)({ region: "southamerica-east1" }, async (req, res) => {
    try {
        const sig = req.headers["stripe-signature"] || "";
        const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const event = stripe.webhooks.constructEvent(req.rawBody, sig, whSecret);
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const uid = session.metadata?.firebaseUID;
                const plan = session.metadata?.plan ?? null;
                if (uid) {
                    await db.collection("users").doc(uid).set({
                        entitlement: {
                            active: true,
                            plan,
                            currentPeriodEnd: null, // atualiza no evento de subscription
                            subscriptionId: null,
                        },
                    }, { merge: true });
                }
                break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const sub = event.data.object;
                // ======= FIX DO UID (sem acessar .metadata de DeletedCustomer) =======
                let uid = null;
                // 1) Tenta via metadata da própria subscription
                if (sub.metadata && sub.metadata.firebaseUID) {
                    uid = sub.metadata.firebaseUID;
                }
                else {
                    // 2) Se não veio, tenta via customer (string ou expandido)
                    let customerId = null;
                    if (typeof sub.customer === "string") {
                        customerId = sub.customer;
                    }
                    else {
                        // sub.customer é Customer | DeletedCustomer
                        const custObj = sub.customer;
                        if (!("deleted" in custObj) || !custObj.deleted) {
                            // só usa se NÃO for DeletedCustomer
                            customerId = custObj.id;
                        }
                    }
                    if (customerId) {
                        try {
                            const cust = await stripe.customers.retrieve(customerId);
                            if (!("deleted" in cust)) {
                                uid = cust.metadata?.firebaseUID ?? null;
                            }
                        }
                        catch (err) {
                            logger.warn("stripeWebhook: falha ao recuperar customer", {
                                customerId,
                                err: err?.message,
                            });
                        }
                    }
                }
                // ======= /FIX DO UID =======
                const active = ["active", "trialing", "past_due"].includes(sub.status);
                const plan = sub.items.data[0]?.price?.id === process.env.STRIPE_PRICE_ID_ANNUAL
                    ? "annual"
                    : "monthly";
                if (uid) {
                    await db.collection("users").doc(uid).set({
                        entitlement: {
                            active,
                            plan,
                            currentPeriodEnd: sub.current_period_end ?? null,
                            subscriptionId: sub.id,
                        },
                    }, { merge: true });
                }
                break;
            }
            default:
                // ignore outros eventos
                break;
        }
        res.json({ received: true });
    }
    catch (err) {
        logger.error("stripeWebhook error", err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

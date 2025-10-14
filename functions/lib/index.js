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
exports.refreshEntitlement = exports.stripeWebhook = exports.createCheckoutSession = exports.checkEntitlement = void 0;
// functions/src/index.ts
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const logger = __importStar(require("firebase-functions/logger"));
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const stripe_1 = __importDefault(require("stripe"));
// -------------------------------------------------------
// Opções globais (região + secrets para TODAS as functions)
// -------------------------------------------------------
(0, v2_1.setGlobalOptions)({
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
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
});
const DEFAULT_PRICE_IDS = {
    annual: "price_1SIDlaGaPkvrhUnL7nNYC3xD",
    monthly: "price_1SIDjxGaPkvrhUnLfxIqIESn",
};
function extractPriceIds(raw, fallback) {
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
const STRIPE_PRICE_ID_ANNUAL = ANNUAL_PRICE_IDS[0];
const STRIPE_PRICE_ID_MONTHLY = MONTHLY_PRICE_IDS[0];
const KNOWN_ANNUAL_PRICE_IDS = new Set(ANNUAL_PRICE_IDS);
const KNOWN_MONTHLY_PRICE_IDS = new Set(MONTHLY_PRICE_IDS);
function inferPlanFromPrice(priceId) {
    if (!priceId)
        return null;
    if (KNOWN_ANNUAL_PRICE_IDS.has(priceId))
        return "annual";
    if (KNOWN_MONTHLY_PRICE_IDS.has(priceId))
        return "monthly";
    return null;
}
const ALLOWED_ORIGINS = new Set([
    "https://v-d-sigma.vercel.app",
    "http://localhost:5173",
]);
function applyCors(req, res) {
    const originHeader = req.headers["origin"];
    const origin = typeof originHeader === "string" ? originHeader : "";
    if (ALLOWED_ORIGINS.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Firebase-AppCheck, Stripe-Signature");
}
async function verifyBearer(req) {
    const authHeader = req.headers["authorization"];
    const hdr = typeof authHeader === "string" ? authHeader : "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token)
        throw new Error("missing-token");
    return (0, auth_1.getAuth)().verifyIdToken(token);
}
// -------------------------------------------------------
// GET protegido – retorna { active } (o que o front espera)
// -------------------------------------------------------
exports.checkEntitlement = (0, https_1.onRequest)(async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    try {
        const decoded = await verifyBearer(req);
        const uid = decoded.uid;
        const snap = await db.collection("users").doc(uid).get();
        const entitlement = (snap.exists ? snap.data()?.entitlement : null) ?? {};
        const active = !!entitlement.active;
        const plan = (entitlement.plan ?? null) || null;
        const currentPeriodEnd = typeof entitlement.currentPeriodEnd === "number" ? entitlement.currentPeriodEnd : null;
        const expiresAt = typeof currentPeriodEnd === "number"
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null;
        res.json({ active, plan, currentPeriodEnd, expiresAt });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : "error";
        logger.error("checkEntitlement error", msg);
        res.status(msg === "missing-token" ? 401 : 400).json({ error: msg });
    }
});
// -------------------------------------------------------
// POST – cria sessão do Stripe Checkout
// -------------------------------------------------------
exports.createCheckoutSession = (0, https_1.onRequest)(async (req, res) => {
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
        const uid = decoded.uid;
        const email = decoded.email ?? undefined;
        const body = (req.body ?? {});
        const plan = body.plan ?? "monthly";
        const priceId = plan === "annual" ? STRIPE_PRICE_ID_ANNUAL : STRIPE_PRICE_ID_MONTHLY;
        if (!priceId) {
            res.status(500).json({ error: "missing-price-id" });
            return;
        }
        // customer por usuário
        const userRef = db.collection("users").doc(uid);
        const snap = await userRef.get();
        let customerId = (snap.exists
            ? snap.data()?.stripeCustomerId
            : undefined);
        if (!customerId) {
            const customer = await stripe.customers.create({
                email,
                metadata: { firebaseUID: uid },
            });
            customerId = customer.id;
            await userRef.set({ stripeCustomerId: customerId }, { merge: true });
        }
        const successUrl = process.env.STRIPE_SUCCESS_URL;
        const cancelUrl = process.env.STRIPE_CANCEL_URL;
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
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : "error";
        logger.error("createCheckoutSession error", msg);
        res.status(msg === "missing-token" ? 401 : 400).json({ error: msg });
    }
});
// -------------------------------------------------------
// POST – Webhook do Stripe (sincroniza Firestore)
// -------------------------------------------------------
exports.stripeWebhook = (0, https_1.onRequest)(async (req, res) => {
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
                            currentPeriodEnd: null,
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
                // recuperar uid
                let uid = null;
                if (sub.metadata && sub.metadata.firebaseUID) {
                    uid = sub.metadata.firebaseUID;
                }
                else {
                    let customerId = null;
                    if (typeof sub.customer === "string")
                        customerId = sub.customer;
                    else if (!("deleted" in sub.customer) || !sub.customer.deleted) {
                        customerId = sub.customer.id;
                    }
                    if (customerId) {
                        try {
                            const cust = await stripe.customers.retrieve(customerId);
                            if (!("deleted" in cust)) {
                                uid = cust.metadata?.firebaseUID ?? null;
                            }
                        }
                        catch (err) {
                            logger.warn("stripeWebhook: retrieve customer failed", {
                                customerId,
                                err: err?.message,
                            });
                        }
                    }
                }
                const active = ["active", "trialing", "past_due"].includes(sub.status);
                const plan = inferPlanFromPrice(sub.items.data[0]?.price?.id) ?? "monthly";
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
                // ignore
                break;
        }
        res.json({ received: true });
    }
    catch (err) {
        logger.error("stripeWebhook error", err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});
// -------------------------------------------------------
// POST – Refresh imediato (chamado em /pay/success)
// -------------------------------------------------------
exports.refreshEntitlement = (0, https_1.onRequest)(async (req, res) => {
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
        const uid = decoded.uid;
        const userRef = db.collection("users").doc(uid);
        const snap = await userRef.get();
        const customerId = (snap.exists
            ? snap.data()?.stripeCustomerId
            : undefined);
        if (!customerId) {
            await userRef.set({
                entitlement: {
                    active: false,
                    plan: null,
                    currentPeriodEnd: null,
                    subscriptionId: null,
                },
            }, { merge: true });
            res.json({ entitled: false, reason: "no-customer" });
            return;
        }
        const subs = await stripe.subscriptions.list({
            customer: customerId,
            status: "all",
            expand: ["data.items"],
        });
        const sub = subs.data.find((s) => ["active", "trialing", "past_due"].includes(s.status)) ||
            null;
        const active = !!sub;
        const priceId = sub?.items.data[0]?.price?.id;
        const plan = inferPlanFromPrice(priceId) ?? (priceId ? "monthly" : null);
        const currentPeriodEnd = sub?.current_period_end ?? null;
        const subscriptionId = sub?.id ?? null;
        await userRef.set({ entitlement: { active, plan, currentPeriodEnd, subscriptionId } }, { merge: true });
        res.json({ entitled: active, plan, currentPeriodEnd, subscriptionId });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : "error";
        logger.error("refreshEntitlement error", msg);
        res.status(400).json({ error: msg });
    }
});

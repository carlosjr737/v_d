import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import cors from 'cors';
import type { Request, Response } from 'express';

admin.initializeApp();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' });

const PRICE_ID = process.env.STRIPE_PRICE_ID as string;
const SUCCESS_URL = process.env.SUCCESS_URL as string;
const CANCEL_URL = process.env.CANCEL_URL as string;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

const CORS = cors({ origin: true });

async function verifyAuth(req: Request): Promise<string> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) throw new Error('unauthorized');
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid;
}

export const createCheckoutSession = functions.region('southamerica-east1').https.onRequest(async (req: Request, res: Response) => {
  CORS(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
      const uid = await verifyAuth(req);
      const { promoCode } = (req.body || {}) as { promoCode?: string };

      const userRef = admin.firestore().doc(`users/${uid}`);
      const userSnap = await userRef.get();
      let customerId: string | undefined = userSnap.get('stripeCustomerId');

      if (!customerId) {
        const userRecord = await admin.auth().getUser(uid).catch(() => null);
        const email = userRecord?.email || undefined;
        const customer = await stripe.customers.create({ email, metadata: { uid } });
        customerId = customer.id;
        await userRef.set({ stripeCustomerId: customerId }, { merge: true });
        await admin.firestore().doc(`stripeCustomers/${customerId}`).set({ uid }, { merge: true });
      }

      const params: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        customer: customerId,
        client_reference_id: uid,
        success_url: SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: CANCEL_URL,
        line_items: [{ price: PRICE_ID, quantity: 1 }],
        allow_promotion_codes: true,
        payment_method_types: ['card', 'boleto'],
      };

      if (promoCode) {
        // promotion_code precisa existir no Stripe com esse code
        // Alternativamente, use 'discounts: [{ coupon: "..." }]' se preferir cupom direto
      }

      const session = await stripe.checkout.sessions.create(params);
      res.json({ url: session.url });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ error: err.message || 'unknown_error' });
    }
  });
});

export const stripeWebhook = functions.region('southamerica-east1').https.onRequest(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.paid':
      case 'customer.subscription.updated': {
        const obj = event.data.object as any;
        const customerId = (obj.customer?.id ?? obj.customer) as string;
        const sub = obj.subscription ? await stripe.subscriptions.retrieve(obj.subscription) : null;
        let uid: string | undefined;

        const stripeMap = await admin.firestore().doc(`stripeCustomers/${customerId}`).get();
        uid = (stripeMap.exists && stripeMap.get('uid')) || (obj.client_reference_id as string);

        if (!uid) {
          console.warn('No uid found for event', event.id);
          break;
        }

        const active = sub ? sub.status === 'active' || sub.status === 'trialing' : true;
        const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

        await admin.firestore().doc(`users/${uid}`).set({ stripeCustomerId: customerId }, { merge: true });
        await admin.firestore().doc(`users/${uid}/entitlements/specialActions`).set(
          {
            active,
            currentPeriodEnd: periodEnd,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const mapDoc = await admin.firestore().doc(`stripeCustomers/${customerId}`).get();
        const uid = mapDoc.get('uid');
        if (uid) {
          await admin.firestore().doc(`users/${uid}/entitlements/specialActions`).set(
            {
              active: false,
              currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).send('webhook_handler_error');
  }
});

export const checkEntitlement = functions.region('southamerica-east1').https.onRequest(async (req: Request, res: Response) => {
  CORS(req, res, async () => {
    try {
      const uid = await verifyAuth(req);
      const snap = await admin.firestore().doc(`users/${uid}/entitlements/specialActions`).get();
      const data = snap.exists ? snap.data() : null;
      res.json({ active: !!data?.active, expiresAt: data?.currentPeriodEnd || null });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'unknown_error' });
    }
  });
});

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { checkoutSessions } from '../db';

const router = Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

/**
 * @swagger
 * tags:
 *   name: Checkout
 *   description: Stripe payment checkout endpoints
 */

/**
 * @swagger
 * /api/checkout/session:
 *   post:
 *     summary: Create a Stripe Checkout session
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     price: { type: number }
 *                     quantity: { type: integer }
 *                     imgName: { type: string }
 *               userEmail: { type: string }
 *     responses:
 *       200:
 *         description: Checkout session URL
 *       400:
 *         description: No items provided
 *       503:
 *         description: Stripe not configured
 */
router.post('/session', async (req: Request, res: Response): Promise<void> => {
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({
      error: 'Stripe not configured. Set STRIPE_SECRET_KEY environment variable.',
      docs: 'https://dashboard.stripe.com/test/apikeys'
    });
    return;
  }

  const { items, userEmail, shipping } = req.body as {
    items: Array<{ name: string; price: number; quantity: number; imgName?: string; discount?: number }>;
    userEmail?: string;
    shipping?: number;
  };

  if (!items || items.length === 0) {
    res.status(400).json({ error: 'No items provided' });
    return;
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-07-29.dahlia' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5137';

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => {
      const unitPrice = item.discount
        ? Math.round(item.price * (1 - item.discount) * 100)
        : Math.round(item.price * 100);

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            ...(item.imgName && {
              images: [`${frontendUrl}/${item.imgName}`],
            }),
          },
          unit_amount: unitPrice,
        },
        quantity: item.quantity,
      };
    });

    // Add shipping as a line item if applicable
    if (shipping && shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping' },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      customer_email: userEmail,
      success_url: `${frontendUrl}/cart?payment=success`,
      cancel_url: `${frontendUrl}/cart?payment=cancelled`,
    });

    // Persist session reference
    checkoutSessions.create(userEmail || null, session.id, session.amount_total);

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;

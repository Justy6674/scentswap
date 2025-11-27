/**
 * Outseta Subscription Updated Webhook
 * 
 * This endpoint is called by Outseta when a subscription changes.
 * Configure in Outseta: Settings > Notifications > Add Callback
 * Event: Subscription Updated
 * 
 * URL: https://www.scentswap.com.au/api/outseta/subscription-updated
 * 
 * @see docs/OUTSETA_INTEGRATION.md
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase with service role key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Verify Outseta webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    console.warn('Missing signature or secret - skipping verification');
    return true;
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computed = hmac.digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const webhookSecret = process.env.OUTSETA_WEBHOOK_SECRET;

    // Verify signature (if configured)
    if (webhookSecret && !verifyWebhookSignature(rawBody, signature || null, webhookSecret)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse webhook payload
    const { Account, Subscription, Person } = req.body;

    console.log('Outseta subscription update webhook received:', {
      accountUid: Account?.Uid,
      personUid: Person?.Uid,
      planName: Subscription?.Plan?.Name,
      status: Subscription?.Status,
    });

    if (!Account?.Uid && !Person?.Uid) {
      return res.status(400).json({ error: 'Missing Account or Person UID' });
    }

    // Update user by Account UID or Person UID
    const updateData = {
      subscription_plan: Subscription?.Plan?.Name?.toLowerCase() || 'free',
      subscription_status: Subscription?.Status || 'active',
      updated_at: new Date().toISOString(),
    };

    let updateQuery = supabase.from('users').update(updateData);

    if (Account?.Uid) {
      updateQuery = updateQuery.eq('outseta_account_uid', Account.Uid);
    } else if (Person?.Uid) {
      updateQuery = updateQuery.eq('outseta_person_uid', Person.Uid);
    }

    const { error, count } = await updateQuery;

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }

    console.log(`Updated ${count || 'unknown'} user(s) subscription to ${updateData.subscription_plan}`);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


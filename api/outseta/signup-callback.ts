/**
 * Outseta Sign-Up Callback Webhook
 * 
 * This endpoint is called by Outseta when a new user signs up.
 * Configure in Outseta: Auth > Sign Up & Login > Show Advanced Options > Sign Up Callback URL
 * 
 * URL: https://www.scentswap.com.au/api/outseta/signup-callback
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
    return true; // Allow in development, enforce in production
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
    const { Person, Account, Subscription } = req.body;

    if (!Person?.Uid || !Person?.Email) {
      return res.status(400).json({ error: 'Missing required Person data' });
    }

    console.log('Outseta signup webhook received:', {
      personUid: Person.Uid,
      email: Person.Email,
      accountUid: Account?.Uid,
      planName: Subscription?.Plan?.Name,
    });

    // Build user data
    const fullName = `${Person.FirstName || ''} ${Person.LastName || ''}`.trim() || Person.Email.split('@')[0];
    const username = Person.Email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if user already exists by Outseta ID or email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`outseta_person_uid.eq.${Person.Uid},email.eq.${Person.Email}`)
      .single();

    let userId: string;

    if (existingUser) {
      // Update existing user
      userId = existingUser.id;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          outseta_person_uid: Person.Uid,
          outseta_account_uid: Account?.Uid,
          subscription_plan: Subscription?.Plan?.Name?.toLowerCase() || 'free',
          subscription_status: Subscription?.Status || 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }

      console.log('Updated existing user:', userId);
    } else {
      // Create new user
      userId = crypto.randomUUID();

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: Person.Email,
          full_name: fullName,
          username: username,
          verification_tier: 'unverified',
          outseta_person_uid: Person.Uid,
          outseta_account_uid: Account?.Uid,
          subscription_plan: Subscription?.Plan?.Name?.toLowerCase() || 'free',
          subscription_status: Subscription?.Status || 'active',
        });

      if (insertError) {
        console.error('Error creating user:', insertError);
        throw insertError;
      }

      console.log('Created new user:', userId);
    }

    // Return the response with ClientIdentifier
    // Outseta will store this and include it in future JWTs
    return res.status(200).json({
      ...req.body,
      ClientIdentifier: userId,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


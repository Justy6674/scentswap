/**
 * Outseta Person Updated Webhook
 * 
 * This endpoint is called by Outseta when a person's profile is updated.
 * Configure in Outseta: Settings > Notifications > Add Callback
 * 
 * Events that trigger this:
 * - Person Updated
 * - Account Add Person
 * 
 * URL: https://www.scentswap.com.au/api/outseta/person-updated
 * 
 * @see docs/OUTSETA_INTEGRATION.md
 * @see https://go.outseta.com/support/kb/articles/B9lV2dm8/integrate-outseta-with-your-backend-database
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
 * @see https://go.outseta.com/support/kb/articles/dQX70amO/secure-and-verify-webhooks-with-a-sha256-signature
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

    // Parse webhook payload - can be Person or Account with Person
    const data = req.body;
    
    // Handle different payload structures
    let person = data.Person || data;
    
    if (!person?.Uid || !person?.Email) {
      console.log('Webhook payload:', JSON.stringify(data, null, 2));
      return res.status(400).json({ error: 'Missing required Person data' });
    }

    console.log('Person updated webhook received:', {
      personUid: person.Uid,
      email: person.Email,
      firstName: person.FirstName,
      lastName: person.LastName,
    });

    // Build update data
    const fullName = `${person.FirstName || ''} ${person.LastName || ''}`.trim();
    
    // Find and update user by Outseta Person UID
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('outseta_person_uid', person.Uid)
      .single();

    if (findError || !existingUser) {
      // Try to find by email as fallback
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', person.Email)
        .single();

      if (emailError || !userByEmail) {
        console.log('User not found in Supabase, may be new signup');
        return res.status(200).json({ message: 'User not found, skipping update' });
      }

      // Update user found by email
      const { error: updateError } = await supabase
        .from('users')
        .update({
          outseta_person_uid: person.Uid,
          email: person.Email,
          full_name: fullName || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userByEmail.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }

      console.log('Updated user (found by email):', userByEmail.id);
    } else {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: person.Email,
          full_name: fullName || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }

      console.log('Updated user:', existingUser.id);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


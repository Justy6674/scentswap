import { VercelRequest, VercelResponse } from '@vercel/node';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

// Configuration
const OUTSETA_DOMAIN = 'scentswap.outseta.com';
const JWKS_URL = `https://${OUTSETA_DOMAIN}/.well-known/jwks`;

// Initialize Supabase Admin
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify Outseta Token
    const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${OUTSETA_DOMAIN}`,
    });

    // 2. Extract User Info
    const outsetaPersonUid = payload.sub as string;
    const email = payload.email as string;
    const outsetaAccountUid = payload['outseta:accountUid'] as string;
    
    // Get additional info passed in body (optional, fallback to token)
    const { user: bodyUser } = req.body || {};
    const firstName = bodyUser?.FirstName || payload.given_name;
    const lastName = bodyUser?.LastName || payload.family_name;
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : undefined;

    console.log('Syncing user:', { email, outsetaPersonUid });

    // 3. Update/Upsert User in Supabase
    // We use email as the primary key to link existing users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Update existing
      await supabase
        .from('users')
        .update({
          outseta_person_uid: outsetaPersonUid,
          outseta_account_uid: outsetaAccountUid,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id);
        
      return res.status(200).json({ status: 'synced', id: existingUser.id });
    } else {
      // This shouldn't happen often if we assume users exist, but for new users:
      // We can create them. But usually the webhook handles creation.
      // Let's allow creation just in case.
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          full_name: fullName || email.split('@')[0],
          outseta_person_uid: outsetaPersonUid,
          outseta_account_uid: outsetaAccountUid,
          verification_tier: 'unverified',
          subscription_plan: 'free', // Default, webhook handles plan details
          subscription_status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ status: 'created', id: newUser.id });
    }

  } catch (error: any) {
    console.error('Sync failed:', error);
    return res.status(401).json({ error: 'Invalid token or sync error', details: error.message });
  }
}


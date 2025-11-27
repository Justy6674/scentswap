/**
 * JWT Exchange Endpoint
 * 
 * Exchanges an Outseta JWT for a Supabase-signed JWT.
 * This allows using Supabase RLS with Outseta authentication.
 * 
 * URL: https://www.scentswap.com.au/api/auth/exchange-token
 * 
 * @see docs/OUTSETA_INTEGRATION.md
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as jose from 'jose';

// Outseta JWKS URL for token verification
const OUTSETA_JWKS_URL = 'https://scentswap.outseta.com/.well-known/jwks';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { outsetaToken } = req.body;

    if (!outsetaToken) {
      return res.status(400).json({ error: 'Missing outsetaToken' });
    }

    // 1. Verify the Outseta JWT
    const JWKS = jose.createRemoteJWKSet(new URL(OUTSETA_JWKS_URL));
    
    let payload: jose.JWTPayload;
    try {
      const result = await jose.jwtVerify(outsetaToken, JWKS);
      payload = result.payload;
    } catch (verifyError) {
      console.error('JWT verification failed:', verifyError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 2. Extract claims from Outseta token
    const sub = payload.sub; // Person UID
    const email = payload.email as string;
    const accountUid = payload['outseta:accountUid'] as string;
    const planUid = payload['outseta:planUid'] as string;
    const clientIdentifier = payload['outseta:accountClientIdentifier'] as string;

    // 3. Create Supabase-signed JWT
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
    
    if (!supabaseJwtSecret) {
      console.error('SUPABASE_JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabaseToken = await new jose.SignJWT({
      sub: sub,
      email: email,
      role: 'authenticated', // Required by Supabase
      'outseta:accountUid': accountUid,
      'outseta:planUid': planUid,
      'outseta:clientIdentifier': clientIdentifier,
      aud: 'authenticated',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setIssuer('supabase')
      .sign(new TextEncoder().encode(supabaseJwtSecret));

    // 4. Return the Supabase token
    return res.status(200).json({
      supabaseToken,
      user: {
        id: clientIdentifier || sub,
        email,
        outsetaPersonUid: sub,
        outsetaAccountUid: accountUid,
        planUid,
      },
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


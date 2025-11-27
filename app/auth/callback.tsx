/**
 * Auth Callback Page
 * 
 * Handles the redirect after Outseta login.
 * Outseta appends ?access_token=<JWT> to this URL.
 * 
 * Flow:
 * 1. User logs in via Outseta
 * 2. Outseta redirects to this page with access_token
 * 3. We extract the token, store it, sync with Supabase
 * 4. Redirect to the main app
 * 
 * @see docs/OUTSETA_INTEGRATION.md
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { OUTSETA_CONFIG, getTierFromPlanUid } from '@/contexts/SubscriptionContext';
import { db } from '@/lib/database';

export default function AuthCallbackScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    if (Platform.OS === 'web') {
      handleCallback();
    } else {
      // Mobile shouldn't reach this page directly
      router.replace('/(tabs)');
    }
  }, []);

  async function handleCallback() {
    try {
      // Get access_token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');

      if (!accessToken) {
        setStatus('error');
        setMessage('No access token found. Please try logging in again.');
        setTimeout(() => router.replace('/(auth)/login'), 3000);
        return;
      }

      setMessage('Verifying your account...');

      // Wait for Outseta to be ready
      await waitForOutseta();

      // Set the token in Outseta
      if (window.Outseta) {
        window.Outseta.setAccessToken(accessToken);
      }

      // Get user info from Outseta
      setMessage('Loading your profile...');
      
      let outsetaUser = null;
      let jwtPayload = null;
      
      if (window.Outseta) {
        try {
          outsetaUser = await window.Outseta.getUser();
          jwtPayload = await window.Outseta.getJwtPayload();
        } catch (e) {
          console.error('Error getting Outseta user:', e);
        }
      }

      if (outsetaUser && jwtPayload) {
        // Sync user to Supabase
        setMessage('Syncing your account...');
        await syncUserToSupabase(outsetaUser, jwtPayload);
      }

      // Clean up URL
      window.history.replaceState({}, document.title, '/auth/callback');

      setStatus('success');
      setMessage('Welcome to ScentSwap!');

      // Redirect to main app
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);

    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
      setTimeout(() => router.replace('/(auth)/login'), 3000);
    }
  }

  async function waitForOutseta(maxAttempts = 20): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (typeof window !== 'undefined' && window.Outseta) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error('Outseta failed to load');
  }

  async function syncUserToSupabase(outsetaUser: any, jwtPayload: any) {
    try {
      const personUid = outsetaUser.Uid || jwtPayload?.sub;
      const accountUid = jwtPayload?.['outseta:accountUid'];
      const planUid = jwtPayload?.['outseta:planUid'] || OUTSETA_CONFIG.planUids.FREE;
      const email = outsetaUser.Email || jwtPayload?.email;
      const firstName = outsetaUser.FirstName || '';
      const lastName = outsetaUser.LastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || email.split('@')[0];

      // Check if user exists in Supabase
      const existingUser = await db.getUserByOutsetaId(personUid);

      if (existingUser) {
        // Update existing user
        await db.updateUserFromOutseta(existingUser.id, {
          outseta_person_uid: personUid,
          outseta_account_uid: accountUid,
          subscription_plan: getTierFromPlanUid(planUid),
          subscription_status: 'active',
        });
        
        // Store in local storage for AuthContext
        localStorage.setItem('scentswap_user', JSON.stringify(existingUser));
      } else {
        // Create new user in Supabase
        const newUser = await db.createUserFromOutseta({
          email,
          full_name: fullName,
          outseta_person_uid: personUid,
          outseta_account_uid: accountUid,
          subscription_plan: getTierFromPlanUid(planUid),
          subscription_status: 'active',
        });
        
        if (newUser) {
          localStorage.setItem('scentswap_user', JSON.stringify(newUser));
        }
      }
    } catch (error) {
      console.error('Error syncing user to Supabase:', error);
      // Don't throw - user can still use the app
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    logoContainer: {
      width: 120,
      height: 120,
      marginBottom: 32,
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    spinner: {
      marginBottom: 24,
    },
    message: {
      fontSize: 18,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    successIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    errorIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo-nobg.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {status === 'processing' && (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.spinner}
        />
      )}

      {status === 'success' && (
        <Text style={styles.successIcon}>✓</Text>
      )}

      {status === 'error' && (
        <Text style={styles.errorIcon}>⚠</Text>
      )}

      <Text style={styles.message}>{message}</Text>

      {status === 'error' && (
        <Text style={styles.subMessage}>Redirecting to login...</Text>
      )}
    </View>
  );
}


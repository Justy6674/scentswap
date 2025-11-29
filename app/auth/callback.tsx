/**
 * Auth Callback Page
 * 
 * Handles the redirect after Outseta login/signup.
 * Outseta appends ?access_token=<JWT> to this URL.
 * 
 * Flow:
 * 1. User logs in/signs up via Outseta
 * 2. Outseta redirects to this page with access_token
 * 3. We extract the token, let Outseta handle it
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

// Simple colors for callback page
const colors = {
  background: '#FBF9F7',
  primary: '#5BBFBA',
  text: '#2D3436',
  textSecondary: '#636E72',
};

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Completing sign in...');
  const [mounted, setMounted] = useState(false);

  // Only run on client side after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleCallback();
    } else {
      // Mobile shouldn't reach this page directly
      router.replace('/(tabs)');
    }
  }, [mounted]);

  async function handleCallback() {
    try {
      // Get access_token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');

      if (!accessToken) {
        // No token - might already be logged in, check Outseta
        setMessage('Checking session...');
        await waitForOutseta();
        
        if ((window as any).Outseta) {
          try {
            const user = await (window as any).Outseta.getUser();
            if (user) {
              setStatus('success');
              setMessage('Welcome back!');
              setTimeout(() => router.replace('/(tabs)'), 1000);
              return;
            }
          } catch (e) {
            // No existing session
          }
        }
        
        setStatus('error');
        setMessage('No session found. Please try logging in again.');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
        return;
      }

      setMessage('Verifying your account...');

      // Wait for Outseta to be ready
      await waitForOutseta();

      // Set the token in Outseta - it will handle storage
      if ((window as any).Outseta) {
        (window as any).Outseta.setAccessToken(accessToken);
      }

      // Give Outseta a moment to process the token
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clean up URL (remove token from address bar)
      window.history.replaceState({}, document.title, '/');

      setStatus('success');
      setMessage('Welcome to ScentSwap!');

      // Redirect to main app
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);

    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
      setTimeout(() => router.replace('/(auth)/login'), 3000);
    }
  }

  async function waitForOutseta(maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (typeof window !== 'undefined' && (window as any).Outseta) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
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


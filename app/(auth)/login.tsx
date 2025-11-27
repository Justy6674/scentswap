/**
 * Login Screen
 * 
 * Redirects to Outseta hosted login page.
 * Uses only Outseta-approved methods per documentation.
 * 
 * @see docs/OUTSETA_INTEGRATION.md
 * @see .cursor/rules/outseta.mdc
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription, OUTSETA_CONFIG } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/Button';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated, isLoading } = useSubscription();

  // If already authenticated, redirect to tabs
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  /**
   * Handle login - redirect to Outseta hosted login page
   * This is the Outseta-approved method per their documentation
   */
  const handleLogin = () => {
    // Direct redirect to Outseta hosted login page
    // Outseta will handle the auth flow and redirect back with access_token
    const loginUrl = OUTSETA_CONFIG.urls.login;
    
    if (Platform.OS === 'web') {
      window.location.href = loginUrl;
    } else {
      // Mobile - open in system browser
      Linking.openURL(loginUrl);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    logoContainer: {
      width: 140,
      height: 140,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 48,
      maxWidth: 300,
    },
    buttonContainer: {
      width: '100%',
      maxWidth: 320,
      gap: 16,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
      width: '100%',
      maxWidth: 320,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: colors.textSecondary,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 32,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
    backButton: {
      position: 'absolute',
      top: 16,
      left: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureList: {
      marginTop: 32,
      gap: 12,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    featureIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo-nobg.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to continue swapping fragrances with collectors across Australia
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Sign In with Email"
            onPress={handleLogin}
            icon="mail-outline"
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>secure login via Outseta</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>Secure authentication</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="card" size={14} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>Easy subscription management</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="lock-closed" size={14} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>Your data stays private</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

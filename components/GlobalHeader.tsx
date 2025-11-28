/**
 * GlobalHeader - Shared header component for all public pages
 * 
 * Features:
 * - Logo with brand name
 * - Navigation links (FAQ, Pricing, Sign In)
 * - Get Started CTA button
 * - Responsive design (mobile/desktop)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';

const COLORS = {
  teal: '#5BBFBA',
  charcoal: '#2D3436',
  warmGray: '#636E72',
  white: '#FFFFFF',
  warmCream: '#FBF9F7',
};

interface GlobalHeaderProps {
  transparent?: boolean;
}

export function GlobalHeader({ transparent = false }: GlobalHeaderProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const handleGetStarted = () => {
    router.push('/(auth)/register');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={[
      styles.header,
      transparent && styles.headerTransparent,
    ]}>
      <View style={styles.headerContent}>
        {/* Logo */}
        <TouchableOpacity 
          style={styles.headerLogo}
          onPress={() => router.push('/')}
        >
          <Image 
            source={require('@/assets/images/favicon-nobg.png')} 
            style={styles.headerLogoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerBrand}>ScentSwap</Text>
        </TouchableOpacity>

        {/* Navigation */}
        <View style={styles.headerNav}>
          <TouchableOpacity 
            onPress={() => router.push('/faq')} 
            style={styles.headerNavLink}
          >
            <Text style={styles.headerNavText}>FAQ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/register')} 
            style={styles.headerNavLink}
          >
            <Text style={styles.headerNavText}>Pricing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSignIn} 
            style={styles.headerNavLink}
          >
            <Text style={styles.headerNavText}>Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleGetStarted} 
            style={styles.headerCta}
          >
            <Text style={styles.headerCtaText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.warmCream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 100,
  },
  headerTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogoImage: {
    width: 32,
    height: 32,
  },
  headerBrand: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.charcoal,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerNavLink: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerNavText: {
    fontSize: 15,
    color: COLORS.warmGray,
    fontWeight: '500',
  },
  headerCta: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  headerCtaText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default GlobalHeader;


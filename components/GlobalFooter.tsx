/**
 * GlobalFooter - Shared footer component for all public pages
 * 
 * Features:
 * - Logo with tagline
 * - Navigation links
 * - Social media icons
 * - Copyright and legal links
 * - Responsive design (mobile/desktop)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  teal: '#5BBFBA',
  charcoal: '#2D3436',
  warmGray: '#636E72',
  lightGray: '#B2BEC3',
  white: '#FFFFFF',
  softIvory: '#F5F3F0',
};

export function GlobalFooter() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View style={styles.footer}>
      <View style={[
        styles.footerContent, 
        isDesktop && { flexDirection: 'row', alignItems: 'flex-start' }
      ]}>
        {/* Logo & Tagline */}
        <View style={[styles.footerLogo, isDesktop && { alignItems: 'flex-start' }]}>
          <Image 
            source={require('@/assets/images/favicon-nobg.png')} 
            style={styles.footerLogoImage}
            resizeMode="contain"
          />
          <Text style={styles.footerTagline}>Trade scents, not cash</Text>
        </View>

        {/* Links */}
        <View style={[styles.footerLinks, isDesktop && { flexDirection: 'row', gap: 32 }]}>
          <TouchableOpacity onPress={() => router.push('/faq')}>
            <Text style={styles.footerLink}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={styles.footerLink}>How It Works</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={styles.footerLink}>Trust & Safety</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={styles.footerLink}>Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Social Icons */}
        <View style={styles.footerSocial}>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-instagram" size={20} color={COLORS.warmGray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-facebook" size={20} color={COLORS.warmGray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-twitter" size={20} color={COLORS.warmGray} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Bar */}
      <View style={[styles.footerBottom, isDesktop && { flexDirection: 'row' }]}>
        <Text style={styles.footerCopyright}>
          © 2025 ScentSwap. Made in Australia 🇦🇺
        </Text>
        <View style={styles.footerLegal}>
          <TouchableOpacity>
            <Text style={styles.footerLegalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.footerLegalDivider}>•</Text>
          <TouchableOpacity>
            <Text style={styles.footerLegalLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: COLORS.softIvory,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerContent: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    alignItems: 'center',
    gap: 32,
    marginBottom: 32,
  },
  footerLogo: {
    alignItems: 'center',
  },
  footerLogoImage: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 14,
    color: COLORS.warmGray,
  },
  footerLinks: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.warmGray,
  },
  footerSocial: {
    flexDirection: 'row',
    gap: 16,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBottom: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 16,
  },
  footerCopyright: {
    fontSize: 13,
    color: COLORS.lightGray,
  },
  footerLegal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLegalLink: {
    fontSize: 13,
    color: COLORS.lightGray,
  },
  footerLegalDivider: {
    color: COLORS.lightGray,
  },
});

export default GlobalFooter;



/**
 * ScentSwap Color Palette
 * Aesthetic: Light Luxe - Warm cream backgrounds with Teal & Coral accents from logo
 */

// Primary brand colors (from logo)
const teal = '#5BBFBA';        // Left bottle + swap arrows - PRIMARY
const coral = '#E8927C';       // Right bottle - SECONDARY
const tealDark = '#4A9E9A';    // Darker teal for hover/active states
const coralDark = '#D4836D';   // Darker coral for hover/active states

// Light theme backgrounds
const warmCream = '#FBF9F7';   // Main background
const softIvory = '#F5F3F0';   // Section backgrounds
const pureWhite = '#FFFFFF';   // Cards
const lightTeal = '#E8F6F5';   // Hero gradient start
const lightTealEnd = '#D4EFED'; // Hero gradient end

// Text colors
const charcoal = '#2D3436';    // Primary text
const warmGray = '#636E72';    // Secondary text
const lightGray = '#B2BEC3';   // Muted text

// Utility
const errorRed = '#E74C3C';
const successGreen = '#27AE60';

export const Colors = {
  // Brand colors for direct access
  brand: {
    teal,
    coral,
    tealDark,
    coralDark,
    lightTeal,
    lightTealEnd,
  },
  light: {
    text: charcoal,
    textSecondary: warmGray,
    textMuted: lightGray,
    background: warmCream,
    backgroundSecondary: softIvory,
    tint: teal,
    icon: charcoal,
    tabIconDefault: warmGray,
    tabIconSelected: teal,
    border: '#E0E0E0',
    primary: teal,
    secondary: coral,
    card: pureWhite,
    error: errorRed,
    success: successGreen,
    // Hero specific
    heroBackground: lightTeal,
    heroGradientEnd: lightTealEnd,
  },
  dark: {
    text: pureWhite,
    textSecondary: lightGray,
    textMuted: warmGray,
    background: '#1A2F38',
    backgroundSecondary: '#0F1C22',
    tint: teal,
    icon: pureWhite,
    tabIconDefault: warmGray,
    tabIconSelected: teal,
    border: '#2D4A52',
    primary: teal,
    secondary: coral,
    card: '#1A2F38',
    error: errorRed,
    success: successGreen,
    // Hero specific
    heroBackground: '#0F1C22',
    heroGradientEnd: '#1A2F38',
  },
};

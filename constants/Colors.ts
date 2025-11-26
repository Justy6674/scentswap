const primaryTeal = '#6AABA3';
const primaryTealLight = '#8DCDC6';
const primaryTealDark = '#4A8A83';
const mintLight = '#E0F2F1'; // Very light mint for backgrounds
const mintMedium = '#B2DFDB'; // Medium mint for accents
const mintDark = '#004D40'; // Dark mint for text/contrast
const accentCoral = '#E8A898';
const accentCoralLight = '#F5C5B8';
const accentCoralDark = '#D08878';
const successGreen = '#22C55E';
const warningOrange = '#F59E0B';
const errorRed = '#EF4444';

export const Colors = {
  light: {
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    background: '#FFFFFF',
    backgroundSecondary: mintLight, // Use mint for secondary background
    tint: primaryTeal,
    primary: primaryTeal,
    primaryLight: primaryTealLight,
    primaryDark: primaryTealDark,
    secondary: mintMedium,
    accent: accentCoral,
    accentLight: accentCoralLight,
    accentDark: accentCoralDark,
    success: successGreen,
    warning: warningOrange,
    error: errorRed,
    icon: '#6B7280',
    border: '#E5E7EB',
    card: '#FFFFFF',
    cardSecondary: '#F4F4F5',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryTeal,
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#0A0A0B',
    backgroundSecondary: '#18181B', // Keep dark for dark mode, maybe slight teal tint?
    tint: primaryTealLight,
    primary: primaryTeal,
    primaryLight: primaryTealLight,
    primaryDark: primaryTealDark,
    secondary: primaryTealDark,
    accent: accentCoral,
    accentLight: accentCoralLight,
    accentDark: accentCoralDark,
    success: successGreen,
    warning: warningOrange,
    error: errorRed,
    icon: '#9CA3AF',
    border: '#27272A',
    card: '#18181B',
    cardSecondary: '#27272A',
    tabIconDefault: '#6B7280',
    tabIconSelected: primaryTealLight,
  },
};

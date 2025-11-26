/**
 * ScentSwap Luxury Palette
 * Aesthetic: "Tom Ford Packaging" - Deep Black, Crisp White, Metallic Gold Accents.
 */

const gold = '#D4AF37'; // Metallic Gold
const deepBlack = '#050505'; // Almost pure black
const offBlack = '#121212'; // Material Dark
const pureWhite = '#FFFFFF';
const softGray = '#A0A0A0';
const errorRed = '#CF6679';

export const Colors = {
  light: {
    text: deepBlack,
    textSecondary: '#4A4A4A',
    background: '#F5F5F5', // Light gray for contrast in light mode
    backgroundSecondary: pureWhite,
    tint: gold,
    icon: '#2C2C2C',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: gold,
    border: '#E0E0E0',
    primary: gold,
    card: pureWhite,
    error: errorRed,
  },
  dark: {
    text: pureWhite,
    textSecondary: softGray,
    background: deepBlack,
    backgroundSecondary: offBlack,
    tint: gold,
    icon: pureWhite,
    tabIconDefault: '#666666',
    tabIconSelected: gold,
    border: '#333333',
    primary: gold,
    card: offBlack,
    error: errorRed,
  },
};

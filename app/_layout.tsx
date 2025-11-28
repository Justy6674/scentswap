import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { Head } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { OutsetaScript } from '@/components/OutsetaScript';

const ScentSwapLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const ScentSwapDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? ScentSwapDarkTheme : ScentSwapLightTheme}>
          <Head>
            <title>ScentSwap - AI Powered Fragrance Exchange</title>
            <meta name="description" content="Australia's first AI-powered fragrance marketplace. Trade scents, not cash. Verify authenticity and swap securely." />
            <meta property="og:title" content="ScentSwap - Trade Scents, Not Cash" />
            <meta property="og:description" content="Join Australia's most trusted fragrance trading community. AI-powered fairness, authenticity checks, and secure swaps." />
            <meta property="og:type" content="website" />
            <meta name="theme-color" content="#5BBFBA" />
          </Head>
          <OutsetaScript />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            <Stack.Screen name="listing/[id]" options={{ headerShown: true, title: 'Listing Details' }} />
            <Stack.Screen name="listing/new" options={{ headerShown: true, title: 'Add Fragrance' }} />
            <Stack.Screen name="swap/[id]" options={{ headerShown: true, title: 'Swap Details' }} />
            <Stack.Screen name="swap/new" options={{ headerShown: true, title: 'Propose Swap' }} />
            <Stack.Screen name="profile/[id]" options={{ headerShown: true, title: 'Profile' }} />
            <Stack.Screen name="search" options={{ headerShown: true, title: 'Search' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

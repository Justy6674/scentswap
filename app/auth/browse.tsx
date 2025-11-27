import { Redirect } from 'expo-router';

/**
 * Redirect for Outseta Post Login (Alternative Path)
 * 
 * Some configurations might redirect to /auth/browse.
 * This route captures that and redirects to the main tabs.
 */
export default function AuthBrowseRedirect() {
  return <Redirect href="/(tabs)" />;
}


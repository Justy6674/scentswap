import React, { useState, useEffect, ComponentType } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Loading component
const LoadingScreen = () => (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Loading Admin Panel...</Text>
    </View>
  </SafeAreaView>
);

export default function AdminScreen() {
  const [AdminContent, setAdminContent] = useState<ComponentType | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Dynamically import AdminContent only on client
    import('./AdminContent')
      .then((module) => {
        setAdminContent(() => module.default);
      })
      .catch((error) => {
        console.error('Failed to load AdminContent:', error);
      });
  }, []);

  // During SSR or while loading, show loading state
  if (!isClient || !AdminContent) {
    return <LoadingScreen />;
  }

  return <AdminContent />;
}


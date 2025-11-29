import React, { useState, useEffect, Suspense, lazy } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Dynamically import the admin content to avoid SSR issues
const AdminContent = lazy(() => import('./AdminContent'));

export default function AdminScreen() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR, show a loading state
  if (!isClient) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Loading Admin Panel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Suspense
      fallback={
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Loading Admin Panel...</Text>
          </View>
        </SafeAreaView>
      }
    >
      <AdminContent />
    </Suspense>
  );
}


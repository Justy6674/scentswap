import React from 'react';
import { View, Text } from 'react-native';

export default function AdminScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A2E' }}>
      <Text style={{ color: 'white', fontSize: 18 }}>Admin Panel</Text>
      <Text style={{ color: '#9CA3AF', marginTop: 12 }}>System operational</Text>
    </View>
  );
}


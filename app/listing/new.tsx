import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { db } from '@/lib/database';

const CONDITIONS = [
  { key: 'New', label: 'New', description: 'Sealed, never used' },
  { key: 'Like New', label: 'Like New', description: 'Used 1-2 times' },
  { key: 'Good', label: 'Good', description: 'Light use, good condition' },
  { key: 'Fair', label: 'Fair', description: 'Moderate use, some wear' },
];

const CONCENTRATIONS = ['Parfum', 'EDP', 'EDT', 'EDC', 'Cologne', 'Other'];

export default function NewListingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, isLoading: authLoading, isAdmin: authIsAdmin } = useAuth();
  const { isAdmin: subscriptionIsAdmin } = useSubscription();
  
  const isAdmin = authIsAdmin || subscriptionIsAdmin;
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [house, setHouse] = useState('');
  const [concentration, setConcentration] = useState('');
  const [sizeMl, setSizeMl] = useState('');
  const [fillPercentage, setFillPercentage] = useState('100');
  const [condition, setCondition] = useState('Like New');
  const [batchCode, setBatchCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - photos.length,
    });

    if (!result.canceled) {
      setPhotos([...photos, ...result.assets.map(a => a.uri)].slice(0, 5));
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri].slice(0, 5));
    }
  }

  function removePhoto(index: number) {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  function validate() {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter the fragrance name');
      return false;
    }
    if (!house.trim()) {
      Alert.alert('Validation Error', 'Please enter the fragrance house/brand');
      return false;
    }
    if (!sizeMl || isNaN(parseInt(sizeMl))) {
      Alert.alert('Validation Error', 'Please enter a valid bottle size');
      return false;
    }
    if (!fillPercentage || isNaN(parseInt(fillPercentage))) {
      Alert.alert('Validation Error', 'Please enter a valid fill percentage');
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate() || !user) return;
    
    setLoading(true);
    const listing = await db.createListing({
      user_id: user.id,
      custom_name: name,
      house: house,
      concentration: concentration || null,
      size_ml: parseInt(sizeMl),
      fill_percentage: parseInt(fillPercentage),
      condition: condition as 'New' | 'Like New' | 'Good' | 'Fair',
      batch_code: batchCode || null,
      description: description || null,
      photos: photos,
      is_active: true,
      fragrance_id: null,
      swap_preferences: null,
      estimated_value: null,
      admin_verified: isAdmin,
      admin_verified_at: isAdmin ? new Date().toISOString() : null,
    });
    setLoading(false);

    if (listing) {
      Alert.alert('Success', 'Your fragrance has been listed!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    photosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    photoContainer: {
      width: 100,
      height: 100,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    removePhotoButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addPhotoButton: {
      width: 100,
      height: 100,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    photoActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
    },
    photoActionText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.text,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    optionText: {
      fontSize: 14,
      color: colors.text,
    },
    optionTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    conditionCard: {
      flex: 1,
      minWidth: '45%',
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    conditionCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    conditionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    conditionDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    slider: {
      marginTop: 8,
    },
    sliderValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
    },
    sliderLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    fillBar: {
      height: 8,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 4,
      marginTop: 12,
      overflow: 'hidden',
    },
    fillLevel: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    fillButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    fillButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
    },
    fillButtonText: {
      fontSize: 14,
      color: colors.text,
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, authLoading]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Fragrance',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 5 && (
                <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                  <Ionicons name="add" size={32} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {photos.length < 5 && (
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoActionButton} onPress={pickImage}>
                  <Ionicons name="images-outline" size={20} color={colors.text} />
                  <Text style={styles.photoActionText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionButton} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={20} color={colors.text} />
                  <Text style={styles.photoActionText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <Input
              label="Fragrance Name"
              placeholder="e.g., Bleu de Chanel"
              value={name}
              onChangeText={setName}
            />
            <Input
              label="House/Brand"
              placeholder="e.g., Chanel"
              value={house}
              onChangeText={setHouse}
            />
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 }}>
              Concentration
            </Text>
            <View style={styles.optionsGrid}>
              {CONCENTRATIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.optionButton,
                    concentration === c && styles.optionButtonSelected,
                  ]}
                  onPress={() => setConcentration(c)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      concentration === c && styles.optionTextSelected,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size & Fill Level</Text>
            <Input
              label="Bottle Size (ml)"
              placeholder="e.g., 100"
              value={sizeMl}
              onChangeText={setSizeMl}
              keyboardType="numeric"
            />
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8, marginTop: 8 }}>
              Fill Level
            </Text>
            <View style={styles.slider}>
              <Text style={styles.sliderValue}>{fillPercentage}%</Text>
              <Text style={styles.sliderLabel}>
                {sizeMl ? `~${Math.round((parseInt(sizeMl) * parseInt(fillPercentage)) / 100)}ml remaining` : 'Enter size above'}
              </Text>
              <View style={styles.fillBar}>
                <View style={[styles.fillLevel, { width: `${fillPercentage}%` as any }]} />
              </View>
              <View style={styles.fillButtons}>
                {['25', '50', '75', '100'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={styles.fillButton}
                    onPress={() => setFillPercentage(val)}
                  >
                    <Text style={styles.fillButtonText}>{val}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condition</Text>
            <View style={styles.optionsGrid}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[
                    styles.conditionCard,
                    condition === c.key && styles.conditionCardSelected,
                  ]}
                  onPress={() => setCondition(c.key)}
                >
                  <Text
                    style={[
                      styles.conditionLabel,
                      condition === c.key && { color: colors.primary },
                    ]}
                  >
                    {c.label}
                  </Text>
                  <Text style={styles.conditionDescription}>{c.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Info (Optional)</Text>
            <Input
              label="Batch Code"
              placeholder="e.g., 38N101"
              value={batchCode}
              onChangeText={setBatchCode}
            />
            <Input
              label="Description"
              placeholder="Any additional notes about this fragrance..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <Button
            title="List Fragrance"
            onPress={handleSubmit}
            loading={loading}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

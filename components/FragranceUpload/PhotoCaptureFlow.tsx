/**
 * Photo Capture Flow
 * Guided photo capture with overlays and quality checking
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { UploadIntent } from './FragranceUploadFlow';

interface Props {
  intent: UploadIntent;
  onComplete: (photos: Record<string, string>) => void;
  onBack: () => void;
}

type PhotoType = 'front' | 'side' | 'bottom' | 'boxFront' | 'boxBottom';

interface PhotoRequirement {
  key: PhotoType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  required: boolean;
  overlay: string;
}

export default function PhotoCaptureFlow({ intent, onComplete, onBack }: Props) {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<FlashMode>(FlashMode.off);
  const cameraRef = useRef<Camera>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Define photo requirements based on intent
  const photoRequirements: PhotoRequirement[] = intent === 'library'
    ? [
        {
          key: 'front',
          title: 'Front View',
          description: 'Clear front view of the bottle with label visible',
          icon: 'camera',
          required: true,
          overlay: 'Place bottle in center frame'
        }
      ]
    : [
        {
          key: 'front',
          title: 'Front View',
          description: 'Clear front view with brand and fragrance name visible',
          icon: 'camera',
          required: true,
          overlay: 'Center bottle, ensure label is clear'
        },
        {
          key: 'side',
          title: 'Side View',
          description: 'Side angle showing fill level clearly',
          icon: 'swap-horizontal',
          required: true,
          overlay: 'Show liquid level from the side'
        },
        {
          key: 'bottom',
          title: 'Bottom View',
          description: 'Bottom of bottle showing batch code and authenticity markers',
          icon: 'arrow-down-circle',
          required: true,
          overlay: 'Show bottom clearly for authenticity check'
        },
        {
          key: 'boxFront',
          title: 'Box Front (Optional)',
          description: 'Original box front if available',
          icon: 'cube',
          required: false,
          overlay: 'Include original packaging if available'
        },
        {
          key: 'boxBottom',
          title: 'Box Bottom (Optional)',
          description: 'Box bottom with batch codes',
          icon: 'cube-outline',
          required: false,
          overlay: 'Show box bottom with codes'
        }
      ];

  const currentRequirement = photoRequirements[currentPhotoIndex];

  useEffect(() => {
    // Pulse animation for capture button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await requestPermission();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to take photos of your fragrances.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => ImagePicker.openSettings?.() }
        ]
      );
      return false;
    }
    return true;
  };

  const capturePhoto = async () => {
    if (!currentRequirement || isCapturing || !cameraRef.current) return;

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      setCurrentPhoto(photo.uri);
      setShowPreview(true);
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const acceptPhoto = () => {
    if (!currentPhoto || !currentRequirement) return;

    const newPhotos = {
      ...photos,
      [currentRequirement.key]: currentPhoto
    };

    setPhotos(newPhotos);
    setCurrentPhoto(null);
    setShowPreview(false);

    // Move to next photo or complete
    if (currentPhotoIndex < photoRequirements.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    } else {
      // Check if we have all required photos
      const requiredPhotos = photoRequirements.filter(req => req.required);
      const hasAllRequired = requiredPhotos.every(req => newPhotos[req.key]);

      if (hasAllRequired) {
        onComplete(newPhotos);
      } else {
        // Find first missing required photo
        const missingRequired = requiredPhotos.find(req => !newPhotos[req.key]);
        if (missingRequired) {
          const missingIndex = photoRequirements.findIndex(req => req.key === missingRequired.key);
          setCurrentPhotoIndex(missingIndex);
          Alert.alert(
            'Required Photo Missing',
            `Please take a ${missingRequired.title.toLowerCase()} photo to continue.`
          );
        }
      }
    }
  };

  const retakePhoto = () => {
    setCurrentPhoto(null);
    setShowPreview(false);
  };

  const skipOptionalPhoto = () => {
    if (currentRequirement?.required) return;

    if (currentPhotoIndex < photoRequirements.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    } else {
      // Check if we have all required photos
      const requiredPhotos = photoRequirements.filter(req => req.required);
      const hasAllRequired = requiredPhotos.every(req => photos[req.key]);

      if (hasAllRequired) {
        onComplete(photos);
      }
    }
  };

  const selectFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCurrentPhoto(result.assets[0].uri);
      setShowPreview(true);
    }
  };

  const toggleFlash = () => {
    setFlashMode(current => current === FlashMode.off ? FlashMode.on : FlashMode.off);
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#b68a71" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera" size={64} color="#b68a71" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDescription}>
            To capture photos of your fragrances, we need access to your camera.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showPreview && currentPhoto) {
    return (
      <View style={styles.container}>
        <View style={styles.previewHeader}>
          <TouchableOpacity style={styles.headerButton} onPress={retakePhoto}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Review Photo</Text>
            <Text style={styles.headerSubtitle}>{currentRequirement.title}</Text>
          </View>
        </View>

        <View style={styles.previewContainer}>
          <Image source={{ uri: currentPhoto }} style={styles.previewImage} />
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
            <Ionicons name="camera" size={20} color="#f8fafc" />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.acceptButton} onPress={acceptPhoto}>
            <Ionicons name="checkmark" size={20} color="#f8fafc" />
            <Text style={styles.acceptButtonText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {currentRequirement?.title || 'Take Photos'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Photo {currentPhotoIndex + 1} of {photoRequirements.length}
            {currentRequirement?.required ? ' (Required)' : ' (Optional)'}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
          <Ionicons
            name={flashMode === FlashMode.on ? 'flash' : 'flash-off'}
            size={24}
            color="#f8fafc"
          />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {photoRequirements.map((req, index) => (
          <View
            key={req.key}
            style={[
              styles.progressDot,
              index === currentPhotoIndex && styles.progressDotActive,
              photos[req.key] && styles.progressDotComplete,
            ]}
          />
        ))}
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
          flashMode={flashMode}
        >
          {/* Overlay Instructions */}
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              <Text style={styles.overlayTitle}>{currentRequirement?.title}</Text>
              <Text style={styles.overlayDescription}>
                {currentRequirement?.overlay}
              </Text>
            </View>

            {/* Frame Overlay */}
            <View style={styles.frameOverlay}>
              <View style={styles.frameCorner} />
              <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
              <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
              <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
            </View>
          </View>
        </Camera>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {currentRequirement?.description}
        </Text>
        <Text style={styles.instructionTip}>
          💡 Ensure good lighting and hold camera steady
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton} onPress={selectFromGallery}>
          <Ionicons name="images" size={24} color="#f8fafc" />
          <Text style={styles.controlButtonText}>Gallery</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.captureButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              isCapturing && styles.captureButtonDisabled
            ]}
            onPress={capturePhoto}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="large" color="#f8fafc" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {!currentRequirement?.required ? (
          <TouchableOpacity style={styles.skipButton} onPress={skipOptionalPhoto}>
            <Ionicons name="arrow-forward" size={24} color="#f8fafc" />
            <Text style={styles.controlButtonText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  permissionDescription: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  permissionButton: {
    backgroundColor: '#b68a71',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  permissionText: {
    fontSize: 16,
    color: '#f8fafc',
    marginTop: 16,
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#334155',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 250, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#334155',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#475569',
  },
  progressDotActive: {
    backgroundColor: '#b68a71',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotComplete: {
    backgroundColor: '#22c55e',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  overlayContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  overlayDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  frameOverlay: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    right: '15%',
    bottom: '25%',
  },
  frameCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#b68a71',
    borderWidth: 2,
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 2,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructions: {
    backgroundColor: '#334155',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#f8fafc',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  instructionTip: {
    fontSize: 12,
    color: '#b68a71',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#334155',
  },
  galleryButton: {
    alignItems: 'center',
    padding: 8,
  },
  skipButton: {
    alignItems: 'center',
    padding: 8,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#f8fafc',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  captureButtonContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#b68a71',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#f8fafc',
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#b68a71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#334155',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    backgroundColor: '#334155',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b68a71',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
});
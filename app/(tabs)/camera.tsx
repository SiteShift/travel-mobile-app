import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { CameraView, useCameraPermissions, Camera } from 'expo-camera';
import { Icon } from '../../src/components/Icon';
import { useRouter } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          exif: false,
        });
        console.log('Photo taken:', photo.uri);
        router.push({ pathname: '/entry-editor', params: { photoUri: photo.uri } });
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Could not take picture.');
      }
    }
  };

  const toggleCameraType = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };
  
  if (!permission) {
    return <View style={styles.permissionContainer} />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        flash={flash}
        ref={cameraRef}
      />
      
      {/* UI Overlay - positioned absolutely over the camera */}
      <SafeAreaView style={styles.uiOverlay} edges={['top', 'bottom']}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <Pressable style={styles.controlButton} onPress={() => router.back()}>
            <Icon name="close" size="xl" color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.controlButton} onPress={toggleFlash}>
            <Icon name={flash === 'on' ? 'flash' : 'flash-off'} size="xl" color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.controlButton} />
          <Pressable style={styles.shutterButton} onPress={handleTakePhoto}>
            <View style={styles.shutterButtonInner} />
          </Pressable>
          <Pressable style={styles.controlButton} onPress={toggleCameraType}>
            <Icon name="camera-reverse" size="xl" color="#FFFFFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  uiOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: 'space-between',
    pointerEvents: 'box-none', // Allow touches to pass through to camera
  },
  topControls: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  bottomControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingBottom: 20 },
  controlButton: { padding: 10, width: 60, alignItems: 'center' },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  permissionText: { color: 'white', fontSize: 18, marginBottom: 20 },
  permissionButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#333', borderRadius: 8 },
  permissionButtonText: { color: 'white', fontSize: 16 },
}); 
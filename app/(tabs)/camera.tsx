import { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar, Animated as RNAnimated } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import type { CameraViewRef } from 'expo-camera';
// Lazy-load MediaLibrary to avoid bundler error if the module isn't installed yet
let MediaLibrary: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MediaLibrary = require('expo-media-library');
} catch {}
import { useRouter } from 'expo-router';
import { Icon } from '../../src/components/Icon';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// Lazy-load Constants so we can detect Expo Go without adding a hard dep
let Constants: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Constants = require('expo-constants');
} catch {}
// Haptics feedback on shutter press
let Haptics: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics');
} catch {}
import Animated, {
  useSharedValue,
  runOnJS,
  interpolate,
  Extrapolate,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

export default function CameraScreen() {
  // State
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [zoom, setZoom] = useState(0);
  
  const [permission, requestPermission] = useCameraPermissions();
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Refs
  const cameraRef = useRef<CameraViewRef | null>(null);
  const router = useRouter();
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const shutterOpacity = useRef(new RNAnimated.Value(0)).current;
  const flashOpacity = useRef(new RNAnimated.Value(0)).current;
  const isFocused = useIsFocused();
  
  // Animation Shared Values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  // Focus Effect for Status Bar
  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(true);
      // Proactively ask for camera permission on first open
      if (!permission?.granted) {
        requestPermission();
      }
      // Reset zoom and saved scale on focus so the second open starts fresh
      savedScale.value = 1;
      setZoom(0);
      return () => {
        StatusBar.setHidden(false);
        if (recordingTimer.current) {
          clearTimeout(recordingTimer.current);
          recordingTimer.current = null;
        }
        setIsNavigating(false);
        shutterOpacity.setValue(0);
        setIsCameraReady(false);
      };
    }, [shutterOpacity, permission?.granted, requestPermission])
  );

  // Animated Styles
  // progress ring removed (photo-only)

  const shutterButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Gestures
  const updateZoom = useCallback((newZoom: number) => {
    setZoom(Math.max(0, Math.min(1, newZoom)));
  }, []);

  const toggleCameraFacing = useCallback(() => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }, []);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newZoom = interpolate(
        savedScale.value * event.scale,
        [1, 3], [0, 1], Extrapolate.CLAMP
      );
      runOnJS(updateZoom)(newZoom);
    })
    .onEnd((event) => {
      savedScale.value *= event.scale;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => runOnJS(toggleCameraFacing)());

  const composedGestures = Gesture.Simultaneous(pinchGesture, doubleTapGesture);

  // Core Functions
  const navigateToEditor = useCallback((uri: string) => {
    router.push({
      pathname: '/entry-editor',
      params: { photoUri: uri, cameraFacing: facing },
    });
  }, [router, facing]);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      // White flash to mask any preview pause during capture
      flashOpacity.setValue(1);
      RNAnimated.timing(flashOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      const refAny: any = cameraRef.current;
      const hasAsync = typeof refAny?.takePictureAsync === 'function';
      const hasSync = typeof refAny?.takePicture === 'function';
      if (!hasAsync && !hasSync) {
        try { console.warn('No capture function on camera ref'); } catch {}
        flashOpacity.setValue(0);
        return;
      }
      const photo = hasAsync
        ? await refAny.takePictureAsync({ 
            quality: 1.0,
            skipProcessing: true,
            mirror: false,
            exif: true,
          })
        : await refAny.takePicture({ 
            quality: 1.0,
            skipProcessing: true,
            mirror: false,
            exif: true,
          });
      if (photo?.uri) {
        // In Expo Go/local dev, skip saving to Media Library to avoid permission issues
        const isExpoGo = Constants?.appOwnership === 'expo' || __DEV__;
        if (!isExpoGo) {
          // Save to user's photo library (camera roll) only in standalone/dev-build
          try {
            if (MediaLibrary?.requestPermissionsAsync) {
              const libPerm = await MediaLibrary.requestPermissionsAsync();
              if (libPerm?.granted) {
                const asset = await MediaLibrary.createAssetAsync(photo.uri);
                try {
                  const albumName = 'TripMemo';
                  let album = await MediaLibrary.getAlbumAsync(albumName);
                  if (!album) {
                    album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
                  } else {
                    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                  }
                } catch {}
              }
            }
          } catch {}
        }
        navigateToEditor(photo.uri);
      } else {
        // ensure flash is gone
        flashOpacity.setValue(0);
      }
    } catch (e) {
      flashOpacity.setValue(0);
      console.error('Photo capture failed:', e);
    }
  }, [navigateToEditor, flashOpacity]);

  // Photo-only: no video recording

  // Request camera + mic permissions on first interaction (must be declared before use)
  const ensurePermissions = useCallback(async (): Promise<boolean> => {
    try {
      // In Expo Go, allow capture without prompting to keep local testing smooth
      const isExpoGo = Constants?.appOwnership === 'expo' || __DEV__;
      if (isExpoGo) return true;
      if (!permission?.granted) {
        const { granted } = await requestPermission();
        if (!granted) return false;
      }
      return true;
    } catch (e) {
      console.warn('Permission request failed', e);
      return false;
    }
  }, [permission?.granted, requestPermission]);

  const handleShutterPress = useCallback(async () => {
    try { Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Medium); } catch {}
    try { console.log('Shutter pressed'); } catch {}
    const ok = await ensurePermissions();
    try { console.log('Permissions ok:', ok); } catch {}
    if (!ok) return;
    try {
      const r: any = cameraRef.current;
      console.log('isCameraReady:', isCameraReady, 'hasRef:', !!r, 'hasTakePictureAsync:', typeof r?.takePictureAsync === 'function', 'hasTakePicture:', typeof r?.takePicture === 'function');
    } catch {}
    if (!isCameraReady) {
      setTimeout(() => {
        try { console.log('Retry after delay; ready?', isCameraReady); } catch {}
        takePicture();
      }, 200);
      return;
    }
    takePicture();
  }, [ensurePermissions, isCameraReady, takePicture]);

  const toggleFlash = useCallback(() => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  }, []);

  const closeCamera = useCallback(() => {
    if (recordingTimer.current) {
      clearTimeout(recordingTimer.current);
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/');
    }
  }, [router]);

  // (moved ensurePermissions above)

  const hasCameraPermission = !!permission?.granted;

  return (
    <View style={styles.fullScreenContainer}>
      {hasCameraPermission && (
        <>
          <CameraView 
            style={styles.fullScreenCamera} 
            facing={facing} 
            flash={flash} 
            zoom={zoom} 
            mode="picture"
            ref={(ref) => {
              try { console.log('Camera ref set:', !!ref); } catch {}
              cameraRef.current = ref as unknown as CameraViewRef | null;
            }}
            onCameraReady={() => { setIsCameraReady(true); try { console.log('Camera ready'); } catch {} }}
            onMountError={(e: any) => { setIsCameraReady(false); try { console.warn('Camera mount error', e?.nativeEvent?.message || e); } catch {} }}
          />
          {/* Gesture capture overlay (absolute, above camera) */}
          <GestureDetector gesture={composedGestures}>
            <View style={styles.gestureArea} />
          </GestureDetector>

          {/* Controls overlay (absolute, above camera) */}
          <View style={styles.controlsOverlay}>
            {/* Photo-only: no mode toggle */}
            <View style={styles.topControls}>
              {/* photo-only: no recording indicator */}
              <TouchableOpacity style={styles.controlButton} onPress={closeCamera} activeOpacity={0.7}>
                <Icon name="close" size="xl" color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.controlButton} onPress={toggleFlash} activeOpacity={0.7}>
                <Icon 
                  name={flash === 'on' ? 'flash' : 'flash-off'} 
                  size="xl" 
                  color={flash === 'on' ? '#FFD700' : 'white'} 
                />
              </TouchableOpacity>

              <View style={styles.shutterContainer}>
                <Animated.View style={[styles.shutterButton, shutterButtonStyle, !isCameraReady && { opacity: 0.6 } ]}>
                  <TouchableOpacity
                    style={styles.shutterTouchable}
                    onPress={handleShutterPress}
                    activeOpacity={1}
                  >
                    <View style={styles.shutterButtonInner} />
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing} activeOpacity={0.7}>
                <Icon name="refresh" size="xl" color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* White flash overlay (very quick) */}
          <RNAnimated.View pointerEvents="none" style={[styles.flashOverlay, { opacity: flashOpacity }]} />
        </>
      )}
      {!hasCameraPermission && (
        <View style={styles.permissionOverlay} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  fullScreenCamera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 20,
  },
  permissionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  shutterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 20,
  },
  gestureArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  permissionText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60, // Account for status bar
    zIndex: 10,
  },
  // removed modeToggleOverlay
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  // removed recording indicator styles
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40, // Account for home indicator
  },
  // removed mode toggle styles
  controlButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
  },
  shutterContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // removed recording ring styles
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shutterTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
  },
  shutterButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'black',
  },
  // removed recording state style
}); 
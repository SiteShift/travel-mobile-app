import { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar, Animated as RNAnimated } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Icon } from '../../src/components/Icon';
import { useFocusEffect } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const recordingTimer = useRef<NodeJS.Timeout | null>(null); // no longer used for long-press, kept for safety
  const shutterOpacity = useRef(new RNAnimated.Value(0)).current; // legacy (unused now)
  const flashOpacity = useRef(new RNAnimated.Value(0)).current;
  
  // Animation Shared Values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const recordingProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Focus Effect for Status Bar
  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(true);
      // Proactively ask for camera permission on first open
      if (!permission?.granted) {
        requestPermission();
      }
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
  const navigateToEditor = useCallback((uri: string, isVideo: boolean = false) => {
    router.push({
      pathname: '/entry-editor',
      params: { 
        photoUri: uri, 
        ...(isVideo && { isVideo: 'true' }),
        cameraFacing: facing
      },
    });
  }, [router, facing]);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      // White flash to mask any preview pause during capture
      flashOpacity.setValue(1);
      RNAnimated.timing(flashOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 1.0,
        skipProcessing: true,
        mirror: false,
        exif: true,
      });
      if (photo?.uri) {
        navigateToEditor(photo.uri, false);
      } else {
        // ensure flash is gone
        flashOpacity.setValue(0);
      }
    } catch (e) {
      flashOpacity.setValue(0);
      console.error('Photo capture failed:', e);
    }
  }, [navigateToEditor, shutterOpacity]);

  // removed: video recording (photo-only)

  // Request camera + mic permissions on first interaction (must be declared before use)
  const ensurePermissions = useCallback(async (): Promise<boolean> => {
    try {
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
    const ok = await ensurePermissions();
    if (!ok || !isCameraReady) return;
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
        <CameraView 
          style={styles.fullScreenCamera} 
          facing={facing} 
          flash={flash} 
          zoom={zoom} 
          ref={cameraRef}
          onCameraReady={() => setIsCameraReady(true)}
        >
        <GestureDetector gesture={composedGestures}>
          <View style={styles.gestureArea} />
        </GestureDetector>
        
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
                  disabled={!isCameraReady}
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
      </CameraView>
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
    flex: 1,
    width: '100%',
    height: '100%',
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
    flex: 1,
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
import { useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
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
  const [isRecording, setIsRecording] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  
  // Refs
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Animation Shared Values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const recordingProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Focus Effect for Status Bar
  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(true);
      return () => {
        StatusBar.setHidden(false);
        if (recordingTimer.current) {
          clearTimeout(recordingTimer.current);
          recordingTimer.current = null;
        }
      };
    }, [])
  );

  // Animated Styles
  const progressRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${recordingProgress.value * 360}deg` }],
  }));

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
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 1.0, // ABSOLUTE MAXIMUM quality for crystal clear photos
        skipProcessing: false,
        mirror: false,
        exif: true, // Keep EXIF data for best quality
      });
      if (photo?.uri) {
        navigateToEditor(photo.uri, false);
      }
    } catch (e) {
      console.error('Photo capture failed:', e);
    }
  }, [navigateToEditor]);

  const startRecording = useCallback(() => {
    if (!cameraRef.current) return;
    
    setIsRecording(true);
    
    cameraRef.current.recordAsync({ maxDuration: 30 })
      .then(video => {
        if (video?.uri) {
          navigateToEditor(video.uri, true);
        }
      })
      .catch(error => {
        console.error('Recording failed:', error);
      });
  }, [navigateToEditor]);

  const onShutterPressIn = useCallback(() => {
    buttonScale.value = withTiming(0.9, { duration: 100 });
    recordingTimer.current = setTimeout(() => {
      recordingProgress.value = withRepeat(withTiming(1, { duration: 30000 }), -1, true);
      startRecording();
    }, 200);
  }, [startRecording, buttonScale, recordingProgress]);
  
  const onShutterPressOut = useCallback(() => {
    if (recordingTimer.current) {
      clearTimeout(recordingTimer.current);
      recordingTimer.current = null;
      buttonScale.value = withTiming(1);
      takePicture();
    } else if (isRecording) {
      cameraRef.current?.stopRecording();
      setIsRecording(false);
      cancelAnimation(recordingProgress);
      recordingProgress.value = 0;
      buttonScale.value = withTiming(1);
    }
  }, [isRecording, takePicture, buttonScale, recordingProgress]);

  const toggleFlash = useCallback(() => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  }, []);

  const closeCamera = useCallback(() => {
    if (isRecording) {
      cameraRef.current?.stopRecording();
      setIsRecording(false);
    }
    if (recordingTimer.current) {
      clearTimeout(recordingTimer.current);
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/');
    }
  }, [isRecording, router]);

  // Render Logic
  if (!permission) return <View style={styles.fullScreenContainer} />;

  if (!permission.granted) {
    return (
      <View style={styles.fullScreenContainer}>
        <Text style={styles.permissionText}>We need your permission</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      <CameraView style={styles.fullScreenCamera} facing={facing} flash={flash} zoom={zoom} ref={cameraRef}>
        <GestureDetector gesture={composedGestures}>
          <View style={styles.gestureArea} />
        </GestureDetector>
        
        <View style={styles.controlsOverlay}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={closeCamera} activeOpacity={0.7}>
              <Icon name="close" size="xl" color="white" />
            </TouchableOpacity>
            
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>REC</Text>
              </View>
            )}
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
              {isRecording && (
                <Animated.View style={[styles.progressRing, progressRingStyle]}>
                  <View style={styles.progressRingInner} />
                </Animated.View>
              )}
              
              <Animated.View style={[styles.shutterButton, shutterButtonStyle]}>
                <TouchableOpacity
                  style={styles.shutterTouchable}
                  onPressIn={onShutterPressIn}
                  onPressOut={onShutterPressOut}
                  activeOpacity={1}
                >
                  <View style={[styles.shutterButtonInner, isRecording && styles.shutterButtonRecording]} />
                </TouchableOpacity>
              </Animated.View>
            </View>
            
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing} activeOpacity={0.7}>
              <Icon name="refresh" size="xl" color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
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
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  recordingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40, // Account for home indicator
  },
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
  progressRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  progressRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#FF3B30',
  },
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
  shutterButtonRecording: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
}); 
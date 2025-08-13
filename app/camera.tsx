import { useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
let MediaLibrary: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MediaLibrary = require('expo-media-library');
} catch {}
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Icon } from '../src/components/Icon';
let Constants: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Constants = require('expo-constants');
} catch {}

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const isFocused = useIsFocused();
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
            <Text style={styles.text}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function toggleFlash() {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  }

  const ensurePermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (!permission?.granted) {
        const { granted } = await requestPermission();
        if (!granted) return false;
      }
      return true;
    } catch {
      return false;
    }
  }, [permission?.granted, requestPermission]);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        skipProcessing: true,
        mirror: false,
        exif: true,
      });
      if (photo?.uri) {
        const isExpoGo = Constants?.appOwnership === 'expo' || __DEV__;
        if (!isExpoGo) {
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
        router.push({
          pathname: '/entry-editor',
          params: { 
            photoUri: photo.uri,
            cameraFacing: facing
          },
        });
      }
    } catch (e) {
      console.error('Photo capture failed:', e);
    }
  }, [router, facing]);

  const handleShutterPress = useCallback(async () => {
    const ok = await ensurePermissions();
    if (!ok) return;
    if (!isCameraReady) {
      setTimeout(() => {
        if (isCameraReady) takePicture();
      }, 120);
      return;
    }
    takePicture();
  }, [ensurePermissions, isCameraReady, takePicture]);

  const closeCamera = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/');
    }
  };

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          key={isFocused ? 'focused' : 'blurred'}
          style={styles.camera}
          facing={facing}
          flash={flash}
          ref={cameraRef}
          onCameraReady={() => setIsCameraReady(true)}
        />
      )}
      {/* Absolute overlay above camera */}
      <View style={styles.controlsOverlay}>
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={closeCamera}>
              <Icon name="close" size="xl" color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <Icon name={flash === 'on' ? 'sun' : 'cloud'} size="xl" color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomControls}>
          <View style={styles.controlButton} />
          <TouchableOpacity style={[styles.shutterButton, !isCameraReady && { opacity: 0.6 }]} onPress={handleShutterPress} disabled={!isCameraReady}>
            <View style={styles.shutterButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <Icon name="refresh" size="xl" color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    justifyContent: 'space-between',
    padding: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 40,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: 'black',
  },
}); 
import { useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Icon } from '../src/components/Icon';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  
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

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0, // Maximum quality for ultra-sharp photos
        skipProcessing: false,
        mirror: false,
        exif: true, // Keep EXIF data for best quality
      });
      if (photo) {
        console.log('Photo taken:', photo.uri);
        router.push({
          pathname: '/entry-editor',
          params: { 
            photoUri: photo.uri,
            cameraFacing: facing
          },
        });
      }
    }
  };

  const closeCamera = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        flash={flash}
        ref={cameraRef}
      >
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
                <TouchableOpacity style={styles.shutterButton} onPress={takePicture}>
              <View style={styles.shutterButtonInner} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
                    <Icon name="refresh" size="xl" color="white" />
                </TouchableOpacity>
            </View>
          </View>
      </CameraView>
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
    flex: 1,
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
    ...StyleSheet.absoluteFillObject,
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
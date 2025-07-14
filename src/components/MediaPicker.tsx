import React, { useState } from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { LoadingSpinner } from './LoadingSpinner';
import { SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  timestamp?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface MediaPickerProps {
  visible: boolean;
  onClose: () => void;
  onMediaSelect: (media: MediaItem[]) => void;
  maxSelection?: number;
  allowsEditing?: boolean;
  includeVideos?: boolean;
  quality?: number;
  selectedMedia?: MediaItem[];
  showCamera?: boolean;
  showLibrary?: boolean;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  visible,
  onClose,
  onMediaSelect,
  maxSelection = 10,
  allowsEditing = true,
  includeVideos = true,
  quality = 0.8,
  selectedMedia = [],
  showCamera = true,
  showLibrary = true,
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to add photos and videos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  // Note: Recent media functionality requires expo-media-library
  // For now, we'll focus on camera and library picker functionality

  const handleCameraPress = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: includeVideos ? ['images', 'videos'] : ['images'],
        allowsEditing,
        aspect: [4, 3],
        quality,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaItem: MediaItem = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          width: asset.width,
          height: asset.height,
          duration: asset.duration ?? undefined,
          size: asset.fileSize ?? undefined,
          timestamp: Date.now(),
        };

        handleMediaSelection([mediaItem]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture media. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLibraryPress = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: includeVideos ? ['images', 'videos'] : ['images'],
        allowsMultipleSelection: maxSelection > 1,
        selectionLimit: maxSelection,
        allowsEditing: maxSelection === 1 && allowsEditing,
        aspect: [4, 3],
        quality,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets.length > 0) {
        const mediaItems: MediaItem[] = result.assets.map(asset => ({
          id: Date.now().toString() + Math.random(),
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          width: asset.width,
          height: asset.height,
          duration: asset.duration ?? undefined,
          size: asset.fileSize ?? undefined,
          timestamp: Date.now(),
        }));

        handleMediaSelection(mediaItems);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select media. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaSelection = (media: MediaItem[]) => {
    onMediaSelect(media);
    onClose();
  };





    return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              Select Cover Photo
            </Text>
            <Text style={styles.subtitle}>
              Choose how you want to add your cover photo
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.firstActionButton}
            onPress={handleCameraPress}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>
              Take Photo
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLibraryPress}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>
              Choose from Library
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
      
      {isLoading && (
        <LoadingSpinner
          variant="overlay"
          message="Processing media..."
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    zIndex: 9999,
  },
  modalContainer: {
    borderRadius: 14,
    width: screenWidth * 0.65,
    maxWidth: 270,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 25,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
    textAlign: 'center',
    color: '#000000',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    color: '#666666',
  },
  actionButton: {
    paddingVertical: SPACING.md + 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  firstActionButton: {
    paddingVertical: SPACING.md + 2,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#007AFF',
  },
  cancelButton: {
    paddingVertical: SPACING.md + 2,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#007AFF',
  },
});

   
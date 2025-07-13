import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Button } from './Button';
import { BottomSheet } from './BottomSheet';
import { LoadingSpinner } from './LoadingSpinner';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [recentMedia, setRecentMedia] = useState<MediaItem[]>([]);
  const [currentSelection, setCurrentSelection] = useState<MediaItem[]>(selectedMedia);

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

  const handleRecentMediaPress = (media: MediaItem) => {
    const isSelected = currentSelection.some(item => item.id === media.id);
    
    if (isSelected) {
      const newSelection = currentSelection.filter(item => item.id !== media.id);
      setCurrentSelection(newSelection);
    } else {
      if (currentSelection.length < maxSelection) {
        setCurrentSelection([...currentSelection, media]);
      } else {
        Alert.alert(
          'Selection Limit',
          `You can only select up to ${maxSelection} items.`
        );
      }
    }
  };

  const handleMediaSelection = (media: MediaItem[]) => {
    if (maxSelection === 1) {
      onMediaSelect(media);
      onClose();
    } else {
      const newSelection = [...currentSelection];
      
      for (const item of media) {
        if (newSelection.length < maxSelection) {
          newSelection.push(item);
        }
      }
      
      setCurrentSelection(newSelection);
    }
  };

  const handleConfirmSelection = () => {
    onMediaSelect(currentSelection);
    onClose();
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => {
    const isSelected = currentSelection.some(selected => selected.id === item.id);
    const selectionIndex = currentSelection.findIndex(selected => selected.id === item.id);
    const itemSize = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm * 2) / 3;

    return (
      <TouchableOpacity
        style={[
          styles.mediaItem,
          {
            width: itemSize,
            height: itemSize,
            borderColor: isSelected ? colors.primary[500] : 'transparent',
          },
        ]}
        onPress={() => handleRecentMediaPress(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
        
        {item.type === 'video' && (
          <View style={styles.videoIndicator}>
            <Icon name="play" size="sm" color={colors.text.inverse} />
            {item.duration && (
              <Text style={[styles.videoDuration, { color: colors.text.inverse }]}>
                {Math.round(item.duration / 1000)}s
              </Text>
            )}
          </View>
        )}

        {maxSelection > 1 && (
          <View style={[
            styles.selectionIndicator,
            {
              backgroundColor: isSelected ? colors.primary[500] : 'rgba(0,0,0,0.3)',
              borderColor: colors.text.inverse,
            }
          ]}>
            {isSelected && (
              <Text style={[styles.selectionNumber, { color: colors.text.inverse }]}>
                {selectionIndex + 1}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      {showCamera && (
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.primary[500] }]}
          onPress={handleCameraPress}
          disabled={isLoading}
        >
          <Icon name="camera" size="lg" color={colors.text.inverse} />
          <Text style={[styles.quickActionText, { color: colors.text.inverse }]}>
            Camera
          </Text>
        </TouchableOpacity>
      )}
      
      {showLibrary && (
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.secondary[500] }]}
          onPress={handleLibraryPress}
          disabled={isLoading}
        >
          <Icon name="images" size="lg" color={colors.text.inverse} />
          <Text style={[styles.quickActionText, { color: colors.text.inverse }]}>
            Library
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRecentMedia = () => {
    if (recentMedia.length === 0) return null;

    return (
      <View style={styles.recentSection}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Recent Media
        </Text>
        
        <FlatList
          data={recentMedia}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.mediaGrid}
          columnWrapperStyle={styles.mediaRow}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          style={styles.mediaList}
        />
      </View>
    );
  };

  const renderFooter = () => {
    if (maxSelection === 1 || currentSelection.length === 0) return null;

    return (
      <View style={[styles.footer, { borderTopColor: colors.border.primary }]}>
        <Text style={[styles.selectionCount, { color: colors.text.secondary }]}>
          {currentSelection.length} of {maxSelection} selected
        </Text>
        
        <Button
          title={`Add ${currentSelection.length} ${currentSelection.length === 1 ? 'item' : 'items'}`}
          onPress={handleConfirmSelection}
          disabled={currentSelection.length === 0}
        />
      </View>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      size="large"
      title="Add Media"
    >
      {isLoading && (
        <LoadingSpinner
          variant="overlay"
          message="Processing media..."
        />
      )}
      
      {renderQuickActions()}
      {renderRecentMedia()}
      {renderFooter()}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  quickActions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  quickActionText: {
    ...TYPOGRAPHY.styles.bodySmall,
    fontWeight: '600',
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.md,
  },
  mediaList: {
    flex: 1,
    maxHeight: 400,
  },
  mediaGrid: {
    paddingBottom: SPACING.lg,
  },
  mediaRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  mediaItem: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: SPACING.xs,
    left: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    gap: SPACING.xs,
  },
  videoDuration: {
    ...TYPOGRAPHY.styles.caption,
    fontSize: 10,
  },
  selectionIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionNumber: {
    ...TYPOGRAPHY.styles.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  selectionCount: {
    ...TYPOGRAPHY.styles.body,
  },
}); 
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { SafeAreaWrapper } from './SafeAreaWrapper';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PhotoItem {
  id: string;
  uri: string;
  thumbnail?: string;
  title?: string;
  date: string;
  location?: string;
  entryId?: string;
  entryTitle?: string;
  tags?: string[];
  metadata?: {
    width: number;
    height: number;
    size: number;
    camera?: string;
    settings?: string;
  };
}

export interface PhotoGalleryProps {
  photos: PhotoItem[];
  onPhotoPress?: (photo: PhotoItem, index: number) => void;
  onPhotoLongPress?: (photo: PhotoItem, index: number) => void;
  onSelectionChange?: (selectedPhotos: PhotoItem[]) => void;
  selectionMode?: boolean;
  selectedPhotos?: PhotoItem[];
  numColumns?: number;
  showMetadata?: boolean;
  showEntryInfo?: boolean;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  style?: ViewStyle;
  testID?: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onPhotoPress,
  onPhotoLongPress,
  onSelectionChange,
  selectionMode = false,
  selectedPhotos = [],
  numColumns = 2,
  showMetadata = false,
  showEntryInfo = true,
  emptyStateTitle = 'No Photos Yet',
  emptyStateMessage = 'Photos from your trip entries will appear here.',
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const itemWidth = (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * (numColumns - 1)) / numColumns;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isPhotoSelected = (photo: PhotoItem) => {
    return selectedPhotos.some(selected => selected.id === photo.id);
  };

  const handlePhotoPress = (photo: PhotoItem, index: number) => {
    if (selectionMode) {
      handlePhotoSelection(photo);
    } else if (onPhotoPress) {
      onPhotoPress(photo, index);
    } else {
      // Default to lightbox
      setCurrentPhotoIndex(index);
      setLightboxVisible(true);
    }
  };

  const handlePhotoLongPress = (photo: PhotoItem, index: number) => {
    if (onPhotoLongPress) {
      onPhotoLongPress(photo, index);
    } else {
      // Default to selection mode
      handlePhotoSelection(photo);
    }
  };

  const handlePhotoSelection = (photo: PhotoItem) => {
    const isSelected = isPhotoSelected(photo);
    let newSelection: PhotoItem[];

    if (isSelected) {
      newSelection = selectedPhotos.filter(selected => selected.id !== photo.id);
    } else {
      newSelection = [...selectedPhotos, photo];
    }

    onSelectionChange?.(newSelection);
  };

  const handleLightboxNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (direction === 'next' && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const renderPhotoItem = ({ item: photo, index }: { item: PhotoItem; index: number }) => {
    const isSelected = isPhotoSelected(photo);

    return (
      <TouchableOpacity
        style={[
          styles.photoItem,
          {
            width: itemWidth,
            backgroundColor: colors.surface.secondary,
          },
          isSelected && {
            borderColor: colors.primary[500],
            borderWidth: 3,
          },
        ]}
        onPress={() => handlePhotoPress(photo, index)}
        onLongPress={() => handlePhotoLongPress(photo, index)}
        activeOpacity={0.8}
      >
        {/* Photo Image */}
        <Image
          source={{ uri: photo.uri }} // ALWAYS use full quality image for crystal clarity
          style={styles.photoImage}
          resizeMode="cover"
        />

        {/* Selection Overlay */}
        {selectionMode && (
          <View style={styles.selectionOverlay}>
            <View
              style={[
                styles.selectionCircle,
                {
                  backgroundColor: isSelected ? colors.primary[500] : 'transparent',
                  borderColor: colors.text.inverse,
                },
              ]}
            >
              {isSelected && (
                <Icon name="checkmark" size="xs" color={colors.text.inverse} />
              )}
            </View>
          </View>
        )}

        {/* Photo Info Overlay */}
        {showEntryInfo && photo.entryTitle && (
          <View style={[styles.photoInfoOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Text style={[styles.photoInfoText, { color: colors.text.inverse }]} numberOfLines={1}>
              {photo.entryTitle}
            </Text>
            <Text style={[styles.photoDateText, { color: colors.text.inverse }]}>
              {formatDate(photo.date)}
            </Text>
          </View>
        )}

        {/* Metadata Badge */}
        {showMetadata && photo.tags && photo.tags.length > 0 && (
          <View style={styles.metadataBadge}>
            <Badge
              variant="default"
              size="small"
              label={`+${photo.tags.length}`}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderLightbox = () => {
    if (!lightboxVisible || photos.length === 0) return null;

    const currentPhoto = photos[currentPhotoIndex];

    return (
      <Modal
        visible={lightboxVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLightboxVisible(false)}
      >
        <View style={[styles.lightboxContainer, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
          <SafeAreaWrapper variant="full">
            {/* Lightbox Header */}
            <View style={styles.lightboxHeader}>
              <TouchableOpacity
                style={styles.lightboxCloseButton}
                onPress={() => setLightboxVisible(false)}
              >
                <Icon name="close" size="md" color={colors.text.inverse} />
              </TouchableOpacity>
              <View style={styles.lightboxHeaderInfo}>
                <Text style={[styles.lightboxTitle, { color: colors.text.inverse }]}>
                  {currentPhoto.title || currentPhoto.entryTitle || 'Photo'}
                </Text>
                <Text style={[styles.lightboxSubtitle, { color: colors.text.inverse }]}>
                  {currentPhotoIndex + 1} of {photos.length}
                </Text>
              </View>
            </View>

            {/* Photo Viewer */}
            <View style={styles.lightboxContent}>
              <ScrollView
                style={styles.lightboxScrollView}
                contentContainerStyle={styles.lightboxScrollContent}
                minimumZoomScale={1}
                maximumZoomScale={3}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
                <Image
                  source={{ uri: currentPhoto.uri }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
              </ScrollView>

              {/* Navigation Buttons */}
              {photos.length > 1 && (
                <>
                  {currentPhotoIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.lightboxNavButton, styles.lightboxNavButtonLeft]}
                      onPress={() => handleLightboxNavigation('prev')}
                    >
                      <Icon name="chevron-left" size="lg" color={colors.text.inverse} />
                    </TouchableOpacity>
                  )}
                  {currentPhotoIndex < photos.length - 1 && (
                    <TouchableOpacity
                      style={[styles.lightboxNavButton, styles.lightboxNavButtonRight]}
                      onPress={() => handleLightboxNavigation('next')}
                    >
                      <Icon name="chevron-right" size="lg" color={colors.text.inverse} />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Photo Metadata */}
            {showMetadata && currentPhoto.metadata && (
              <View style={[styles.lightboxFooter, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                <Text style={[styles.lightboxMetadataText, { color: colors.text.inverse }]}>
                  {formatDate(currentPhoto.date)}
                  {currentPhoto.location && ` • ${currentPhoto.location}`}
                </Text>
                {currentPhoto.metadata.camera && (
                  <Text style={[styles.lightboxMetadataText, { color: colors.text.inverse }]}>
                    {currentPhoto.metadata.camera}
                    {currentPhoto.metadata.settings && ` • ${currentPhoto.metadata.settings}`}
                  </Text>
                )}
              </View>
            )}
          </SafeAreaWrapper>
        </View>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Icon name="camera" size="xxl" color={colors.text.tertiary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
        {emptyStateTitle}
      </Text>
      <Text style={[styles.emptyStateMessage, { color: colors.text.secondary }]}>
        {emptyStateMessage}
      </Text>
    </View>
  );

  if (photos.length === 0) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
        showsVerticalScrollIndicator={false}
      />
      {renderLightbox()}
    </View>
  );
};

// Convenience components
export const TripPhotoGallery: React.FC<Omit<PhotoGalleryProps, 'showEntryInfo'>> = (props) => (
  <PhotoGallery {...props} showEntryInfo={true} />
);

export const CompactPhotoGallery: React.FC<Omit<PhotoGalleryProps, 'numColumns' | 'showMetadata'>> = (props) => (
  <PhotoGallery {...props} numColumns={3} showMetadata={false} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  photoItem: {
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  },
  photoInfoText: {
    ...TYPOGRAPHY.styles.caption,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  photoDateText: {
    ...TYPOGRAPHY.styles.caption,
    fontSize: 11,
  },
  metadataBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    minHeight: 300,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.styles.h2,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateMessage: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  lightboxContainer: {
    flex: 1,
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  lightboxCloseButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  lightboxHeaderInfo: {
    flex: 1,
  },
  lightboxTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: 2,
  },
  lightboxSubtitle: {
    ...TYPOGRAPHY.styles.caption,
  },
  lightboxContent: {
    flex: 1,
    position: 'relative',
  },
  lightboxScrollView: {
    flex: 1,
  },
  lightboxScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  lightboxNavButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.md,
  },
  lightboxNavButtonLeft: {
    left: SPACING.md,
  },
  lightboxNavButtonRight: {
    right: SPACING.md,
  },
  lightboxFooter: {
    padding: SPACING.md,
  },
  lightboxMetadataText: {
    ...TYPOGRAPHY.styles.caption,
    marginBottom: 2,
  },
});

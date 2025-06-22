import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { SafeAreaWrapper } from './SafeAreaWrapper';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PhotoLightboxItem {
  id: string;
  uri: string;
  title?: string;
  date: string;
  location?: string;
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

export interface PhotoLightboxProps {
  visible: boolean;
  photos: PhotoLightboxItem[];
  initialIndex?: number;
  onClose: () => void;
  onPhotoChange?: (index: number, photo: PhotoLightboxItem) => void;
  onShare?: (photo: PhotoLightboxItem) => void;
  onDelete?: (photo: PhotoLightboxItem) => void;
  showMetadata?: boolean;
  showActions?: boolean;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  visible,
  photos,
  initialIndex = 0,
  onClose,
  onPhotoChange,
  onShare,
  onDelete,
  showMetadata = true,
  showActions = true,
}) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1);
      scale.value = withSpring(1);
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [visible]);

  const currentPhoto = photos[currentIndex];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onPhotoChange?.(newIndex, photos[newIndex]);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onPhotoChange?.(newIndex, photos[newIndex]);
    }
  };

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 });
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      'worklet';
    },
    onActive: (event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // Scale down slightly when dragging
      const distance = Math.sqrt(
        Math.pow(event.translationX, 2) + Math.pow(event.translationY, 2)
      );
      const maxDistance = 200;
      const scaleValue = Math.max(0.8, 1 - (distance / maxDistance) * 0.2);
      scale.value = scaleValue;
      
      // Fade out when dragging down
      if (event.translationY > 0) {
        const fadeValue = Math.max(0.3, 1 - (event.translationY / 300));
        opacity.value = fadeValue;
      }
    },
    onEnd: (event) => {
      'worklet';
      // If dragged down significantly, close the lightbox
      if (event.translationY > 100 || Math.abs(event.velocityY) > 1000) {
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.8, { duration: 200 });
        runOnJS(handleClose)();
      } 
      // If dragged left/right significantly, change photo
      else if (Math.abs(event.translationX) > 100 && Math.abs(event.velocityX) > 500) {
        if (event.translationX > 0 && currentIndex > 0) {
          runOnJS(handlePrevious)();
        } else if (event.translationX < 0 && currentIndex < photos.length - 1) {
          runOnJS(handleNext)();
        }
        
        // Reset position
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withTiming(1);
      } 
      // Otherwise, spring back to original position
      else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withTiming(1);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: showControls ? 1 : 0,
          transform: [{ translateY: showControls ? 0 : -100 }],
        },
      ]}
    >
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Icon name="close" size="md" color={colors.text.inverse} />
      </TouchableOpacity>
      
      <View style={styles.headerInfo}>
        <Text style={[styles.headerTitle, { color: colors.text.inverse }]} numberOfLines={1}>
          {currentPhoto?.title || currentPhoto?.entryTitle || 'Photo'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.inverse }]}>
          {currentIndex + 1} of {photos.length}
        </Text>
      </View>

      {showActions && (
        <View style={styles.headerActions}>
          {onShare && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onShare(currentPhoto)}
            >
              <Icon name="share" size="md" color={colors.text.inverse} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete(currentPhoto)}
            >
              <Icon name="trash" size="md" color={colors.error[400]} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );

  const renderNavigationButtons = () => (
    <>
      {currentIndex > 0 && (
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonLeft]}
          onPress={handlePrevious}
        >
          <Icon name="chevron-left" size="lg" color={colors.text.inverse} />
        </TouchableOpacity>
      )}
      {currentIndex < photos.length - 1 && (
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonRight]}
          onPress={handleNext}
        >
          <Icon name="chevron-right" size="lg" color={colors.text.inverse} />
        </TouchableOpacity>
      )}
    </>
  );

  const renderFooter = () => {
    if (!showMetadata || !currentPhoto) return null;

    return (
      <Animated.View
        style={[
          styles.footer,
          { backgroundColor: 'rgba(0,0,0,0.8)' },
          {
            opacity: showControls ? 1 : 0,
            transform: [{ translateY: showControls ? 0 : 100 }],
          },
        ]}
      >
        <Text style={[styles.footerDate, { color: colors.text.inverse }]}>
          {formatDate(currentPhoto.date)}
        </Text>
        
        {currentPhoto.location && (
          <View style={styles.footerLocation}>
            <Icon name="map-pin" size="xs" color={colors.text.inverse} />
            <Text style={[styles.footerLocationText, { color: colors.text.inverse }]}>
              {currentPhoto.location}
            </Text>
          </View>
        )}

        {currentPhoto.tags && currentPhoto.tags.length > 0 && (
          <View style={styles.footerTags}>
                         {currentPhoto.tags.slice(0, 3).map((tag) => (
               <Badge
                 key={tag}
                 variant="default"
                 outlined={true}
                 size="small"
                 label={tag}
                 style={styles.tag}
               />
             ))}
             {currentPhoto.tags.length > 3 && (
               <Badge
                 variant="default"
                 outlined={true}
                 size="small"
                 label={`+${currentPhoto.tags.length - 3}`}
                 style={styles.tag}
               />
             )}
          </View>
        )}

        {currentPhoto.metadata && (
          <View style={styles.footerMetadata}>
            <Text style={[styles.metadataText, { color: colors.text.inverse }]}>
              {currentPhoto.metadata.width} × {currentPhoto.metadata.height}
              {currentPhoto.metadata.size && ` • ${formatFileSize(currentPhoto.metadata.size)}`}
            </Text>
            {currentPhoto.metadata.camera && (
              <Text style={[styles.metadataText, { color: colors.text.inverse }]}>
                {currentPhoto.metadata.camera}
                {currentPhoto.metadata.settings && ` • ${currentPhoto.metadata.settings}`}
              </Text>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  if (!visible || !currentPhoto) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
        <SafeAreaWrapper variant="full">
          {renderHeader()}

          <PanGestureHandler onGestureEvent={panGestureHandler}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <TouchableOpacity
                style={styles.imageWrapper}
                onPress={toggleControls}
                activeOpacity={1}
              >
                <ScrollView
                  style={styles.imageScrollView}
                  contentContainerStyle={styles.imageScrollContent}
                  minimumZoomScale={1}
                  maximumZoomScale={3}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  bouncesZoom={false}
                >
                  <Image
                    source={{ uri: currentPhoto.uri }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </ScrollView>
              </TouchableOpacity>
            </Animated.View>
          </PanGestureHandler>

          {showControls && renderNavigationButtons()}
          {renderFooter()}
        </SafeAreaWrapper>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  closeButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.styles.caption,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.md,
    zIndex: 1,
  },
  navButtonLeft: {
    left: SPACING.md,
  },
  navButtonRight: {
    right: SPACING.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    zIndex: 1,
  },
  footerDate: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.sm,
  },
  footerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  footerLocationText: {
    ...TYPOGRAPHY.styles.body,
  },
  footerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tag: {
    marginRight: 0,
    marginBottom: 0,
  },
  footerMetadata: {
    gap: SPACING.xs,
  },
  metadataText: {
    ...TYPOGRAPHY.styles.caption,
  },
}); 
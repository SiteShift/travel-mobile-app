import React, { memo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { MinimalMemory } from '../../types/tripDetailMinimal';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

interface MinimalPhotoCardProps {
  memory: MinimalMemory;
  onPress: (memory: MinimalMemory) => void;
  onCaptionEdit?: (memoryId: string) => void;
  showCaption?: boolean;
  isEditingCaption?: boolean;
  width?: number;
  borderRadius?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const MinimalPhotoCard: React.FC<MinimalPhotoCardProps> = memo(({
  memory,
  onPress,
  onCaptionEdit,
  showCaption = true,
  isEditingCaption = false,
  width = screenWidth - SPACING.lg * 2,
  borderRadius = BORDER_RADIUS.sm
}) => {
  const { colors } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [captionText, setCaptionText] = useState(memory.caption || '');
  
  const handlePress = () => onPress(memory);
  
  const handleCaptionPress = () => {
    if (onCaptionEdit) {
      onCaptionEdit(memory.id);
    }
  };
  
  // Calculate height based on aspect ratio
  const aspectRatio = memory.aspectRatio || 1;
  const height = width / aspectRatio;
  
  return (
    <View style={[
      styles.photoWrapper,
      showCaption && memory.caption && styles.photoWrapperWithCaption,
      { 
        borderColor: colors.border.secondary,
        backgroundColor: colors.background.primary,
      }
    ]}>
      <TouchableOpacity
        style={[styles.container, { width, height, borderRadius }]}
        onPress={handlePress}
        activeOpacity={0.95}
      >
        {/* Loading state */}
        {!imageLoaded && (
          <View style={[styles.loadingState, { backgroundColor: colors.surface.secondary }]} />
        )}
        
        {/* Photo */}
        <Image
          source={{ uri: memory.uri }}
          style={[styles.photo, { borderRadius }]}
          contentFit="cover"
          transition={300}
          onLoad={() => setImageLoaded(true)}
        />
      </TouchableOpacity>
      
      {/* Caption below image */}
      {memory.caption && showCaption && (
        <TouchableOpacity 
          style={styles.captionBelow}
          onPress={handleCaptionPress}
          activeOpacity={0.7}
        >
          {isEditingCaption ? (
            <TextInput
              style={[styles.captionInput, { 
                color: colors.text.primary,
                borderColor: colors.primary[500] 
              }]}
              value={captionText}
              onChangeText={setCaptionText}
              placeholder="Add a caption..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              autoFocus
              onBlur={() => console.log('Save caption:', captionText)}
            />
          ) : (
            <Text 
              style={[styles.captionText, { color: colors.text.primary }]} 
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {memory.caption}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  photoWrapper: {
    // marginBottom removed - spacing now handled at grid level
  },
  
  photoWrapperWithCaption: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  container: {
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  
  loadingState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  photo: {
    width: '100%',
    height: '100%',
  },
  
  captionBelow: {
    padding: SPACING.md,
    backgroundColor: 'white',
  },
  
  captionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  
  captionInput: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    textAlignVertical: 'top',
    minHeight: 40,
  },
  
  // Legacy styles to remove
  captionGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  },
  
  caption: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    lineHeight: 20,
  },
});

MinimalPhotoCard.displayName = 'MinimalPhotoCard';

export { MinimalPhotoCard }; 
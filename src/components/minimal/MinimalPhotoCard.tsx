import React, { memo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Keyboard,
  Platform,
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
  onCaptionUpdate?: (memoryId: string, caption: string) => void;
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
  onCaptionUpdate,
  showCaption = true,
  isEditingCaption = false,
  width = screenWidth - SPACING.lg * 2,
  borderRadius = BORDER_RADIUS.sm
}) => {
  const { colors } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const captionInputRef = useRef<TextInput>(null);
  
  // Initialize caption text properly
  useEffect(() => {
    if (isEditingCaption) {
      // Set to actual caption or empty string (not placeholder)
      setCaptionText(memory.caption === 'Add a caption...' ? '' : memory.caption || '');
    }
  }, [isEditingCaption, memory.caption]);
  
  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  const handlePress = () => onPress(memory);
  
  const handleCaptionPress = () => {
    if (onCaptionEdit) {
      onCaptionEdit(memory.id);
    }
  };
  
  const handleCaptionBlur = () => {
    if (onCaptionUpdate) {
      // Auto-save on blur
      const finalCaption = captionText.trim() || 'Add a caption...';
      onCaptionUpdate(memory.id, finalCaption);
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
        // Move up when keyboard is visible and this caption is being edited
        transform: [{ translateY: isEditingCaption ? -keyboardHeight * 0.3 : 0 }]
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
          priority="high"
          cachePolicy="memory-disk"
          recyclingKey={memory.id}
          allowDownscaling={false}
          autoplay={false}
          onLoad={() => setImageLoaded(true)}
        />
      </TouchableOpacity>
      
      {/* Caption below image */}
      {showCaption && (
        <TouchableOpacity 
          style={styles.captionBelow}
          onPress={handleCaptionPress}
          activeOpacity={0.7}
          disabled={isEditingCaption}
        >
          {isEditingCaption ? (
            <TextInput
              ref={captionInputRef}
              style={[styles.captionInput, { 
                color: colors.text.primary,
                backgroundColor: colors.surface.primary,
                borderColor: 'transparent', // Remove blue outline
                borderWidth: 0, // Remove all borders
              }]}
              value={captionText}
              onChangeText={setCaptionText}
              placeholder="Add a caption..."
              placeholderTextColor={colors.text.tertiary} // More grey placeholder
              multiline
              autoFocus
              onBlur={handleCaptionBlur}
              returnKeyType="done"
              blurOnSubmit={true}
              textAlignVertical="top"
            />
          ) : (
            <Text 
              style={[styles.captionText, { 
                color: memory.caption === 'Add a caption...' ? colors.text.tertiary : colors.text.primary 
              }]} 
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {memory.caption || 'Add a caption...'}
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
    padding: SPACING.sm,
    textAlignVertical: 'top',
    minHeight: 40,
    // Remove all border styling
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    // Remove focus outline on web
    ...(Platform.OS === 'web' && {
      outline: 'none',
      outlineWidth: 0,
    }),
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
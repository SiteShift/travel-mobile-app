import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { useTheme } from '../contexts/ThemeContext';
import { MinimalMemory } from '../types/tripDetailMinimal';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { Icon } from './Icon';

interface PhotoLightboxProps {
  memory: MinimalMemory;
  visible: boolean;
  onClose: () => void;
  onCaptionUpdate?: (memoryId: string, caption: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  memory,
  visible,
  onClose,
  onCaptionUpdate
}) => {
  const { colors, isDark } = useTheme();
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation values
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Initialize caption text properly
  useEffect(() => {
    setCaptionText(memory.caption === 'Add a caption...' ? '' : memory.caption || '');
  }, [memory.caption, visible]);
  
  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      // Auto-save when keyboard closes
      if (isEditingCaption) {
        handleCaptionSave();
      }
    });
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isEditingCaption, captionText]);
  
  // Animation effects
  useEffect(() => {
    if (visible) {
      StatusBar.setHidden(true, 'fade');
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      StatusBar.setHidden(false, 'fade');
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);
  
  // Gesture handlers - Ultra sensitive swipe down
  const handleGestureStateChange = useCallback((event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY: gestureY, velocityY } = event.nativeEvent;
      // Ultra sensitive: 40px threshold or 300 velocity
      if (gestureY > 40 || velocityY > 300) {
        // Auto-save before closing
        if (isEditingCaption) {
          handleCaptionSave();
        }
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }).start(onClose);
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [translateY, onClose, isEditingCaption]);
  
  const handleGesture = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        // Only allow downward gestures
        if (event.nativeEvent.translationY > 0) {
          translateY.setValue(event.nativeEvent.translationY);
        }
      }
    }
  );
  
  // Caption handlers
  const handleCaptionEdit = useCallback(() => {
    setIsEditingCaption(true);
  }, []);
  
  const handleCaptionSave = useCallback(() => {
    setIsEditingCaption(false);
    if (onCaptionUpdate) {
      const finalCaption = captionText.trim() || 'Add a caption...';
      onCaptionUpdate(memory.id, finalCaption);
    }
  }, [captionText, memory.id, onCaptionUpdate]);
  
  const handleClose = useCallback(() => {
    if (isEditingCaption) {
      handleCaptionSave();
    }
    onClose();
  }, [isEditingCaption, handleCaptionSave, onClose]);
  
  if (!visible) return null;
  
  // Simple, intelligent image sizing
  const aspectRatio = memory.aspectRatio || 1;
  const maxHeight = screenHeight * 0.75; // Leave space for caption
  const maxWidth = screenWidth * 0.95;
  
  let imageWidth, imageHeight;
  if (aspectRatio > 1) {
    // Landscape
    imageWidth = Math.min(maxWidth, maxHeight * aspectRatio);
    imageHeight = imageWidth / aspectRatio;
  } else {
    // Portrait or square
    imageHeight = Math.min(maxHeight, maxWidth / aspectRatio);
    imageWidth = imageHeight * aspectRatio;
  }
  
  return (
    <Animated.View 
      style={[
        styles.overlay,
        { 
          opacity,
          backgroundColor: 'rgba(0,0,0,0.95)' // Pure black for premium feel
        }
      ]}
    >
      <PanGestureHandler
        onGestureEvent={handleGesture}
        onHandlerStateChange={handleGestureStateChange}
      >
        <Animated.View 
          style={[
            styles.container,
            { 
              transform: [
                { scale }, 
                { translateY: translateY },
                // Move up when keyboard is visible
                { translateY: isEditingCaption ? -keyboardHeight * 0.2 : 0 }
              ]
            }
          ]}
        >
          {/* Minimal close button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
          <Icon name="close" size="md" color="white" />
          </TouchableOpacity>
          
          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: memory.uri }}
              style={[
                styles.image,
                {
                  width: imageWidth,
                  height: imageHeight,
                }
              ]}
              contentFit="contain"
              transition={200}
            />
          </View>
          
          {/* Clean caption section */}
          <View style={styles.captionSection}>
            {isEditingCaption ? (
              <TextInput
                style={styles.captionInput}
                value={captionText}
                onChangeText={setCaptionText}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                autoFocus
                onBlur={handleCaptionSave}
                returnKeyType="done"
                blurOnSubmit={true}
                textAlignVertical="top"
                maxLength={200}
              />
            ) : (
              <TouchableOpacity 
                style={styles.captionDisplay}
                onPress={handleCaptionEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.captionText}>
                  {memory.caption === 'Add a caption...' || !memory.caption ? 'Add a caption...' : memory.caption}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: SPACING.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  image: {
    borderRadius: BORDER_RADIUS.sm,
  },
  
  captionSection: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
    maxHeight: 120,
  },
  
  captionDisplay: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 50,
    justifyContent: 'center',
  },
  
  captionText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    textAlign: 'center',
  },
  
  captionInput: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    textAlignVertical: 'top',
    minHeight: 50,
    maxHeight: 100,
    textAlign: 'center',
    // Remove focus outline
    ...(Platform.OS === 'web' && {
      outline: 'none',
      outlineWidth: 0,
    }),
  },
}); 
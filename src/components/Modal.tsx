import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  SHADOWS,
} from '../constants/theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export type ModalVariant = 'center' | 'bottom' | 'fullscreen' | 'alert';
export type ModalSize = 'small' | 'medium' | 'large' | 'auto';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  variant?: ModalVariant;
  size?: ModalSize;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  animationType?: 'fade' | 'slide' | 'none';
  backdropOpacity?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  scrollable?: boolean;
  testID?: string;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  variant = 'center',
  size = 'medium',
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  animationType = 'fade',
  backdropOpacity = 0.5,
  style,
  contentStyle,
  titleStyle,
  scrollable = false,
  testID,
}) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      const animations = [];
      
      if (animationType === 'fade' || variant === 'center') {
        animations.push(
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          })
        );
      }

      if (variant === 'center' || variant === 'alert') {
        animations.push(
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          })
        );
      }

      if (variant === 'bottom') {
        animations.push(
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    } else {
      // Hide animation
      const animations = [];
      
      if (animationType === 'fade' || variant === 'center') {
        animations.push(
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: true,
          })
        );
      }

      if (variant === 'center' || variant === 'alert') {
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          })
        );
      }

      if (variant === 'bottom') {
        animations.push(
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    }
  }, [visible, variant, animationType, fadeAnim, scaleAnim, slideAnim]);

  const getModalSize = () => {
    const baseWidth = SCREEN_WIDTH - (SPACING.xl * 2);
    
    switch (size) {
      case 'small':
        return {
          width: Math.min(baseWidth, 300),
          maxHeight: SCREEN_HEIGHT * 0.4,
        };
      case 'large':
        return {
          width: Math.min(baseWidth, 500),
          maxHeight: SCREEN_HEIGHT * 0.8,
        };
      case 'auto':
        return {
          width: baseWidth,
          maxHeight: SCREEN_HEIGHT * 0.9,
        };
      default: // medium
        return {
          width: Math.min(baseWidth, 400),
          maxHeight: SCREEN_HEIGHT * 0.6,
        };
    }
  };

  const getContainerStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      flex: 1,
      backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
    };

    switch (variant) {
      case 'center':
      case 'alert':
        return {
          ...baseStyles,
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING.xl,
        };
      case 'bottom':
        return {
          ...baseStyles,
          justifyContent: 'flex-end',
        };
      case 'fullscreen':
        return {
          ...baseStyles,
          backgroundColor: colors.surface.primary,
        };
      default:
        return baseStyles;
    }
  };

  const getContentStyles = (): ViewStyle => {
    const modalSize = getModalSize();
    const baseStyles: ViewStyle = {
      backgroundColor: colors.surface.primary,
      borderRadius: variant === 'fullscreen' ? 0 : BORDER_RADIUS.lg,
      ...SHADOWS.lg,
    };

    switch (variant) {
      case 'center':
      case 'alert':
        return {
          ...baseStyles,
          ...modalSize,
          padding: SPACING.lg,
        };
      case 'bottom':
        return {
          ...baseStyles,
          width: '100%',
          maxHeight: SCREEN_HEIGHT * 0.8,
          borderTopLeftRadius: BORDER_RADIUS.xl,
          borderTopRightRadius: BORDER_RADIUS.xl,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          paddingTop: SPACING.md,
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.xl,
        };
      case 'fullscreen':
        return {
          flex: 1,
          backgroundColor: colors.surface.primary,
          borderRadius: 0,
        };
      default:
        return baseStyles;
    }
  };

  const getAnimatedStyles = () => {
    switch (variant) {
      case 'center':
      case 'alert':
        return {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        };
      case 'bottom':
        return {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT, 0],
              }),
            },
          ],
        };
      case 'fullscreen':
        return {
          opacity: fadeAnim,
        };
      default:
        return {};
    }
  };

  const renderHeader = () => {
    if (!title && !showCloseButton) return null;

    return (
      <View style={styles.header}>
        {variant === 'bottom' && (
          <View style={[styles.dragHandle, { backgroundColor: colors.neutral[300] }]} />
        )}
        
        {title && (
          <Text
            style={[styles.title, { color: colors.text.primary }, titleStyle]}
            testID={`${testID}-title`}
          >
            {title}
          </Text>
        )}
        
        {showCloseButton && variant !== 'bottom' && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID={`${testID}-close`}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
          >
            <Text style={[styles.closeText, { color: colors.text.secondary }]}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderContent = () => {
    const ContentWrapper = scrollable ? ScrollView : View;
    const contentProps = scrollable ? {
      showsVerticalScrollIndicator: false,
      bounces: false,
    } : { style: { flex: 1 } };

    return (
      <ContentWrapper {...contentProps}>
        {children}
      </ContentWrapper>
    );
  };

  if (variant === 'fullscreen') {
    return (
      <RNModal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
        testID={testID}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface.primary }}>
          {renderHeader()}
          {renderContent()}
        </SafeAreaView>
      </RNModal>
    );
  }

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      <TouchableWithoutFeedback
        onPress={closeOnBackdrop ? onClose : undefined}
        testID={`${testID}-backdrop`}
      >
        <View style={getContainerStyles()}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                getContentStyles(),
                getAnimatedStyles(),
                contentStyle,
                style,
              ]}
            >
              {renderHeader()}
              {renderContent()}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

// Convenience component for alerts
export const AlertModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  testID?: string;
}> = ({
  visible,
  onClose,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  testID,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="alert"
      size="small"
      title={title}
      showCloseButton={false}
      testID={testID}
    >
      <Text style={[styles.alertMessage, { color: colors.text.secondary }]}>
        {message}
      </Text>
      <View style={styles.alertActions}>
        {onConfirm && (
          <TouchableOpacity
            onPress={onClose}
            style={[styles.alertButton, { borderColor: colors.neutral[200] }]}
          >
            <Text style={[styles.alertButtonText, { color: colors.text.secondary }]}>
              {cancelText}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => {
            onConfirm?.();
            onClose();
          }}
          style={[styles.alertButton, { backgroundColor: colors.primary[500] }]}
        >
          <Text style={[styles.alertButtonText, { color: colors.text.inverse }]}>
            {confirmText}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    minHeight: 24,
  },
  dragHandle: {
    position: 'absolute',
    top: -SPACING.sm,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    ...TYPOGRAPHY.styles.h3,
    flex: 1,
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  closeText: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '300',
  },
  alertMessage: {
    ...TYPOGRAPHY.styles.body,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  alertActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  alertButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  alertButtonText: {
    ...TYPOGRAPHY.styles.button,
  },
});

export default Modal; 
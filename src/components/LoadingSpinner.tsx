import React, { useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';

export type LoadingSize = 'small' | 'medium' | 'large';
export type LoadingVariant = 'default' | 'overlay' | 'inline' | 'minimal';

export interface LoadingSpinnerProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  color?: string;
  message?: string;
  showMessage?: boolean;
  overlay?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  variant = 'default',
  color,
  message = 'Loading...',
  showMessage = true,
  overlay = false,
  style,
  textStyle,
  testID,
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    };
  }, [fadeAnim, scaleAnim]);

  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return 'small' as const;
      case 'large':
        return 'large' as const;
      default:
        return undefined; // This maps to 'medium' for ActivityIndicator
    }
  };

  const getSpinnerColor = () => {
    if (color) return color;
    
    switch (variant) {
      case 'overlay':
        return colors.text.inverse;
      case 'minimal':
        return colors.text.secondary;
      default:
        return colors.primary[500];
    }
  };

  const getContainerStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      justifyContent: 'center',
      alignItems: 'center',
    };

    switch (variant) {
      case 'overlay':
        return {
          ...baseStyles,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
        };
      case 'inline':
        return {
          ...baseStyles,
          flexDirection: 'row',
          padding: SPACING.sm,
        };
      case 'minimal':
        return {
          ...baseStyles,
          padding: SPACING.xs,
        };
      default:
        return {
          ...baseStyles,
          padding: SPACING.md,
          backgroundColor: colors.surface.primary,
          borderRadius: 8,
          minWidth: 120,
          minHeight: 80,
        };
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      color: variant === 'overlay' ? colors.text.inverse : colors.text.primary,
      textAlign: 'center',
    };

    switch (size) {
      case 'small':
        return {
          ...baseStyles,
          ...TYPOGRAPHY.styles.caption,
          marginTop: SPACING.xs,
        };
      case 'large':
        return {
          ...baseStyles,
          ...TYPOGRAPHY.styles.body,
          marginTop: SPACING.sm,
        };
      default:
        return {
          ...baseStyles,
          ...TYPOGRAPHY.styles.bodySmall,
          marginTop: SPACING.sm,
        };
    }
  };

  const renderContent = () => {
    if (variant === 'inline') {
      return (
        <>
          <ActivityIndicator
            size={getSpinnerSize()}
            color={getSpinnerColor()}
            testID={`${testID}-spinner`}
          />
          {showMessage && message && (
            <Text
              style={[getTextStyles(), { marginTop: 0, marginLeft: SPACING.sm }, textStyle]}
              testID={`${testID}-text`}
            >
              {message}
            </Text>
          )}
        </>
      );
    }

    return (
      <>
        <ActivityIndicator
          size={getSpinnerSize()}
          color={getSpinnerColor()}
          testID={`${testID}-spinner`}
        />
        {showMessage && message && variant !== 'minimal' && (
          <Text
            style={[getTextStyles(), textStyle]}
            testID={`${testID}-text`}
          >
            {message}
          </Text>
        )}
      </>
    );
  };

  if (overlay || variant === 'overlay') {
    return (
      <Animated.View
        style={[
          getContainerStyles(),
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
        testID={testID}
      >
        {renderContent()}
      </Animated.View>
    );
  }

  return (
    <View
      style={[getContainerStyles(), style]}
      testID={testID}
    >
      {renderContent()}
    </View>
  );
};

// Convenience component for full screen loading
export const FullScreenLoader: React.FC<{
  message?: string;
  testID?: string;
}> = ({ message = 'Loading...', testID }) => {
  return (
    <LoadingSpinner
      variant="overlay"
      size="large"
      message={message}
      testID={testID}
    />
  );
};

// Convenience component for button loading state
export const ButtonLoader: React.FC<{
  color?: string;
  testID?: string;
}> = ({ color, testID }) => {
  return (
    <LoadingSpinner
      variant="minimal"
      size="small"
      color={color}
      showMessage={false}
      testID={testID}
    />
  );
};

export default LoadingSpinner; 
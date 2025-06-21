import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  COMPONENTS,
  SHADOWS,
} from '../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { colors } = useTheme();

  const getButtonStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      height: COMPONENTS.button.height[size],
      paddingHorizontal: COMPONENTS.button.paddingHorizontal[size],
      borderRadius: BORDER_RADIUS.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: fullWidth ? undefined : 44, // Minimum touch target
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: disabled
            ? colors.neutral[300]
            : colors.primary[500],
          ...SHADOWS.sm,
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: disabled
            ? colors.neutral[100]
            : colors.surface.secondary,
          borderWidth: 1,
          borderColor: disabled
            ? colors.neutral[200]
            : colors.border.primary,
          ...SHADOWS.sm,
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyles;
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseTextStyles: TextStyle = {
      ...TYPOGRAPHY.styles[size === 'small' ? 'buttonSmall' : 'button'],
      textAlign: 'center',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseTextStyles,
          color: disabled ? colors.text.disabled : colors.text.inverse,
        };
      case 'secondary':
        return {
          ...baseTextStyles,
          color: disabled ? colors.text.disabled : colors.text.primary,
        };
      case 'ghost':
        return {
          ...baseTextStyles,
          color: disabled ? colors.text.disabled : colors.primary[500],
        };
      default:
        return baseTextStyles;
    }
  };

  const getLoadingColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.text.inverse;
      case 'secondary':
        return colors.text.primary;
      case 'ghost':
        return colors.primary[500];
      default:
        return colors.text.primary;
    }
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={getLoadingColor()}
          testID={`${testID}-loading`}
        />
      );
    }

    const textElement = (
      <Text
        style={[getTextStyles(), textStyle]}
        numberOfLines={1}
        testID={`${testID}-text`}
      >
        {title}
      </Text>
    );

    if (!icon) {
      return textElement;
    }

    const iconElement = icon;

    return (
      <>
        {iconPosition === 'left' && (
          <>
            {iconElement}
            <Text style={{ width: SPACING.xs }} />
          </>
        )}
        {textElement}
        {iconPosition === 'right' && (
          <>
            <Text style={{ width: SPACING.xs }} />
            {iconElement}
          </>
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyles(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      testID={testID}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Button; 
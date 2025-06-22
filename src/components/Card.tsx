import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  COMPONENTS,
} from '../constants/theme';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';
export type CardSize = 'small' | 'medium' | 'large';

export interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  padding?: keyof typeof SPACING;
  margin?: keyof typeof SPACING;
  borderRadius?: keyof typeof BORDER_RADIUS;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  disabled?: boolean;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  padding,
  margin,
  borderRadius = 'lg',
  onPress,
  style,
  contentStyle,
  disabled = false,
  testID,
  ...props
}) => {
  const { colors } = useTheme();

  const getPadding = () => {
    if (padding) return SPACING[padding];
    
    switch (size) {
      case 'small':
        return SPACING.sm;
      case 'large':
        return SPACING.lg;
      default:
        return COMPONENTS.card.paddingHorizontal;
    }
  };

  const getMargin = () => {
    if (margin) return SPACING[margin];
    return 0;
  };

  const getCardStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: BORDER_RADIUS[borderRadius],
      margin: getMargin(),
      overflow: 'hidden',
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: colors.surface.primary,
          borderWidth: 1,
          borderColor: colors.border.primary,
        };
      case 'elevated':
        return {
          ...baseStyles,
          backgroundColor: colors.surface.primary,
          ...SHADOWS.md,
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: colors.surface.secondary,
          ...SHADOWS.sm,
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: colors.surface.primary,
          ...SHADOWS.sm,
        };
    }
  };

  const getContentStyles = (): ViewStyle => {
    return {
      padding: getPadding(),
    };
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        getCardStyles(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
      testID={testID}
      {...(onPress && props)}
    >
      <View style={[getContentStyles(), contentStyle]}>
        {children}
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
});

export default Card; 
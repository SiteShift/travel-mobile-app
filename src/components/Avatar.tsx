import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  SHADOWS,
} from '../constants/theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type AvatarVariant = 'circular' | 'rounded' | 'square';

export interface AvatarProps extends Omit<TouchableOpacityProps, 'style'> {
  source?: { uri: string } | number;
  size?: AvatarSize;
  variant?: AvatarVariant;
  fallbackText?: string;
  showBadge?: boolean;
  badgeColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  testID?: string;
}

const AVATAR_SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  xxl: 96,
} as const;

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 'md',
  variant = 'circular',
  fallbackText,
  showBadge = false,
  badgeColor,
  onPress,
  style,
  imageStyle,
  textStyle,
  disabled = false,
  testID,
  ...props
}) => {
  const { colors } = useTheme();
  const avatarSize = AVATAR_SIZES[size];

  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return avatarSize / 2;
      case 'rounded':
        return BORDER_RADIUS.md;
      case 'square':
        return 0;
      default:
        return avatarSize / 2;
    }
  };

  const getContainerStyles = (): ViewStyle => {
    return {
      width: avatarSize,
      height: avatarSize,
      borderRadius: getBorderRadius(),
      backgroundColor: colors.surface.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      ...SHADOWS.sm,
    };
  };

  const getImageStyles = (): ImageStyle => {
    return {
      width: avatarSize,
      height: avatarSize,
      borderRadius: getBorderRadius(),
    };
  };

  const getFallbackTextStyles = (): TextStyle => {
    const fontSize = size === 'xs' ? 10 : 
                    size === 'sm' ? 12 : 
                    size === 'md' ? 14 : 
                    size === 'lg' ? 16 : 
                    size === 'xl' ? 20 : 24;

    return {
      fontSize,
      fontWeight: TYPOGRAPHY.styles.button.fontWeight,
      color: colors.text.primary,
      textAlign: 'center',
    };
  };

  const getBadgeStyles = (): ViewStyle => {
    const badgeSize = Math.max(avatarSize * 0.25, 8);
    const badgeOffset = avatarSize * 0.1;

    return {
      position: 'absolute',
      top: badgeOffset,
      right: badgeOffset,
      width: badgeSize,
      height: badgeSize,
      borderRadius: badgeSize / 2,
      backgroundColor: badgeColor || colors.success[500],
      borderWidth: 2,
      borderColor: colors.surface.primary,
    };
  };

  const generateFallbackText = () => {
    if (fallbackText) {
      // Extract initials from the text (up to 2 characters)
      const initials = fallbackText
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
      return initials;
    }
    return '?';
  };

  const renderContent = () => {
    if (source) {
      return (
        <Image
          source={source}
          style={[getImageStyles(), imageStyle]}
          resizeMode="cover"
          testID={`${testID}-image`}
        />
      );
    }

    return (
      <Text
        style={[getFallbackTextStyles(), textStyle]}
        testID={`${testID}-fallback`}
      >
        {generateFallbackText()}
      </Text>
    );
  };

  const renderBadge = () => {
    if (!showBadge) return null;

    return (
      <View style={getBadgeStyles()} testID={`${testID}-badge`} />
    );
  };

  const AvatarComponent = onPress ? TouchableOpacity : View;

  return (
    <AvatarComponent
      style={[
        getContainerStyles(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={fallbackText ? `Avatar for ${fallbackText}` : 'Avatar'}
      testID={testID}
      {...(onPress && props)}
    >
      {renderContent()}
      {renderBadge()}
    </AvatarComponent>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
});

export default Avatar; 
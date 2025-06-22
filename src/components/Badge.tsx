import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
} from '../constants/theme';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  outlined?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  testID?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  outlined = false,
  removable = false,
  onRemove,
  onPress,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  disabled = false,
  testID,
  ...props
}) => {
  const { colors } = useTheme();

  const getBadgeStyles = (): ViewStyle => {
    const paddingHorizontal = size === 'small' ? SPACING.xs : 
                             size === 'large' ? SPACING.md : SPACING.sm;
    const paddingVertical = size === 'small' ? SPACING.xs / 2 : 
                           size === 'large' ? SPACING.sm : SPACING.xs;

    let backgroundColor: string;
    let borderColor: string;

    switch (variant) {
      case 'primary':
        backgroundColor = outlined ? 'transparent' : colors.primary[500];
        borderColor = colors.primary[500];
        break;
      case 'secondary':
        backgroundColor = outlined ? 'transparent' : colors.secondary[500];
        borderColor = colors.secondary[500];
        break;
      case 'success':
        backgroundColor = outlined ? 'transparent' : colors.success[500];
        borderColor = colors.success[500];
        break;
      case 'warning':
        backgroundColor = outlined ? 'transparent' : colors.warning[500];
        borderColor = colors.warning[500];
        break;
      case 'error':
        backgroundColor = outlined ? 'transparent' : colors.error[500];
        borderColor = colors.error[500];
        break;
      case 'info':
        backgroundColor = outlined ? 'transparent' : colors.info[500];
        borderColor = colors.info[500];
        break;
      default:
        backgroundColor = outlined ? 'transparent' : colors.neutral[200];
        borderColor = colors.neutral[300];
        break;
    }

    return {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal,
      paddingVertical,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor,
      borderWidth: outlined ? 1 : 0,
      borderColor: outlined ? borderColor : 'transparent',
      minHeight: size === 'small' ? 20 : size === 'large' ? 32 : 24,
    };
  };

  const getTextStyles = (): TextStyle => {
    const fontSize = size === 'small' ? TYPOGRAPHY.styles.caption.fontSize : 
                    size === 'large' ? TYPOGRAPHY.styles.bodySmall.fontSize : 
                    TYPOGRAPHY.styles.caption.fontSize;

    let textColor: string;

    if (outlined) {
      switch (variant) {
        case 'primary':
          textColor = colors.primary[500];
          break;
        case 'secondary':
          textColor = colors.secondary[500];
          break;
        case 'success':
          textColor = colors.success[500];
          break;
        case 'warning':
          textColor = colors.warning[600];
          break;
        case 'error':
          textColor = colors.error[500];
          break;
        case 'info':
          textColor = colors.info[500];
          break;
        default:
          textColor = colors.text.primary;
          break;
      }
    } else {
      switch (variant) {
        case 'primary':
        case 'secondary':
        case 'success':
        case 'error':
        case 'info':
          textColor = colors.text.inverse;
          break;
        case 'warning':
          textColor = colors.text.primary;
          break;
        default:
          textColor = colors.text.primary;
          break;
      }
    }

    return {
      fontSize,
      fontWeight: TYPOGRAPHY.styles.caption.fontWeight,
      color: disabled ? colors.text.disabled : textColor,
      textAlign: 'center',
    };
  };

  const renderIcon = (icon: React.ReactNode, position: 'left' | 'right') => {
    if (!icon) return null;

    const marginStyle = {
      marginLeft: position === 'right' ? SPACING.xs : 0,
      marginRight: position === 'left' ? SPACING.xs : 0,
    };

    return (
      <View style={marginStyle} testID={`${testID}-${position}-icon`}>
        {icon}
      </View>
    );
  };

  const renderRemoveButton = () => {
    if (!removable || !onRemove) return null;

    return (
      <TouchableOpacity
        onPress={onRemove}
        disabled={disabled}
        style={styles.removeButton}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        testID={`${testID}-remove`}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${label}`}
      >
        <Text style={[getTextStyles(), styles.removeText]}>×</Text>
      </TouchableOpacity>
    );
  };

  const BadgeComponent = onPress ? TouchableOpacity : View;

  return (
    <BadgeComponent
      style={[
        getBadgeStyles(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${variant} badge: ${label}`}
      testID={testID}
      {...(onPress && props)}
    >
      {renderIcon(leftIcon, 'left')}
      
      <Text
        style={[getTextStyles(), textStyle]}
        numberOfLines={1}
        testID={`${testID}-text`}
      >
        {label}
      </Text>
      
      {renderIcon(rightIcon, 'right')}
      {renderRemoveButton()}
    </BadgeComponent>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  removeButton: {
    marginLeft: SPACING.xs / 2,
    paddingHorizontal: SPACING.xs / 2,
  },
  removeText: {
    fontSize: 16,
    lineHeight: 16,
  },
});

export default Badge; 
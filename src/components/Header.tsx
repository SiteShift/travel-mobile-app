import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import {
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
} from '../constants/theme';

export type HeaderVariant = 'default' | 'transparent' | 'elevated' | 'minimal';
export type HeaderSize = 'compact' | 'default' | 'large';

export interface HeaderAction {
  icon: string;
  onPress: () => void;
  badge?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  variant?: HeaderVariant;
  size?: HeaderSize;
  leftAction?: HeaderAction;
  rightActions?: HeaderAction[];
  onTitlePress?: () => void;
  backgroundColor?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  centerComponent?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  testID?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  variant = 'default',
  size = 'default',
  leftAction,
  rightActions = [],
  onTitlePress,
  backgroundColor,
  showBackButton = false,
  onBackPress,
  centerComponent,
  style,
  titleStyle,
  subtitleStyle,
  testID,
}) => {
  const { colors } = useTheme();

  const getHeaderHeight = () => {
    switch (size) {
      case 'compact':
        return 44;
      case 'large':
        return 96;
      default:
        return 56;
    }
  };

  const getHeaderStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      height: getHeaderHeight(),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      justifyContent: 'space-between',
    };

    switch (variant) {
      case 'transparent':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
        };
      case 'elevated':
        return {
          ...baseStyles,
          backgroundColor: backgroundColor || colors.surface.primary,
          ...SHADOWS.sm,
          borderBottomWidth: 0,
        };
      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: backgroundColor || colors.surface.primary,
          paddingHorizontal: SPACING.sm,
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: backgroundColor || colors.surface.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral[200],
        };
    }
  };

  const getTitleStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      color: colors.text.primary,
      textAlign: 'center',
    };

    switch (size) {
      case 'compact':
        return {
          ...baseStyles,
          ...TYPOGRAPHY.styles.h4,
        };
      case 'large':
        return {
          ...baseStyles,
          ...TYPOGRAPHY.styles.h2,
        };
      default:
        return {
          ...baseStyles,
          ...TYPOGRAPHY.styles.h3,
        };
    }
  };

  const getSubtitleStyles = (): TextStyle => {
    return {
      color: colors.text.secondary,
      ...TYPOGRAPHY.styles.caption,
      textAlign: 'center',
      marginTop: SPACING.xs / 2,
    };
  };

  const renderLeftSection = () => {
    if (showBackButton) {
      return (
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={`${testID}-back-button`}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="back" size="md" color="text" />
        </TouchableOpacity>
      );
    }

    if (leftAction) {
      return (
        <TouchableOpacity
          onPress={leftAction.onPress}
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={leftAction.testID}
          accessibilityRole="button"
          accessibilityLabel={leftAction.accessibilityLabel}
        >
          <Icon name={leftAction.icon} size="md" color="text" />
          {leftAction.badge && (
            <View style={[styles.badge, { backgroundColor: colors.error[500] }]} />
          )}
        </TouchableOpacity>
      );
    }

    return <View style={styles.actionButton} />;
  };

  const renderCenterSection = () => {
    if (centerComponent) {
      return (
        <View style={styles.centerSection}>
          {centerComponent}
        </View>
      );
    }

    if (title || subtitle) {
      const TitleComponent = onTitlePress ? TouchableOpacity : View;
      
      return (
        <TitleComponent
          style={styles.centerSection}
          onPress={onTitlePress}
          activeOpacity={onTitlePress ? 0.7 : 1}
          testID={`${testID}-title`}
          accessibilityRole={onTitlePress ? 'button' : undefined}
        >
          {title && (
            <Text
              style={[getTitleStyles(), titleStyle]}
              numberOfLines={1}
              testID={`${testID}-title-text`}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[getSubtitleStyles(), subtitleStyle]}
              numberOfLines={1}
              testID={`${testID}-subtitle-text`}
            >
              {subtitle}
            </Text>
          )}
        </TitleComponent>
      );
    }

    return <View style={styles.centerSection} />;
  };

  const renderRightSection = () => {
    if (rightActions.length === 0) {
      return <View style={styles.actionButton} />;
    }

    if (rightActions.length === 1) {
      const action = rightActions[0];
      return (
        <TouchableOpacity
          onPress={action.onPress}
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={action.testID}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
        >
          <Icon name={action.icon} size="md" color="text" />
          {action.badge && (
            <View style={[styles.badge, { backgroundColor: colors.error[500] }]} />
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.rightActionsContainer}>
        {rightActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            style={styles.multiActionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID={action.testID}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
          >
            <Icon name={action.icon} size="md" color="text" />
            {action.badge && (
              <View style={[styles.badge, { backgroundColor: colors.error[500] }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View
      style={[getHeaderStyles(), style]}
      testID={testID}
    >
      {renderLeftSection()}
      {renderCenterSection()}
      {renderRightSection()}
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  multiActionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: SPACING.xs,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default Header; 
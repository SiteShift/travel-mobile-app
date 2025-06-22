import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import {
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
} from '../constants/theme';

export type FABSize = 'small' | 'default' | 'large';
export type FABVariant = 'primary' | 'secondary' | 'surface';
export type FABPosition = 'bottom-right' | 'bottom-left' | 'bottom-center' | 'custom';

export interface FABAction {
  icon: string;
  label?: string;
  onPress: () => void;
  backgroundColor?: string;
  testID?: string;
  accessibilityLabel?: string;
}

export interface FloatingActionButtonProps {
  icon?: string;
  onPress?: () => void;
  size?: FABSize;
  variant?: FABVariant;
  position?: FABPosition;
  actions?: FABAction[];
  backgroundColor?: string;
  iconColor?: string;
  extended?: boolean;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon = 'add',
  onPress,
  size = 'default',
  variant = 'primary',
  position = 'bottom-right',
  actions = [],
  backgroundColor,
  iconColor,
  extended = false,
  label,
  disabled = false,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = React.useState(false);

  useEffect(() => {
    if (isExpanded) {
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(actionsAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.back(1.2),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(actionsAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isExpanded, rotateAnim, actionsAnim]);

  const getFABSize = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'large':
        return 64;
      default:
        return 56;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'sm' as const;
      case 'large':
        return 'xl' as const;
      default:
        return 'lg' as const;
    }
  };

  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    
    switch (variant) {
      case 'secondary':
        return colors.secondary[500];
      case 'surface':
        return colors.surface.secondary;
      default:
        return colors.primary[500];
    }
  };

  const getIconColor = () => {
    if (iconColor) return iconColor;
    
    switch (variant) {
      case 'surface':
        return colors.text.primary;
      default:
        return colors.text.inverse;
    }
  };

  const getPositionStyles = (): ViewStyle => {
    const fabSize = getFABSize();
    const margin = SPACING.lg;

    switch (position) {
      case 'bottom-left':
        return {
          position: 'absolute',
          bottom: margin,
          left: margin,
        };
      case 'bottom-center':
        return {
          position: 'absolute',
          bottom: margin,
          left: '50%',
          marginLeft: -fabSize / 2,
        };
      case 'custom':
        return {};
      default: // bottom-right
        return {
          position: 'absolute',
          bottom: margin,
          right: margin,
        };
    }
  };

  const getFABStyles = (): ViewStyle => {
    const fabSize = getFABSize();
    
    return {
      width: extended ? 'auto' : fabSize,
      height: fabSize,
      borderRadius: extended ? fabSize / 2 : fabSize / 2,
      backgroundColor: getBackgroundColor(),
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: extended ? 'row' : 'column',
      paddingHorizontal: extended ? SPACING.md : 0,
      ...SHADOWS.lg,
      opacity: disabled ? 0.6 : 1,
    };
  };

  const handlePress = () => {
    if (disabled) return;

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (actions.length > 0) {
      setIsExpanded(!isExpanded);
    } else if (onPress) {
      onPress();
    }
  };

  const renderMainFAB = () => {
    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '45deg'],
    });

    return (
      <Animated.View
        style={[
          getFABStyles(),
          getPositionStyles(),
          {
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled}
          style={styles.fabTouchable}
          activeOpacity={0.8}
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={label || 'Floating action button'}
        >
          <Animated.View
            style={{
              transform: [{ rotate: actions.length > 0 ? rotation : '0deg' }],
            }}
          >
            <Icon
              name={icon}
              size={getIconSize()}
              color={getIconColor()}
            />
          </Animated.View>
          {extended && label && (
            <View style={styles.labelContainer}>
              <Icon
                name={icon}
                size={getIconSize()}
                color={getIconColor()}
              />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderActions = () => {
    if (actions.length === 0) return null;

    return actions.map((action, index) => {
      const translateY = actionsAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -(getFABSize() + SPACING.md) * (index + 1)],
      });

      const opacity = actionsAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
      });

      const scale = actionsAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.actionButton,
            getPositionStyles(),
            {
              transform: [
                { translateY },
                { scale },
              ],
              opacity,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              action.onPress();
              setIsExpanded(false);
            }}
            style={[
              styles.actionTouchable,
              {
                backgroundColor: action.backgroundColor || colors.surface.primary,
                ...SHADOWS.md,
              },
            ]}
            testID={action.testID}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel || action.label}
          >
            <Icon
              name={action.icon}
              size="md"
              color="text"
            />
          </TouchableOpacity>
        </Animated.View>
      );
    });
  };

  const renderBackdrop = () => {
    if (!isExpanded || actions.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: actionsAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={() => setIsExpanded(false)}
          activeOpacity={1}
        />
      </Animated.View>
    );
  };

  return (
    <>
      {renderBackdrop()}
      {renderActions()}
      {renderMainFAB()}
    </>
  );
};

// Convenience components for travel-specific use cases
export const AddEntryFAB: React.FC<{
  onPress: () => void;
  position?: FABPosition;
  testID?: string;
}> = ({ onPress, position, testID }) => (
  <FloatingActionButton
    icon="add"
    onPress={onPress}
    position={position}
    testID={testID}
  />
);

export const TravelActionsFAB: React.FC<{
  onAddPhoto: () => void;
  onAddNote: () => void;
  onAddLocation: () => void;
  position?: FABPosition;
  testID?: string;
}> = ({ onAddPhoto, onAddNote, onAddLocation, position, testID }) => (
  <FloatingActionButton
    icon="add"
    position={position}
    actions={[
      {
        icon: 'camera',
        onPress: onAddPhoto,
        accessibilityLabel: 'Add photo',
      },
      {
        icon: 'note',
        onPress: onAddNote,
        accessibilityLabel: 'Add note',
      },
      {
        icon: 'location',
        onPress: onAddLocation,
        accessibilityLabel: 'Add location',
      },
    ]}
    testID={testID}
  />
);

export const MapFAB: React.FC<{
  onCurrentLocation: () => void;
  position?: FABPosition;
  testID?: string;
}> = ({ onCurrentLocation, position, testID }) => (
  <FloatingActionButton
    icon="location"
    onPress={onCurrentLocation}
    variant="surface"
    size="small"
    position={position}
    testID={testID}
  />
);

const styles = StyleSheet.create({
  fabTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  labelContainer: {
    marginLeft: SPACING.sm,
  },
  actionButton: {
    position: 'absolute',
  },
  actionTouchable: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  backdropTouchable: {
    flex: 1,
  },
});

export default FloatingActionButton; 
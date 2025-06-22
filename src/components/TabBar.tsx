import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import {
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
} from '../constants/theme';

export type TabBarVariant = 'default' | 'floating' | 'minimal' | 'elevated';
export type TabBarPosition = 'bottom' | 'top';

export interface TabItem {
  key: string;
  icon: string;
  activeIcon?: string;
  label: string;
  badge?: boolean;
  badgeCount?: number;
  disabled?: boolean;
  testID?: string;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  variant?: TabBarVariant;
  position?: TabBarPosition;
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  showLabels?: boolean;
  showBadges?: boolean;
  style?: ViewStyle;
  tabStyle?: ViewStyle;
  labelStyle?: TextStyle;
  testID?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  variant = 'default',
  position = 'bottom',
  backgroundColor,
  activeColor,
  inactiveColor,
  showLabels = true,
  showBadges = true,
  style,
  tabStyle,
  labelStyle,
  testID,
}) => {
  const { colors } = useTheme();
  const animatedValues = React.useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.key] = new Animated.Value(tab.key === activeTab ? 1 : 0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  React.useEffect(() => {
    tabs.forEach((tab) => {
      Animated.timing(animatedValues[tab.key], {
        toValue: tab.key === activeTab ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  }, [activeTab, animatedValues, tabs]);

  const getTabBarStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      flexDirection: 'row',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: backgroundColor || colors.surface.primary,
    };

    switch (variant) {
      case 'floating':
        return {
          ...baseStyles,
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.lg,
          borderRadius: BORDER_RADIUS.xl,
          ...SHADOWS.lg,
        };
      case 'elevated':
        return {
          ...baseStyles,
          ...SHADOWS.md,
          borderTopWidth: 1,
          borderTopColor: colors.neutral[200],
        };
      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          paddingVertical: SPACING.xs,
        };
      default:
        return {
          ...baseStyles,
          borderTopWidth: 1,
          borderTopColor: colors.neutral[200],
        };
    }
  };

  const getActiveColor = () => {
    if (activeColor) return activeColor;
    return colors.primary[500];
  };

  const getInactiveColor = () => {
    if (inactiveColor) return inactiveColor;
    return colors.text.secondary;
  };

  const handleTabPress = (tab: TabItem) => {
    if (tab.disabled) return;
    
    // Add press animation
    const scaleAnim = new Animated.Value(1);
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

    onTabPress(tab.key);
  };

  const renderBadge = (tab: TabItem) => {
    if (!showBadges || (!tab.badge && !tab.badgeCount)) return null;

    const badgeContent = tab.badgeCount && tab.badgeCount > 0 
      ? tab.badgeCount > 99 ? '99+' : tab.badgeCount.toString()
      : '';

    return (
      <View style={[styles.badge, { backgroundColor: colors.error[500] }]}>
        {badgeContent ? (
          <Text style={[styles.badgeText, { color: colors.text.inverse }]}>
            {badgeContent}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderTab = (tab: TabItem) => {
    const isActive = tab.key === activeTab;
    const animatedValue = animatedValues[tab.key];
    
    const iconColor = isActive ? getActiveColor() : getInactiveColor();
    const labelColor = isActive ? getActiveColor() : getInactiveColor();
    
    const animatedIconScale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.1],
    });

    const animatedLabelOpacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.7, 1],
    });

    return (
      <TouchableOpacity
        key={tab.key}
        onPress={() => handleTabPress(tab)}
        style={[styles.tab, tabStyle]}
        disabled={tab.disabled}
        activeOpacity={0.7}
        testID={tab.testID || `tab-${tab.key}`}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={tab.label}
      >
        <View style={styles.tabContent}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: animatedIconScale }],
              },
            ]}
          >
            <Icon
              name={isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
              size="md"
              color={iconColor}
            />
            {renderBadge(tab)}
          </Animated.View>
          
          {showLabels && (
            <Animated.Text
              style={[
                styles.tabLabel,
                {
                  color: labelColor,
                  opacity: animatedLabelOpacity,
                },
                labelStyle,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Animated.Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        getTabBarStyles(),
        position === 'top' && styles.topPosition,
        style,
      ]}
      testID={testID}
    >
      {tabs.map(renderTab)}
    </View>
  );
};

// Convenience components for travel-specific use cases
export const TravelTabBar: React.FC<{
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  variant?: TabBarVariant;
  hasNotifications?: boolean;
  testID?: string;
}> = ({ activeTab, onTabPress, variant, hasNotifications, testID }) => {
  const travelTabs: TabItem[] = [
    {
      key: 'map',
      icon: 'map',
      activeIcon: 'map-filled',
      label: 'Map',
    },
    {
      key: 'trips',
      icon: 'backpack',
      activeIcon: 'backpack-filled',
      label: 'Trips',
    },
    {
      key: 'camera',
      icon: 'camera',
      activeIcon: 'camera-filled',
      label: 'Capture',
    },
    {
      key: 'journal',
      icon: 'journal',
      activeIcon: 'journal-filled',
      label: 'Journal',
    },
    {
      key: 'profile',
      icon: 'user',
      activeIcon: 'user-filled',
      label: 'Profile',
      badge: hasNotifications,
    },
  ];

  return (
    <TabBar
      tabs={travelTabs}
      activeTab={activeTab}
      onTabPress={onTabPress}
      variant={variant}
      testID={testID}
    />
  );
};

export const SimpleTabBar: React.FC<{
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  variant?: TabBarVariant;
  testID?: string;
}> = ({ activeTab, onTabPress, variant, testID }) => {
  const simpleTabs: TabItem[] = [
    {
      key: 'home',
      icon: 'home',
      label: 'Home',
    },
    {
      key: 'search',
      icon: 'search',
      label: 'Search',
    },
    {
      key: 'favorites',
      icon: 'heart',
      label: 'Favorites',
    },
    {
      key: 'settings',
      icon: 'settings',
      label: 'Settings',
    },
  ];

  return (
    <TabBar
      tabs={simpleTabs}
      activeTab={activeTab}
      onTabPress={onTabPress}
      variant={variant}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  topPosition: {
    borderTopWidth: 0,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    minHeight: 48,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: SPACING.xs / 2,
  },
  tabLabel: {
    ...TYPOGRAPHY.styles.caption,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...TYPOGRAPHY.styles.caption,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
});

export default TabBar; 
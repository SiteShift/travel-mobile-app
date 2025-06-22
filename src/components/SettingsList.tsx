import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  type: 'navigation' | 'toggle' | 'info' | 'button' | 'profile';
  value?: boolean | string | number;
  badge?: string;
  disabled?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
}

export interface SettingsSection {
  id: string;
  title?: string;
  items: SettingsItem[];
}

export interface SettingsListProps {
  sections: SettingsSection[];
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  showSeparators?: boolean;
  testID?: string;
}

export const SettingsList: React.FC<SettingsListProps> = ({
  sections,
  style,
  itemStyle,
  showSeparators = true,
  testID,
}) => {
  const { colors } = useTheme();

  const renderSettingsItem = (item: SettingsItem, isLast: boolean) => {
    const getItemStyles = () => {
      const baseStyles = [
        styles.settingsItem,
        {
          backgroundColor: colors.surface.primary,
          borderBottomColor: colors.border.primary,
        },
        itemStyle,
      ];

      if (item.disabled) {
        baseStyles.push(styles.disabledItem);
      }

      if (!showSeparators || isLast) {
        baseStyles.push(styles.lastItem);
      }

      return baseStyles;
    };

    const renderLeftContent = () => {
      if (item.leftElement) {
        return <View style={styles.leftElement}>{item.leftElement}</View>;
      }

      if (item.type === 'profile') {
        return (
          <Avatar
            source={typeof item.value === 'string' ? { uri: item.value } : undefined}
            fallbackText={item.title.substring(0, 2)}
            size="lg"
            style={styles.profileAvatar}
          />
        );
      }

      if (item.icon) {
        return (
          <View style={styles.iconContainer}>
            <Icon
              name={item.icon}
              size="md"
              color={
                item.disabled
                  ? colors.text.disabled
                  : item.iconColor || colors.text.secondary
              }
            />
          </View>
        );
      }

      return null;
    };

    const renderRightContent = () => {
      if (item.rightElement) {
        return <View style={styles.rightElement}>{item.rightElement}</View>;
      }

      if (item.type === 'toggle') {
        return (
          <Switch
            value={Boolean(item.value)}
            onValueChange={item.onToggle}
            disabled={item.disabled}
            trackColor={{
              false: colors.neutral[300],
              true: colors.primary[500],
            }}
            thumbColor={colors.surface.primary}
            style={styles.switch}
          />
        );
      }

      if (item.type === 'navigation') {
        return (
          <View style={styles.navigationRight}>
            {item.badge && (
              <Badge
                label={item.badge}
                variant="default"
                size="small"
                style={styles.badge}
              />
            )}
            {typeof item.value === 'string' && (
              <Text
                style={[
                  styles.valueText,
                  { color: colors.text.tertiary }
                ]}
                numberOfLines={1}
              >
                {item.value}
              </Text>
            )}
            <Icon
              name="chevron-right"
              size="sm"
              color={item.disabled ? colors.text.disabled : colors.text.tertiary}
            />
          </View>
        );
      }

      if (item.type === 'info' && typeof item.value === 'string') {
        return (
          <Text
            style={[
              styles.infoText,
              { color: colors.text.secondary }
            ]}
            numberOfLines={2}
          >
            {item.value}
          </Text>
        );
      }

      return null;
    };

    const handlePress = () => {
      if (item.disabled) return;
      
      if (item.type === 'toggle') {
        item.onToggle?.(!item.value);
      } else {
        item.onPress?.();
      }
    };

    return (
      <TouchableOpacity
        key={item.id}
        style={getItemStyles()}
        onPress={handlePress}
        disabled={item.disabled || item.type === 'info'}
        activeOpacity={item.type === 'info' ? 1 : 0.7}
      >
        {renderLeftContent()}
        
        <View style={styles.itemContent}>
          <View style={styles.itemText}>
            <Text
              style={[
                styles.itemTitle,
                {
                  color: item.destructive
                    ? colors.error[500]
                    : item.disabled
                      ? colors.text.disabled
                      : colors.text.primary
                }
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.subtitle && (
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: item.disabled ? colors.text.disabled : colors.text.secondary }
                ]}
                numberOfLines={2}
              >
                {item.subtitle}
              </Text>
            )}
          </View>
          {renderRightContent()}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (section: SettingsSection) => (
    <View key={section.id} style={styles.section}>
      {section.title && (
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          {section.title.toUpperCase()}
        </Text>
      )}
      
      <View style={[styles.sectionContent, { backgroundColor: colors.surface.primary }]}>
        {section.items.map((item, index) =>
          renderSettingsItem(item, index === section.items.length - 1)
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, style]} testID={testID}>
      {sections.map(renderSection)}
    </View>
  );
};

// Convenience components for specific use cases
export interface ProfileSettingsItemProps {
  name: string;
  email: string;
  avatarUrl?: string;
  verified?: boolean;
  onPress?: () => void;
}

export const ProfileSettingsItem: React.FC<ProfileSettingsItemProps> = ({
  name,
  email,
  avatarUrl,
  verified = false,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={styles.profileSettingsItem} onPress={onPress}>
      <Avatar
        source={avatarUrl ? { uri: avatarUrl } : undefined}
        fallbackText={name.substring(0, 2)}
        size="xl"
        style={styles.profileAvatar}
      />
      
      <View style={styles.profileInfo}>
        <View style={styles.profileNameRow}>
          <Text style={[styles.profileName, { color: colors.text.primary }]}>
            {name}
          </Text>
          {verified && (
            <Icon name="verified" size="sm" color={colors.success[500]} />
          )}
        </View>
        <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
          {email}
        </Text>
      </View>
      
      <Icon name="chevron-right" size="sm" color={colors.text.tertiary} />
    </TouchableOpacity>
  );
};

export interface QuickActionProps {
  icon: string;
  title: string;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  title,
  subtitle,
  color,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.quickAction,
        { backgroundColor: colors.surface.secondary }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.quickActionIcon,
        { backgroundColor: color || colors.primary[500] }
      ]}>
        <Icon name={icon} size="lg" color={colors.text.inverse} />
      </View>
      
      <Text style={[styles.quickActionTitle, { color: colors.text.primary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.quickActionSubtitle, { color: colors.text.secondary }]}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.styles.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.lg,
  },
  sectionContent: {
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.md,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  disabledItem: {
    opacity: 0.6,
  },
  iconContainer: {
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftElement: {
    marginRight: SPACING.md,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemTitle: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubtitle: {
    ...TYPOGRAPHY.styles.bodySmall,
    lineHeight: 18,
  },
  rightElement: {
    alignItems: 'flex-end',
  },
  navigationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  valueText: {
    ...TYPOGRAPHY.styles.bodySmall,
    maxWidth: 120,
    textAlign: 'right',
  },
  infoText: {
    ...TYPOGRAPHY.styles.bodySmall,
    maxWidth: 140,
    textAlign: 'right',
    lineHeight: 18,
  },
  badge: {
    marginRight: SPACING.xs,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  
  // Profile item styles
  profileSettingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: 'transparent',
  },
  profileAvatar: {
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  profileName: {
    ...TYPOGRAPHY.styles.h4,
    fontWeight: '600',
  },
  profileEmail: {
    ...TYPOGRAPHY.styles.body,
  },
  
  // Quick action styles
  quickAction: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 100,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionTitle: {
    ...TYPOGRAPHY.styles.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionSubtitle: {
    ...TYPOGRAPHY.styles.caption,
    textAlign: 'center',
  },
}); 
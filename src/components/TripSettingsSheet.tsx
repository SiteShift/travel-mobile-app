import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BottomSheet, BottomSheetProps } from './BottomSheet';
import { Icon } from './Icon';
import { Badge } from './Badge';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface TripSettingsAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color?: string;
  badge?: string;
  destructive?: boolean;
  onPress: () => void;
}

export interface TripSettingsSheetProps extends Omit<BottomSheetProps, 'children'> {
  tripTitle: string;
  tripId: string;
  onEditTrip?: () => void;
  onShareTrip?: () => void;
  onDuplicateTrip?: () => void;
  onArchiveTrip?: () => void;
  onDeleteTrip?: () => void;
  onExportTrip?: () => void;
  onTripSettings?: () => void;
  onViewOnMap?: () => void;
  customActions?: TripSettingsAction[];
}

export const TripSettingsSheet: React.FC<TripSettingsSheetProps> = ({
  tripTitle,
  tripId,
  onEditTrip,
  onShareTrip,
  onDuplicateTrip,
  onArchiveTrip,
  onDeleteTrip,
  onExportTrip,
  onTripSettings,
  onViewOnMap,
  customActions = [],
  ...bottomSheetProps
}) => {
  const { colors } = useTheme();

  const handleShareTrip = async () => {
    try {
      if (onShareTrip) {
        onShareTrip();
      } else {
        // Default sharing behavior
        await Share.share({
          message: `Check out my trip: ${tripTitle}`,
          title: tripTitle,
        });
      }
    } catch (error) {
      console.error('Error sharing trip:', error);
    }
  };

  const handleArchiveTrip = () => {
    Alert.alert(
      'Archive Trip',
      `Are you sure you want to archive "${tripTitle}"? You can restore it later from your archived trips.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            onArchiveTrip?.();
            bottomSheetProps.onClose?.();
          },
        },
      ]
    );
  };

  const handleDeleteTrip = () => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to permanently delete "${tripTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeleteTrip?.();
            bottomSheetProps.onClose?.();
          },
        },
      ]
    );
  };

  const defaultActions: TripSettingsAction[] = [
    {
      id: 'edit',
      title: 'Edit Trip Details',
      subtitle: 'Change title, description, dates',
      icon: 'edit',
      onPress: () => {
        onEditTrip?.();
        bottomSheetProps.onClose?.();
      },
    },
    {
      id: 'share',
      title: 'Share Trip',
      subtitle: 'Share with friends and family',
      icon: 'share',
      onPress: handleShareTrip,
    },
    {
      id: 'map',
      title: 'View on Map',
      subtitle: 'See all locations on map',
      icon: 'map',
      onPress: () => {
        onViewOnMap?.();
        bottomSheetProps.onClose?.();
      },
    },
    {
      id: 'duplicate',
      title: 'Duplicate Trip',
      subtitle: 'Create a copy of this trip',
      icon: 'copy',
      onPress: () => {
        onDuplicateTrip?.();
        bottomSheetProps.onClose?.();
      },
    },
    {
      id: 'export',
      title: 'Export Trip',
      subtitle: 'Download as PDF or backup',
      icon: 'download',
      badge: 'Pro',
      onPress: () => {
        onExportTrip?.();
        bottomSheetProps.onClose?.();
      },
    },
    {
      id: 'settings',
      title: 'Trip Settings',
      subtitle: 'Privacy, permissions, sharing',
      icon: 'settings',
      onPress: () => {
        onTripSettings?.();
        bottomSheetProps.onClose?.();
      },
    },
    {
      id: 'archive',
      title: 'Archive Trip',
      subtitle: 'Hide from main list',
      icon: 'archive',
      color: colors.warning[500],
      onPress: handleArchiveTrip,
    },
    {
      id: 'delete',
      title: 'Delete Trip',
      subtitle: 'Permanently remove trip',
      icon: 'trash',
      color: colors.error[500],
      destructive: true,
      onPress: handleDeleteTrip,
    },
  ];

  const allActions = [...customActions, ...defaultActions];

  const renderAction = (action: TripSettingsAction) => (
    <TouchableOpacity
      key={action.id}
      style={[
        styles.actionItem,
        {
          backgroundColor: colors.surface.primary,
          borderBottomColor: colors.border.primary,
        },
      ]}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.actionIcon}>
        <Icon
          name={action.icon}
          size="md"
          color={action.color || colors.text.primary}
        />
      </View>
      
      <View style={styles.actionContent}>
        <View style={styles.actionHeader}>
          <Text
            style={[
              styles.actionTitle,
              {
                color: action.destructive ? colors.error[500] : colors.text.primary,
              },
            ]}
          >
            {action.title}
          </Text>
          {action.badge && (
            <Badge
              variant="primary"
              size="small"
              label={action.badge}
              style={styles.actionBadge}
            />
          )}
        </View>
        {action.subtitle && (
          <Text style={[styles.actionSubtitle, { color: colors.text.secondary }]}>
            {action.subtitle}
          </Text>
        )}
      </View>

      <View style={styles.actionChevron}>
        <Icon name="chevron-right" size="sm" color={colors.text.tertiary} />
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
        Trip Options
      </Text>
      <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]} numberOfLines={1}>
        {tripTitle}
      </Text>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      {allActions.map(renderAction)}
    </View>
  );

  return (
    <BottomSheet {...bottomSheetProps} size="large">
      {renderHeader()}
      {renderActions()}
    </BottomSheet>
  );
};

// Convenience component for quick trip actions
export const QuickTripActionsSheet: React.FC<
  Omit<TripSettingsSheetProps, 'customActions'> & {
    quickActions?: ('edit' | 'share' | 'archive' | 'delete')[];
  }
> = ({ quickActions = ['edit', 'share', 'archive', 'delete'], ...props }) => {
  const filteredActions = quickActions.map(actionId => {
    switch (actionId) {
      case 'edit':
        return {
          id: 'edit',
          title: 'Edit Trip',
          icon: 'edit',
          onPress: () => {
            props.onEditTrip?.();
            props.onClose?.();
          },
        };
      case 'share':
        return {
          id: 'share',
          title: 'Share Trip',
          icon: 'share',
          onPress: () => {
            props.onShareTrip?.();
            props.onClose?.();
          },
        };
      case 'archive':
        return {
          id: 'archive',
          title: 'Archive Trip',
          icon: 'archive',
          onPress: () => {
            props.onArchiveTrip?.();
            props.onClose?.();
          },
        };
      case 'delete':
        return {
          id: 'delete',
          title: 'Delete Trip',
          icon: 'trash',
          destructive: true,
          onPress: () => {
            props.onDeleteTrip?.();
            props.onClose?.();
          },
        };
      default:
        return {
          id: actionId,
          title: actionId,
          icon: 'help',
          onPress: () => {},
        };
    }
  });

  return <TripSettingsSheet {...props} customActions={filteredActions} />;
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    ...TYPOGRAPHY.styles.h3,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.styles.body,
  },
  actionsContainer: {
    paddingBottom: SPACING.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  actionContent: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  actionTitle: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '600',
    flex: 1,
  },
  actionBadge: {
    marginLeft: SPACING.sm,
  },
  actionSubtitle: {
    ...TYPOGRAPHY.styles.caption,
    lineHeight: 16,
  },
  actionChevron: {
    marginLeft: SPACING.sm,
  },
}); 
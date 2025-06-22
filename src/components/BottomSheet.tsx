import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { 
  PanGestureHandler, 
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State
} from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import {
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
} from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type BottomSheetSize = 'small' | 'medium' | 'large' | 'full';
export type BottomSheetVariant = 'default' | 'modal' | 'persistent';

export interface BottomSheetAction {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  testID?: string;
}

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: BottomSheetSize;
  variant?: BottomSheetVariant;
  children?: React.ReactNode;
  actions?: BottomSheetAction[];
  showDragHandle?: boolean;
  showCloseButton?: boolean;
  scrollable?: boolean;
  snapPoints?: number[];
  backgroundColor?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  size = 'medium',
  variant = 'default',
  children,
  actions = [],
  showDragHandle = true,
  showCloseButton = false,
  scrollable = false,
  snapPoints,
  backgroundColor,
  style,
  titleStyle,
  contentStyle,
  testID,
}) => {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  const getSheetHeight = () => {
    if (snapPoints && snapPoints.length > 0) {
      return snapPoints[0];
    }

    switch (size) {
      case 'small':
        return SCREEN_HEIGHT * 0.3;
      case 'large':
        return SCREEN_HEIGHT * 0.8;
      case 'full':
        return SCREEN_HEIGHT * 0.95;
      default: // medium
        return SCREEN_HEIGHT * 0.5;
    }
  };

  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    return colors.surface.primary;
  };

  const handleBackdropPress = () => {
    if (variant !== 'persistent') {
      onClose();
    }
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: false }
  );

  const handleGestureStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { translationY, velocityY, state } = event.nativeEvent;
    
    if (state === State.END) {
      const sheetHeight = getSheetHeight();
      
      // Close if dragged down more than 30% or with sufficient velocity
      if (translationY > sheetHeight * 0.3 || velocityY > 1000) {
        onClose();
      } else {
        // Snap back to original position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const renderHeader = () => {
    if (!title && !showCloseButton && !showDragHandle) return null;

    return (
      <View style={styles.header}>
        {showDragHandle && (
          <View style={[styles.dragHandle, { backgroundColor: colors.neutral[300] }]} />
        )}
        
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            {title && (
              <Text
                style={[styles.title, { color: colors.text.primary }, titleStyle]}
                testID={`${testID}-title`}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[styles.subtitle, { color: colors.text.secondary }]}
                testID={`${testID}-subtitle`}
              >
                {subtitle}
              </Text>
            )}
          </View>
          
          {showCloseButton && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID={`${testID}-close-button`}
              accessibilityRole="button"
              accessibilityLabel="Close bottom sheet"
            >
              <Icon name="close" size="md" color="text" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    const ContentWrapper = scrollable ? ScrollView : View;
    const contentProps = scrollable
      ? {
          showsVerticalScrollIndicator: false,
          bounces: false,
        }
      : {};

    return (
      <ContentWrapper
        style={[styles.content, contentStyle]}
        {...contentProps}
      >
        {children}
      </ContentWrapper>
    );
  };

  const renderActions = () => {
    if (actions.length === 0) return null;

    return (
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            style={[
              styles.actionButton,
              { borderColor: colors.neutral[200] }
            ]}
            testID={action.testID}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Icon
              name={action.icon}
              size="lg"
              color={action.color || 'text'}
            />
            <Text
              style={[styles.actionLabel, { color: colors.text.primary }]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={handleBackdropPress}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Bottom Sheet */}
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleGestureStateChange}
        enabled={variant !== 'persistent'}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              height: getSheetHeight(),
              backgroundColor: getBackgroundColor(),
              transform: [{ translateY }],
            },
            style,
          ]}
          testID={testID}
        >
          {renderHeader()}
          {renderContent()}
          {renderActions()}
        </Animated.View>
      </PanGestureHandler>
    </>
  );
};

// Convenience components for travel-specific use cases
export const TravelActionsSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  onAddPhoto: () => void;
  onAddNote: () => void;
  onAddLocation: () => void;
  onAddExpense: () => void;
  testID?: string;
}> = ({ visible, onClose, onAddPhoto, onAddNote, onAddLocation, onAddExpense, testID }) => (
  <BottomSheet
    visible={visible}
    onClose={onClose}
    title="Quick Actions"
    size="small"
    actions={[
      {
        icon: 'camera',
        label: 'Add Photo',
        onPress: onAddPhoto,
      },
      {
        icon: 'note',
        label: 'Write Note',
        onPress: onAddNote,
      },
      {
        icon: 'location',
        label: 'Add Location',
        onPress: onAddLocation,
      },
      {
        icon: 'money',
        label: 'Track Expense',
        onPress: onAddExpense,
      },
    ]}
    testID={testID}
  />
);

export const TripOptionsSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  onExport: () => void;
  onEdit: () => void;
  onDelete: () => void;
  testID?: string;
}> = ({ visible, onClose, onShare, onExport, onEdit, onDelete, testID }) => (
  <BottomSheet
    visible={visible}
    onClose={onClose}
    title="Trip Options"
    showCloseButton
    actions={[
      {
        icon: 'share',
        label: 'Share Trip',
        onPress: onShare,
      },
      {
        icon: 'download',
        label: 'Export Data',
        onPress: onExport,
      },
      {
        icon: 'edit',
        label: 'Edit Trip',
        onPress: onEdit,
      },
      {
        icon: 'delete',
        label: 'Delete Trip',
        onPress: onDelete,
        color: 'error',
      },
    ]}
    testID={testID}
  />
);

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
    zIndex: 1001,
  },
  header: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.styles.h3,
    marginBottom: SPACING.xs / 2,
  },
  subtitle: {
    ...TYPOGRAPHY.styles.bodySmall,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  actionLabel: {
    ...TYPOGRAPHY.styles.bodySmall,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default BottomSheet; 
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface SimpleDateTimePickerProps {
  value: Date;
  onDateChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  disabled?: boolean;
  placeholder?: string;
  showIcon?: boolean;
  testID?: string;
  minDate?: Date;
  maxDate?: Date;
  accentColor?: string;
}

export const SimpleDateTimePicker: React.FC<SimpleDateTimePickerProps> = ({
  value,
  onDateChange,
  mode = 'datetime',
  disabled = false,
  placeholder,
  showIcon = true,
  testID,
  minDate,
  maxDate,
  accentColor = '#EF6144',
}) => {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [temp, setTemp] = useState<Date>(value);

  const formatDate = (date: Date) => {
    switch (mode) {
      case 'date':
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'datetime':
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      default:
        return date.toLocaleDateString('en-US');
    }
  };

  const getRelativeDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    const tomorrowStr = tomorrow.toDateString();

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    
    return null;
  };

  const getDisplayText = () => {
    if (!value && placeholder) return placeholder;

    const formatted = formatDate(value);
    const relative = getRelativeDate(value);

    if (relative && mode !== 'time') {
      if (mode === 'datetime') {
        const timeStr = value.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${relative}, ${timeStr}`;
      }
      return relative;
    }

    return formatted;
  };

  const getIcon = () => {
    switch (mode) {
      case 'date':
        return 'calendar';
      case 'time':
        return 'time';
      case 'datetime':
        return 'calendar-clock';
      default:
        return 'calendar';
    }
  };

  const handlePress = () => {
    if (disabled) return;
    setTemp(value);
    setIsVisible(true);
  };

  const handleConfirm = () => {
    try {
      const clamped = clampDate(temp, minDate, maxDate);
      onDateChange(clamped);
    } catch (error) {
      console.error('Invalid date/time format');
    }
    setIsVisible(false);
  };

  const handleCancel = () => {
    setTemp(value);
    setIsVisible(false);
  };

  const renderQuickDates = () => null;

  const renderPicker = () => (
    <Modal
      visible={isVisible}
      onClose={handleCancel}
      variant="center"
      size="small"
      animationType="none"
      showCloseButton={false}
      contentStyle={{ backgroundColor: '#FFFFFF' }}
    >
      <View style={[styles.pickerContainer, { backgroundColor: '#FFFFFF' }]}>        
        {(mode === 'date' || mode === 'datetime') && (
          <View style={{ alignItems: 'center', paddingVertical: 8 } as any}>
            <DateTimePicker
              value={temp}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              onChange={(e: any, d?: Date) => { if (d) setTemp(new Date(d)); }}
              minimumDate={minDate}
              maximumDate={maxDate}
              themeVariant={Platform.OS === 'ios' ? 'light' : undefined}
              textColor={Platform.OS === 'ios' ? '#111111' : undefined}
            />
          </View>
        )}

        {(mode === 'time' || mode === 'datetime') && (
          <View style={{ alignItems: 'center', paddingVertical: 8 } as any}>
            <DateTimePicker
              value={temp}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              onChange={(e: any, d?: Date) => { if (d) setTemp(new Date(d)); }}
              themeVariant={Platform.OS === 'ios' ? 'light' : undefined}
              textColor={Platform.OS === 'ios' ? '#111111' : undefined}
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button title="Cancel" variant="secondary" onPress={handleCancel} style={styles.button} />
          <Button title="Confirm" onPress={handleConfirm} style={StyleSheet.flatten([styles.button, { backgroundColor: accentColor }])} />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container} testID={testID}>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface.secondary,
            borderColor: isVisible ? accentColor : colors.border.primary,
            borderStyle: isVisible ? 'solid' : 'dashed',
          },
          disabled && styles.disabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {showIcon && (
          <Icon
            name={getIcon()}
            size="md"
            color={disabled ? colors.text.disabled : colors.text.secondary}
            style={styles.icon}
          />
        )}
        
        <Text
          style={[
            styles.text,
            {
              color: disabled 
                ? colors.text.disabled 
                : value 
                  ? colors.text.primary 
                  : colors.text.secondary
            }
          ]}
          numberOfLines={1}
        >
          {getDisplayText()}
        </Text>
        
        <Icon
          name="chevron-down"
          size="sm"
          color={disabled ? colors.text.disabled : colors.text.tertiary}
        />
      </TouchableOpacity>

      {renderPicker()}
    </View>
  );
};

function clampDate(date: Date, min?: Date, max?: Date) {
  let d = date;
  if (min && d < min) d = new Date(min);
  if (max && d > max) d = new Date(max);
  return d;
}

const styles = StyleSheet.create({
  container: {
    // No additional styles needed
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.6,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  text: {
    ...TYPOGRAPHY.styles.body,
    flex: 1,
  },
  pickerContainer: {
    paddingBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    ...TYPOGRAPHY.styles.h4,
    fontWeight: '700',
  },
  sheetClose: {
    fontSize: 26,
    lineHeight: 26,
    fontWeight: '700',
  },
  wheelRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wheelCol: {
    flex: 1,
    height: 200,
  },
  wheelItem: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    ...TYPOGRAPHY.styles.body,
  },
  wheelDivider: {
    position: 'absolute',
    top: 78,
    left: 0,
    right: 0,
    height: 44,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  quickDatesContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.md,
  },
  quickDates: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  quickDateText: {
    ...TYPOGRAPHY.styles.bodySmall,
    fontWeight: '600',
  },
  inputsContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  input: {
    marginBottom: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
  },
}); 
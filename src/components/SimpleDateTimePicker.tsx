import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
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
}

export const SimpleDateTimePicker: React.FC<SimpleDateTimePickerProps> = ({
  value,
  onDateChange,
  mode = 'datetime',
  disabled = false,
  placeholder,
  showIcon = true,
  testID,
}) => {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value.toISOString().split('T')[0]);
  const [tempTime, setTempTime] = useState(
    value.toTimeString().split(':').slice(0, 2).join(':')
  );

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
    setTempDate(value.toISOString().split('T')[0]);
    setTempTime(value.toTimeString().split(':').slice(0, 2).join(':'));
    setIsVisible(true);
  };

  const handleConfirm = () => {
    try {
      let newDate: Date;
      
      if (mode === 'time') {
        const [hours, minutes] = tempTime.split(':');
        newDate = new Date(value);
        newDate.setHours(parseInt(hours), parseInt(minutes));
      } else if (mode === 'date') {
        newDate = new Date(tempDate);
        newDate.setHours(value.getHours(), value.getMinutes());
      } else {
        const [hours, minutes] = tempTime.split(':');
        newDate = new Date(tempDate);
        newDate.setHours(parseInt(hours), parseInt(minutes));
      }
      
      onDateChange(newDate);
    } catch (error) {
      console.error('Invalid date/time format');
    }
    setIsVisible(false);
  };

  const handleCancel = () => {
    setTempDate(value.toISOString().split('T')[0]);
    setTempTime(value.toTimeString().split(':').slice(0, 2).join(':'));
    setIsVisible(false);
  };

  const renderQuickDates = () => {
    if (mode === 'time') return null;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const quickDates = [
      { label: 'Yesterday', date: yesterday },
      { label: 'Today', date: today },
      { label: 'Tomorrow', date: tomorrow },
    ];

    return (
      <View style={styles.quickDatesContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Quick Select
        </Text>
        <View style={styles.quickDates}>
          {quickDates.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.quickDateButton,
                { backgroundColor: colors.surface.secondary }
              ]}
              onPress={() => setTempDate(item.date.toISOString().split('T')[0])}
            >
              <Text style={[styles.quickDateText, { color: colors.text.primary }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderPicker = () => (
    <Modal
      visible={isVisible}
      onClose={handleCancel}
      variant="bottom"
      title={`Select ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
    >
      <View style={styles.pickerContainer}>
        {renderQuickDates()}
        
        <View style={styles.inputsContainer}>
          {(mode === 'date' || mode === 'datetime') && (
            <Input
              label="Date"
              value={tempDate}
              onChangeText={setTempDate}
              placeholder="YYYY-MM-DD"
              leftIcon={<Icon name="calendar" size="sm" color={colors.text.secondary} />}
              containerStyle={styles.input}
            />
          )}
          
          {(mode === 'time' || mode === 'datetime') && (
            <Input
              label="Time"
              value={tempTime}
              onChangeText={setTempTime}
              placeholder="HH:MM"
              leftIcon={<Icon name="time" size="sm" color={colors.text.secondary} />}
              containerStyle={styles.input}
            />
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={handleCancel}
            style={styles.button}
          />
          <Button
            title="Confirm"
            onPress={handleConfirm}
            style={styles.button}
          />
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
            borderColor: colors.border.primary,
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
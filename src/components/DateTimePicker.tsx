import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
// Note: For full functionality, install @react-native-community/datetimepicker
// For now, we'll create a simplified version using basic inputs
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface DateTimePickerProps {
  value: Date;
  onDateChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  locale?: string;
  style?: any;
  disabled?: boolean;
  placeholder?: string;
  showIcon?: boolean;
  testID?: string;
}

export const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onDateChange,
  mode = 'datetime',
  minimumDate,
  maximumDate = new Date(),
  locale = 'en-US',
  style,
  disabled = false,
  placeholder,
  showIcon = true,
  testID,
}) => {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const [currentMode, setCurrentMode] = useState<'date' | 'time'>(mode === 'datetime' ? 'date' : mode);

  const formatDate = (date: Date) => {
    switch (mode) {
      case 'date':
        return date.toLocaleDateString(locale, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      case 'time':
        return date.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'datetime':
        return date.toLocaleDateString(locale, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      default:
        return date.toLocaleDateString(locale);
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
        const timeStr = value.toLocaleTimeString(locale, {
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
    setTempDate(value);
    setCurrentMode(mode === 'datetime' ? 'date' : mode);
    setIsVisible(true);
  };

  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setIsVisible(false);
    }

    if (selectedDate) {
      setTempDate(selectedDate);
      
      if (Platform.OS === 'android') {
        if (mode === 'datetime' && currentMode === 'date') {
          // For datetime mode on Android, show time picker after date
          setTimeout(() => {
            setCurrentMode('time');
            setIsVisible(true);
          }, 100);
        } else {
          onDateChange(selectedDate);
        }
      }
    }
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    setIsVisible(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setIsVisible(false);
  };

  const renderIOSPicker = () => (
    <Modal
      visible={isVisible}
      onClose={handleCancel}
      variant="bottom"
      title={mode === 'datetime' && currentMode === 'time' ? 'Select Time' : `Select ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
    >
      <View style={styles.pickerContainer}>
        <DateTimePicker
          value={tempDate}
          mode={currentMode}
          display="spinner"
          onChange={handleDateTimeChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          locale={locale}
          style={styles.picker}
        />
        
        <View style={styles.buttonContainer}>
          {mode === 'datetime' && currentMode === 'date' && (
            <Button
              title="Next: Time"
              onPress={() => setCurrentMode('time')}
              style={styles.button}
            />
          )}
          
          {(mode !== 'datetime' || currentMode === 'time') && (
            <>
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
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderAndroidPicker = () => {
    if (!isVisible) return null;

    return (
      <DateTimePicker
        value={tempDate}
        mode={currentMode}
        display="default"
        onChange={handleDateTimeChange}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        locale={locale}
      />
    );
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
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

      {Platform.OS === 'ios' ? renderIOSPicker() : renderAndroidPicker()}
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
  picker: {
    height: 200,
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
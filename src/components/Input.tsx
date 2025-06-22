import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  COMPONENTS,
} from '../constants/theme';

export type InputVariant = 'default' | 'filled' | 'outlined';
export type InputState = 'default' | 'error' | 'success' | 'disabled';
export type InputSize = 'small' | 'medium' | 'large';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  variant?: InputVariant;
  state?: InputState;
  size?: InputSize;
  helperText?: string;
  errorText?: string;
  successText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  required?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  testID?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      variant = 'default',
      state = 'default',
      size = 'medium',
      helperText,
      errorText,
      successText,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputStyle,
      labelStyle,
      required = false,
      showCharacterCount = false,
      maxLength,
      multiline = false,
      numberOfLines = 1,
      testID,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const isDisabled = state === 'disabled';
    const hasError = state === 'error';
    const hasSuccess = state === 'success';

    const getContainerStyles = (): ViewStyle => {
      const baseStyles: ViewStyle = {
        marginBottom: SPACING.md,
      };

      return {
        ...baseStyles,
        opacity: isDisabled ? 0.6 : 1,
      };
    };

    const getInputContainerStyles = (): ViewStyle => {
      const height = size === 'small' ? 36 : size === 'large' ? 52 : COMPONENTS.input.height;
      
      const baseStyles: ViewStyle = {
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: COMPONENTS.input.paddingHorizontal,
        paddingVertical: multiline ? SPACING.sm : 0,
        minHeight: height,
      };

      let borderColor = colors.border.primary;
      let backgroundColor = 'transparent';

      if (isFocused) {
        borderColor = colors.primary[500];
      } else if (hasError) {
        borderColor = colors.error[500];
      } else if (hasSuccess) {
        borderColor = colors.success[500];
      }

      switch (variant) {
        case 'filled':
          backgroundColor = colors.surface.secondary;
          return {
            ...baseStyles,
            backgroundColor,
            borderWidth: 0,
          };
        case 'outlined':
          return {
            ...baseStyles,
            backgroundColor: colors.surface.primary,
            borderWidth: 1,
            borderColor,
          };
        default:
          return {
            ...baseStyles,
            backgroundColor: 'transparent',
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
            borderRadius: 0,
            paddingHorizontal: 0,
          };
      }
    };

    const getInputStyles = (): TextStyle => {
      const fontSize = size === 'small' ? TYPOGRAPHY.styles.bodySmall.fontSize : TYPOGRAPHY.styles.body.fontSize;
      
      return {
        flex: 1,
        fontSize,
        fontWeight: TYPOGRAPHY.styles.body.fontWeight,
        color: isDisabled ? colors.text.disabled : colors.text.primary,
        paddingVertical: multiline ? SPACING.xs : 0,
        textAlignVertical: multiline ? 'top' : 'center',
        minHeight: multiline ? (numberOfLines || 3) * 20 : undefined,
      };
    };

    const getLabelStyles = (): TextStyle => {
      const fontSize = size === 'small' ? TYPOGRAPHY.styles.caption.fontSize : TYPOGRAPHY.styles.bodySmall.fontSize;
      
      return {
        fontSize,
        fontWeight: TYPOGRAPHY.styles.bodySmall.fontWeight,
        color: hasError ? colors.error[500] : colors.text.secondary,
        marginBottom: SPACING.xs,
      };
    };

    const getHelperTextStyles = (): TextStyle => {
      return {
        ...TYPOGRAPHY.styles.caption,
        color: hasError
          ? colors.error[500]
          : hasSuccess
          ? colors.success[500]
          : colors.text.tertiary,
        marginTop: SPACING.xs,
      };
    };

    const renderLabel = () => {
      if (!label) return null;

      return (
        <Text style={[getLabelStyles(), labelStyle]} testID={`${testID}-label`}>
          {label}
          {required && (
            <Text style={{ color: colors.error[500] }}> *</Text>
          )}
        </Text>
      );
    };

    const renderLeftIcon = () => {
      if (!leftIcon) return null;

      return (
        <View style={styles.iconContainer} testID={`${testID}-left-icon`}>
          {leftIcon}
        </View>
      );
    };

    const renderRightIcon = () => {
      if (!rightIcon) return null;

      const IconComponent = onRightIconPress ? TouchableOpacity : View;

      return (
        <IconComponent
          style={styles.iconContainer}
          onPress={onRightIconPress}
          disabled={isDisabled}
          testID={`${testID}-right-icon`}
          accessibilityRole={onRightIconPress ? 'button' : undefined}
        >
          {rightIcon}
        </IconComponent>
      );
    };

    const renderHelperText = () => {
      const text = errorText || successText || helperText;
      if (!text && !showCharacterCount) return null;

      return (
        <View style={styles.helperContainer}>
          {text && (
            <Text style={getHelperTextStyles()} testID={`${testID}-helper`}>
              {text}
            </Text>
          )}
          {showCharacterCount && maxLength && (
            <Text style={[getHelperTextStyles(), styles.characterCount]} testID={`${testID}-count`}>
              {(value?.length || 0)}/{maxLength}
            </Text>
          )}
        </View>
      );
    };

    return (
      <View style={[getContainerStyles(), containerStyle]} testID={testID}>
        {renderLabel()}
        
        <View style={getInputContainerStyles()}>
          {renderLeftIcon()}
          
          <TextInput
            ref={ref}
            style={[getInputStyles(), inputStyle]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.text.disabled}
            editable={!isDisabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={maxLength}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
            testID={`${testID}-input`}
            accessibilityLabel={label}
            accessibilityHint={helperText}
            accessibilityState={{
              disabled: isDisabled,
            }}
            {...props}
          />
          
          {renderRightIcon()}
        </View>
        
        {renderHelperText()}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  iconContainer: {
    marginHorizontal: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCount: {
    marginLeft: SPACING.sm,
  },
});

export default Input; 
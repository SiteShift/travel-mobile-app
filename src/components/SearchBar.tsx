import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  FlatList,
  Keyboard,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import {
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
} from '../constants/theme';

export type SearchBarVariant = 'default' | 'rounded' | 'minimal' | 'elevated';
export type SearchBarSize = 'small' | 'medium' | 'large';

export interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  type?: 'location' | 'place' | 'recent' | 'suggestion';
  data?: any;
}

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
  placeholder?: string;
  variant?: SearchBarVariant;
  size?: SearchBarSize;
  suggestions?: SearchSuggestion[];
  onSuggestionPress?: (suggestion: SearchSuggestion) => void;
  showSuggestions?: boolean;
  loading?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  returnKeyType?: 'search' | 'go' | 'done';
  backgroundColor?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  suggestionsStyle?: ViewStyle;
  testID?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  onFocus,
  onBlur,
  onClear,
  placeholder = 'Search...',
  variant = 'default',
  size = 'medium',
  suggestions = [],
  onSuggestionPress,
  showSuggestions = true,
  loading = false,
  disabled = false,
  autoFocus = false,
  returnKeyType = 'search',
  backgroundColor,
  leftIcon = 'search',
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  suggestionsStyle,
  testID,
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showSuggestionsList && suggestions.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showSuggestionsList, suggestions.length, fadeAnim]);

  const getSearchBarHeight = () => {
    switch (size) {
      case 'small':
        return 36;
      case 'large':
        return 52;
      default:
        return 44;
    }
  };

  const getSearchBarStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      height: getSearchBarHeight(),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.sm,
      backgroundColor: backgroundColor || colors.surface.secondary,
      borderWidth: 1,
      borderColor: isFocused ? colors.primary[500] : colors.neutral[200],
    };

    switch (variant) {
      case 'rounded':
        return {
          ...baseStyles,
          borderRadius: getSearchBarHeight() / 2,
        };
      case 'elevated':
        return {
          ...baseStyles,
          borderRadius: BORDER_RADIUS.md,
          ...SHADOWS.sm,
          borderWidth: 0,
        };
      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderBottomWidth: 1,
          borderRadius: 0,
          paddingHorizontal: 0,
        };
      default:
        return {
          ...baseStyles,
          borderRadius: BORDER_RADIUS.md,
        };
    }
  };

  const getInputStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      flex: 1,
      color: colors.text.primary,
      paddingHorizontal: SPACING.sm,
    };

    switch (size) {
      case 'small':
        return {
          ...baseStyles,
          ...TYPOGRAPHY.styles.bodySmall,
        };
      case 'large':
        return {
          ...baseStyles,
          ...TYPOGRAPHY.styles.body,
          fontSize: 16,
        };
      default:
        return {
          ...baseStyles,
          ...TYPOGRAPHY.styles.body,
        };
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestionsList(true);
    onFocus?.();

    Animated.timing(scaleAnim, {
      toValue: 1.02,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for suggestion press
    setTimeout(() => setShowSuggestionsList(false), 150);
    onBlur?.();

    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    onSearch?.(value);
    Keyboard.dismiss();
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    onSuggestionPress?.(suggestion);
    onChangeText(suggestion.title);
    setShowSuggestionsList(false);
    Keyboard.dismiss();
  };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;

    return (
      <View style={styles.iconContainer}>
        <Icon
          name={leftIcon}
          size={size === 'small' ? 'sm' : 'md'}
          color={isFocused ? colors.primary[500] : colors.text.secondary}
        />
      </View>
    );
  };

  const renderRightContent = () => {
    const iconSize = size === 'small' ? 'sm' : 'md';

    if (loading) {
      return (
        <View style={styles.iconContainer}>
          <Icon name="loading" size={iconSize} color="text" />
        </View>
      );
    }

    if (value.length > 0) {
      return (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.iconContainer}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={`${testID}-clear-button`}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Icon name="close" size={iconSize} color="text" />
        </TouchableOpacity>
      );
    }

    if (rightIcon) {
      return (
        <TouchableOpacity
          onPress={onRightIconPress}
          style={styles.iconContainer}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={`${testID}-right-icon`}
          accessibilityRole="button"
        >
          <Icon name={rightIcon} size={iconSize} color="text" />
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderSuggestionItem = ({ item }: { item: SearchSuggestion }) => {
    const getTypeIcon = () => {
      switch (item.type) {
        case 'location':
          return 'location';
        case 'place':
          return 'place';
        case 'recent':
          return 'history';
        default:
          return 'search';
      }
    };

    return (
      <TouchableOpacity
        onPress={() => handleSuggestionPress(item)}
        style={[styles.suggestionItem, { borderColor: colors.neutral[200] }]}
        testID={`suggestion-${item.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.title}`}
      >
        <Icon
          name={item.icon || getTypeIcon()}
          size="md"
          color="text"
          style={styles.suggestionIcon}
        />
        <View style={styles.suggestionContent}>
          <Text
            style={[styles.suggestionTitle, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text
              style={[styles.suggestionSubtitle, { color: colors.text.secondary }]}
              numberOfLines={1}
            >
              {item.subtitle}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSuggestions = () => {
    if (!showSuggestions || !showSuggestionsList || suggestions.length === 0) {
      return null;
    }

    return (
      <Animated.View
        style={[
          styles.suggestionsContainer,
          {
            backgroundColor: colors.surface.primary,
            borderColor: colors.neutral[200],
            opacity: fadeAnim,
          },
          suggestionsStyle,
        ]}
      >
        <FlatList
          data={suggestions}
          renderItem={renderSuggestionItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Animated.View
        style={[
          getSearchBarStyles(),
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {renderLeftIcon()}
        
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          style={[getInputStyles(), inputStyle]}
          editable={!disabled}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          testID={`${testID}-input`}
          accessibilityRole="search"
          accessibilityLabel={placeholder}
        />

        {renderRightContent()}
      </Animated.View>

      {renderSuggestions()}
    </View>
  );
};

// Convenience components for travel-specific use cases
export const LocationSearchBar: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onLocationSelect?: (location: SearchSuggestion) => void;
  locations?: SearchSuggestion[];
  loading?: boolean;
  testID?: string;
}> = ({ value, onChangeText, onLocationSelect, locations, loading, testID }) => (
  <SearchBar
    value={value}
    onChangeText={onChangeText}
    onSuggestionPress={onLocationSelect}
    suggestions={locations}
    loading={loading}
    placeholder="Search locations..."
    leftIcon="location"
    variant="elevated"
    testID={testID}
  />
);

export const TripSearchBar: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onTripSelect?: (trip: SearchSuggestion) => void;
  trips?: SearchSuggestion[];
  testID?: string;
}> = ({ value, onChangeText, onTripSelect, trips, testID }) => (
  <SearchBar
    value={value}
    onChangeText={onChangeText}
    onSuggestionPress={onTripSelect}
    suggestions={trips}
    placeholder="Search trips..."
    leftIcon="backpack"
    variant="rounded"
    testID={testID}
  />
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    ...SHADOWS.md,
    maxHeight: 200,
    zIndex: 1001,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    marginRight: SPACING.sm,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    ...TYPOGRAPHY.styles.body,
    marginBottom: SPACING.xs / 2,
  },
  suggestionSubtitle: {
    ...TYPOGRAPHY.styles.bodySmall,
  },
});

export default SearchBar; 
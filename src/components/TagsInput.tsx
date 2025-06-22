import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { BottomSheet } from './BottomSheet';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface Tag {
  id: string;
  label: string;
  category?: string;
  color?: string;
  icon?: string;
}

export interface TagsInputProps {
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
  placeholder?: string;
  showSuggestions?: boolean;
  showCategories?: boolean;
  editable?: boolean;
  compact?: boolean;
  style?: any;
  testID?: string;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  tags,
  onTagsChange,
  maxTags = 10,
  placeholder = 'Add tags...',
  showSuggestions = true,
  showCategories = true,
  editable = true,
  compact = false,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const travelTagCategories = [
    {
      id: 'activities',
      name: 'Activities',
      icon: 'target',
      suggestions: [
        { id: 'hiking', label: 'Hiking', icon: 'hiking' },
        { id: 'swimming', label: 'Swimming', icon: 'swim' },
        { id: 'sightseeing', label: 'Sightseeing', icon: 'camera' },
        { id: 'shopping', label: 'Shopping', icon: 'shopping-bag' },
        { id: 'food-tour', label: 'Food Tour', icon: 'food' },
        { id: 'museum', label: 'Museum', icon: 'bank' },
        { id: 'beach', label: 'Beach', icon: 'beach' },
        { id: 'nightlife', label: 'Nightlife', icon: 'music' },
      ],
    },
    {
      id: 'transport',
      name: 'Transport',
      icon: 'car',
      suggestions: [
        { id: 'flight', label: 'Flight', icon: 'airplane' },
        { id: 'train', label: 'Train', icon: 'train' },
        { id: 'bus', label: 'Bus', icon: 'bus' },
        { id: 'taxi', label: 'Taxi', icon: 'taxi' },
        { id: 'walking', label: 'Walking', icon: 'walk' },
        { id: 'bike', label: 'Bike', icon: 'bike' },
        { id: 'car-rental', label: 'Car Rental', icon: 'car' },
        { id: 'boat', label: 'Boat', icon: 'boat' },
      ],
    },
    {
      id: 'food',
      name: 'Food & Drink',
      icon: 'food',
      suggestions: [
        { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
        { id: 'street-food', label: 'Street Food', icon: 'food-cart' },
        { id: 'cafe', label: 'Café', icon: 'coffee' },
        { id: 'bar', label: 'Bar', icon: 'beer' },
        { id: 'local-cuisine', label: 'Local Cuisine', icon: 'chef-hat' },
        { id: 'breakfast', label: 'Breakfast', icon: 'breakfast' },
        { id: 'lunch', label: 'Lunch', icon: 'lunch' },
        { id: 'dinner', label: 'Dinner', icon: 'dinner' },
      ],
    },
    {
      id: 'accommodation',
      name: 'Accommodation',
      icon: 'home',
      suggestions: [
        { id: 'hotel', label: 'Hotel', icon: 'hotel' },
        { id: 'hostel', label: 'Hostel', icon: 'bunk-bed' },
        { id: 'airbnb', label: 'Airbnb', icon: 'home-variant' },
        { id: 'resort', label: 'Resort', icon: 'palm-tree' },
        { id: 'camping', label: 'Camping', icon: 'tent' },
        { id: 'guest-house', label: 'Guest House', icon: 'home-group' },
      ],
    },
    {
      id: 'mood',
      name: 'Mood',
      icon: 'happy',
      suggestions: [
        { id: 'amazing', label: 'Amazing', icon: 'star' },
        { id: 'fun', label: 'Fun', icon: 'happy' },
        { id: 'relaxing', label: 'Relaxing', icon: 'calm' },
        { id: 'adventurous', label: 'Adventurous', icon: 'mountain' },
        { id: 'romantic', label: 'Romantic', icon: 'heart' },
        { id: 'exciting', label: 'Exciting', icon: 'lightning' },
        { id: 'peaceful', label: 'Peaceful', icon: 'meditation' },
        { id: 'challenging', label: 'Challenging', icon: 'shield' },
      ],
    },
  ];

  const getAllSuggestions = () => {
    return travelTagCategories.flatMap(category =>
      category.suggestions.map(suggestion => ({
        ...suggestion,
        category: category.id,
      }))
    );
  };

  const getFilteredSuggestions = () => {
    if (!inputValue.trim()) return [];
    
    const allSuggestions = getAllSuggestions();
    const existingTagIds = tags.map(tag => tag.id);
    
    return allSuggestions.filter(suggestion =>
      !existingTagIds.includes(suggestion.id) &&
      suggestion.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  const handleAddTag = (tag: Omit<Tag, 'id'> & { id?: string }) => {
    if (tags.length >= maxTags) return;
    
    const newTag: Tag = {
      id: tag.id || Date.now().toString(),
      label: tag.label,
      category: tag.category,
      color: tag.color,
      icon: tag.icon,
    };
    
    onTagsChange([...tags, newTag]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(tags.filter(tag => tag.id !== tagId));
  };

  const handleSubmitEditing = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && tags.length < maxTags) {
      const existingTag = tags.find(tag => 
        tag.label.toLowerCase() === trimmedValue.toLowerCase()
      );
      
      if (!existingTag) {
        handleAddTag({ label: trimmedValue });
      }
    }
  };

  const getTagColor = (category?: string) => {
    switch (category) {
      case 'activities':
        return colors.primary[500];
      case 'transport':
        return colors.secondary[500];
      case 'food':
        return colors.warning[500];
      case 'accommodation':
        return colors.info[500];
      case 'mood':
        return colors.success[500];
      default:
        return colors.neutral[500];
    }
  };

  const renderTag = (tag: Tag, removable = true) => (
    <Badge
      key={tag.id}
      label={tag.label}
      variant="default"
      size="small"
      removable={removable && editable}
      onRemove={() => handleRemoveTag(tag.id)}
      style={styles.tag}
    />
  );

  const renderSuggestion = ({ item }: { item: Tag }) => (
    <TouchableOpacity
      style={[
        styles.suggestion,
        { backgroundColor: colors.surface.secondary }
      ]}
      onPress={() => handleAddTag(item)}
      activeOpacity={0.7}
    >
      {item.icon && (
        <Icon
          name={item.icon}
          size="sm"
          color={getTagColor(item.category)}
          style={styles.suggestionIcon}
        />
      )}
      <Text style={[styles.suggestionText, { color: colors.text.primary }]}>
        {item.label}
      </Text>
      <Icon name="plus" size="xs" color={colors.text.tertiary} />
    </TouchableOpacity>
  );

  const renderCategory = (category: any) => (
    <View key={category.id} style={styles.category}>
      <View style={styles.categoryHeader}>
        <Icon
          name={category.icon}
          size="sm"
          color={getTagColor(category.id)}
          style={styles.categoryIcon}
        />
        <Text style={[styles.categoryTitle, { color: colors.text.primary }]}>
          {category.name}
        </Text>
      </View>
      
      <View style={styles.categoryTags}>
        {category.suggestions.map((suggestion: any) => {
          const isAdded = tags.some(tag => tag.id === suggestion.id);
          return (
            <TouchableOpacity
              key={suggestion.id}
              style={[
                styles.categoryTag,
                {
                  backgroundColor: isAdded 
                    ? getTagColor(category.id) 
                    : colors.surface.secondary,
                  borderColor: getTagColor(category.id),
                },
                isAdded && styles.categoryTagActive,
              ]}
              onPress={() => {
                if (isAdded) {
                  handleRemoveTag(suggestion.id);
                } else {
                  handleAddTag({ ...suggestion, category: category.id });
                }
              }}
              disabled={!isAdded && tags.length >= maxTags}
            >
              {suggestion.icon && (
                <Icon
                  name={suggestion.icon}
                  size="xs"
                  color={isAdded ? colors.text.inverse : getTagColor(category.id)}
                  style={styles.categoryTagIcon}
                />
              )}
              <Text
                style={[
                  styles.categoryTagText,
                  {
                    color: isAdded 
                      ? colors.text.inverse 
                      : colors.text.primary
                  }
                ]}
              >
                {suggestion.label}
              </Text>
              {isAdded && (
                <Icon name="check" size="xs" color={colors.text.inverse} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderInput = () => {
    if (!editable) return null;

    return (
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { color: colors.text.primary }
          ]}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor={colors.text.disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmitEditing}
          returnKeyType="done"
          blurOnSubmit={false}
          editable={tags.length < maxTags}
        />
        
        {tags.length < maxTags && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsExpanded(true)}
          >
            <Icon name="tag-plus" size="sm" color={colors.primary[500]} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCompactView = () => (
    <View style={[styles.compactContainer, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactTags}
      >
        {tags.map(tag => renderTag(tag, false))}
        {editable && tags.length < maxTags && (
          <TouchableOpacity
            style={[
              styles.addTagButton,
              { backgroundColor: colors.surface.secondary }
            ]}
            onPress={() => setIsExpanded(true)}
          >
            <Icon name="plus" size="xs" color={colors.text.secondary} />
            <Text style={[styles.addTagText, { color: colors.text.secondary }]}>
              Add tag
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  const renderFullView = () => (
    <View style={[styles.container, style]}>
      <View style={styles.tagsContainer}>
        {tags.map(tag => renderTag(tag))}
        {renderInput()}
      </View>
      
      {isFocused && showSuggestions && (
        <FlatList
          data={getFilteredSuggestions()}
          renderItem={renderSuggestion}
          keyExtractor={(item) => item.id}
          style={styles.suggestions}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {tags.length > 0 && (
        <Text style={[styles.counter, { color: colors.text.tertiary }]}>
          {tags.length}/{maxTags} tags
        </Text>
      )}
    </View>
  );

  const renderExpandedSheet = () => (
    <BottomSheet
      visible={isExpanded}
      onClose={() => setIsExpanded(false)}
      size="large"
      title="Add Tags"
    >
      <View style={styles.sheetContent}>
        {renderInput()}
        
        {showCategories && (
          <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
            {travelTagCategories.map(renderCategory)}
          </ScrollView>
        )}
      </View>
    </BottomSheet>
  );

  if (compact) {
    return (
      <>
        {renderCompactView()}
        {renderExpandedSheet()}
      </>
    );
  }

  return (
    <View testID={testID}>
      {renderFullView()}
      {renderExpandedSheet()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No additional styles needed
  },
  compactContainer: {
    // No additional styles needed
  },
  compactTags: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  addTagText: {
    ...TYPOGRAPHY.styles.caption,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tag: {
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  input: {
    ...TYPOGRAPHY.styles.body,
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    minHeight: 32,
  },
  addButton: {
    padding: SPACING.xs,
  },
  suggestions: {
    maxHeight: 150,
    marginBottom: SPACING.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  suggestionIcon: {
    marginRight: SPACING.sm,
  },
  suggestionText: {
    ...TYPOGRAPHY.styles.body,
    flex: 1,
  },
  counter: {
    ...TYPOGRAPHY.styles.caption,
    textAlign: 'right',
  },
  sheetContent: {
    flex: 1,
    paddingBottom: SPACING.lg,
  },
  categoriesContainer: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  category: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryIcon: {
    marginRight: SPACING.sm,
  },
  categoryTitle: {
    ...TYPOGRAPHY.styles.h4,
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  categoryTagActive: {
    // Additional styles for active state
  },
  categoryTagIcon: {
    // No additional styles needed
  },
  categoryTagText: {
    ...TYPOGRAPHY.styles.caption,
    fontWeight: '500',
  },
}); 
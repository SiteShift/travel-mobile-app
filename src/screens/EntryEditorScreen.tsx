import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { Header } from '../components/Header';
import { RichTextEditor } from '../components/RichTextEditor';
import { MediaPicker, MediaItem } from '../components/MediaPicker';
import { SimpleDateTimePicker } from '../components/SimpleDateTimePicker';
import { LocationPicker, LocationData } from '../components/LocationPicker';
import { WeatherDisplay, WeatherData } from '../components/WeatherDisplay';
import { TagsInput, Tag } from '../components/TagsInput';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface TripEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  location?: LocationData;
  weather?: WeatherData;
  tags: Tag[];
  media: MediaItem[];
  mood?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntryEditorScreenProps {
  entryId?: string;
  tripId: string;
  initialDate?: Date;
  initialLocation?: LocationData;
  onSave?: (entry: TripEntry) => void;
  onCancel?: () => void;
}

export default function EntryEditorScreen({
  entryId,
  tripId,
  initialDate = new Date(),
  initialLocation,
  onSave,
  onCancel,
}: EntryEditorScreenProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // Entry data
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(initialDate);
  const [location, setLocation] = useState<LocationData | undefined>(initialLocation);
  const [weather, setWeather] = useState<WeatherData | undefined>();
  const [tags, setTags] = useState<Tag[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mood, setMood] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);

  // Auto-save
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  // Load existing entry if editing
  useEffect(() => {
    if (entryId) {
      loadEntry(entryId);
    }
  }, [entryId]);

  // Auto-save functionality
  useEffect(() => {
    const currentData = JSON.stringify({
      title,
      content,
      date: date.toISOString(),
      location,
      weather,
      tags,
      media,
      mood,
      isPublic,
    });

    if (currentData !== lastSavedRef.current && (title || content)) {
      setHasUnsavedChanges(true);
      
      // Clear existing timeout
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }

      // Set new timeout for auto-save
      autoSaveRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [title, content, date, location, weather, tags, media, mood, isPublic]);

  const loadEntry = async (id: string) => {
    setIsLoading(true);
    try {
      // Mock loading - in real app, this would fetch from API
      const mockEntry: TripEntry = {
        id,
        title: 'Amazing Day in Paris',
        content: 'Today was incredible! We visited the **Eiffel Tower** and had the most amazing croissants at a local café.\n\n🥐 **Breakfast**: Started with fresh croissants and coffee\n🗼 **Sightseeing**: Climbed the Eiffel Tower\n🍽️ **Lunch**: Traditional French bistro\n\nThe weather was perfect and everyone was so friendly!',
        date: new Date(),
        location: {
          id: 'paris',
          name: 'Paris, France',
          address: 'Paris, Île-de-France, France',
          coordinates: { latitude: 48.8566, longitude: 2.3522 },
          type: 'search',
          country: 'France',
        },
        weather: {
          condition: 'sunny',
          temperature: 22,
          temperatureUnit: 'C',
          description: 'Sunny',
          icon: 'sunny',
          humidity: 55,
          windSpeed: 10,
          windUnit: 'km/h',
          feelsLike: 24,
        },
        tags: [
          { id: 'sightseeing', label: 'Sightseeing', category: 'activities' },
          { id: 'food-tour', label: 'Food Tour', category: 'food' },
          { id: 'amazing', label: 'Amazing', category: 'mood' },
        ],
        media: [],
        mood: 'amazing',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setTitle(mockEntry.title);
      setContent(mockEntry.content);
      setDate(mockEntry.date);
      setLocation(mockEntry.location);
      setWeather(mockEntry.weather);
      setTags(mockEntry.tags);
      setMedia(mockEntry.media);
      setMood(mockEntry.mood || '');
      setIsPublic(mockEntry.isPublic);

      lastSavedRef.current = JSON.stringify(mockEntry);
    } catch (error) {
      Alert.alert('Error', 'Failed to load entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!title && !content) return;

    try {
      // Mock auto-save - in real app, this would save to local storage or API
      const entryData = {
        title,
        content,
        date,
        location,
        weather,
        tags,
        media,
        mood,
        isPublic,
      };

      lastSavedRef.current = JSON.stringify(entryData);
      setHasUnsavedChanges(false);
      
      console.log('Auto-saved entry:', entryData);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please add a title for your entry.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please add some content to your entry.');
      return;
    }

    setIsSaving(true);
    try {
      const entry: TripEntry = {
        id: entryId || Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        date,
        location,
        weather,
        tags,
        media,
        mood,
        isPublic,
        createdAt: entryId ? new Date() : new Date(),
        updatedAt: new Date(),
      };

      // Mock save - in real app, this would save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave?.(entry);
      setHasUnsavedChanges(false);
      
      Alert.alert(
        'Success',
        entryId ? 'Entry updated successfully!' : 'Entry created successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => onCancel?.(),
          },
        ]
      );
    } else {
      onCancel?.();
    }
  };

  const handleMediaSelect = (selectedMedia: MediaItem[]) => {
    setMedia([...media, ...selectedMedia]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveMedia = (mediaId: string) => {
    setMedia(media.filter(item => item.id !== mediaId));
    setHasUnsavedChanges(true);
  };

  const handleLocationSelect = (selectedLocation: LocationData) => {
    setLocation(selectedLocation);
    setHasUnsavedChanges(true);
  };

  const handleWeatherSelect = (selectedWeather: WeatherData) => {
    setWeather(selectedWeather);
    setHasUnsavedChanges(true);
  };

  const handleTagsChange = (newTags: Tag[]) => {
    setTags(newTags);
    setHasUnsavedChanges(true);
  };

  const getEntryStats = () => {
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const charCount = content.length;
    const readingTime = Math.ceil(wordCount / 200); // Assume 200 words per minute

    return { wordCount, charCount, readingTime };
  };

  const renderMetadataSection = () => (
    <Card style={styles.metadataCard}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Entry Details
      </Text>
      
      <View style={styles.metadataGrid}>
        <View style={styles.metadataItem}>
          <Text style={[styles.metadataLabel, { color: colors.text.secondary }]}>
            Date & Time
          </Text>
          <SimpleDateTimePicker
            value={date}
            onDateChange={setDate}
            mode="datetime"
            showIcon={true}
          />
        </View>

        <View style={styles.metadataItem}>
          <Text style={[styles.metadataLabel, { color: colors.text.secondary }]}>
            Location
          </Text>
          <TouchableOpacity
            style={[
              styles.metadataButton,
              { backgroundColor: colors.surface.secondary, borderColor: colors.border.primary }
            ]}
            onPress={() => setShowLocationPicker(true)}
          >
            <Icon
              name="map-pin"
              size="sm"
              color={location ? colors.primary[500] : colors.text.tertiary}
            />
            <Text
              style={[
                styles.metadataButtonText,
                { color: location ? colors.text.primary : colors.text.tertiary }
              ]}
              numberOfLines={1}
            >
              {location ? location.name : 'Add location'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metadataItem}>
          <Text style={[styles.metadataLabel, { color: colors.text.secondary }]}>
            Weather
          </Text>
          <WeatherDisplay
            weather={weather}
            onWeatherSelect={handleWeatherSelect}
            compact={true}
            editable={true}
          />
        </View>
      </View>
    </Card>
  );

  const renderMediaSection = () => (
    <Card style={styles.mediaCard}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Photos & Videos
        </Text>
        <Button
          title="Add Media"
          variant="ghost"
          size="small"
          onPress={() => setShowMediaPicker(true)}
          leftIcon={<Icon name="camera" size="sm" color={colors.primary[500]} />}
        />
      </View>

      {media.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
          {media.map((item, index) => (
            <View key={item.id} style={styles.mediaItem}>
              <TouchableOpacity
                style={styles.removeMedia}
                onPress={() => handleRemoveMedia(item.id)}
              >
                <Icon name="close" size="xs" color={colors.text.inverse} />
              </TouchableOpacity>
              {/* Media preview would go here */}
              <View
                style={[
                  styles.mediaPlaceholder,
                  { backgroundColor: colors.surface.tertiary }
                ]}
              >
                <Icon
                  name={item.type === 'video' ? 'play' : 'image'}
                  size="lg"
                  color={colors.text.tertiary}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity
          style={[
            styles.emptyMedia,
            { backgroundColor: colors.surface.secondary, borderColor: colors.border.primary }
          ]}
          onPress={() => setShowMediaPicker(true)}
        >
          <Icon name="camera" size="xl" color={colors.text.tertiary} />
          <Text style={[styles.emptyMediaText, { color: colors.text.secondary }]}>
            Tap to add photos or videos
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  const renderTagsSection = () => (
    <Card style={styles.tagsCard}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Tags
      </Text>
      <TagsInput
        tags={tags}
        onTagsChange={handleTagsChange}
        maxTags={8}
        placeholder="Add tags..."
        showSuggestions={true}
        showCategories={true}
        editable={true}
        compact={false}
      />
    </Card>
  );

  const renderStats = () => {
    const stats = getEntryStats();
    
    return (
      <View style={styles.statsContainer}>
        <Badge
          label={`${stats.wordCount} words`}
          variant="outlined"
          size="small"
        />
        <Badge
          label={`${stats.readingTime} min read`}
          variant="outlined"
          size="small"
        />
        {hasUnsavedChanges && (
          <Badge
            label="Unsaved changes"
            variant="warning"
            size="small"
          />
        )}
      </View>
    );
  };

  const renderFooter = () => (
    <View style={[styles.footer, { borderTopColor: colors.border.primary }]}>
      {renderStats()}
      
      <View style={styles.footerActions}>
        <Button
          title="Preview"
          variant="secondary"
          size="small"
          onPress={() => setPreviewMode(!previewMode)}
          leftIcon={<Icon name="eye" size="sm" color={colors.text.secondary} />}
        />
        
        <View style={styles.footerMainActions}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={handleCancel}
          />
          <Button
            title={entryId ? 'Update' : 'Save'}
            onPress={handleSave}
            loading={isSaving}
            disabled={!title.trim() || !content.trim()}
          />
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaWrapper variant="full">
        <LoadingSpinner variant="fullscreen" message="Loading entry..." />
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper variant="full">
      <Header
        title={entryId ? 'Edit Entry' : 'New Entry'}
        showBackButton={true}
        onBackPress={handleCancel}
        actions={[
          {
            icon: 'more-vertical',
            onPress: () => console.log('More options'),
          },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <Card style={styles.titleCard}>
            <RichTextEditor
              value={title}
              onChangeText={setTitle}
              placeholder="Entry title..."
              maxLength={100}
              minHeight={60}
              showToolbar={false}
              showWordCount={false}
              autoFocus={!entryId}
            />
          </Card>

          {/* Metadata Section */}
          {renderMetadataSection()}

          {/* Content Editor */}
          <Card style={styles.contentCard}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Your Story
            </Text>
            <RichTextEditor
              value={content}
              onChangeText={setContent}
              placeholder="What happened on this day? Share your story..."
              maxLength={10000}
              minHeight={300}
              showToolbar={true}
              showWordCount={true}
            />
          </Card>

          {/* Media Section */}
          {renderMediaSection()}

          {/* Tags Section */}
          {renderTagsSection()}
        </ScrollView>

        {/* Footer */}
        {renderFooter()}
      </KeyboardAvoidingView>

      {/* Modals */}
      <MediaPicker
        visible={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onMediaSelect={handleMediaSelect}
        maxSelection={10}
        includeVideos={true}
        allowsEditing={true}
      />

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={location}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  titleCard: {
    marginBottom: SPACING.md,
  },
  contentCard: {
    marginBottom: SPACING.md,
  },
  metadataCard: {
    marginBottom: SPACING.md,
  },
  mediaCard: {
    marginBottom: SPACING.md,
  },
  tagsCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metadataGrid: {
    gap: SPACING.md,
  },
  metadataItem: {
    // No additional styles needed
  },
  metadataLabel: {
    ...TYPOGRAPHY.styles.bodySmall,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  metadataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    minHeight: 48,
  },
  metadataButtonText: {
    ...TYPOGRAPHY.styles.body,
    flex: 1,
  },
  mediaScroll: {
    marginHorizontal: -SPACING.sm,
  },
  mediaItem: {
    position: 'relative',
    marginHorizontal: SPACING.sm,
  },
  mediaPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMedia: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  emptyMedia: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  emptyMediaText: {
    ...TYPOGRAPHY.styles.body,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerMainActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
}); 
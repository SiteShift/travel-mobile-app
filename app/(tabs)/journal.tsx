import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaWrapper } from '../../src/components/SafeAreaWrapper';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { router } from 'expo-router';

// Mock journal entries for demonstration
const mockEntries = [
  {
    id: '1',
    title: 'First Day in Paris',
    date: '2024-01-10',
    location: 'Paris, France',
    preview: 'What an incredible first day exploring the City of Light! Started early at the Eiffel Tower...',
    images: 3,
    mood: '😍',
  },
  {
    id: '2',
    title: 'Tokyo Sushi Experience',
    date: '2024-01-08',
    location: 'Tokyo, Japan',
    preview: 'Had the most amazing sushi experience at a traditional restaurant in Shibuya...',
    images: 5,
    mood: '🤤',
  },
  {
    id: '3',
    title: 'Bali Beach Sunset',
    date: '2024-01-05',
    location: 'Bali, Indonesia',
    preview: 'The sunsets here are absolutely breathtaking. Spent the evening on the beach...',
    images: 8,
    mood: '🌅',
  },
];

export default function JournalTab() {
  const { colors } = useTheme();

  const handleCreateEntry = () => {
    // Navigate to Entry Editor
    router.push('/entry-editor');
  };

  const handleViewEntry = (entryId: string) => {
    console.log('View entry:', entryId);
    // Would navigate to entry detail view
  };

  const renderEntryCard = ({ item }: { item: typeof mockEntries[0] }) => (
    <Card 
      variant="elevated" 
      style={styles.entryCard}
      onPress={() => handleViewEntry(item.id)}
    >
      <View style={styles.entryHeader}>
        <View style={styles.entryTitleSection}>
          <Text style={[styles.entryTitle, { color: colors.text.primary }]}>
            {item.title}
          </Text>
          <Text style={[styles.entryDate, { color: colors.text.secondary }]}>
            {item.date} • {item.location}
          </Text>
        </View>
        <Text style={styles.entryMood}>{item.mood}</Text>
      </View>
      
      <Text style={[styles.entryPreview, { color: colors.text.secondary }]}>
        {item.preview}
      </Text>
      
      <View style={styles.entryFooter}>
        <View style={styles.entryStats}>
          <Icon name="image" size="sm" color={colors.text.tertiary} />
          <Text style={[styles.entryStatsText, { color: colors.text.tertiary }]}>
            {item.images} photos
          </Text>
        </View>
        <Icon name="chevron-right" size="sm" color={colors.text.tertiary} />
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="book" size="xxl" color={colors.text.tertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        Start Your Travel Journal
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
        Document your adventures with rich journal entries, photos, and memories
      </Text>
      
      <Button
        title="Create Your First Entry"
        variant="primary"
        onPress={handleCreateEntry}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <SafeAreaWrapper variant="full">
      <Header 
        title="Journal" 
        rightActions={[
          {
            icon: 'add',
            onPress: handleCreateEntry,
            badge: false,
          },
        ]}
      />
      
      <View style={styles.container}>
        {mockEntries.length > 0 ? (
          <FlatList
            data={mockEntries}
            renderItem={renderEntryCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  listContainer: {
    paddingVertical: SPACING.md,
  },
  entryCard: {
    marginBottom: SPACING.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  entryTitleSection: {
    flex: 1,
  },
  entryTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.xs,
  },
  entryDate: {
    ...TYPOGRAPHY.styles.caption,
  },
  entryMood: {
    fontSize: 24,
    marginLeft: SPACING.sm,
  },
  entryPreview: {
    ...TYPOGRAPHY.styles.body,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryStatsText: {
    ...TYPOGRAPHY.styles.caption,
    marginLeft: SPACING.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.styles.h2,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  emptyButton: {
    minWidth: 200,
  },
}); 
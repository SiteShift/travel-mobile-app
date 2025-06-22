import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from './Card';
import { Icon } from './Icon';
import { Button } from './Button';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TimelineDate {
  date: string; // YYYY-MM-DD format
  entryCount: number;
  hasPhotos: boolean;
  mood?: 'happy' | 'excited' | 'peaceful' | 'adventurous' | 'tired';
}

export interface TimelineNavigationProps {
  dates: TimelineDate[];
  currentDate?: string;
  onDateSelect: (date: string) => void;
  tripStartDate: string;
  tripEndDate: string;
  showMonthView?: boolean;
  compactMode?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const TimelineNavigation: React.FC<TimelineNavigationProps> = ({
  dates,
  currentDate,
  onDateSelect,
  tripStartDate,
  tripEndDate,
  showMonthView = false,
  compactMode = false,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    if (currentDate) {
      const month = currentDate.substring(0, 7); // YYYY-MM
      setSelectedMonth(month);
    }
  }, [currentDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatWeekday = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
    });
  };

  const getDayNumber = (dateString: string, startDate: string) => {
    const start = new Date(startDate);
    const current = new Date(dateString);
    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'happy': return colors.warning[500];
      case 'excited': return colors.error[500];
      case 'peaceful': return colors.success[500];
      case 'adventurous': return colors.primary[500];
      case 'tired': return colors.info[500];
      default: return colors.primary[300];
    }
  };

  const groupDatesByMonth = () => {
    const grouped: { [month: string]: TimelineDate[] } = {};
    
    dates.forEach(dateEntry => {
      const month = dateEntry.date.substring(0, 7); // YYYY-MM
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(dateEntry);
    });

    return grouped;
  };

  const renderDateButton = (dateEntry: TimelineDate) => {
    const isSelected = currentDate === dateEntry.date;
    const dayNumber = getDayNumber(dateEntry.date, tripStartDate);
    
    return (
      <TouchableOpacity
        key={dateEntry.date}
        style={[
          styles.dateButton,
          compactMode && styles.dateButtonCompact,
          isSelected && [
            styles.dateButtonSelected,
            { backgroundColor: colors.primary[100] }
          ],
          { borderColor: colors.border.primary }
        ]}
        onPress={() => onDateSelect(dateEntry.date)}
        activeOpacity={0.7}
      >
        <View style={styles.dateButtonContent}>
          <Text style={[
            styles.dateButtonDay,
            { color: isSelected ? colors.primary[500] : colors.text.primary }
          ]}>
            Day {dayNumber}
          </Text>
          <Text style={[
            styles.dateButtonDate,
            { color: isSelected ? colors.primary[500] : colors.text.secondary }
          ]}>
            {formatDate(dateEntry.date)}
          </Text>
          {!compactMode && (
            <Text style={[
              styles.dateButtonWeekday,
              { color: isSelected ? colors.primary[400] : colors.text.tertiary }
            ]}>
              {formatWeekday(dateEntry.date)}
            </Text>
          )}
        </View>

        {/* Entry indicators */}
        <View style={styles.dateIndicators}>
          {dateEntry.entryCount > 0 && (
            <View style={[
              styles.entryIndicator,
              { backgroundColor: getMoodColor(dateEntry.mood) }
            ]}>
              <Text style={[styles.entryIndicatorText, { color: 'white' }]}>
                {dateEntry.entryCount}
              </Text>
            </View>
          )}
          {dateEntry.hasPhotos && (
            <View style={[styles.photoIndicator, { backgroundColor: colors.warning[500] }]}>
              <Icon name="camera" size="xs" color="white" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHorizontalNavigation = () => (
    <View style={[styles.horizontalContainer, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalContent}
        style={styles.horizontalScroll}
      >
        {dates.map(renderDateButton)}
      </ScrollView>
      
      <TouchableOpacity
        style={[styles.calendarButton, { backgroundColor: colors.surface.secondary }]}
        onPress={() => setShowCalendar(true)}
      >
        <Icon name="calendar" size="sm" color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );

  const renderExpandedNavigation = () => (
    <View style={[styles.expandedContainer, style]}>
      <View style={[styles.expandedHeader, { borderBottomColor: colors.border.primary }]}>
        <Text style={[styles.expandedTitle, { color: colors.text.primary }]}>
          Timeline Navigation
        </Text>
        <TouchableOpacity
          onPress={() => setIsExpanded(false)}
          style={styles.collapseButton}
        >
          <Icon name="chevron-up" size="md" color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.expandedContent}>
        <View style={styles.datesGrid}>
          {dates.map(renderDateButton)}
        </View>
      </ScrollView>
    </View>
  );

  const renderCalendarModal = () => {
    const groupedDates = groupDatesByMonth();
    const months = Object.keys(groupedDates).sort();

    return (
      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={[styles.calendarModal, { backgroundColor: colors.surface.primary }]}>
          <View style={[styles.calendarHeader, { borderBottomColor: colors.border.primary }]}>
            <Text style={[styles.calendarTitle, { color: colors.text.primary }]}>
              Trip Calendar
            </Text>
            <TouchableOpacity
              onPress={() => setShowCalendar(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size="md" color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.calendarContent}>
            {months.map(month => (
              <View key={month} style={styles.monthSection}>
                <Text style={[styles.monthTitle, { color: colors.text.primary }]}>
                  {formatMonthYear(month + '-01')}
                </Text>
                <View style={styles.monthDates}>
                  {groupedDates[month].map(renderDateButton)}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.calendarFooter, { borderTopColor: colors.border.primary }]}>
            <Button
              title="Close"
              variant="secondary"
              onPress={() => setShowCalendar(false)}
              style={styles.closeCalendarButton}
            />
          </View>
        </View>
      </Modal>
    );
  };

  if (compactMode) {
    return (
      <View style={[styles.compactContainer, style]} testID={testID}>
        <TouchableOpacity
          style={[styles.compactButton, { backgroundColor: colors.surface.secondary }]}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Icon name="calendar" size="sm" color={colors.text.secondary} />
          <Text style={[styles.compactButtonText, { color: colors.text.secondary }]}>
            {currentDate ? formatDate(currentDate) : 'Jump to date'}
          </Text>
          <Icon 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size="sm" 
            color={colors.text.secondary} 
          />
        </TouchableOpacity>

        {isExpanded && renderExpandedNavigation()}
        {renderCalendarModal()}
      </View>
    );
  }

  return (
    <View testID={testID}>
      {isExpanded ? renderExpandedNavigation() : renderHorizontalNavigation()}
      {renderCalendarModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Horizontal Navigation
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  horizontalScroll: {
    flex: 1,
  },
  horizontalContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },

  // Date Buttons
  dateButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    minWidth: 80,
    alignItems: 'center',
    position: 'relative',
  },
  dateButtonCompact: {
    minWidth: 70,
    padding: SPACING.xs,
  },
  dateButtonSelected: {
    borderWidth: 2,
  },
  dateButtonContent: {
    alignItems: 'center',
  },
  dateButtonDay: {
    ...TYPOGRAPHY.styles.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  dateButtonDate: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '500',
  },
  dateButtonWeekday: {
    ...TYPOGRAPHY.styles.caption,
    fontSize: 10,
  },

  // Date Indicators
  dateIndicators: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    flexDirection: 'row',
    gap: 2,
  },
  entryIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
  },
  photoIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Expanded Navigation
  expandedContainer: {
    maxHeight: 300,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  expandedTitle: {
    ...TYPOGRAPHY.styles.h4,
  },
  collapseButton: {
    padding: SPACING.xs,
  },
  expandedContent: {
    maxHeight: 240,
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  // Compact Mode
  compactContainer: {
    // No specific styles needed
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
  },
  compactButtonText: {
    ...TYPOGRAPHY.styles.body,
    flex: 1,
  },

  // Calendar Modal
  calendarModal: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  calendarTitle: {
    ...TYPOGRAPHY.styles.h3,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  calendarContent: {
    flex: 1,
    padding: SPACING.md,
  },
  monthSection: {
    marginBottom: SPACING.lg,
  },
  monthTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.md,
  },
  monthDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  calendarFooter: {
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  closeCalendarButton: {
    width: '100%',
  },
}); 
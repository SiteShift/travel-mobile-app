import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SearchBar } from '../components/SearchBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Icon } from '../components/Icon';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants/theme';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  entryCount: number;
  photoCount: number;
  distance?: string;
  status: 'upcoming' | 'active' | 'completed';
}

interface TripsScreenProps {
  // Navigation props would be typed here
}

// Mock data for trips
const mockTrips: Trip[] = [
  {
    id: '1',
    title: 'European Adventure',
    destination: 'Paris, Rome, Barcelona',
    startDate: '2024-06-01',
    endDate: '2024-06-15',
    entryCount: 12,
    photoCount: 89,
    distance: '2,847 km',
    status: 'completed',
  },
  {
    id: '2',
    title: 'Tokyo Discovery',
    destination: 'Tokyo, Japan',
    startDate: '2024-08-10',
    endDate: '2024-08-20',
    entryCount: 8,
    photoCount: 156,
    distance: '45 km',
    status: 'active',
  },
  {
    id: '3',
    title: 'California Road Trip',
    destination: 'San Francisco to Los Angeles',
    startDate: '2024-09-15',
    endDate: '2024-09-25',
    entryCount: 0,
    photoCount: 0,
    status: 'upcoming',
  },
  {
    id: '4',
    title: 'Iceland Adventure',
    destination: 'Reykjavik, Ring Road',
    startDate: '2024-03-20',
    endDate: '2024-03-30',
    entryCount: 15,
    photoCount: 203,
    distance: '1,332 km',
    status: 'completed',
  },
];

export default function TripsScreen({}: TripsScreenProps) {
  const { colors } = useTheme();
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>(mockTrips);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredTrips(trips);
    } else {
      const filtered = trips.filter(
        trip =>
          trip.title.toLowerCase().includes(query.toLowerCase()) ||
          trip.destination.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTrips(filtered);
    }
  };

  const handleFilter = (newFilter: typeof filter) => {
    setFilter(newFilter);
    let filtered = trips;
    
    if (newFilter !== 'all') {
      filtered = trips.filter(trip => trip.status === newFilter);
    }
    
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        trip =>
          trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredTrips(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleTripPress = (trip: Trip) => {
    router.push(`/trip/${trip.id}`);
  };

  const handleCreateTrip = () => {
    console.log('Navigate to create trip');
    // Navigation would be handled here
  };

  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'active':
        return colors.success[500];
      case 'completed':
        return colors.text.secondary;
      case 'upcoming':
        return colors.primary[500];
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (status: Trip['status']) => {
    switch (status) {
      case 'active':
        return 'play-circle';
      case 'completed':
        return 'check-circle';
      case 'upcoming':
        return 'clock';
      default:
        return 'circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderTripCard = ({ item: trip }: { item: Trip }) => (
    <Card
      variant="elevated"
      size="medium"
      style={styles.tripCard}
      onPress={() => handleTripPress(trip)}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={[styles.tripTitle, { color: colors.text.primary }]}>
            {trip.title}
          </Text>
          <Text style={[styles.tripDestination, { color: colors.text.secondary }]}>
            {trip.destination}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Icon
            name={getStatusIcon(trip.status)}
            size="sm"
            color={getStatusColor(trip.status)}
          />
        </View>
      </View>

      <View style={styles.tripDates}>
        <Text style={[styles.dateText, { color: colors.text.secondary }]}>
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
        </Text>
      </View>

      <View style={styles.tripStats}>
        <View style={styles.statItem}>
          <Icon name="book" size="xs" color={colors.text.secondary} />
          <Text style={[styles.statText, { color: colors.text.secondary }]}>
            {trip.entryCount} entries
          </Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="camera" size="xs" color={colors.text.secondary} />
          <Text style={[styles.statText, { color: colors.text.secondary }]}>
            {trip.photoCount} photos
          </Text>
        </View>
        {trip.distance && (
          <View style={styles.statItem}>
            <Icon name="map" size="xs" color={colors.text.secondary} />
            <Text style={[styles.statText, { color: colors.text.secondary }]}>
              {trip.distance}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {(['all', 'active', 'completed', 'upcoming'] as const).map((filterOption) => (
        <Button
          key={filterOption}
          title={filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          variant={filter === filterOption ? 'primary' : 'ghost'}
          size="small"
          onPress={() => handleFilter(filterOption)}
          style={styles.filterButton}
        />
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="map-outline" size="xxl" color={colors.text.tertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        No trips found
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
        {searchQuery ? 'Try adjusting your search' : 'Start planning your first adventure!'}
      </Text>
      {!searchQuery && (
        <Button
          title="Create Your First Trip"
          variant="primary"
          onPress={handleCreateTrip}
          style={styles.createButton}
        />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaWrapper variant="full">
        <LoadingSpinner variant="overlay" message="Loading trips..." />
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper variant="full">
      <Header
        title="My Trips"
        rightActions={[
          {
            icon: 'add',
            onPress: handleCreateTrip,
            badge: false,
          },
        ]}
      />

      <View style={styles.content}>
        <SearchBar
          placeholder="Search trips..."
          value={searchQuery}
          onChangeText={handleSearch}
          variant="elevated"
          size="medium"
        />

        {renderFilterButtons()}

        <FlatList
          data={filteredTrips}
          renderItem={renderTripCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  listContainer: {
    paddingBottom: SPACING.xl,
  },
  tripCard: {
    marginBottom: SPACING.md,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    ...TYPOGRAPHY.styles.h3,
    marginBottom: SPACING.xs,
  },
  tripDestination: {
    ...TYPOGRAPHY.styles.body,
    marginBottom: SPACING.xs,
  },
  statusContainer: {
    marginLeft: SPACING.sm,
  },
  tripDates: {
    marginBottom: SPACING.sm,
  },
  dateText: {
    ...TYPOGRAPHY.styles.caption,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    ...TYPOGRAPHY.styles.caption,
    marginLeft: SPACING.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    marginVertical: SPACING.md,
    gap: SPACING.xs,
  },
  filterButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
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
  },
  createButton: {
    minWidth: 200,
  },
}); 
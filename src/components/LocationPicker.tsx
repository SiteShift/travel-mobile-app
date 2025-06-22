import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { SearchBar } from './SearchBar';
import { BottomSheet } from './BottomSheet';
import { LoadingSpinner } from './LoadingSpinner';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface LocationData {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type?: 'current' | 'search' | 'favorite' | 'recent';
  country?: string;
  region?: string;
}

export interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  currentLocation?: LocationData;
  recentLocations?: LocationData[];
  favoriteLocations?: LocationData[];
  placeholder?: string;
  showCurrentLocation?: boolean;
  showRecentLocations?: boolean;
  showFavorites?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onLocationSelect,
  currentLocation,
  recentLocations = [],
  favoriteLocations = [],
  placeholder = 'Search for a location...',
  showCurrentLocation = true,
  showRecentLocations = true,
  showFavorites = true,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(currentLocation || null);

  // Mock search results - in real app, this would use a geocoding service
  const mockSearchResults: LocationData[] = [
    {
      id: '1',
      name: 'Eiffel Tower',
      address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
      coordinates: { latitude: 48.8584, longitude: 2.2945 },
      type: 'search',
      country: 'France',
      region: 'Île-de-France',
    },
    {
      id: '2',
      name: 'Times Square',
      address: 'Times Square, New York, NY 10036, USA',
      coordinates: { latitude: 40.7580, longitude: -73.9855 },
      type: 'search',
      country: 'United States',
      region: 'New York',
    },
    {
      id: '3',
      name: 'Sydney Opera House',
      address: 'Bennelong Point, Sydney NSW 2000, Australia',
      coordinates: { latitude: -33.8568, longitude: 151.2153 },
      type: 'search',
      country: 'Australia',
      region: 'New South Wales',
    },
  ];

  const mockRecentLocations: LocationData[] = [
    {
      id: 'recent1',
      name: 'Central Park',
      address: 'New York, NY, USA',
      coordinates: { latitude: 40.7829, longitude: -73.9654 },
      type: 'recent',
      country: 'United States',
    },
    {
      id: 'recent2',
      name: 'Golden Gate Bridge',
      address: 'San Francisco, CA, USA',
      coordinates: { latitude: 37.8199, longitude: -122.4783 },
      type: 'recent',
      country: 'United States',
    },
  ];

  const mockFavoriteLocations: LocationData[] = [
    {
      id: 'fav1',
      name: 'Home',
      address: '123 Main St, Your City',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      type: 'favorite',
    },
    {
      id: 'fav2',
      name: 'Office',
      address: '456 Work Ave, Business District',
      coordinates: { latitude: 40.7589, longitude: -73.9851 },
      type: 'favorite',
    },
  ];

  useEffect(() => {
    if (searchQuery.length > 2) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to get your current location.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setIsGettingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocoding would happen here in a real app
      const currentLoc: LocationData = {
        id: 'current',
        name: 'Current Location',
        address: `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`,
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        type: 'current',
      };

      setUserLocation(currentLoc);
      onLocationSelect(currentLoc);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const filtered = mockSearchResults.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.address.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearching(false);
    }, 500);
  };

  const handleLocationSelect = (location: LocationData) => {
    onLocationSelect(location);
    onClose();
  };

  const renderLocationItem = (location: LocationData) => {
    const getLocationIcon = () => {
      switch (location.type) {
        case 'current':
          return 'my-location';
        case 'favorite':
          return 'heart';
        case 'recent':
          return 'time';
        default:
          return 'map-pin';
      }
    };

    const getLocationIconColor = () => {
      switch (location.type) {
        case 'current':
          return colors.primary[500];
        case 'favorite':
          return colors.error[500];
        case 'recent':
          return colors.warning[500];
        default:
          return colors.text.secondary;
      }
    };

    return (
      <TouchableOpacity
        key={location.id}
        style={[
          styles.locationItem,
          { borderBottomColor: colors.border.primary }
        ]}
        onPress={() => handleLocationSelect(location)}
        activeOpacity={0.7}
      >
        <Icon
          name={getLocationIcon()}
          size="md"
          color={getLocationIconColor()}
          style={styles.locationIcon}
        />
        
        <View style={styles.locationInfo}>
          <Text style={[styles.locationName, { color: colors.text.primary }]} numberOfLines={1}>
            {location.name}
          </Text>
          <Text style={[styles.locationAddress, { color: colors.text.secondary }]} numberOfLines={2}>
            {location.address}
          </Text>
          {location.country && (
            <Text style={[styles.locationCountry, { color: colors.text.tertiary }]}>
              {location.country}
            </Text>
          )}
        </View>

        <Icon name="chevron-right" size="sm" color={colors.text.tertiary} />
      </TouchableOpacity>
    );
  };

  const renderCurrentLocationButton = () => {
    if (!showCurrentLocation) return null;

    return (
      <TouchableOpacity
        style={[
          styles.currentLocationButton,
          { backgroundColor: colors.primary[500] }
        ]}
        onPress={getCurrentLocation}
        disabled={isGettingLocation}
      >
        {isGettingLocation ? (
          <LoadingSpinner variant="inline" size="small" />
        ) : (
          <Icon name="my-location" size="md" color={colors.text.inverse} />
        )}
        <Text style={[styles.currentLocationText, { color: colors.text.inverse }]}>
          {isGettingLocation ? 'Getting location...' : 'Use current location'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, locations: LocationData[]) => {
    if (locations.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {title}
        </Text>
        {locations.map(renderLocationItem)}
      </View>
    );
  };

  const renderContent = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner variant="inline" message="Searching locations..." />
        </View>
      );
    }

    if (searchQuery && searchResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="map-pin" size="xxl" color={colors.text.tertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No locations found
          </Text>
          <Text style={[styles.emptyMessage, { color: colors.text.secondary }]}>
            Try a different search term or check your spelling.
          </Text>
        </View>
      );
    }

    if (searchQuery) {
      return renderSection('Search Results', searchResults);
    }

    return (
      <FlatList
        data={[]}
        keyExtractor={() => 'empty'}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <>
            {renderCurrentLocationButton()}
            {renderSection('Favorites', showFavorites ? mockFavoriteLocations : [])}
            {renderSection('Recent', showRecentLocations ? mockRecentLocations : [])}
          </>
        )}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      size="large"
      title="Select Location"
    >
      <View style={styles.container}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={placeholder}
          showSuggestions={false}
          loading={isSearching}
          style={styles.searchBar}
        />
        
        {renderContent()}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 600,
  },
  searchBar: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  content: {
    flex: 1,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  currentLocationText: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  locationIcon: {
    marginRight: SPACING.md,
  },
  locationInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  locationName: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationAddress: {
    ...TYPOGRAPHY.styles.bodySmall,
    lineHeight: 18,
  },
  locationCountry: {
    ...TYPOGRAPHY.styles.caption,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.styles.h3,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
    lineHeight: 22,
  },
}); 
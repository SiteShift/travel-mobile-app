import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Text,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { Header } from '../components/Header';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../constants/theme';

interface MapScreenProps {
  // Navigation props would be typed here
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function MapScreen({}: MapScreenProps) {
  const { colors, isDark } = useTheme();
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Request location permissions and get current location
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setHasLocationPermission(true);
        getCurrentLocation();
      } else {
        setHasLocationPermission(false);
        setIsLoading(false);
        // Default to San Francisco for demo
        setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to see your current position on the map.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Get location error:', error);
      // Default to San Francisco if location fails
      setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
      setIsLoading(false);
    }
  };

  const handleAddEntry = () => {
    Alert.alert(
      'Add Travel Entry',
      'Create a new journal entry at this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Entry', onPress: () => console.log('Navigate to entry creation') },
      ]
    );
  };

  const handleMapPress = (event: any) => {
    console.log('Map pressed:', event.nativeEvent.coordinate);
    // Handle map tap - could show location details or create entry
  };

  const handleMapLongPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    Alert.alert(
      'Add Entry Here?',
      `Create a travel entry at this location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Entry', 
          onPress: () => {
            console.log('Create entry at:', coordinate);
            // Navigate to entry creation with coordinates
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper variant="full">
        <LoadingSpinner 
          variant="overlay" 
          message="Loading map..." 
        />
      </SafeAreaWrapper>
    );
  }

  // Sample travel entry locations
  const travelEntries = [
    {
      id: 'paris',
      coordinate: { latitude: 48.8566, longitude: 2.3522 },
      title: 'Paris Adventure',
      description: 'Amazing day at the Eiffel Tower',
    },
    {
      id: 'tokyo',
      coordinate: { latitude: 35.6762, longitude: 139.6503 },
      title: 'Tokyo Exploration',
      description: 'Incredible sushi and culture',
    },
    {
      id: 'bali',
      coordinate: { latitude: -8.3405, longitude: 115.0920 },
      title: 'Bali Paradise',
      description: 'Beautiful beaches and temples',
    },
  ];

  return (
    <SafeAreaWrapper variant="full">
      <Header
        title="Travel Map"
        variant="transparent"
        rightActions={[
          {
            icon: 'search',
            onPress: () => console.log('Search locations'),
            badge: false,
          },
          {
            icon: 'filter',
            onPress: () => console.log('Filter entries'),
            badge: false,
          },
        ]}
      />
      
      <View style={styles.mapContainer}>
        {userLocation ? (
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleMapPress}
            onLongPress={handleMapLongPress}
            showsUserLocation={hasLocationPermission}
            showsMyLocationButton={hasLocationPermission}
            showsCompass={true}
            showsScale={true}
            mapType={isDark ? 'hybrid' : 'standard'}
          >
            {/* User location marker */}
            {hasLocationPermission && userLocation && (
              <Marker
                coordinate={userLocation}
                title="Your Location"
                description="You are here"
              >
                <View style={[styles.userLocationMarker, { backgroundColor: colors.primary[500] }]}>
                  <View style={styles.userLocationInner} />
                </View>
              </Marker>
            )}
            
            {/* Travel entry markers */}
            {travelEntries.map((entry) => (
              <Marker
                key={entry.id}
                coordinate={entry.coordinate}
                title={entry.title}
                description={entry.description}
                onPress={() => {
                  Alert.alert(
                    entry.title,
                    entry.description,
                    [
                      { text: 'Close', style: 'cancel' },
                      { text: 'View Details', onPress: () => console.log('View entry:', entry.id) },
                    ]
                  );
                }}
              >
                <View style={[styles.entryMarker, { backgroundColor: colors.secondary[500] }]}>
                  <Text style={styles.entryMarkerText}>📍</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={[styles.errorContainer, { backgroundColor: colors.surface.secondary }]}>
            <Text style={[styles.errorText, { color: colors.text.primary }]}>
              Unable to load map
            </Text>
            <Text style={[styles.errorSubtext, { color: colors.text.secondary }]}>
              Please check your internet connection and location permissions
            </Text>
          </View>
        )}
      </View>
      
      {/* Floating Action Button for adding entries */}
      <FloatingActionButton
        variant="primary"
        position="bottom-right"
        icon="add"
        onPress={handleAddEntry}
        size="large"
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  entryMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  entryMarkerText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 
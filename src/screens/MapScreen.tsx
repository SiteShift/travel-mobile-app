import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';

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
      <View style={styles.container}>
        <LoadingSpinner variant="overlay" message="Loading map..." />
      </View>
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
    <View style={styles.container}>
      {userLocation ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
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
          showsMyLocationButton={false} // Hiding default button for a cleaner look
          showsCompass={false}
          showsScale={false}
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

          {/* Render travel entry markers */}
          {travelEntries.map((entry) => (
            <Marker
              key={entry.id}
              coordinate={entry.coordinate}
              title={entry.title}
              description={entry.description}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.permissionDeniedContainer}>
          <Text style={[styles.permissionText, { color: colors.text.primary }]}>
            Enable location access to use the map.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // To avoid flashes of white
  },
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
}); 
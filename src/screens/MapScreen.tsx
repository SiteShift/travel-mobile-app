import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Alert, Platform, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, LatLng, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { useRouter } from 'expo-router';

interface MapScreenProps {
  // Navigation props would be typed here
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function MapScreen({}: MapScreenProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [tripMarkers, setTripMarkers] = useState<{ id: string; title: string; country: string; coordinate: LatLng }[]>([]);

  // Request location permissions and get current location
  useEffect(() => {
    requestLocationPermission();
    loadTripMarkers();
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

  // Fetch trips from storage, geocode their country to coordinates, cache, and set markers
  const loadTripMarkers = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tripKeys = keys.filter(k => k.startsWith('trip_') && !k.startsWith('trip_geo_'));
      if (tripKeys.length === 0) {
        setTripMarkers([]);
        return;
      }
      const pairs = await AsyncStorage.multiGet(tripKeys);
      const markers: { id: string; title: string; country: string; coordinate: LatLng }[] = [];
      for (const [key, value] of pairs) {
        if (!value) continue;
        try {
          const t = JSON.parse(value);
          const id = String(t?.id || '').trim();
          const title = String(t?.title || 'Trip');
          const country = String(t?.country || '').trim();
          if (!id || !country) continue;
          // Per-trip geo cache
          const cacheKey = `trip_geo_${id}`;
          let cached = await AsyncStorage.getItem(cacheKey);
          let coord: LatLng | null = null;
          if (cached) {
            try { const parsed = JSON.parse(cached); coord = parsed && parsed.lat && parsed.lng ? { latitude: parsed.lat, longitude: parsed.lng } : null; } catch { coord = null; }
          }
          if (!coord) {
            const results = await Location.geocodeAsync(country);
            if (Array.isArray(results) && results.length > 0) {
              coord = { latitude: results[0].latitude, longitude: results[0].longitude };
              await AsyncStorage.setItem(cacheKey, JSON.stringify({ lat: coord.latitude, lng: coord.longitude, country }));
            }
          }
          if (coord) {
            markers.push({ id, title, country, coordinate: coord });
          }
        } catch {}
      }
      setTripMarkers(markers);
      // Fit map to markers if we have some and map is ready
      if (markers.length > 0 && mapRef.current) {
        mapRef.current.fitToCoordinates(markers.map(m => m.coordinate), { edgePadding: { top: 80, left: 80, bottom: 120, right: 80 }, animated: true });
      }
    } catch (e) {
      console.error('MapScreen: failed to load trip markers', e);
      setTripMarkers([]);
    }
  }, []);

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

  // Remove placeholder markers; use real trips from storage

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
          mapType="standard"
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

          {/* Render trip markers from stored trips */}
          {tripMarkers.map((m) => (
            <Marker
              key={m.id}
              coordinate={m.coordinate}
            >
              <Callout tooltip onPress={() => router.push(`/trip/${m.id}`)}>
                <View style={styles.calloutWrapper}>
                  <View style={[styles.calloutBubble, { backgroundColor: '#FFFFFF' }]}>
                    <Text style={styles.calloutTitle} numberOfLines={2}>{m.title}</Text>
                    <View style={{ height: 8 }} />
                    <Text style={styles.calloutSubtitle}>{m.country}</Text>
                    <View style={{ height: 10 }} />
                    <View style={styles.calloutButtonRow}>
                      <Text style={{ flex: 1 }} />
                      <Text style={{ flex: 1 }} />
                      <View style={styles.calloutButton}>
                        <Text style={styles.calloutButtonText}>View Trip</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.calloutArrow} />
                </View>
              </Callout>
            </Marker>
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
  // Custom callout styles
  calloutWrapper: {
    alignItems: 'center',
  },
  calloutBubble: {
    width: 220,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  calloutButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutButton: {
    backgroundColor: '#f97316',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  calloutButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  calloutArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginTop: -1,
  },
}); 
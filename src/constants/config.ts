// App Configuration Constants

// Mapbox Configuration
// Note: In production, this should be loaded from environment variables or secure storage
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidHJhdmVsam91cm5hbCIsImEiOiJjbTQ5cGNiZWYwNnZpMmtxdGxzNjh1b3VsIn0.placeholder_token';

// Map Configuration
export const MAP_CONFIG = {
  defaultCenter: [-122.4194, 37.7749], // San Francisco
  defaultZoom: 12,
  maxZoom: 18,
  minZoom: 2,
  animationDuration: 1000,
};

// Location Configuration
export const LOCATION_CONFIG = {
  accuracy: 'balanced' as const,
  timeout: 10000,
  maximumAge: 60000,
  enableHighAccuracy: false,
};

// API Configuration
export const API_CONFIG = {
  baseUrl: 'https://api.traveljournal.app',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Storage Keys
export const STORAGE_KEYS = {
  theme: 'app_theme',
  userLocation: 'user_location',
  drafts: 'entry_drafts',
  offlineQueue: 'offline_queue',
  userPreferences: 'user_preferences',
  authToken: 'auth_token',
} as const;

// App Limits
export const APP_LIMITS = {
  maxPhotosPerEntry: 20,
  maxVideoLength: 300, // 5 minutes in seconds
  maxEntryLength: 10000, // characters
  maxTripDuration: 365, // days
  maxTripsPerUser: 100,
};

// Media Configuration
export const MEDIA_CONFIG = {
  imageQuality: 1.0, // Maximum quality for ultra-sharp images
  imageMaxWidth: 4096, // 4K resolution for maximum detail
  imageMaxHeight: 4096, // 4K resolution for maximum detail
  videoQuality: 'high' as const,
  compressionRatio: 0.95, // Minimal compression for best quality
};

// Deep Link Configuration
export const DEEP_LINK_CONFIG = {
  scheme: 'traveljournal',
  host: 'app.traveljournal.com',
  prefixes: [
    'traveljournal://',
    'https://app.traveljournal.com',
    'https://traveljournal.app',
  ],
};

// Feature Flags
export const FEATURE_FLAGS = {
  enableOfflineMode: true,
  enableSocialSharing: true,
  enableWeatherIntegration: true,
  enableMapClustering: true,
  enableVoiceNotes: false,
  enableCollaborativeTrips: false,
};

// Development Configuration
export const DEV_CONFIG = {
  enableDebugMode: __DEV__,
  enablePerformanceMonitoring: true,
  enableCrashReporting: !__DEV__,
  logLevel: __DEV__ ? 'debug' : 'error',
};

// Export all configurations
export default {
  MAPBOX_ACCESS_TOKEN,
  MAP_CONFIG,
  LOCATION_CONFIG,
  API_CONFIG,
  STORAGE_KEYS,
  APP_LIMITS,
  MEDIA_CONFIG,
  DEEP_LINK_CONFIG,
  FEATURE_FLAGS,
  DEV_CONFIG,
}; 
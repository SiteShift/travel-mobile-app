import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

// Root Stack Navigator Types
export type RootStackParamList = {
  // Auth Flow
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  
  // Main App Flow
  Main: undefined;
  
  // Trip Management
  TripDetail: { tripId: string };
  TripEdit: { tripId?: string };
  TripShare: { tripId: string };
  
  // Entry Management
  EntryDetail: { entryId: string; tripId: string };
  EntryEdit: { entryId?: string; tripId: string; initialLocation?: Location };
  EntryCamera: { tripId: string };
  
  // Media & Gallery
  PhotoViewer: { photoId: string; entryId?: string };
  PhotoEditor: { photoId: string };
  Gallery: { tripId: string; entryId?: string };
  
  // Profile & Settings
  ProfileEdit: undefined;
  Settings: undefined;
  SettingsPrivacy: undefined;
  SettingsNotifications: undefined;
  SettingsAbout: undefined;
  
  // Onboarding
  PermissionsRequest: undefined;
  Tutorial: undefined;
};

// Tab Navigator Types
export type TabParamList = {
  Map: undefined;
  Trips: undefined;
  Camera: { tripId?: string };
  Journal: { tripId?: string };
  Profile: undefined;
};

// Map Stack Navigator Types
export type MapStackParamList = {
  MapMain: undefined;
  LocationSearch: undefined;
  LocationDetail: { locationId: string };
  NearbyPlaces: { latitude: number; longitude: number };
};

// Trips Stack Navigator Types
export type TripsStackParamList = {
  TripsList: undefined;
  TripDetail: { tripId: string };
  TripEdit: { tripId?: string };
  TripSettings: { tripId: string };
  TripTimeline: { tripId: string };
  TripGallery: { tripId: string };
  TripStats: { tripId: string };
};

// Journal Stack Navigator Types
export type JournalStackParamList = {
  JournalMain: { tripId?: string };
  EntryDetail: { entryId: string };
  EntryEdit: { entryId?: string; tripId: string };
  EntrySearch: undefined;
  TagsManager: undefined;
};

// Profile Stack Navigator Types
export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileEdit: undefined;
  ProfileStats: undefined;
  ProfileSharing: undefined;
  Settings: undefined;
  SettingsPrivacy: undefined;
  SettingsNotifications: undefined;
  SettingsTheme: undefined;
  SettingsLanguage: undefined;
  SettingsAbout: undefined;
  SettingsHelp: undefined;
};

// Camera Stack Navigator Types
export type CameraStackParamList = {
  CameraMain: { tripId?: string };
  CameraCapture: { tripId: string };
  PhotoPreview: { photoUri: string; tripId: string };
  VideoPreview: { videoUri: string; tripId: string };
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  StackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type MapStackScreenProps<T extends keyof MapStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<MapStackParamList, T>,
    TabScreenProps<'Map'>
  >;

export type TripsStackScreenProps<T extends keyof TripsStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<TripsStackParamList, T>,
    TabScreenProps<'Trips'>
  >;

export type JournalStackScreenProps<T extends keyof JournalStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<JournalStackParamList, T>,
    TabScreenProps<'Journal'>
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<ProfileStackParamList, T>,
    TabScreenProps<'Profile'>
  >;

export type CameraStackScreenProps<T extends keyof CameraStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<CameraStackParamList, T>,
    TabScreenProps<'Camera'>
  >;

// Data Types for Navigation
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
  placeId?: string;
}

export interface NavigationLocation extends Location {
  timestamp: number;
  accuracy?: number;
}

export interface MediaItem {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  timestamp: number;
  location?: Location;
  metadata?: Record<string, any>;
}

// Navigation Utilities Types
export interface NavigationState {
  currentRoute: string;
  previousRoute?: string;
  params?: Record<string, any>;
}

export interface DeepLinkConfig {
  screens: {
    Main: {
      screens: {
        Map: 'map';
        Trips: {
          screens: {
            TripsList: 'trips';
            TripDetail: 'trips/:tripId';
            TripEdit: 'trips/:tripId/edit';
          };
        };
        Journal: {
          screens: {
            JournalMain: 'journal';
            EntryDetail: 'journal/entry/:entryId';
            EntryEdit: 'journal/entry/:entryId/edit';
          };
        };
        Profile: {
          screens: {
            ProfileMain: 'profile';
            Settings: 'profile/settings';
          };
        };
      };
    };
    TripDetail: 'trip/:tripId';
    EntryDetail: 'entry/:entryId';
    PhotoViewer: 'photo/:photoId';
  };
}

// Hook Types
export interface UseNavigationOptions {
  resetOnBlur?: boolean;
  trackAnalytics?: boolean;
}

export interface NavigationAnalytics {
  screenName: string;
  timeSpent: number;
  interactions: number;
  entryPoint?: string;
}

// Tab Bar Configuration
export interface TabConfig {
  name: keyof TabParamList;
  icon: string;
  activeIcon?: string;
  label: string;
  badge?: boolean;
  badgeCount?: number;
}

// Navigation Theme
export interface NavigationTheme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
}

// Screen Options
export interface ScreenOptions {
  title?: string;
  headerShown?: boolean;
  headerTransparent?: boolean;
  headerBackTitle?: string;
  gestureEnabled?: boolean;
  animation?: 'slide' | 'fade' | 'none';
}

// Navigation Events
export type NavigationEvent = 
  | 'focus'
  | 'blur'
  | 'state'
  | 'beforeRemove'
  | 'tabPress'
  | 'tabLongPress';

export interface NavigationEventData {
  type: NavigationEvent;
  target?: string;
  data?: any;
  defaultPrevented?: boolean;
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 
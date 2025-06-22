import React from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

// Navigation reference for imperative navigation
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

// Simple navigation utilities for Phase 3
export const NavigationUtils = {
  // Check if navigation is ready
  isReady(): boolean {
    return navigationRef.current?.isReady() ?? false;
  },

  // Go back
  goBack(): void {
    if (navigationRef.current?.canGoBack()) {
      navigationRef.current.goBack();
    }
  },

  // Get current route name
  getCurrentRouteName(): string | undefined {
    return navigationRef.current?.getCurrentRoute()?.name;
  },

  // Navigate to trip detail
  navigateToTrip(tripId: string): void {
    if (this.isReady()) {
      navigationRef.current?.navigate('TripDetail', { tripId });
    }
  },

  // Navigate to entry detail
  navigateToEntry(entryId: string, tripId: string): void {
    if (this.isReady()) {
      navigationRef.current?.navigate('EntryDetail', { entryId, tripId });
    }
  },

  // Navigate to photo viewer
  navigateToPhoto(photoId: string, entryId?: string): void {
    if (this.isReady()) {
      navigationRef.current?.navigate('PhotoViewer', { photoId, entryId });
    }
  },
};

// Screen tracking for analytics
export const ScreenTracker = {
  // Track screen focus
  onScreenFocus(screenName: string): void {
    console.log(`Screen focused: ${screenName}`);
  },

  // Track screen blur
  onScreenBlur(screenName: string): void {
    console.log(`Screen blurred: ${screenName}`);
  },
};

export default NavigationUtils; 
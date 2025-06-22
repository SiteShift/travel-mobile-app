import { useEffect } from 'react';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { ScreenTracker } from '../navigation/navigationUtils';
import type { RootStackScreenProps, TabScreenProps } from '../types/navigation';

// Hook for screen tracking
export function useScreenTracking(screenName: string) {
  useFocusEffect(() => {
    ScreenTracker.onScreenFocus(screenName);
    
    return () => {
      ScreenTracker.onScreenBlur(screenName);
    };
  });
}

// Hook for safe navigation with loading state
export function useSafeNavigation() {
  const navigation = useNavigation();
  
  const navigateToTrip = (tripId: string) => {
    try {
      navigation.navigate('TripDetail' as never, { tripId } as never);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const navigateToEntry = (entryId: string, tripId: string) => {
    try {
      navigation.navigate('EntryDetail' as never, { entryId, tripId } as never);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const navigateToPhoto = (photoId: string, entryId?: string) => {
    try {
      navigation.navigate('PhotoViewer' as never, { photoId, entryId } as never);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return {
    navigateToTrip,
    navigateToEntry,
    navigateToPhoto,
    goBack: navigation.goBack,
    canGoBack: navigation.canGoBack,
  };
}

// Hook for getting route params with type safety
export function useRouteParams<T = any>(): T {
  const route = useRoute();
  return (route.params as T) || ({} as T);
}

// Hook for header configuration
export function useHeaderConfig(
  title: string,
  options?: {
    showBackButton?: boolean;
    rightActions?: Array<{ icon: string; onPress: () => void }>;
  }
) {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title,
      headerShown: true,
      headerBackVisible: options?.showBackButton ?? true,
      // Additional header options would be configured here
    });
  }, [navigation, title, options]);
}

// Hook for tab badge management
export function useTabBadge(tabName: string, count?: number) {
  const navigation = useNavigation();

  useEffect(() => {
    // This would update tab badge count
    // Implementation depends on tab navigator setup
    console.log(`Tab ${tabName} badge count: ${count}`);
  }, [tabName, count]);
}

// Hook for handling deep links
export function useDeepLinking() {
  const navigation = useNavigation();

  const handleDeepLink = (url: string) => {
    try {
      // Parse URL and navigate
      const urlParts = url.split('/');
      const path = urlParts[urlParts.length - 1];
      
      if (path.includes('trip:')) {
        const tripId = path.replace('trip:', '');
        navigation.navigate('TripDetail' as never, { tripId } as never);
      }
      // Add more deep link handling as needed
    } catch (error) {
      console.error('Deep link navigation error:', error);
    }
  };

  return { handleDeepLink };
}

// Hook for navigation state
export function useNavigationState() {
  const navigation = useNavigation();
  const route = useRoute();

  return {
    currentRouteName: route.name,
    routeParams: route.params,
    canGoBack: navigation.canGoBack(),
    navigationState: navigation.getState(),
  };
} 
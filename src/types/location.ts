export interface Location {
  id: string;
  name: string;
  address?: string;
  coordinates: Coordinates;
  type: LocationType;
  
  // Geographic Information
  country?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  
  // Place Details
  category?: LocationCategory;
  subcategory?: string;
  description?: string;
  website?: string;
  phone?: string;
  
  // User Data
  visited: boolean;
  visitedAt?: Date;
  notes?: string;
  rating?: number; // 1-5
  photos?: string[];
  
  // Metadata
  source: 'user' | 'search' | 'current' | 'imported';
  accuracy?: number; // GPS accuracy in meters
  altitude?: number;
  timezone?: string;
  
  // Social
  popularity?: number;
  reviewCount?: number;
  averageRating?: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationType = 
  | 'current'
  | 'search'
  | 'manual'
  | 'favorite'
  | 'recent'
  | 'landmark'
  | 'accommodation'
  | 'restaurant'
  | 'attraction'
  | 'transport'
  | 'custom';

export type LocationCategory = 
  | 'accommodation'
  | 'restaurant'
  | 'attraction'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'nature'
  | 'culture'
  | 'sports'
  | 'health'
  | 'services'
  | 'other';

export interface LocationSearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  category?: LocationCategory;
  distance?: number; // in meters from current location
  relevance?: number; // search relevance score
  source: 'google' | 'mapbox' | 'local';
}

export interface LocationHistory {
  location: Location;
  visitedAt: Date;
  duration?: number; // minutes spent at location
  entryCount: number;
  photoCount: number;
}

export interface FavoriteLocation {
  id: string;
  location: Location;
  addedAt: Date;
  category: 'wishlist' | 'visited' | 'recommended';
  notes?: string;
  tags: string[];
}

export interface LocationCluster {
  id: string;
  coordinates: Coordinates;
  locations: Location[];
  radius: number; // in meters
  name?: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  category: LocationCategory;
  
  // Rich Details
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  hours?: OpeningHours;
  priceLevel?: 1 | 2 | 3 | 4; // $ to $$$$
  
  // Reviews & Ratings
  rating?: number;
  reviewCount?: number;
  reviews?: Review[];
  
  // Media
  photos?: PlacePhoto[];
  
  // Features
  features?: string[];
  amenities?: string[];
  
  // Additional Info
  verified: boolean;
  lastUpdated: Date;
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  timezone?: string;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "18:00"
  closed?: boolean;
}

export interface Review {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  text: string;
  createdAt: Date;
  helpful: number;
  photos?: string[];
}

export interface PlacePhoto {
  id: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  attribution?: string;
}

export interface LocationStats {
  totalLocations: number;
  uniqueCountries: number;
  uniqueCities: number;
  favoriteLocations: number;
  mostVisitedLocation?: Location;
  furthestLocation?: Location;
  
  // Categories
  accommodations: number;
  restaurants: number;
  attractions: number;
  naturalSites: number;
}

// Geographic utilities
export interface Region {
  id: string;
  name: string;
  type: 'continent' | 'country' | 'state' | 'city';
  coordinates: Coordinates;
  bounds?: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
}

export interface Country {
  code: string; // ISO country code
  name: string;
  continent: string;
  currency: string;
  language: string;
  timezone: string;
  visited: boolean;
  visitCount: number;
  firstVisit?: Date;
  lastVisit?: Date;
}

// Type guards
export const isLocation = (obj: any): obj is Location => {
  return obj && typeof obj.id === 'string' && obj.coordinates && 
         typeof obj.coordinates.latitude === 'number' && 
         typeof obj.coordinates.longitude === 'number';
};

export const isCoordinates = (obj: any): obj is Coordinates => {
  return obj && typeof obj.latitude === 'number' && typeof obj.longitude === 'number';
};

// Utility functions
export const calculateDistance = (loc1: Coordinates, loc2: Coordinates): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const formatCoordinates = (coords: Coordinates): string => {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}; 
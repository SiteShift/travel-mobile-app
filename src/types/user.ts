export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  
  // Account Details
  verified: boolean;
  premium: boolean;
  joinDate: Date;
  lastActiveAt: Date;
  
  // Preferences
  preferences: UserPreferences;
  
  // Privacy Settings
  privacy: PrivacySettings;
  
  // Statistics
  stats: UserStats;
  
  // Profile Settings
  settings: UserSettings;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  units: {
    temperature: 'C' | 'F';
    distance: 'km' | 'mi';
    speed: 'km/h' | 'mph';
  };
  
  // App Behavior
  autoSave: boolean;
  offlineMode: boolean;
  dataSync: boolean;
  
  // Notifications
  notifications: NotificationPreferences;
  
  // Travel Preferences
  defaultPrivacy: 'public' | 'private' | 'friends';
  autoLocation: boolean;
  autoWeather: boolean;
  reminderFrequency: 'never' | 'daily' | 'weekly';
}

export interface NotificationPreferences {
  enabled: boolean;
  types: {
    journalReminders: boolean;
    tripUpdates: boolean;
    social: boolean;
    systemUpdates: boolean;
    marketing: boolean;
  };
  frequency: {
    immediate: boolean;
    daily: boolean;
    weekly: boolean;
  };
  quiet: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "08:00"
  };
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  allowSearch: boolean;
  showLocation: boolean;
  showEmail: boolean;
  allowMessaging: 'everyone' | 'friends' | 'none';
  
  // Data Privacy
  analyticsOptOut: boolean;
  dataSharingOptOut: boolean;
  
  // Content Privacy
  defaultEntryPrivacy: 'public' | 'private' | 'friends';
  defaultTripPrivacy: 'public' | 'private' | 'friends';
}

export interface UserStats {
  // Travel Statistics
  totalTrips: number;
  totalEntries: number;
  totalPhotos: number;
  totalVideos: number;
  totalCountries: number;
  totalCities: number;
  totalDays: number;
  totalDistance: number; // in kilometers
  
  // Content Statistics
  totalWords: number;
  averageWordsPerEntry: number;
  longestEntry: number; // word count
  
  // Activity Statistics
  streakDays: number;
  longestStreak: number;
  entriesThisMonth: number;
  entriesThisYear: number;
  
  // Social Statistics
  followers: number;
  following: number;
  likes: number;
  shares: number;
  
  // Level & Experience
  level: number;
  experience: number;
  nextLevelExp: number;
  badges: Badge[];
  
  // Date Statistics
  firstTripDate?: Date;
  lastTripDate?: Date;
  firstEntryDate?: Date;
  lastEntryDate?: Date;
  
  // Achievements
  achievements: Achievement[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  category: 'travel' | 'writing' | 'social' | 'milestone';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'travel' | 'writing' | 'social' | 'milestone';
  target: number;
  progress: number;
  unlockedAt?: Date;
  type: 'counter' | 'boolean' | 'streak';
}

export interface UserSettings {
  // App Settings
  theme: 'auto' | 'light' | 'dark';
  hapticFeedback: boolean;
  animations: boolean;
  autoBackup: boolean;
  
  // Editor Settings
  defaultEntryTemplate?: string;
  autoCorrect: boolean;
  spellCheck: boolean;
  markdownMode: boolean;
  
  // Map Settings
  mapStyle: 'default' | 'satellite' | 'terrain';
  showTraffic: boolean;
  show3D: boolean;
  
  // Export Settings
  exportFormat: 'json' | 'pdf' | 'html';
  includeMedia: boolean;
  imageQuality: 'high' | 'medium' | 'low';
}

export interface UserProfile {
  user: User;
  recentTrips: UserProfileTrip[];
  recentEntries: UserProfileEntry[];
  favoriteLocations: UserProfileLocation[];
  travelGoals: TravelGoal[];
}

export interface TravelGoal {
  id: string;
  title: string;
  description: string;
  type: 'countries' | 'cities' | 'continents' | 'entries' | 'photos' | 'distance';
  target: number;
  current: number;
  deadline?: Date;
  completed: boolean;
  completedAt?: Date;
}

// Type guards for user objects
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
};

export const isUserStats = (obj: any): obj is UserStats => {
  return obj && typeof obj.totalTrips === 'number' && typeof obj.totalEntries === 'number';
};

// Forward declarations to avoid circular imports
export interface UserProfileTrip {
  id: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

export interface UserProfileEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  tripId: string;
}

export interface UserProfileLocation {
  id: string;
  name: string;
  coordinates: { latitude: number; longitude: number };
  visitCount: number;
} 
export interface EnhancedMemory {
  id: string;
  type: 'photo' | 'video';
  uri: string;
  thumbnail?: string;
  width: number;
  height: number;
  
  // Rich metadata
  timestamp: Date;
  location?: {
    name: string;
    coordinates: [number, number];
    address?: string;
  };
  
  // Story elements
  caption?: string;
  mood?: 'amazing' | 'fun' | 'peaceful' | 'exciting' | 'challenging' | 'memorable';
  rating?: 1 | 2 | 3 | 4 | 5; // User rating
  
  // Social elements
  people?: Array<{
    id: string;
    name: string;
    avatar?: string;
    position?: { x: number; y: number }; // Face position in photo
  }>;
  
  // Context
  weather?: {
    condition: string;
    temperature: number;
    icon: string;
  };
  
  tags?: string[];
  isHighlight?: boolean;
  shareCount?: number;
  viewCount?: number;
  
  // Technical metadata
  camera?: {
    make?: string;
    model?: string;
    settings?: string;
  };
  
  fileSize?: number;
  duration?: number; // for videos
}

export interface EnhancedTripDay {
  day: number;
  date: Date;
  memories: EnhancedMemory[];
  
  // Day summary
  title?: string;
  description?: string;
  mood: 'amazing' | 'fun' | 'peaceful' | 'exciting' | 'challenging' | 'memorable';
  rating?: 1 | 2 | 3 | 4 | 5;
  
  // Location info
  primaryLocation?: {
    name: string;
    coordinates: [number, number];
  };
  
  // Activity summary
  activities?: string[];
  distanceTraveled?: number;
  timeSpent?: number; // minutes
  
  // Weather summary
  weather?: {
    condition: string;
    temperature: number;
    icon: string;
  };
  
  // Story elements
  highlights: string[]; // Key moments
  challenges?: string[]; // What was difficult
  learnings?: string[]; // What was learned
  
  // Social
  sharedWith?: string[]; // People present
  isPublic?: boolean;
  
  // Media stats
  photoCount: number;
  videoCount: number;
  bestPhoto?: string; // Memory ID of hero photo
}

export interface TripStory {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  
  // Journey metadata
  startDate: Date;
  endDate: Date;
  totalDays: number;
  days: EnhancedTripDay[];
  
  // Story stats
  totalMemories: number;
  totalPhotos: number;
  totalVideos: number;
  totalDistance?: number;
  
  // Participants
  travelers: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'owner' | 'traveler' | 'viewer';
  }>;
  
  // Story settings
  viewMode: 'grid' | 'story' | 'timeline' | 'map';
  isCollaborative: boolean;
  privacy: 'private' | 'friends' | 'public';
  
  // Engagement
  views?: number;
  likes?: number;
  shares?: number;
  
  // Version info
  createdAt: Date;
  updatedAt: Date;
}

export interface ViewModeConfig {
  mode: 'grid' | 'story' | 'timeline' | 'map';
  showMetadata: boolean;
  showCaptions: boolean;
  showPeople: boolean;
  showWeather: boolean;
  showLocation: boolean;
  groupBy: 'day' | 'location' | 'activity' | 'mood' | 'people';
  sortBy: 'chronological' | 'rating' | 'recently_viewed';
}

export interface StoryModeState {
  currentDay: number;
  isPlaying: boolean;
  playbackSpeed: 'slow' | 'normal' | 'fast';
  showNarration: boolean;
  autoAdvance: boolean;
}

// Component prop interfaces
export interface DayPreviewProps {
  day: EnhancedTripDay;
  isSelected: boolean;
  onPress: (day: number) => void;
  onLongPress?: (day: number) => void;
  showDetails: boolean;
}

export interface MemoryCardProps {
  memory: EnhancedMemory;
  onPress: (memory: EnhancedMemory) => void;
  onLongPress?: (memory: EnhancedMemory) => void;
  showMetadata: boolean;
  showPeople: boolean;
  style?: any;
}

export interface StoryHeaderProps {
  story: TripStory;
  currentDay: EnhancedTripDay;
  onBack: () => void;
  onShare: () => void;
  onSettings: () => void;
}

// Utility types
export type MoodEmoji = {
  [key in EnhancedTripDay['mood']]: string;
};

export type WeatherIcon = {
  [key: string]: string;
};

export type ActivityIcon = {
  [key: string]: string;
}; 
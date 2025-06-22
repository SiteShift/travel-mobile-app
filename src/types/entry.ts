import type { Location } from './location';
import type { Media } from './media';
import type { Weather } from './weather';

export interface Entry {
  id: string;
  title: string;
  content: string;
  summary?: string;
  
  // Trip association
  tripId: string;
  
  // Temporal data
  date: Date;
  timezone?: string;
  
  // Location data
  location?: Location;
  
  // Weather data
  weather?: Weather;
  
  // Content organization
  tags: Tag[];
  categories: string[];
  mood?: EntryMood;
  
  // Media attachments
  media: Media[];
  coverPhoto?: string;
  coverPhotoId?: string;
  
  // Content metadata
  wordCount: number;
  readingTime: number; // minutes
  language?: string;
  
  // Privacy & sharing
  privacy: 'public' | 'private' | 'friends';
  published: boolean;
  featured: boolean;
  
  // Collaboration
  authorId: string;
  collaborators: string[];
  
  // Versioning & drafts
  isDraft: boolean;
  version: number;
  previousVersionId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  lastViewedAt?: Date;
  
  // Social interactions
  likes: number;
  comments: number;
  shares: number;
  views: number;
  
  // Rich content
  format: EntryFormat;
  richContent?: RichContent;
  
  // Travel specific
  travelDay?: number; // Day of trip (1, 2, 3...)
  activities: Activity[];
  transportation?: TransportationEntry;
  accommodation?: AccommodationEntry;
  
  // Personal reflection
  highlights: string[];
  challenges: string[];
  lessons: string[];
  recommendations: string[];
  
  // Sync & storage
  synced: boolean;
  localOnly: boolean;
  deleted: boolean;
  deletedAt?: Date;
  
  // Analytics
  engagement: EntryEngagement;
  
  // Relationships
  relatedEntries: string[];
  references: EntryReference[];
  
  // Custom fields
  customFields: Record<string, any>;
}

export type EntryFormat = 
  | 'markdown'
  | 'richtext'
  | 'plain'
  | 'template';

export type EntryMood = 
  | 'amazing'
  | 'great'
  | 'good'
  | 'okay'
  | 'challenging'
  | 'difficult'
  | 'excited'
  | 'happy'
  | 'content'
  | 'peaceful'
  | 'adventurous'
  | 'tired'
  | 'homesick'
  | 'grateful'
  | 'reflective';

export interface Tag {
  id: string;
  label: string;
  category: TagCategory;
  color?: string;
  icon?: string;
  count?: number;
  
  // Metadata
  createdBy?: string;
  createdAt?: Date;
  lastUsed?: Date;
}

export type TagCategory = 
  | 'activities'
  | 'transport'
  | 'food'
  | 'accommodation'
  | 'mood'
  | 'weather'
  | 'people'
  | 'places'
  | 'experiences'
  | 'challenges'
  | 'learnings'
  | 'recommendations'
  | 'custom';

export interface Activity {
  id: string;
  name: string;
  description?: string;
  category: ActivityCategory;
  
  // Timing
  startTime?: Date;
  endTime?: Date;
  duration?: number; // minutes
  
  // Location
  location?: Location;
  
  // Details
  cost?: number;
  currency?: string;
  rating?: number; // 1-5
  
  // Participants
  participants: string[];
  
  // Media
  photos: Media[];
  
  // Metadata
  completed: boolean;
  recommended: boolean;
  wouldDoAgain?: boolean;
  difficulty?: 'easy' | 'moderate' | 'hard' | 'extreme';
  
  // Notes
  notes?: string;
  tips?: string[];
  warnings?: string[];
}

export type ActivityCategory = 
  | 'sightseeing'
  | 'outdoor'
  | 'cultural'
  | 'food'
  | 'shopping'
  | 'entertainment'
  | 'sports'
  | 'relaxation'
  | 'adventure'
  | 'learning'
  | 'social'
  | 'transportation'
  | 'accommodation'
  | 'other';

export interface TransportationEntry {
  method: string;
  from: Location;
  to: Location;
  departureTime?: Date;
  arrivalTime?: Date;
  duration?: number;
  cost?: number;
  currency?: string;
  
  // Details
  provider?: string;
  bookingReference?: string;
  seatNumber?: string;
  class?: string;
  
  // Experience
  rating?: number;
  notes?: string;
  delays?: number; // minutes
  
  // Media
  tickets?: Media[];
  photos?: Media[];
}

export interface AccommodationEntry {
  name: string;
  type: string;
  location: Location;
  checkIn?: Date;
  checkOut?: Date;
  
  // Details
  roomType?: string;
  pricePerNight?: number;
  currency?: string;
  bookingReference?: string;
  
  // Experience
  rating?: number;
  notes?: string;
  amenities?: string[];
  
  // Review
  wouldStayAgain?: boolean;
  highlights?: string[];
  issues?: string[];
  
  // Media
  photos?: Media[];
  reservation?: Media[];
}

export interface RichContent {
  blocks: ContentBlock[];
  version: string;
  lastModified: Date;
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: any;
  metadata?: Record<string, any>;
  
  // Layout
  order: number;
  width?: 'full' | 'half' | 'third' | 'quarter';
  
  // Styling
  style?: Record<string, any>;
  className?: string;
}

export type BlockType = 
  | 'text'
  | 'heading'
  | 'image'
  | 'gallery'
  | 'video'
  | 'audio'
  | 'map'
  | 'weather'
  | 'quote'
  | 'list'
  | 'table'
  | 'separator'
  | 'code'
  | 'embed'
  | 'activity'
  | 'location'
  | 'timeline'
  | 'expense'
  | 'rating'
  | 'checklist';

export interface EntryEngagement {
  viewCount: number;
  uniqueViews: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  
  // Time-based metrics
  averageReadTime: number; // seconds
  completionRate: number; // percentage
  
  // Geographic engagement
  viewsByCountry: Record<string, number>;
  
  // Time-based engagement
  viewsByHour: Record<string, number>;
  viewsByDay: Record<string, number>;
  
  // Referral sources
  referralSources: Record<string, number>;
  
  // Device metrics
  deviceTypes: Record<string, number>;
  
  // Recent activity
  recentViews: RecentView[];
  recentLikes: RecentLike[];
  recentComments: RecentComment[];
}

export interface RecentView {
  userId?: string;
  timestamp: Date;
  duration: number; // seconds
  source: string;
  deviceType: string;
  location?: string;
}

export interface RecentLike {
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
}

export interface RecentComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: RecentComment[];
}

export interface EntryReference {
  type: 'url' | 'book' | 'article' | 'person' | 'place' | 'event';
  title: string;
  url?: string;
  description?: string;
  
  // Additional metadata based on type
  author?: string;
  publishedDate?: Date;
  isbn?: string;
  coordinates?: { latitude: number; longitude: number };
}

export interface EntryTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  
  // Template structure
  blocks: ContentBlock[];
  defaultTags: Tag[];
  suggestedActivities: string[];
  
  // Prompts
  titlePrompts: string[];
  contentPrompts: string[];
  reflectionPrompts: string[];
  
  // Usage
  useCount: number;
  rating: number;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Sharing
  public: boolean;
  featured: boolean;
  
  // Customization
  customizable: boolean;
  variables: TemplateVariable[];
}

export type TemplateCategory = 
  | 'daily'
  | 'activity'
  | 'food'
  | 'accommodation'
  | 'transportation'
  | 'reflection'
  | 'itinerary'
  | 'review'
  | 'planning'
  | 'memories'
  | 'custom';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'location' | 'choice';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  choices?: string[];
}

export interface EntryDraft {
  id: string;
  entryId?: string; // If editing existing entry
  tripId: string;
  
  // Draft content
  title: string;
  content: string;
  
  // Metadata
  lastSaved: Date;
  autoSaved: boolean;
  version: number;
  
  // Associated data
  location?: Location;
  weather?: Weather;
  tags: Tag[];
  media: Media[];
  
  // Draft settings
  expiresAt?: Date;
  synced: boolean;
}

export interface EntryStats {
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  longestEntry: Entry;
  shortestEntry: Entry;
  
  // Time-based
  entriesThisWeek: number;
  entriesThisMonth: number;
  entriesThisYear: number;
  
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: Date;
  
  // Popular content
  mostLikedEntry: Entry;
  mostViewedEntry: Entry;
  mostCommentedEntry: Entry;
  
  // Categories
  entriesByMood: Record<EntryMood, number>;
  entriesByTag: Record<string, number>;
  entriesByLocation: Record<string, number>;
  
  // Engagement
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  
  // Media
  entriesWithPhotos: number;
  entriesWithVideos: number;
  averagePhotosPerEntry: number;
}

// Utility functions
export const getEntryWordCount = (content: string): number => {
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const getEntryReadingTime = (wordCount: number): number => {
  // Assuming 200 words per minute reading speed
  return Math.ceil(wordCount / 200);
};

export const getEntryMoodIcon = (mood: EntryMood): string => {
  const moodIcons: Record<EntryMood, string> = {
    'amazing': '🤩',
    'great': '😊',
    'good': '😌',
    'okay': '😐',
    'challenging': '😤',
    'difficult': '😔',
    'excited': '🤗',
    'happy': '😄',
    'content': '😌',
    'peaceful': '😇',
    'adventurous': '🤠',
    'tired': '😴',
    'homesick': '🏠',
    'grateful': '🙏',
    'reflective': '🤔',
  };
  return moodIcons[mood] || '😊';
};

export const getEntryMoodColor = (mood: EntryMood): string => {
  const moodColors: Record<EntryMood, string> = {
    'amazing': '#FF6B6B',
    'great': '#4ECDC4',
    'good': '#45B7D1',
    'okay': '#96CEB4',
    'challenging': '#FFEAA7',
    'difficult': '#DDA0DD',
    'excited': '#FF9FF3',
    'happy': '#54A0FF',
    'content': '#5F27CD',
    'peaceful': '#00D2D3',
    'adventurous': '#FF9F43',
    'tired': '#C8D6E5',
    'homesick': '#8395A7',
    'grateful': '#F8C291',
    'reflective': '#B8860B',
  };
  return moodColors[mood] || '#45B7D1';
};

export const formatEntryDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getEntryExcerpt = (content: string, maxLength: number = 150): string => {
  if (content.length <= maxLength) return content;
  
  const excerpt = content.substring(0, maxLength);
  const lastSpace = excerpt.lastIndexOf(' ');
  
  return lastSpace > 0 ? excerpt.substring(0, lastSpace) + '...' : excerpt + '...';
};

export const sortEntriesByDate = (entries: Entry[]): Entry[] => {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const groupEntriesByDate = (entries: Entry[]): Record<string, Entry[]> => {
  return entries.reduce((groups, entry) => {
    const dateKey = entry.date.toISOString().split('T')[0];
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(entry);
    return groups;
  }, {} as Record<string, Entry[]>);
};

// Type guards
export const isEntry = (obj: any): obj is Entry => {
  return obj && typeof obj.id === 'string' && 
         typeof obj.title === 'string' && 
         typeof obj.content === 'string' && 
         obj.date instanceof Date;
};

export const isEntryDraft = (obj: any): obj is EntryDraft => {
  return obj && typeof obj.id === 'string' && 
         typeof obj.tripId === 'string' && 
         obj.lastSaved instanceof Date;
};

export const isTag = (obj: any): obj is Tag => {
  return obj && typeof obj.id === 'string' && 
         typeof obj.label === 'string' && 
         typeof obj.category === 'string';
}; 
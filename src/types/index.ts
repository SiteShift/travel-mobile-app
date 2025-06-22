// Re-export all types from individual files
export * from './user';
export * from './trip';
export * from './entry';
export * from './media';
export * from './location';
export * from './weather';
export * from './navigation';

// Additional common types and utilities
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchFilters {
  query?: string;
  tags?: string[];
  location?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  mood?: string;
  category?: string;
  privacy?: 'public' | 'private' | 'friends';
  sortBy?: 'date' | 'title' | 'likes' | 'views';
  sortOrder?: 'asc' | 'desc';
}

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  stack?: string;
}

export interface SyncStatus {
  lastSyncAt?: Date;
  pendingSync: boolean;
  syncInProgress: boolean;
  syncErrors: SyncError[];
  totalPendingItems: number;
  syncBatch?: SyncBatch;
}

export interface SyncError {
  id: string;
  type: 'upload' | 'download' | 'conflict';
  itemId: string;
  itemType: 'user' | 'trip' | 'entry' | 'media';
  error: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  retryable: boolean;
}

export interface SyncBatch {
  id: string;
  startedAt: Date;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  progress: number; // percentage
  estimatedTimeRemaining?: number; // seconds
}

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  itemType: 'user' | 'trip' | 'entry' | 'media';
  itemId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  dependencies: string[];
  priority: 'low' | 'normal' | 'high';
  retryCount: number;
  maxRetries: number;
}

export type OfflineActionType = 
  | 'user_update'
  | 'trip_create'
  | 'trip_update'
  | 'trip_delete'
  | 'entry_create'
  | 'entry_update'
  | 'entry_delete'
  | 'media_upload'
  | 'media_delete';

export interface ConflictResolution {
  id: string;
  itemType: 'user' | 'trip' | 'entry' | 'media';
  itemId: string;
  conflictType: 'version' | 'deletion' | 'concurrent_edit';
  
  // Conflicting versions
  localVersion: any;
  remoteVersion: any;
  
  // Resolution options
  resolution?: 'local' | 'remote' | 'merge' | 'manual';
  resolvedData?: any;
  
  // Metadata
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  
  // Context
  localLastModified: Date;
  remoteLastModified: Date;
  conflictDetails: string;
}

export interface DataMigration {
  version: string;
  description: string;
  targetVersion: string;
  migrationSteps: MigrationStep[];
  rollbackSteps: MigrationStep[];
  
  // Execution info
  executedAt?: Date;
  executedBy?: string;
  duration?: number; // milliseconds
  success?: boolean;
  error?: string;
  
  // Dependencies
  dependsOn: string[];
  conflicts: string[];
}

export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  type: 'schema' | 'data' | 'cleanup';
  script: string;
  rollbackScript?: string;
  
  // Execution
  executed: boolean;
  executedAt?: Date;
  duration?: number;
  error?: string;
}

export interface BackupInfo {
  id: string;
  type: 'full' | 'incremental' | 'media';
  size: number; // bytes
  compressed: boolean;
  encrypted: boolean;
  
  // Content info
  itemCounts: {
    users: number;
    trips: number;
    entries: number;
    media: number;
  };
  
  // Timestamps
  createdAt: Date;
  expiresAt?: Date;
  
  // Storage
  location: 'local' | 'cloud';
  path: string;
  checksum: string;
  
  // Metadata
  appVersion: string;
  deviceInfo: string;
  description?: string;
}

// Utility type helpers
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Type guards for common interfaces
export const isApiResponse = <T>(obj: any): obj is ApiResponse<T> => {
  return obj && typeof obj.success === 'boolean' && obj.timestamp instanceof Date;
};

export const isPaginatedResponse = <T>(obj: any): obj is PaginatedResponse<T> => {
  return obj && Array.isArray(obj.data) && obj.pagination && 
         typeof obj.pagination.page === 'number';
};

export const isSyncStatus = (obj: any): obj is SyncStatus => {
  return obj && typeof obj.pendingSync === 'boolean' && 
         typeof obj.syncInProgress === 'boolean';
};

export const isOfflineAction = (obj: any): obj is OfflineAction => {
  return obj && typeof obj.id === 'string' && 
         typeof obj.type === 'string' && 
         obj.timestamp instanceof Date;
};

export const isConflictResolution = (obj: any): obj is ConflictResolution => {
  return obj && typeof obj.id === 'string' && 
         typeof obj.itemType === 'string' && 
         obj.detectedAt instanceof Date;
};

// Common validation schemas (basic validation without external dependencies)
export const ValidationSchemas = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  coordinates: {
    latitude: (lat: number) => lat >= -90 && lat <= 90,
    longitude: (lng: number) => lng >= -180 && lng <= 180,
  },
  currency: /^[A-Z]{3}$/,
  timezone: /^[A-Za-z_]+\/[A-Za-z_]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

// Date and time utilities
export const DateUtils = {
  isValidDate: (date: any): date is Date => {
    return date instanceof Date && !isNaN(date.getTime());
  },
  
  formatISO: (date: Date): string => {
    return date.toISOString();
  },
  
  parseISO: (dateString: string): Date => {
    return new Date(dateString);
  },
  
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  
  diffInDays: (date1: Date, date2: Date): number => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  
  isToday: (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },
  
  isYesterday: (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  },
  
  isTomorrow: (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  },
};

// Storage keys for AsyncStorage
export const StorageKeys = {
  USER_DATA: '@travel_journal/user_data',
  USER_PREFERENCES: '@travel_journal/user_preferences',
  TRIPS: '@travel_journal/trips',
  ENTRIES: '@travel_journal/entries',
  MEDIA: '@travel_journal/media',
  DRAFTS: '@travel_journal/drafts',
  OFFLINE_QUEUE: '@travel_journal/offline_queue',
  SYNC_STATUS: '@travel_journal/sync_status',
  CACHE: '@travel_journal/cache',
  THEME: '@travel_journal/theme',
  ONBOARDING: '@travel_journal/onboarding_complete',
  APP_VERSION: '@travel_journal/app_version',
  LAST_BACKUP: '@travel_journal/last_backup',
  CONFLICT_QUEUE: '@travel_journal/conflict_queue',
} as const;

// App constants
export const AppConstants = {
  APP_NAME: 'TravelJournal',
  VERSION: '1.0.0',
  API_VERSION: 'v1',
  
  // Limits
  MAX_PHOTOS_PER_ENTRY: 20,
  MAX_VIDEO_LENGTH: 300, // seconds
  MAX_ENTRY_LENGTH: 50000, // characters
  MAX_TRIP_DURATION: 365, // days
  MAX_TRIPS_PER_USER: 1000,
  MAX_ENTRIES_PER_TRIP: 1000,
  
  // File sizes (bytes)
  MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Cache settings
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  
  // Sync settings
  SYNC_INTERVAL: 30 * 1000, // 30 seconds
  OFFLINE_QUEUE_MAX_SIZE: 1000,
  MAX_RETRY_ATTEMPTS: 3,
  SYNC_BATCH_SIZE: 50,
  
  // Default values
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_TIMEZONE: 'UTC',
  DEFAULT_UNITS: {
    temperature: 'C' as const,
    distance: 'km' as const,
    speed: 'km/h' as const,
  },
} as const; 
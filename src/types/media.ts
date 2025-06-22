import type { Location } from './location';

export interface Media {
  id: string;
  type: MediaType;
  uri: string;
  filename: string;
  size: number; // bytes
  
  // Dimensions (for images and videos)
  width?: number;
  height?: number;
  
  // Media-specific data
  duration?: number; // for videos/audio in seconds
  format: string; // 'jpg', 'mp4', 'mov', etc.
  quality: MediaQuality;
  
  // Metadata
  metadata: MediaMetadata;
  
  // Location & Time
  location?: Location;
  takenAt: Date;
  uploadedAt: Date;
  
  // Processing
  processed: boolean;
  thumbnail?: string;
  compressed?: string;
  blurhash?: string;
  
  // Content
  caption?: string;
  altText?: string;
  tags: string[];
  
  // Ownership & Privacy
  ownerId: string;
  privacy: 'public' | 'private' | 'friends';
  
  // Usage
  entryId?: string;
  tripId?: string;
  featured: boolean;
  
  // Storage
  cloudUrl?: string;
  localPath?: string;
  synced: boolean;
  
  // Stats
  views: number;
  likes: number;
  downloads: number;
}

export type MediaType = 
  | 'photo'
  | 'video'
  | 'audio'
  | 'document'
  | 'panorama'
  | 'timelapse'
  | 'slowmotion';

export type MediaQuality = 
  | 'low'
  | 'medium'
  | 'high'
  | 'original';

export interface MediaMetadata {
  // EXIF data for photos
  exif?: ExifData;
  
  // Camera information
  camera?: CameraInfo;
  
  // GPS data
  gps?: GpsData;
  
  // File information
  fileSize: number;
  mimeType: string;
  colorSpace?: string;
  orientation?: number;
  
  // Processing history
  edits?: EditHistory[];
  filters?: string[];
  
  // AI Analysis
  analysis?: MediaAnalysis;
}

export interface ExifData {
  make?: string; // Camera manufacturer
  model?: string; // Camera model
  software?: string;
  dateTime?: Date;
  
  // Camera settings
  aperture?: number; // f-stop
  shutterSpeed?: string; // "1/60"
  iso?: number;
  focalLength?: number; // mm
  flash?: boolean;
  
  // Image properties
  colorSpace?: string;
  whiteBalance?: string;
  exposureMode?: string;
  meteringMode?: string;
  
  // Lens information
  lensModel?: string;
  lensMake?: string;
}

export interface CameraInfo {
  make: string;
  model: string;
  lensModel?: string;
  settings: {
    aperture?: number;
    shutterSpeed?: string;
    iso?: number;
    focalLength?: number;
    flash?: boolean;
  };
}

export interface GpsData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  direction?: number;
  speed?: number;
  timestamp?: Date;
}

export interface EditHistory {
  id: string;
  type: EditType;
  parameters: Record<string, any>;
  appliedAt: Date;
  appliedBy: string;
}

export type EditType = 
  | 'crop'
  | 'rotate'
  | 'filter'
  | 'adjust'
  | 'resize'
  | 'compress'
  | 'enhance'
  | 'retouch';

export interface MediaAnalysis {
  // AI-generated content
  description?: string;
  tags?: string[];
  objects?: DetectedObject[];
  faces?: DetectedFace[];
  text?: ExtractedText[];
  
  // Image quality
  sharpness?: number;
  exposure?: number;
  composition?: number;
  
  // Content categories
  categories?: string[];
  landmarks?: string[];
  activities?: string[];
  
  // Safety & appropriateness
  safeForWork: boolean;
  contentWarnings?: string[];
  
  // Processing info
  analyzedAt: Date;
  confidence: number;
  version: string;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DetectedFace {
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes?: {
    age?: number;
    gender?: string;
    emotions?: Record<string, number>;
  };
}

export interface ExtractedText {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  language?: string;
}

export interface MediaCollection {
  id: string;
  name: string;
  description?: string;
  coverMedia?: Media;
  mediaItems: Media[];
  
  // Organization
  tags: string[];
  location?: Location;
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  // Ownership
  ownerId: string;
  collaborators: string[];
  privacy: 'public' | 'private' | 'friends';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  mediaCount: number;
  totalSize: number;
  
  // Stats
  views: number;
  likes: number;
  shares: number;
}

export interface MediaAlbum {
  id: string;
  title: string;
  description?: string;
  coverPhoto?: string;
  
  // Content
  mediaItems: Media[];
  layout: AlbumLayout;
  
  // Trip association
  tripId?: string;
  entryIds: string[];
  
  // Sharing
  shareUrl?: string;
  password?: string;
  expiresAt?: Date;
  
  // Creation
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type AlbumLayout = 
  | 'grid'
  | 'masonry'
  | 'timeline'
  | 'map'
  | 'story';

export interface MediaUpload {
  id: string;
  media: Media;
  status: UploadStatus;
  progress: number; // 0-100
  
  // Upload details
  startedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  retryCount: number;
  
  // Error handling
  error?: UploadError;
  
  // Processing
  processingSteps: ProcessingStep[];
  
  // Queue info
  priority: 'low' | 'normal' | 'high';
  queuePosition?: number;
}

export type UploadStatus = 
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface UploadError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

export interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface MediaStats {
  totalMedia: number;
  totalSize: number; // bytes
  
  // By type
  photos: number;
  videos: number;
  audio: number;
  documents: number;
  
  // By quality
  originalQuality: number;
  highQuality: number;
  mediumQuality: number;
  lowQuality: number;
  
  // Storage
  cloudStorage: number;
  localStorage: number;
  
  // Usage
  featured: number;
  shared: number;
  downloaded: number;
  
  // Time ranges
  thisMonth: number;
  thisYear: number;
  allTime: number;
}

export interface MediaPreferences {
  // Upload settings
  autoUpload: boolean;
  uploadQuality: MediaQuality;
  uploadOnWifiOnly: boolean;
  compressBeforeUpload: boolean;
  
  // Storage settings
  keepOriginals: boolean;
  maxLocalStorage: number; // MB
  autoDeleteAfterUpload: boolean;
  
  // Processing settings
  generateThumbnails: boolean;
  generateBlurhash: boolean;
  autoAnalysis: boolean;
  autoTagging: boolean;
  
  // Privacy settings
  defaultPrivacy: 'public' | 'private' | 'friends';
  geotagging: boolean;
  removeExifData: boolean;
  
  // Backup settings
  autoBackup: boolean;
  backupFrequency: 'realtime' | 'daily' | 'weekly';
  backupLocation: 'cloud' | 'local' | 'both';
}

// Utility functions
export const getMediaTypeIcon = (type: MediaType): string => {
  const iconMap: Record<MediaType, string> = {
    'photo': '📷',
    'video': '🎥',
    'audio': '🎵',
    'document': '📄',
    'panorama': '🌅',
    'timelapse': '⏱️',
    'slowmotion': '🐌',
  };
  return iconMap[type] || '📎';
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const getImageAspectRatio = (width: number, height: number): number => {
  return width / height;
};

export const isPortrait = (media: Media): boolean => {
  if (!media.width || !media.height) return false;
  return media.height > media.width;
};

export const isLandscape = (media: Media): boolean => {
  if (!media.width || !media.height) return false;
  return media.width > media.height;
};

export const isSquare = (media: Media): boolean => {
  if (!media.width || !media.height) return false;
  return Math.abs(media.width - media.height) < 10; // Allow small variance
};

export const getVideoDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Type guards
export const isMedia = (obj: any): obj is Media => {
  return obj && typeof obj.id === 'string' && 
         typeof obj.type === 'string' && 
         typeof obj.uri === 'string';
};

export const isPhoto = (media: Media): boolean => {
  return media.type === 'photo' || media.type === 'panorama';
};

export const isVideo = (media: Media): boolean => {
  return media.type === 'video' || media.type === 'timelapse' || 
         media.type === 'slowmotion';
}; 
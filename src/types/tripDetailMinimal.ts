// Minimal, elegant types focused on what matters

export interface MinimalMemory {
  id: string;
  uri: string;
  thumbnail?: string;
  caption?: string; // Optional, user-friendly
  timestamp: Date; // For chronological sorting only
  aspectRatio?: number; // For layout calculations
}

export interface MinimalDay {
  day: number;
  date: Date;
  memories: MinimalMemory[];
  location?: string; // Auto-detected, simplified
}

export interface MinimalTrip {
  id: string;
  title: string;
  coverImage: string | any; // Allow both URI strings and require() objects
  startDate: Date;
  endDate: Date;
  days: MinimalDay[];
  totalPhotos: number;
}

// View preferences - simple
export interface ViewPreferences {
  mode: 'story' | 'grid';
  showCaptions: boolean;
} 
import type { Location } from './location';
import type { Media } from './media';
import type { Weather } from './weather';
import type { Entry } from './entry';

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: string;
  
  // Dates
  startDate: Date;
  endDate: Date;
  plannedDuration: number; // days
  actualDuration?: number; // days
  
  // Media
  coverImage?: string;
  coverImageId?: string;
  media: Media[];
  
  // Content
  entries: Entry[];
  locations: Location[];
  
  // Trip Details
  type: TripType;
  status: TripStatus;
  privacy: 'public' | 'private' | 'friends';
  
  // Participants
  ownerId: string;
  participants: TripParticipant[];
  collaborators: string[];
  
  // Travel Information
  transportMethods: TransportMethod[];
  accommodations: Accommodation[];
  budget?: TripBudget;
  
  // Statistics
  stats: TripStats;
  
  // Organization
  tags: string[];
  categories: string[];
  mood?: TripMood;
  rating?: number; // 1-5
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
  
  // Sharing & Social
  shareUrl?: string;
  shared: boolean;
  featured: boolean;
  
  // Sync & Storage
  synced: boolean;
  archived: boolean;
  deleted: boolean;
  deletedAt?: Date;
  
  // Weather summary
  weatherSummary?: WeatherSummary;
  
  // Route information
  route?: TripRoute;
  
  // Notes & Planning
  notes?: string;
  plannedActivities: string[];
  checklist: ChecklistItem[];
  
  // Memories
  highlights: string[];
  recommendations: string[];
  lessonsLearned: string[];
}

export type TripType = 
  | 'vacation'
  | 'business'
  | 'adventure'
  | 'backpacking'
  | 'luxury'
  | 'family'
  | 'solo'
  | 'couple'
  | 'group'
  | 'weekend'
  | 'roadtrip'
  | 'cruise'
  | 'camping'
  | 'cultural'
  | 'nature'
  | 'city'
  | 'beach'
  | 'mountain'
  | 'international'
  | 'domestic'
  | 'other';

export type TripStatus = 
  | 'planning'
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'postponed';

export type TripMood = 
  | 'relaxing'
  | 'adventurous'
  | 'romantic'
  | 'educational'
  | 'spontaneous'
  | 'challenging'
  | 'peaceful'
  | 'exciting'
  | 'cultural'
  | 'spiritual';

export interface TripParticipant {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
  
  // Permissions
  canEdit: boolean;
  canInvite: boolean;
  canDelete: boolean;
  
  // Participation
  confirmed: boolean;
  attending: boolean;
  
  // Contact
  phone?: string;
  emergencyContact?: EmergencyContact;
}

export type ParticipantRole = 
  | 'organizer'
  | 'co-organizer'
  | 'participant'
  | 'viewer'
  | 'guest';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
}

export interface TransportMethod {
  id: string;
  type: TransportType;
  details: string;
  
  // Route info
  from: Location;
  to: Location;
  departureTime?: Date;
  arrivalTime?: Date;
  duration?: number; // minutes
  
  // Booking info
  confirmationNumber?: string;
  cost?: number;
  currency?: string;
  bookingUrl?: string;
  
  // Status
  status: 'booked' | 'confirmed' | 'completed' | 'cancelled';
  
  // Files
  tickets?: Media[];
  documents?: Media[];
}

export type TransportType = 
  | 'flight'
  | 'train'
  | 'bus'
  | 'car'
  | 'rental-car'
  | 'taxi'
  | 'uber'
  | 'boat'
  | 'ferry'
  | 'subway'
  | 'walking'
  | 'cycling'
  | 'motorcycle'
  | 'other';

export interface Accommodation {
  id: string;
  name: string;
  type: AccommodationType;
  location: Location;
  
  // Dates
  checkIn: Date;
  checkOut: Date;
  nights: number;
  
  // Details
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  pricePerNight?: number;
  currency?: string;
  
  // Booking
  confirmationNumber?: string;
  bookingUrl?: string;
  bookedThrough?: string;
  
  // Amenities
  amenities: string[];
  notes?: string;
  
  // Files
  reservations?: Media[];
  photos?: Media[];
  
  // Review
  userRating?: number;
  userReview?: string;
  wouldStayAgain?: boolean;
}

export type AccommodationType = 
  | 'hotel'
  | 'hostel'
  | 'airbnb'
  | 'resort'
  | 'apartment'
  | 'house'
  | 'camping'
  | 'rv'
  | 'boat'
  | 'other';

export interface TripBudget {
  totalBudget: number;
  currency: string;
  
  // Categories
  transportation: BudgetCategory;
  accommodation: BudgetCategory;
  food: BudgetCategory;
  activities: BudgetCategory;
  shopping: BudgetCategory;
  miscellaneous: BudgetCategory;
  
  // Tracking
  totalSpent: number;
  remaining: number;
  percentSpent: number;
  
  // Expenses
  expenses: Expense[];
  
  // Exchange rates
  exchangeRates?: Record<string, number>;
  baseCurrency: string;
}

export interface BudgetCategory {
  budgeted: number;
  spent: number;
  remaining: number;
  percentSpent: number;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  date: Date;
  location?: Location;
  
  // Payment
  paymentMethod?: string;
  paidBy?: string;
  
  // Sharing
  splitBetween: string[];
  yourShare: number;
  
  // Receipt
  receipt?: Media;
  
  // Tags
  tags: string[];
  
  // Metadata
  createdAt: Date;
  createdBy: string;
}

export interface TripStats {
  // Basic stats
  totalDays: number;
  entriesCount: number;
  photosCount: number;
  videosCount: number;
  locationsCount: number;
  
  // Distance & Movement
  totalDistance: number; // kilometers
  distanceByTransport: Record<TransportType, number>;
  
  // Geographic
  countriesVisited: string[];
  citiesVisited: string[];
  continentsVisited: string[];
  
  // Content
  totalWords: number;
  averageWordsPerEntry: number;
  longestEntry: number;
  
  // Activity
  activeDays: number; // days with entries
  quietDays: number; // days without entries
  averageEntriesPerDay: number;
  
  // Social
  likes: number;
  comments: number;
  shares: number;
  views: number;
  
  // Favorites
  favoriteLocation?: Location;
  favoriteActivity?: string;
  favoritePhoto?: Media;
  bestWeatherDay?: Date;
  
  // Achievements
  achievements: string[];
  milestones: string[];
  
  // Budget (if tracking)
  budgetUsed?: number;
  budgetRemaining?: number;
  costPerDay?: number;
}

export interface WeatherSummary {
  averageTemperature: number;
  temperatureRange: {
    min: number;
    max: number;
  };
  dominantCondition: string;
  rainyDays: number;
  sunnyDays: number;
  
  // Detailed breakdown
  conditions: Record<string, number>;
  temperatures: number[];
  
  // Best/worst days
  bestWeatherDay?: {
    date: Date;
    weather: Weather;
    reason: string;
  };
  worstWeatherDay?: {
    date: Date;
    weather: Weather;
    reason: string;
  };
}

export interface TripRoute {
  waypoints: RouteWaypoint[];
  totalDistance: number;
  estimatedDuration: number; // hours
  
  // Route details
  mainTransportMethod: TransportType;
  alternativeRoutes?: TripRoute[];
  
  // Geographic bounds
  bounds: {
    northeast: { latitude: number; longitude: number };
    southwest: { latitude: number; longitude: number };
  };
}

export interface RouteWaypoint {
  id: string;
  location: Location;
  order: number;
  arrivalTime?: Date;
  departureTime?: Date;
  duration?: number; // hours spent here
  
  // Content at this waypoint
  entries: Entry[];
  photos: Media[];
  
  // Travel to next waypoint
  distanceToNext?: number;
  transportToNext?: TransportMethod;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: ChecklistCategory;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  
  // Metadata
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  createdBy: string;
}

export type ChecklistCategory = 
  | 'documents'
  | 'packing'
  | 'bookings'
  | 'health'
  | 'money'
  | 'technology'
  | 'pre-departure'
  | 'during-trip'
  | 'post-trip'
  | 'other';

export interface TripTemplate {
  id: string;
  name: string;
  description: string;
  type: TripType;
  
  // Template content
  defaultDuration: number;
  suggestedLocations: Location[];
  recommendedActivities: string[];
  packingList: ChecklistItem[];
  budgetEstimate: Partial<TripBudget>;
  
  // Usage
  useCount: number;
  rating: number;
  createdBy: string;
  createdAt: Date;
  
  // Categories
  tags: string[];
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  climate?: string[];
  difficulty?: 'easy' | 'moderate' | 'challenging' | 'expert';
}

export interface TripInvitation {
  id: string;
  tripId: string;
  inviterId: string;
  inviteeEmail: string;
  role: ParticipantRole;
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sentAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
  
  // Message
  message?: string;
  
  // Permissions
  canEdit: boolean;
  canInvite: boolean;
}

// Utility functions
export const getTripDuration = (trip: Trip): number => {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

export const getTripProgress = (trip: Trip): number => {
  if (trip.status === 'completed') return 100;
  if (trip.status === 'planning' || trip.status === 'upcoming') return 0;
  
  const now = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
};

export const getTripStatusColor = (status: TripStatus): string => {
  const colors: Record<TripStatus, string> = {
    'planning': '#6B7280',
    'upcoming': '#3B82F6',
    'active': '#10B981',
    'completed': '#8B5CF6',
    'cancelled': '#EF4444',
    'postponed': '#F59E0B',
  };
  return colors[status] || '#6B7280';
};

export const isTripActive = (trip: Trip): boolean => {
  const now = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  
  return now >= start && now <= end && trip.status === 'active';
};

export const isTripUpcoming = (trip: Trip): boolean => {
  const now = new Date();
  const start = new Date(trip.startDate);
  
  return now < start && (trip.status === 'upcoming' || trip.status === 'planning');
};

export const isTripCompleted = (trip: Trip): boolean => {
  return trip.status === 'completed' || 
         (new Date() > new Date(trip.endDate) && trip.status === 'active');
};

// Type guards
export const isTrip = (obj: any): obj is Trip => {
  return obj && typeof obj.id === 'string' && 
         typeof obj.title === 'string' && 
         obj.startDate instanceof Date;
};

export const isTripParticipant = (obj: any): obj is TripParticipant => {
  return obj && typeof obj.id === 'string' && 
         typeof obj.userId === 'string' && 
         typeof obj.role === 'string';
}; 
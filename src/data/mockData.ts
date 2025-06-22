import type { 
  User, UserStats, UserPreferences, PrivacySettings, UserSettings,
  Trip, Entry, Media, Location, Weather, Tag
} from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user_1',
    email: 'alex.journey@example.com',
    name: 'Alex Journey',
    username: 'alexjourney',
    bio: 'Travel enthusiast exploring the world one city at a time 🌍✈️',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    
    verified: true,
    premium: true,
    joinDate: new Date('2023-01-15'),
    lastActiveAt: new Date(),
    
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      units: {
        temperature: 'C',
        distance: 'km',
        speed: 'km/h',
      },
      autoSave: true,
      offlineMode: true,
      dataSync: true,
      notifications: {
        enabled: true,
        types: {
          journalReminders: true,
          tripUpdates: true,
          social: false,
          systemUpdates: true,
          marketing: false,
        },
        frequency: {
          immediate: true,
          daily: false,
          weekly: false,
        },
        quiet: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00',
        },
      },
      defaultPrivacy: 'public',
      autoLocation: true,
      autoWeather: true,
      reminderFrequency: 'daily',
    },
    
    privacy: {
      profileVisibility: 'public',
      allowSearch: true,
      showLocation: true,
      showEmail: false,
      allowMessaging: 'friends',
      analyticsOptOut: false,
      dataSharingOptOut: false,
      defaultEntryPrivacy: 'public',
      defaultTripPrivacy: 'public',
    },
    
    stats: {
      totalTrips: 12,
      totalEntries: 156,
      totalPhotos: 892,
      totalVideos: 23,
      totalCountries: 18,
      totalCities: 45,
      totalDays: 287,
      totalDistance: 89432,
      totalWords: 78523,
      averageWordsPerEntry: 503,
      longestEntry: 2847,
      streakDays: 12,
      longestStreak: 28,
      entriesThisMonth: 23,
      entriesThisYear: 156,
      followers: 234,
      following: 89,
      likes: 1247,
      shares: 156,
      level: 15,
      experience: 7823,
      nextLevelExp: 8500,
      badges: [],
      achievements: [],
      firstTripDate: new Date('2023-02-01'),
      lastTripDate: new Date('2024-11-15'),
      firstEntryDate: new Date('2023-02-01'),
      lastEntryDate: new Date(),
    },
    
    settings: {
      theme: 'auto',
      hapticFeedback: true,
      animations: true,
      autoBackup: true,
      autoCorrect: true,
      spellCheck: true,
      markdownMode: false,
      mapStyle: 'default',
      showTraffic: false,
      show3D: true,
      exportFormat: 'json',
      includeMedia: true,
      imageQuality: 'high',
    },
  }
];

// Mock Locations
export const mockLocations: Location[] = [
  {
    id: 'loc_paris',
    name: 'Paris, France',
    address: 'Paris, Île-de-France, France',
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
    type: 'landmark',
    country: 'France',
    region: 'Île-de-France',
    city: 'Paris',
    category: 'culture',
    visited: true,
    visitedAt: new Date('2024-06-15'),
    rating: 5,
    source: 'search',
  },
  {
    id: 'loc_tokyo',
    name: 'Tokyo, Japan',
    address: 'Tokyo, Japan',
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
    type: 'landmark',
    country: 'Japan',
    region: 'Kantō',
    city: 'Tokyo',
    category: 'culture',
    visited: true,
    visitedAt: new Date('2024-03-22'),
    rating: 5,
    source: 'search',
  },
  {
    id: 'loc_bali',
    name: 'Ubud, Bali',
    address: 'Ubud, Gianyar Regency, Bali, Indonesia',
    coordinates: { latitude: -8.5069, longitude: 115.2625 },
    type: 'landmark',
    country: 'Indonesia',
    region: 'Bali',
    city: 'Ubud',
    category: 'nature',
    visited: true,
    visitedAt: new Date('2024-09-10'),
    rating: 4,
    source: 'search',
  },
];

// Mock Weather Data
export const mockWeather: Weather[] = [
  {
    id: 'weather_1',
    condition: 'sunny',
    temperature: 22,
    temperatureUnit: 'C',
    feelsLike: 24,
    description: 'Clear sunny day',
    icon: 'sunny',
    humidity: 65,
    windSpeed: 12,
    windUnit: 'km/h',
    timestamp: new Date('2024-06-15T12:00:00Z'),
    source: 'openweather',
    lastUpdated: new Date('2024-06-15T12:00:00Z'),
    travelCondition: 'excellent',
  },
  {
    id: 'weather_2',
    condition: 'partly-cloudy',
    temperature: 18,
    temperatureUnit: 'C',
    feelsLike: 19,
    description: 'Partly cloudy',
    icon: 'partly-cloudy',
    humidity: 72,
    windSpeed: 8,
    windUnit: 'km/h',
    timestamp: new Date('2024-03-22T14:00:00Z'),
    source: 'openweather',
    lastUpdated: new Date('2024-03-22T14:00:00Z'),
    travelCondition: 'good',
  },
];

// Mock Tags
export const mockTags: Tag[] = [
  { id: 'tag_1', label: 'Sightseeing', category: 'activities' },
  { id: 'tag_2', label: 'Food Tour', category: 'food' },
  { id: 'tag_3', label: 'Amazing', category: 'mood' },
  { id: 'tag_4', label: 'Culture', category: 'experiences' },
  { id: 'tag_5', label: 'Adventure', category: 'activities' },
  { id: 'tag_6', label: 'Relaxing', category: 'mood' },
  { id: 'tag_7', label: 'Photography', category: 'activities' },
  { id: 'tag_8', label: 'Local Cuisine', category: 'food' },
];

// Mock Media
export const mockMedia: Media[] = [
  {
    id: 'media_1',
    type: 'photo',
    uri: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600',
    filename: 'paris_eiffel_tower.jpg',
    size: 1024000,
    width: 800,
    height: 600,
    format: 'jpg',
    quality: 'high',
    metadata: {
      fileSize: 1024000,
      mimeType: 'image/jpeg',
    },
    takenAt: new Date('2024-06-15T15:30:00Z'),
    uploadedAt: new Date('2024-06-15T16:00:00Z'),
    processed: true,
    thumbnail: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=200&h=150',
    tags: ['paris', 'eiffel-tower', 'landmark'],
    ownerId: 'user_1',
    privacy: 'public',
    featured: true,
    synced: true,
    views: 45,
    likes: 12,
    downloads: 3,
  },
];

// Mock Trips
export const mockTrips: Trip[] = [
  {
    id: 'trip_1',
    title: 'European Adventure',
    description: 'A magical journey through the heart of Europe, exploring historic cities, incredible cuisine, and meeting wonderful people along the way.',
    destination: 'Paris, Rome, Barcelona',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-15'),
    plannedDuration: 14,
    actualDuration: 14,
    coverImage: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300',
    media: [],
    entries: [],
    locations: [mockLocations[0]],
    type: 'vacation',
    status: 'completed',
    privacy: 'public',
    ownerId: 'user_1',
    participants: [],
    collaborators: [],
    transportMethods: [],
    accommodations: [],
    stats: {
      totalDays: 14,
      entriesCount: 18,
      photosCount: 127,
      videosCount: 4,
      locationsCount: 8,
      totalDistance: 2847,
      distanceByTransport: {},
      countriesVisited: ['France', 'Italy', 'Spain'],
      citiesVisited: ['Paris', 'Rome', 'Barcelona'],
      continentsVisited: ['Europe'],
      totalWords: 8493,
      averageWordsPerEntry: 472,
      longestEntry: 1247,
      activeDays: 12,
      quietDays: 2,
      averageEntriesPerDay: 1.3,
      likes: 89,
      comments: 23,
      shares: 12,
      views: 456,
      achievements: [],
      milestones: [],
    },
    tags: ['europe', 'culture', 'food', 'sightseeing'],
    categories: ['vacation', 'international'],
    mood: 'amazing',
    rating: 5,
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-06-20'),
    shared: true,
    featured: true,
    synced: true,
    archived: false,
    deleted: false,
    plannedActivities: ['Visit Louvre Museum', 'Eiffel Tower Tour', 'Seine River Cruise'],
    checklist: [],
    highlights: ['Amazing food in Rome', 'Sunset at Eiffel Tower', 'Gaudi architecture in Barcelona'],
    recommendations: ['Try the pasta in Trastevere', 'Book Sagrada Familia in advance'],
    lessonsLearned: ['Always carry a portable charger', 'Learn basic local phrases'],
  }
];

// Mock Entries
export const mockEntries: Entry[] = [
  {
    id: 'entry_1',
    title: 'First Day in Paris - The City of Light',
    content: `What an incredible start to our European adventure! Landing in Paris felt like stepping into a movie. The moment we walked out of Charles de Gaulle airport, the excitement was palpable.

**Morning Adventures**
Started our day with the most amazing croissants and café au lait at a tiny bistro near our hotel. The flaky, buttery pastry melted in my mouth - nothing like the croissants back home! The locals were so friendly, and even with my broken French, they were patient and helpful.

**Afternoon Exploration** 
We spent the afternoon wandering through the Latin Quarter. The cobblestone streets, the old bookshops, the street musicians - it's like Paris has this magical energy that you can feel in every corner. We stumbled upon this amazing little cheese shop where the owner gave us samples of at least 10 different cheeses!

**Evening Magic**
As evening approached, we made our way to the Eiffel Tower. Seeing it for the first time... wow. Photos don't do it justice. As the sun set and the tower lit up, I got a bit emotional. Sometimes you need to travel to realize how beautiful the world really is.

Tomorrow we're planning to visit the Louvre. Can't wait to see the Mona Lisa in person!`,
    summary: 'Incredible first day in Paris with amazing food, friendly locals, and the magical Eiffel Tower at sunset.',
    tripId: 'trip_1',
    date: new Date('2024-06-01'),
    location: mockLocations[0],
    weather: mockWeather[0],
    tags: [mockTags[0], mockTags[1], mockTags[2]],
    categories: ['daily', 'sightseeing'],
    mood: 'excited',
    media: [mockMedia[0]],
    wordCount: 247,
    readingTime: 2,
    privacy: 'public',
    published: true,
    featured: true,
    authorId: 'user_1',
    collaborators: [],
    isDraft: false,
    version: 1,
    createdAt: new Date('2024-06-01T20:00:00Z'),
    updatedAt: new Date('2024-06-01T20:15:00Z'),
    publishedAt: new Date('2024-06-01T20:15:00Z'),
    likes: 23,
    comments: 7,
    shares: 4,
    views: 156,
    format: 'markdown',
    travelDay: 1,
    activities: [],
    highlights: ['First croissant in Paris', 'Eiffel Tower at sunset'],
    challenges: ['Language barrier', 'Jet lag'],
    lessons: ['Learn basic French phrases', 'Book restaurants in advance'],
    recommendations: ['Visit Eiffel Tower at sunset', 'Try local bistros'],
    synced: true,
    localOnly: false,
    deleted: false,
    engagement: {
      viewCount: 156,
      uniqueViews: 134,
      likeCount: 23,
      commentCount: 7,
      shareCount: 4,
      averageReadTime: 120,
      completionRate: 87,
      viewsByCountry: { 'US': 89, 'CA': 23, 'UK': 15, 'FR': 29 },
      viewsByHour: {},
      viewsByDay: {},
      referralSources: { 'direct': 67, 'social': 45, 'search': 44 },
      deviceTypes: { 'mobile': 89, 'desktop': 45, 'tablet': 22 },
      recentViews: [],
      recentLikes: [],
      recentComments: [],
    },
    relatedEntries: [],
    references: [],
    customFields: {},
  }
];

// Data generators for creating more mock data
export const DataGenerators = {
  generateUser: (overrides?: Partial<User>): User => {
    const baseUser = mockUsers[0];
    return {
      ...baseUser,
      id: `user_${Date.now()}`,
      ...overrides,
    };
  },

  generateTrip: (userId: string, overrides?: Partial<Trip>): Trip => {
    const destinations = [
      'Tokyo, Japan', 'Bali, Indonesia', 'Iceland', 'Morocco', 'Thailand',
      'New Zealand', 'Peru', 'Greece', 'Portugal', 'Costa Rica'
    ];
    
    const tripTypes = ['vacation', 'business', 'adventure', 'backpacking', 'family'];
    const startDate = new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 21) + 3; // 3-23 days
    
    return {
      ...mockTrips[0],
      id: `trip_${Date.now()}`,
      title: `Amazing ${destinations[Math.floor(Math.random() * destinations.length)]} Adventure`,
      destination: destinations[Math.floor(Math.random() * destinations.length)],
      type: tripTypes[Math.floor(Math.random() * tripTypes.length)] as any,
      startDate,
      endDate: new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000),
      plannedDuration: duration,
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  generateEntry: (tripId: string, userId: string, overrides?: Partial<Entry>): Entry => {
    const titles = [
      'Exploring Local Markets',
      'Sunset Views and Reflections',
      'Cultural Immersion Day',
      'Adventure in the Mountains',
      'Beach Day Bliss',
      'City Walking Tour',
      'Food Discovery Journey',
      'Museum and Art Day',
      'Local Festival Experience',
      'Hidden Gems Discovery'
    ];

    const moods = ['amazing', 'great', 'good', 'excited', 'happy', 'peaceful', 'adventurous'];
    
    return {
      ...mockEntries[0],
      id: `entry_${Date.now()}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      tripId,
      authorId: userId,
      mood: moods[Math.floor(Math.random() * moods.length)] as any,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },
};

// Helper function to get all mock data
export const getAllMockData = () => ({
  users: mockUsers,
  trips: mockTrips,
  entries: mockEntries,
  media: mockMedia,
  locations: mockLocations,
  weather: mockWeather,
  tags: mockTags,
});

// Helper function to get mock data for specific user
export const getMockDataForUser = (userId: string) => ({
  user: mockUsers.find(u => u.id === userId),
  trips: mockTrips.filter(t => t.ownerId === userId),
  entries: mockEntries.filter(e => e.authorId === userId),
  media: mockMedia.filter(m => m.ownerId === userId),
}); 
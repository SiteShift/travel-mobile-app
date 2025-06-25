import { TripStory, EnhancedMemory, EnhancedTripDay } from '../types/tripDetail';

// Rich mock memories with detailed metadata
const createMockMemories = (): EnhancedMemory[] => [
  {
    id: 'mem_1',
    type: 'photo',
    uri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=200',
    width: 800,
    height: 533,
    timestamp: new Date('2024-06-15T08:24:00Z'),
    location: {
      name: 'Bixby Creek Bridge',
      coordinates: [-121.9018, 36.3728],
      address: 'Highway 1, Big Sur, CA'
    },
    caption: 'Morning coffee with the most incredible view. This bridge never gets old! ☕️',
    mood: 'peaceful',
    rating: 5,
    people: [
      { id: 'user_1', name: 'You', position: { x: 0.3, y: 0.7 } },
      { id: 'user_2', name: 'Sarah', avatar: 'https://i.pravatar.cc/100?img=1', position: { x: 0.7, y: 0.6 } }
    ],
    weather: {
      condition: 'Partly Cloudy',
      temperature: 65,
      icon: '⛅️'
    },
    tags: ['bridge', 'coffee', 'morning', 'big sur', 'scenic'],
    isHighlight: true,
    camera: {
      make: 'Apple',
      model: 'iPhone 15 Pro',
      settings: 'f/1.8, 1/240s, ISO 100'
    },
    viewCount: 23,
    shareCount: 5
  },
  {
    id: 'mem_2',
    type: 'video',
    uri: 'https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_1mb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200',
    width: 800,
    height: 1120,
    duration: 15,
    timestamp: new Date('2024-06-15T11:47:00Z'),
    location: {
      name: 'McWay Falls',
      coordinates: [-121.6694, 36.1596],
      address: 'McWay Falls Trail, Big Sur, CA'
    },
    caption: 'Found this hidden waterfall! The sound is incredible 🌊',
    mood: 'amazing',
    rating: 5,
    people: [
      { id: 'user_3', name: 'Mike', avatar: 'https://i.pravatar.cc/100?img=3' }
    ],
    weather: {
      condition: 'Sunny',
      temperature: 72,
      icon: '☀️'
    },
    tags: ['waterfall', 'hiking', 'nature', 'hidden gem'],
    isHighlight: true,
    viewCount: 45,
    shareCount: 12
  },
  {
    id: 'mem_3',
    type: 'photo',
    uri: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=200',
    width: 800,
    height: 1200,
    timestamp: new Date('2024-06-15T15:20:00Z'),
    location: {
      name: 'Nepenthe Restaurant',
      coordinates: [-121.8093, 36.2691],
      address: '48510 CA-1, Big Sur, CA'
    },
    caption: 'Best Ambrosia burger on the coast! Worth every calorie 🍔',
    mood: 'fun',
    rating: 4,
    people: [
      { id: 'user_1', name: 'You' },
      { id: 'user_2', name: 'Sarah', avatar: 'https://i.pravatar.cc/100?img=1' },
      { id: 'user_3', name: 'Mike', avatar: 'https://i.pravatar.cc/100?img=3' }
    ],
    weather: {
      condition: 'Clear',
      temperature: 75,
      icon: '☀️'
    },
    tags: ['food', 'restaurant', 'lunch', 'friends', 'famous'],
    viewCount: 18,
    shareCount: 3
  },
  {
    id: 'mem_4',
    type: 'photo',
    uri: 'https://images.unsplash.com/photo-1499591934337-9195ba476839?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1499591934337-9195ba476839?w=200',
    width: 800,
    height: 800,
    timestamp: new Date('2024-06-15T19:45:00Z'),
    location: {
      name: 'Big Sur Coastline',
      coordinates: [-121.8082, 36.2704],
      address: 'Highway 1, Big Sur, CA'
    },
    caption: 'Golden hour magic. This light was unreal! ✨',
    mood: 'amazing',
    rating: 5,
    weather: {
      condition: 'Clear',
      temperature: 68,
      icon: '🌅'
    },
    tags: ['sunset', 'golden hour', 'coastline', 'magical'],
    isHighlight: true,
    camera: {
      make: 'Apple',
      model: 'iPhone 15 Pro',
      settings: 'f/2.8, 1/60s, ISO 200'
    },
    viewCount: 67,
    shareCount: 15
  },
  {
    id: 'mem_5',
    type: 'photo',
    uri: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=200',
    width: 800,
    height: 533,
    timestamp: new Date('2024-06-15T21:30:00Z'),
    location: {
      name: 'Glen Oaks Big Sur',
      coordinates: [-121.7771, 36.2432],
      address: '47080 CA-1, Big Sur, CA'
    },
    caption: 'Cozy cabin vibes. Perfect end to an epic day 🏠',
    mood: 'peaceful',
    rating: 4,
    people: [
      { id: 'user_2', name: 'Sarah', avatar: 'https://i.pravatar.cc/100?img=1' }
    ],
    weather: {
      condition: 'Clear',
      temperature: 62,
      icon: '🌙'
    },
    tags: ['cabin', 'accommodation', 'cozy', 'evening'],
    viewCount: 12,
    shareCount: 2
  }
];

const createEnhancedTripDays = (): EnhancedTripDay[] => {
  const memories = createMockMemories();
  
  return [
    {
      day: 1,
      date: new Date('2024-06-15'),
      memories: memories,
      title: 'Big Sur Discovery',
      description: 'Our first day exploring the magical Big Sur coastline',
      mood: 'amazing',
      rating: 5,
      primaryLocation: {
        name: 'Big Sur, California',
        coordinates: [-121.8082, 36.2704]
      },
      activities: ['Scenic Drive', 'Hiking', 'Photography', 'Fine Dining'],
      distanceTraveled: 127,
      timeSpent: 720, // 12 hours
      weather: {
        condition: 'Partly Cloudy to Clear',
        temperature: 70,
        icon: '⛅️'
      },
      highlights: [
        'Discovered McWay Falls waterfall',
        'Amazing sunset at Bixby Bridge',
        'Best Ambrosia burger at Nepenthe'
      ],
      challenges: [
        'Winding roads made Sarah carsick',
        'Crowded parking at popular viewpoints'
      ],
      learnings: [
        'Start early to beat the crowds',
        'Bring motion sickness medicine',
        'Book restaurants in advance'
      ],
      sharedWith: ['Sarah', 'Mike'],
      photoCount: 4,
      videoCount: 1,
      bestPhoto: 'mem_4', // Golden hour shot
      isPublic: false
    },
    {
      day: 2,
      date: new Date('2024-06-16'),
      memories: [],
      title: 'Monterey Bay Adventure',
      description: 'Exploring the aquarium and Cannery Row',
      mood: 'fun',
      rating: 4,
      primaryLocation: {
        name: 'Monterey, California',
        coordinates: [-121.8947, 36.6002]
      },
      activities: ['Aquarium Visit', 'Sea Otters', 'Cannery Row', 'Seafood'],
      distanceTraveled: 45,
      timeSpent: 480, // 8 hours
      weather: {
        condition: 'Foggy Morning, Clear Afternoon',
        temperature: 68,
        icon: '🌫️'
      },
      highlights: [
        'Sea otter feeding show',
        'Interactive kelp forest exhibit',
        'Fresh clam chowder at Fishermans Wharf'
      ],
      photoCount: 0,
      videoCount: 0,
      sharedWith: ['Sarah', 'Mike'],
      isPublic: false
    },
    {
      day: 3,
      date: new Date('2024-06-17'),
      memories: [],
      title: 'Carmel-by-the-Sea',
      description: 'Charming fairy-tale village exploration',
      mood: 'peaceful',
      rating: 4,
      primaryLocation: {
        name: 'Carmel-by-the-Sea, California',
        coordinates: [-121.9233, 36.5552]
      },
      activities: ['Village Walk', 'Art Galleries', 'Beach Time', 'Wine Tasting'],
      distanceTraveled: 32,
      timeSpent: 360, // 6 hours
      weather: {
        condition: 'Sunny',
        temperature: 72,
        icon: '☀️'
      },
      highlights: [
        'Fairy-tale cottages architecture',
        'White sand beach at Carmel Beach',
        'Local wine tasting'
      ],
      photoCount: 0,
      videoCount: 0,
      sharedWith: ['Sarah', 'Mike'],
      isPublic: false
    },
    {
      day: 4,
      date: new Date('2024-06-18'),
      memories: [],
      title: 'San Francisco Return',
      description: 'Journey back through Santa Cruz',
      mood: 'memorable',
      rating: 3,
      primaryLocation: {
        name: 'Santa Cruz, California',
        coordinates: [-122.0308, 36.9741]
      },
      activities: ['Beach Boardwalk', 'Roller Coaster', 'Drive Home'],
      distanceTraveled: 156,
      timeSpent: 540, // 9 hours
      weather: {
        condition: 'Overcast',
        temperature: 65,
        icon: '☁️'
      },
      highlights: [
        'Classic boardwalk experience',
        'Vintage roller coaster ride',
        'Final group photo'
      ],
      challenges: [
        'Traffic on Highway 101',
        'Sad to leave such beautiful places'
      ],
      photoCount: 0,
      videoCount: 0,
      sharedWith: ['Sarah', 'Mike'],
      isPublic: false
    }
  ];
};

export const mockTripStory: TripStory = {
  id: 'trip_cal_roadtrip_2024',
  title: 'California Coast Adventure',
  description: 'Four unforgettable days exploring Big Sur, Monterey, and Carmel with my best friends',
  coverImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
  
  startDate: new Date('2024-06-15'),
  endDate: new Date('2024-06-18'),
  totalDays: 4,
  days: createEnhancedTripDays(),
  
  totalMemories: 5,
  totalPhotos: 4,
  totalVideos: 1,
  totalDistance: 360,
  
  travelers: [
    {
      id: 'user_1',
      name: 'You',
      role: 'owner'
    },
    {
      id: 'user_2',
      name: 'Sarah Chen',
      avatar: 'https://i.pravatar.cc/100?img=1',
      role: 'traveler'
    },
    {
      id: 'user_3',
      name: 'Mike Rodriguez',
      avatar: 'https://i.pravatar.cc/100?img=3',
      role: 'traveler'
    }
  ],
  
  viewMode: 'story',
  isCollaborative: true,
  privacy: 'friends',
  
  views: 156,
  likes: 23,
  shares: 7,
  
  createdAt: new Date('2024-06-15'),
  updatedAt: new Date('2024-06-20')
};

// Utility functions for mock data
export const getMoodEmoji = (mood: EnhancedTripDay['mood']): string => {
  const moodMap = {
    amazing: '🤩',
    fun: '😄',
    peaceful: '😌',
    exciting: '🎉',
    challenging: '😤',
    memorable: '🥰'
  };
  return moodMap[mood];
};

export const getWeatherIcon = (condition: string): string => {
  const weatherMap: { [key: string]: string } = {
    'Sunny': '☀️',
    'Clear': '☀️',
    'Partly Cloudy': '⛅️',
    'Cloudy': '☁️',
    'Overcast': '☁️',
    'Foggy': '🌫️',
    'Rainy': '🌧️',
    'Stormy': '⛈️'
  };
  return weatherMap[condition] || '☀️';
};

export const getActivityIcon = (activity: string): string => {
  const activityMap: { [key: string]: string } = {
    'Scenic Drive': '🚗',
    'Hiking': '🥾',
    'Photography': '📸',
    'Fine Dining': '🍽️',
    'Aquarium Visit': '🐠',
    'Sea Otters': '🦦',
    'Cannery Row': '🏛️',
    'Seafood': '🦀',
    'Village Walk': '🚶‍♀️',
    'Art Galleries': '🎨',
    'Beach Time': '🏖️',
    'Wine Tasting': '🍷',
    'Beach Boardwalk': '🎠',
    'Roller Coaster': '🎢'
  };
  return activityMap[activity] || '✨';
}; 
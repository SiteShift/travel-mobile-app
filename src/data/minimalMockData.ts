import { MinimalTrip, MinimalMemory, MinimalDay } from '../types/tripDetailMinimal';

// Clean, simple mock data focusing on the memories
const createMinimalMemories = (): MinimalMemory[] => [
  {
    id: 'mem_1',
    uri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400',
    caption: 'Morning coffee at Bixby Bridge ☕️',
    timestamp: new Date('2024-06-15T08:24:00Z'),
    aspectRatio: 1.5
  },
  {
    id: 'mem_2',
    uri: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
    caption: 'Found this hidden waterfall!',
    timestamp: new Date('2024-06-15T11:47:00Z'),
    aspectRatio: 0.75
  },
  {
    id: 'mem_3',
    uri: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400',
    caption: 'Best burger on the coast 🍔',
    timestamp: new Date('2024-06-15T15:20:00Z'),
    aspectRatio: 0.67
  },
  {
    id: 'mem_4',
    uri: 'https://images.unsplash.com/photo-1499591934337-9195ba476839?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1499591934337-9195ba476839?w=400',
    caption: 'Golden hour magic ✨',
    timestamp: new Date('2024-06-15T19:45:00Z'),
    aspectRatio: 1.0
  },
  {
    id: 'mem_5',
    uri: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=400',
    // No caption - and that's perfectly fine!
    timestamp: new Date('2024-06-15T21:30:00Z'),
    aspectRatio: 1.5
  }
];

const createMinimalDays = (): MinimalDay[] => [
  {
    day: 1,
    date: new Date('2024-06-15'),
    memories: [], // Start blank as requested
    location: 'Big Sur'
  }
];

export const minimalTripData: MinimalTrip = {
  id: 'trip_cal_2024',
  title: 'California Road Trip',
  coverImage: require('../../assets/images/california-road-trip.jpg'),
  startDate: new Date('2024-06-15'),
  endDate: new Date('2024-06-18'),
  days: createMinimalDays(),
  totalPhotos: 0 // Start with 0 photos
};

// Helper to format dates cleanly
export const formatTripDates = (start: Date, end: Date): string => {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  return `${startStr} - ${endStr}`;
};

// Helper to get day of week
export const getDayOfWeek = (date: Date | undefined): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}; 
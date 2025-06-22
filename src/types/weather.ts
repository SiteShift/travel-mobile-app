export interface Weather {
  id: string;
  condition: WeatherCondition;
  temperature: number;
  temperatureUnit: 'C' | 'F';
  feelsLike?: number;
  
  // Basic Weather Data
  description: string;
  icon: string;
  humidity?: number; // percentage
  pressure?: number; // hPa
  visibility?: number; // km
  uvIndex?: number;
  
  // Wind Information
  windSpeed?: number;
  windDirection?: number; // degrees
  windUnit: 'km/h' | 'mph' | 'm/s';
  windGust?: number;
  
  // Precipitation
  precipitation?: number; // mm
  precipitationProbability?: number; // percentage
  precipitationType?: 'rain' | 'snow' | 'sleet' | 'hail';
  
  // Location & Time
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  timezone?: string;
  
  // Data Source
  source: WeatherSource;
  accuracy?: number;
  lastUpdated: Date;
  
  // Extended Data
  sunrise?: string; // "06:30"
  sunset?: string; // "19:45"
  moonPhase?: string;
  
  // Air Quality
  airQuality?: AirQuality;
  
  // Alerts
  alerts?: WeatherAlert[];
  
  // Travel Specific
  travelCondition: TravelCondition;
  clothingRecommendation?: ClothingRecommendation;
}

export type WeatherCondition = 
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'overcast'
  | 'rainy'
  | 'drizzle'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snowy'
  | 'light-snow'
  | 'heavy-snow'
  | 'sleet'
  | 'hail'
  | 'foggy'
  | 'misty'
  | 'windy'
  | 'clear'
  | 'hot'
  | 'cold';

export type WeatherSource = 
  | 'openweather'
  | 'weatherapi'
  | 'manual'
  | 'estimated'
  | 'user-input';

export type TravelCondition = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'dangerous';

export interface AirQuality {
  aqi: number; // Air Quality Index
  level: 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
  pm25?: number;
  pm10?: number;
  ozone?: number;
  no2?: number;
  so2?: number;
  co?: number;
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  areas: string[];
}

export interface ClothingRecommendation {
  layers: number; // 1-3
  items: ClothingItem[];
  accessories: string[];
  footwear: string;
  notes?: string;
}

export interface ClothingItem {
  type: 'shirt' | 'pants' | 'jacket' | 'sweater' | 'coat' | 'shorts' | 'dress';
  material: 'cotton' | 'wool' | 'synthetic' | 'waterproof' | 'breathable';
  warmth: 'light' | 'medium' | 'warm' | 'very-warm';
}

export interface WeatherForecast {
  current: Weather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  location: {
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  lastUpdated: Date;
}

export interface HourlyForecast {
  time: Date;
  condition: WeatherCondition;
  temperature: number;
  precipitation?: number;
  precipitationProbability?: number;
  windSpeed?: number;
  windDirection?: number;
}

export interface DailyForecast {
  date: Date;
  condition: WeatherCondition;
  temperatureHigh: number;
  temperatureLow: number;
  precipitation?: number;
  precipitationProbability?: number;
  windSpeed?: number;
  windDirection?: number;
  sunrise?: string;
  sunset?: string;
  summary?: string;
}

export interface WeatherHistory {
  date: Date;
  weather: Weather;
  location: string;
  entryId?: string;
  tripId?: string;
}

export interface WeatherPreferences {
  temperatureUnit: 'C' | 'F';
  windUnit: 'km/h' | 'mph' | 'm/s';
  pressureUnit: 'hPa' | 'inHg' | 'mmHg';
  precipitationUnit: 'mm' | 'in';
  
  // Display Preferences
  showFeelsLike: boolean;
  showHumidity: boolean;
  showWind: boolean;
  showPressure: boolean;
  showUvIndex: boolean;
  showAirQuality: boolean;
  
  // Auto-detection
  autoDetectWeather: boolean;
  updateFrequency: 'manual' | 'hourly' | 'daily';
}

export interface WeatherStats {
  totalRecords: number;
  favoriteCondition?: WeatherCondition;
  averageTemperature: number;
  hottestDay?: {
    temperature: number;
    date: Date;
    location: string;
  };
  coldestDay?: {
    temperature: number;
    date: Date;
    location: string;
  };
  rainyDays: number;
  sunnyDays: number;
  
  // Seasonal Stats
  spring: SeasonalStats;
  summer: SeasonalStats;
  autumn: SeasonalStats;
  winter: SeasonalStats;
}

export interface SeasonalStats {
  averageTemperature: number;
  totalDays: number;
  favoriteCondition?: WeatherCondition;
  destinations: string[];
}

// Weather utility functions
export const getWeatherIcon = (condition: WeatherCondition): string => {
  const iconMap: Record<WeatherCondition, string> = {
    'sunny': '☀️',
    'partly-cloudy': '⛅',
    'cloudy': '☁️',
    'overcast': '☁️',
    'rainy': '🌧️',
    'drizzle': '🌦️',
    'heavy-rain': '⛈️',
    'thunderstorm': '⛈️',
    'snowy': '❄️',
    'light-snow': '🌨️',
    'heavy-snow': '❄️',
    'sleet': '🌨️',
    'hail': '🌨️',
    'foggy': '🌫️',
    'misty': '🌫️',
    'windy': '💨',
    'clear': '🌙',
    'hot': '🌡️',
    'cold': '🥶',
  };
  return iconMap[condition] || '🌤️';
};

export const getWeatherDescription = (condition: WeatherCondition): string => {
  const descriptions: Record<WeatherCondition, string> = {
    'sunny': 'Bright and sunny',
    'partly-cloudy': 'Partly cloudy',
    'cloudy': 'Cloudy',
    'overcast': 'Overcast skies',
    'rainy': 'Rainy',
    'drizzle': 'Light rain',
    'heavy-rain': 'Heavy rain',
    'thunderstorm': 'Thunderstorm',
    'snowy': 'Snow',
    'light-snow': 'Light snow',
    'heavy-snow': 'Heavy snow',
    'sleet': 'Sleet',
    'hail': 'Hail',
    'foggy': 'Foggy',
    'misty': 'Misty',
    'windy': 'Windy',
    'clear': 'Clear night',
    'hot': 'Hot',
    'cold': 'Cold',
  };
  return descriptions[condition] || 'Unknown';
};

export const getTravelCondition = (weather: Weather): TravelCondition => {
  const { condition, temperature, windSpeed } = weather;
  
  // Dangerous conditions
  if (condition === 'thunderstorm' || condition === 'heavy-rain' || 
      condition === 'heavy-snow' || condition === 'hail') {
    return 'dangerous';
  }
  
  // Poor conditions
  if (condition === 'rainy' || condition === 'snowy' || 
      temperature < -10 || temperature > 40 || 
      (windSpeed && windSpeed > 50)) {
    return 'poor';
  }
  
  // Fair conditions
  if (condition === 'cloudy' || condition === 'overcast' || 
      condition === 'drizzle' || condition === 'light-snow' ||
      temperature < 5 || temperature > 35) {
    return 'fair';
  }
  
  // Good conditions
  if (condition === 'partly-cloudy' || condition === 'foggy' || 
      condition === 'misty') {
    return 'good';
  }
  
  // Excellent conditions
  return 'excellent';
};

// Type guards
export const isWeather = (obj: any): obj is Weather => {
  return obj && typeof obj.condition === 'string' && 
         typeof obj.temperature === 'number' && 
         obj.timestamp instanceof Date;
};

export const isWeatherCondition = (condition: string): condition is WeatherCondition => {
  const conditions: WeatherCondition[] = [
    'sunny', 'partly-cloudy', 'cloudy', 'overcast', 'rainy', 'drizzle',
    'heavy-rain', 'thunderstorm', 'snowy', 'light-snow', 'heavy-snow',
    'sleet', 'hail', 'foggy', 'misty', 'windy', 'clear', 'hot', 'cold'
  ];
  return conditions.includes(condition as WeatherCondition);
}; 
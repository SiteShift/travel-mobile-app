import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { BottomSheet } from './BottomSheet';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface WeatherData {
  condition: string;
  temperature: number;
  temperatureUnit: 'C' | 'F';
  description?: string;
  humidity?: number;
  windSpeed?: number;
  windUnit?: 'km/h' | 'mph';
  icon: string;
  feelsLike?: number;
  visibility?: number;
}

export interface WeatherDisplayProps {
  weather?: WeatherData;
  onWeatherSelect?: (weather: WeatherData) => void;
  showPicker?: boolean;
  compact?: boolean;
  editable?: boolean;
  style?: any;
  testID?: string;
}

export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  weather,
  onWeatherSelect,
  showPicker = true,
  compact = false,
  editable = true,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const weatherOptions: WeatherData[] = [
    {
      condition: 'sunny',
      temperature: 25,
      temperatureUnit: 'C',
      description: 'Sunny',
      icon: 'sunny',
      humidity: 45,
      windSpeed: 10,
      windUnit: 'km/h',
      feelsLike: 27,
      visibility: 10,
    },
    {
      condition: 'partly-cloudy',
      temperature: 22,
      temperatureUnit: 'C',
      description: 'Partly Cloudy',
      icon: 'partly-cloudy',
      humidity: 55,
      windSpeed: 15,
      windUnit: 'km/h',
      feelsLike: 24,
      visibility: 8,
    },
    {
      condition: 'cloudy',
      temperature: 20,
      temperatureUnit: 'C',
      description: 'Cloudy',
      icon: 'cloud',
      humidity: 70,
      windSpeed: 12,
      windUnit: 'km/h',
      feelsLike: 20,
      visibility: 6,
    },
    {
      condition: 'rainy',
      temperature: 18,
      temperatureUnit: 'C',
      description: 'Rainy',
      icon: 'rainy',
      humidity: 85,
      windSpeed: 20,
      windUnit: 'km/h',
      feelsLike: 16,
      visibility: 3,
    },
    {
      condition: 'stormy',
      temperature: 16,
      temperatureUnit: 'C',
      description: 'Stormy',
      icon: 'thunderstorm',
      humidity: 90,
      windSpeed: 35,
      windUnit: 'km/h',
      feelsLike: 14,
      visibility: 2,
    },
    {
      condition: 'snowy',
      temperature: -2,
      temperatureUnit: 'C',
      description: 'Snowy',
      icon: 'snow',
      humidity: 80,
      windSpeed: 25,
      windUnit: 'km/h',
      feelsLike: -5,
      visibility: 1,
    },
    {
      condition: 'foggy',
      temperature: 15,
      temperatureUnit: 'C',
      description: 'Foggy',
      icon: 'fog',
      humidity: 95,
      windSpeed: 5,
      windUnit: 'km/h',
      feelsLike: 15,
      visibility: 0.5,
    },
    {
      condition: 'windy',
      temperature: 19,
      temperatureUnit: 'C',
      description: 'Windy',
      icon: 'wind',
      humidity: 60,
      windSpeed: 40,
      windUnit: 'km/h',
      feelsLike: 17,
      visibility: 8,
    },
  ];

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return 'sunny';
      case 'partly-cloudy':
      case 'partly cloudy':
        return 'partly-cloudy';
      case 'cloudy':
      case 'overcast':
        return 'cloud';
      case 'rainy':
      case 'rain':
        return 'rainy';
      case 'stormy':
      case 'thunderstorm':
        return 'thunderstorm';
      case 'snowy':
      case 'snow':
        return 'snow';
      case 'foggy':
      case 'fog':
        return 'fog';
      case 'windy':
        return 'wind';
      default:
        return 'thermometer';
    }
  };

  const getWeatherColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return colors.warning[500];
      case 'partly-cloudy':
        return colors.info[500];
      case 'cloudy':
      case 'overcast':
        return colors.neutral[400];
      case 'rainy':
      case 'rain':
        return colors.info[600];
      case 'stormy':
      case 'thunderstorm':
        return colors.secondary[600];
      case 'snowy':
      case 'snow':
        return colors.info[300];
      case 'foggy':
      case 'fog':
        return colors.neutral[500];
      case 'windy':
        return colors.primary[500];
      default:
        return colors.text.secondary;
    }
  };

  const formatTemperature = (temp: number, unit: 'C' | 'F') => {
    return `${temp}°${unit}`;
  };

  const handleWeatherSelect = (selectedWeather: WeatherData) => {
    onWeatherSelect?.(selectedWeather);
    setIsPickerVisible(false);
  };

  const handlePress = () => {
    if (editable && showPicker) {
      setIsPickerVisible(true);
    }
  };

  const renderWeatherOption = ({ item }: { item: WeatherData }) => (
    <TouchableOpacity
      style={[
        styles.weatherOption,
        { borderBottomColor: colors.border.primary }
      ]}
      onPress={() => handleWeatherSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.weatherOptionLeft}>
        <Icon
          name={getWeatherIcon(item.condition)}
          size="lg"
          color={getWeatherColor(item.condition)}
          style={styles.weatherOptionIcon}
        />
        
        <View style={styles.weatherOptionInfo}>
          <Text style={[styles.weatherOptionTitle, { color: colors.text.primary }]}>
            {item.description}
          </Text>
          <Text style={[styles.weatherOptionTemp, { color: colors.text.primary }]}>
            {formatTemperature(item.temperature, item.temperatureUnit)}
          </Text>
          {item.feelsLike && (
            <Text style={[styles.weatherOptionFeels, { color: colors.text.secondary }]}>
              Feels like {formatTemperature(item.feelsLike, item.temperatureUnit)}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.weatherOptionRight}>
        {item.humidity && (
          <View style={styles.weatherDetail}>
            <Icon name="water-drop" size="xs" color={colors.text.tertiary} />
            <Text style={[styles.weatherDetailText, { color: colors.text.tertiary }]}>
              {item.humidity}%
            </Text>
          </View>
        )}
        {item.windSpeed && (
          <View style={styles.weatherDetail}>
            <Icon name="wind" size="xs" color={colors.text.tertiary} />
            <Text style={[styles.weatherDetailText, { color: colors.text.tertiary }]}>
              {item.windSpeed} {item.windUnit}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCompactWeather = () => {
    if (!weather) {
      return (
        <TouchableOpacity
          style={[
            styles.compactContainer,
            styles.emptyCompact,
            { backgroundColor: colors.surface.secondary }
          ]}
          onPress={handlePress}
          disabled={!editable}
        >
          <Icon name="weather-sunny" size="sm" color={colors.text.tertiary} />
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
            Add weather
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          { backgroundColor: colors.surface.secondary }
        ]}
        onPress={handlePress}
        disabled={!editable}
        activeOpacity={0.7}
      >
        <Icon
          name={getWeatherIcon(weather.condition)}
          size="sm"
          color={getWeatherColor(weather.condition)}
        />
        <Text style={[styles.compactTemp, { color: colors.text.primary }]}>
          {formatTemperature(weather.temperature, weather.temperatureUnit)}
        </Text>
        <Text style={[styles.compactDescription, { color: colors.text.secondary }]}>
          {weather.description}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFullWeather = () => {
    if (!weather) {
      return (
        <TouchableOpacity
          style={[
            styles.fullContainer,
            styles.emptyFull,
            { backgroundColor: colors.surface.secondary, borderColor: colors.border.primary }
          ]}
          onPress={handlePress}
          disabled={!editable}
        >
          <Icon name="weather-sunny" size="xxl" color={colors.text.tertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            Add Weather
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            Tap to select current weather conditions
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.fullContainer,
          { backgroundColor: colors.surface.secondary, borderColor: colors.border.primary }
        ]}
        onPress={handlePress}
        disabled={!editable}
        activeOpacity={0.7}
      >
        <View style={styles.fullHeader}>
          <Icon
            name={getWeatherIcon(weather.condition)}
            size="xxl"
            color={getWeatherColor(weather.condition)}
          />
          <View style={styles.fullMainInfo}>
            <Text style={[styles.fullTemp, { color: colors.text.primary }]}>
              {formatTemperature(weather.temperature, weather.temperatureUnit)}
            </Text>
            <Text style={[styles.fullDescription, { color: colors.text.secondary }]}>
              {weather.description}
            </Text>
          </View>
        </View>
        
        {(weather.feelsLike || weather.humidity || weather.windSpeed) && (
          <View style={styles.fullDetails}>
            {weather.feelsLike && (
              <View style={styles.fullDetail}>
                <Text style={[styles.fullDetailLabel, { color: colors.text.tertiary }]}>
                  Feels like
                </Text>
                <Text style={[styles.fullDetailValue, { color: colors.text.secondary }]}>
                  {formatTemperature(weather.feelsLike, weather.temperatureUnit)}
                </Text>
              </View>
            )}
            {weather.humidity && (
              <View style={styles.fullDetail}>
                <Text style={[styles.fullDetailLabel, { color: colors.text.tertiary }]}>
                  Humidity
                </Text>
                <Text style={[styles.fullDetailValue, { color: colors.text.secondary }]}>
                  {weather.humidity}%
                </Text>
              </View>
            )}
            {weather.windSpeed && (
              <View style={styles.fullDetail}>
                <Text style={[styles.fullDetailLabel, { color: colors.text.tertiary }]}>
                  Wind
                </Text>
                <Text style={[styles.fullDetailValue, { color: colors.text.secondary }]}>
                  {weather.windSpeed} {weather.windUnit}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPicker = () => (
    <BottomSheet
      visible={isPickerVisible}
      onClose={() => setIsPickerVisible(false)}
      size="large"
      title="Select Weather"
    >
      <FlatList
        data={weatherOptions}
        renderItem={renderWeatherOption}
        keyExtractor={(item) => item.condition}
        style={styles.pickerList}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheet>
  );

  return (
    <View style={[styles.container, style]} testID={testID}>
      {compact ? renderCompactWeather() : renderFullWeather()}
      {showPicker && renderPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No additional styles needed
  },
  
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  emptyCompact: {
    // Additional styles for empty state
  },
  compactTemp: {
    ...TYPOGRAPHY.styles.bodySmall,
    fontWeight: '600',
  },
  compactDescription: {
    ...TYPOGRAPHY.styles.caption,
  },
  emptyText: {
    ...TYPOGRAPHY.styles.caption,
  },
  
  // Full styles
  fullContainer: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  emptyFull: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fullMainInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  fullTemp: {
    ...TYPOGRAPHY.styles.h2,
    marginBottom: SPACING.xs,
  },
  fullDescription: {
    ...TYPOGRAPHY.styles.body,
  },
  fullDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  fullDetail: {
    alignItems: 'center',
  },
  fullDetailLabel: {
    ...TYPOGRAPHY.styles.caption,
    marginBottom: SPACING.xs,
  },
  fullDetailValue: {
    ...TYPOGRAPHY.styles.bodySmall,
    fontWeight: '600',
  },
  
  // Picker styles
  pickerList: {
    flex: 1,
    maxHeight: 500,
  },
  weatherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  weatherOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherOptionIcon: {
    marginRight: SPACING.md,
  },
  weatherOptionInfo: {
    flex: 1,
  },
  weatherOptionTitle: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  weatherOptionTemp: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: 2,
  },
  weatherOptionFeels: {
    ...TYPOGRAPHY.styles.caption,
  },
  weatherOptionRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  weatherDetailText: {
    ...TYPOGRAPHY.styles.caption,
  },
}); 
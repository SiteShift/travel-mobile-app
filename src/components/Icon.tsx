import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign,
  Entypo,
  FontAwesome5,
} from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

// Icon library types
export type IconLibrary = 
  | 'Ionicons'
  | 'MaterialIcons' 
  | 'MaterialCommunityIcons'
  | 'Feather'
  | 'AntDesign'
  | 'Entypo'
  | 'FontAwesome5';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number;
export type IconColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'text' | 'textSecondary' | 'textDisabled' | 'inverse' | string;

// Travel-themed icon presets
export type TravelIconName =
  // Navigation & Travel
  | 'map'
  | 'compass'
  | 'location'
  | 'pin'
  | 'route'
  | 'navigation'
  | 'airplane'
  | 'car'
  | 'train'
  | 'bus'
  | 'ship'
  | 'bicycle'
  | 'walk'
  
  // Accommodation & Places
  | 'hotel'
  | 'home'
  | 'tent'
  | 'mountain'
  | 'beach'
  | 'city'
  | 'building'
  | 'restaurant'
  | 'cafe'
  | 'shop'
  
  // Activities & Adventure
  | 'camera'
  | 'photo'
  | 'video'
  | 'hiking'
  | 'swimming'
  | 'skiing'
  | 'climbing'
  | 'diving'
  | 'fishing'
  | 'camping'
  | 'adventure'
  | 'flash'
  | 'flash-off'
  
  // Journal & Content
  | 'journal'
  | 'note'
  | 'edit'
  | 'write'
  | 'bookmark'
  | 'favorite'
  | 'share'
  | 'tag'
  | 'calendar'
  | 'clock'
  | 'weather'
  | 'sun'
  | 'rain'
  | 'cloud'
  
  // Interface & Actions
  | 'add'
  | 'remove'
  | 'close'
  | 'check'
  | 'search'
  | 'filter'
  | 'settings'
  | 'menu'
  | 'more'
  | 'back'
  | 'forward'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'refresh'
  | 'download'
  | 'upload'
  | 'sync'
  | 'trash'
  
  // User & Social
  | 'user'
  | 'users'
  | 'profile'
  | 'heart'
  | 'like'
  | 'comment'
  | 'message'
  | 'notification'
  | 'bell'
  
  // System & Status
  | 'loading'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'help'
  | 'lock'
  | 'unlock'
  | 'eye'
  | 'eyeOff'
  | 'star'
  | 'flag'
  
  // Additional UI icons
  | 'chevron-right'
  | 'verified'
  | 'award'
  | 'notebook'
  | 'message-circle'
  | 'moon'
  | 'earth'
  | 'briefcase'
  | 'key'
  | 'shield'
  | 'globe'
  | 'help-circle'
  | 'log-out'
  | 'plus'
  | 'grid'
  | 'trash-outline'
  | 'ellipsis-horizontal';

// Icon mapping for travel-themed presets
const TRAVEL_ICON_MAP: Record<TravelIconName, { library: IconLibrary; name: string }> = {
  // Navigation & Travel
  map: { library: 'Ionicons', name: 'map-outline' },
  compass: { library: 'Ionicons', name: 'compass-outline' },
  location: { library: 'Ionicons', name: 'location-outline' },
  pin: { library: 'Ionicons', name: 'location-sharp' },
  route: { library: 'MaterialCommunityIcons', name: 'routes' },
  navigation: { library: 'Ionicons', name: 'navigate-outline' },
  airplane: { library: 'Ionicons', name: 'airplane-outline' },
  car: { library: 'Ionicons', name: 'car-outline' },
  train: { library: 'Ionicons', name: 'train-outline' },
  bus: { library: 'Ionicons', name: 'bus-outline' },
  ship: { library: 'Ionicons', name: 'boat-outline' },
  bicycle: { library: 'Ionicons', name: 'bicycle-outline' },
  walk: { library: 'Ionicons', name: 'walk-outline' },
  
  // Accommodation & Places
  hotel: { library: 'Ionicons', name: 'bed-outline' },
  home: { library: 'Ionicons', name: 'home-outline' },
  tent: { library: 'MaterialCommunityIcons', name: 'tent' },
  mountain: { library: 'Ionicons', name: 'triangle-outline' },
  beach: { library: 'MaterialCommunityIcons', name: 'beach' },
  city: { library: 'Ionicons', name: 'business-outline' },
  building: { library: 'Ionicons', name: 'business-outline' },
  restaurant: { library: 'Ionicons', name: 'restaurant-outline' },
  cafe: { library: 'Ionicons', name: 'cafe-outline' },
  shop: { library: 'Ionicons', name: 'storefront-outline' },
  
  // Activities & Adventure
  camera: { library: 'Ionicons', name: 'camera-outline' },
  photo: { library: 'Ionicons', name: 'image-outline' },
  video: { library: 'Ionicons', name: 'videocam-outline' },
  hiking: { library: 'MaterialCommunityIcons', name: 'hiking' },
  swimming: { library: 'MaterialCommunityIcons', name: 'swim' },
  skiing: { library: 'MaterialCommunityIcons', name: 'ski' },
  climbing: { library: 'MaterialCommunityIcons', name: 'climbing' },
  diving: { library: 'MaterialCommunityIcons', name: 'diving-scuba' },
  fishing: { library: 'MaterialCommunityIcons', name: 'fish' },
  camping: { library: 'MaterialCommunityIcons', name: 'campfire' },
  adventure: { library: 'MaterialCommunityIcons', name: 'compass-rose' },
  flash: { library: 'Ionicons', name: 'flash-outline' },
  'flash-off': { library: 'Ionicons', name: 'flash-off-outline' },
  
  // Journal & Content
  journal: { library: 'Ionicons', name: 'journal-outline' },
  note: { library: 'Ionicons', name: 'document-text-outline' },
  edit: { library: 'Ionicons', name: 'create-outline' },
  write: { library: 'Ionicons', name: 'pencil-outline' },
  bookmark: { library: 'Ionicons', name: 'bookmark-outline' },
  favorite: { library: 'Ionicons', name: 'heart-outline' },
  share: { library: 'Ionicons', name: 'share-outline' },
  tag: { library: 'Ionicons', name: 'pricetag-outline' },
  calendar: { library: 'Ionicons', name: 'calendar-outline' },
  clock: { library: 'Ionicons', name: 'time-outline' },
  weather: { library: 'Ionicons', name: 'partly-sunny-outline' },
  sun: { library: 'Ionicons', name: 'sunny-outline' },
  rain: { library: 'Ionicons', name: 'rainy-outline' },
  cloud: { library: 'Ionicons', name: 'cloud-outline' },
  
  // Interface & Actions
  add: { library: 'Ionicons', name: 'add-outline' },
  remove: { library: 'Ionicons', name: 'remove-outline' },
  close: { library: 'Ionicons', name: 'close-outline' },
  check: { library: 'Ionicons', name: 'checkmark-outline' },
  search: { library: 'Ionicons', name: 'search-outline' },
  filter: { library: 'Ionicons', name: 'filter-outline' },
  settings: { library: 'Ionicons', name: 'settings-outline' },
  menu: { library: 'Ionicons', name: 'menu-outline' },
  more: { library: 'Ionicons', name: 'ellipsis-horizontal-outline' },
  back: { library: 'Ionicons', name: 'arrow-back-outline' },
  forward: { library: 'Ionicons', name: 'arrow-forward-outline' },
  up: { library: 'Ionicons', name: 'arrow-up-outline' },
  down: { library: 'Ionicons', name: 'arrow-down-outline' },
  left: { library: 'Ionicons', name: 'chevron-back-outline' },
  right: { library: 'Ionicons', name: 'chevron-forward-outline' },
  refresh: { library: 'Ionicons', name: 'refresh-outline' },
  download: { library: 'Ionicons', name: 'download-outline' },
  upload: { library: 'Ionicons', name: 'cloud-upload-outline' },
  sync: { library: 'Ionicons', name: 'sync-outline' },
  
  // User & Social
  user: { library: 'Ionicons', name: 'person-outline' },
  users: { library: 'Ionicons', name: 'people-outline' },
  profile: { library: 'Ionicons', name: 'person-circle-outline' },
  heart: { library: 'Ionicons', name: 'heart-outline' },
  like: { library: 'Ionicons', name: 'thumbs-up-outline' },
  comment: { library: 'Ionicons', name: 'chatbubble-outline' },
  message: { library: 'Ionicons', name: 'mail-outline' },
  notification: { library: 'Ionicons', name: 'notifications-outline' },
  bell: { library: 'Ionicons', name: 'notifications-outline' },
  
  // System & Status
  loading: { library: 'Ionicons', name: 'reload-outline' },
  success: { library: 'Ionicons', name: 'checkmark-circle-outline' },
  warning: { library: 'Ionicons', name: 'warning-outline' },
  error: { library: 'Ionicons', name: 'close-circle-outline' },
  info: { library: 'Ionicons', name: 'information-circle-outline' },
  help: { library: 'Ionicons', name: 'help-circle-outline' },
  lock: { library: 'Ionicons', name: 'lock-closed-outline' },
  unlock: { library: 'Ionicons', name: 'lock-open-outline' },
  eye: { library: 'Ionicons', name: 'eye-outline' },
  eyeOff: { library: 'Ionicons', name: 'eye-off-outline' },
  star: { library: 'Ionicons', name: 'star-outline' },
  flag: { library: 'Ionicons', name: 'flag-outline' },
  trash: { library: 'Ionicons', name: 'trash-outline' },
  
  // Missing icons that were causing warnings
  'chevron-right': { library: 'Ionicons', name: 'chevron-forward-outline' },
  'trash-outline': { library: 'Ionicons', name: 'trash-outline' },
  'ellipsis-horizontal': { library: 'Ionicons', name: 'ellipsis-horizontal' },
  'verified': { library: 'Ionicons', name: 'checkmark-circle' },
  'award': { library: 'Ionicons', name: 'trophy-outline' },
  'notebook': { library: 'Ionicons', name: 'book-outline' },
  'message-circle': { library: 'Ionicons', name: 'chatbubble-outline' },
  'moon': { library: 'Ionicons', name: 'moon-outline' },
  'earth': { library: 'Ionicons', name: 'earth-outline' },
  'briefcase': { library: 'Ionicons', name: 'briefcase-outline' },
  'key': { library: 'Ionicons', name: 'key-outline' },
  'shield': { library: 'Ionicons', name: 'shield-outline' },
  'globe': { library: 'Ionicons', name: 'globe-outline' },
  'help-circle': { library: 'Ionicons', name: 'help-circle-outline' },
  'log-out': { library: 'Ionicons', name: 'log-out-outline' },
  plus: { library: 'Ionicons', name: 'add-outline' },
  grid: { library: 'Ionicons', name: 'grid-outline' },
};

export interface IconProps {
  name: TravelIconName | string;
  library?: IconLibrary;
  size?: IconSize;
  color?: IconColor;
  style?: ViewStyle | TextStyle;
  testID?: string;
}

const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const Icon: React.FC<IconProps> = ({
  name,
  library,
  size = 'md',
  color = 'text',
  style,
  testID,
}) => {
  const { colors } = useTheme();

  // Get icon configuration
  const getIconConfig = () => {
    if (library) {
      // Direct library and name specified
      return { library, name: name as string };
    }
    
    // Check if it's a travel-themed preset
    if (name in TRAVEL_ICON_MAP) {
      return TRAVEL_ICON_MAP[name as TravelIconName];
    }
    
    // Default to Ionicons if no library specified
    return { library: 'Ionicons' as IconLibrary, name: name as string };
  };

  // Get icon size
  const getIconSize = (): number => {
    if (typeof size === 'number') {
      return size;
    }
    return ICON_SIZES[size];
  };

  // Get icon color
  const getIconColor = (): string => {
    // Handle hex colors, rgb colors, and CSS color names
    if (color.startsWith('#') || color.startsWith('rgb') || 
        ['white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'gray', 'grey', 'transparent'].includes(color.toLowerCase())) {
      return color;
    }

    switch (color) {
      case 'primary':
        return colors.primary[500];
      case 'secondary':
        return colors.secondary[500];
      case 'success':
        return colors.success[500];
      case 'warning':
        return colors.warning[500];
      case 'error':
        return colors.error[500];
      case 'info':
        return colors.info[500];
      case 'text':
        return colors.text.primary;
      case 'textSecondary':
        return colors.text.secondary;
      case 'textDisabled':
        return colors.text.disabled;
      case 'inverse':
        return colors.text.inverse;
      default:
        return colors.text.primary;
    }
  };

  const iconConfig = getIconConfig();
  const iconSize = getIconSize();
  const iconColor = getIconColor();

  // Render the appropriate icon component
  const renderIcon = () => {
    const commonProps = {
      name: iconConfig.name as any,
      size: iconSize,
      color: iconColor,
      style,
      testID,
    };

    switch (iconConfig.library) {
      case 'MaterialIcons':
        return <MaterialIcons {...commonProps} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons {...commonProps} />;
      case 'Feather':
        return <Feather {...commonProps} />;
      case 'AntDesign':
        return <AntDesign {...commonProps} />;
      case 'Entypo':
        return <Entypo {...commonProps} />;
      case 'FontAwesome5':
        return <FontAwesome5 {...commonProps} />;
      case 'Ionicons':
      default:
        return <Ionicons {...commonProps} />;
    }
  };

  return renderIcon();
};

// Convenience components for common use cases
export const TravelIcon: React.FC<Omit<IconProps, 'library'> & { name: TravelIconName }> = (props) => (
  <Icon {...props} />
);

export const ActionIcon: React.FC<Omit<IconProps, 'size'> & { size?: 'sm' | 'md' | 'lg' }> = (props) => (
  <Icon size="md" {...props} />
);

export const StatusIcon: React.FC<Omit<IconProps, 'color'> & { 
  status: 'success' | 'warning' | 'error' | 'info' 
}> = ({ status, ...props }) => (
  <Icon color={status} {...props} />
);

export default Icon; 
// Core UI Components
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Input } from './Input';
export type { InputProps, InputVariant, InputState, InputSize } from './Input';

export { Card } from './Card';
export type { CardProps, CardVariant, CardSize } from './Card';

export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize, AvatarVariant } from './Avatar';

export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

export { LoadingSpinner, FullScreenLoader, ButtonLoader } from './LoadingSpinner';
export type { LoadingSpinnerProps, LoadingSize, LoadingVariant } from './LoadingSpinner';

export { Modal, AlertModal } from './Modal';
export type { ModalProps, ModalVariant, ModalSize } from './Modal';

export { Icon, TravelIcon, ActionIcon, StatusIcon } from './Icon';
export type { IconProps, IconLibrary, IconSize, IconColor, TravelIconName } from './Icon';

// Layout Components
export { SafeAreaWrapper, FullSafeArea, TopSafeArea, BottomSafeArea } from './SafeAreaWrapper';
export type { SafeAreaWrapperProps, SafeAreaVariant, SafeAreaMode } from './SafeAreaWrapper';

export { Header } from './Header';
export type { HeaderProps, HeaderVariant, HeaderSize, HeaderAction } from './Header';

export { FloatingActionButton, AddEntryFAB, TravelActionsFAB, MapFAB } from './FloatingActionButton';
export type { FloatingActionButtonProps, FABSize, FABVariant, FABPosition, FABAction } from './FloatingActionButton';

export { BottomSheet, TravelActionsSheet, TripOptionsSheet } from './BottomSheet';
export type { BottomSheetProps, BottomSheetSize, BottomSheetVariant, BottomSheetAction } from './BottomSheet';

export { TabBar, TravelTabBar, SimpleTabBar } from './TabBar';
export type { TabBarProps, TabBarVariant, TabBarPosition, TabItem } from './TabBar';

export { SearchBar, LocationSearchBar, TripSearchBar } from './SearchBar';
export type { SearchBarProps, SearchBarVariant, SearchBarSize, SearchSuggestion } from './SearchBar';

export { TripCover, HeroTripCover, CompactTripCover, DetailedTripCover } from './TripCover';
export type { TripCoverProps, TripCoverSize, TripCoverVariant } from './TripCover';

export { Timeline } from './Timeline';
export type { TimelineProps, TimelineEntry } from './Timeline';

export { TimelineNavigation } from './TimelineNavigation';
export type { TimelineNavigationProps, TimelineDate } from './TimelineNavigation';

export { PhotoGallery, TripPhotoGallery, CompactPhotoGallery } from './PhotoGallery';
export type { PhotoGalleryProps, PhotoItem } from './PhotoGallery';

export { PhotoLightbox } from './PhotoLightbox';
export type { PhotoLightboxProps, PhotoLightboxItem } from './PhotoLightbox';

// Phase 5: Entry Editor & Media Components
export { RichTextEditor } from './RichTextEditor';
export type { RichTextEditorProps } from './RichTextEditor';

export { MediaPicker } from './MediaPicker';
export type { MediaPickerProps, MediaItem } from './MediaPicker';

export { SimpleDateTimePicker } from './SimpleDateTimePicker';
export type { SimpleDateTimePickerProps } from './SimpleDateTimePicker';

export { LocationPicker } from './LocationPicker';
export type { LocationPickerProps, LocationData } from './LocationPicker';

export { WeatherDisplay } from './WeatherDisplay';
export type { WeatherDisplayProps, WeatherData } from './WeatherDisplay';

export { TagsInput } from './TagsInput';
export type { TagsInputProps, Tag } from './TagsInput';

export { TripSettingsSheet, QuickTripActionsSheet } from './TripSettingsSheet';
export type { TripSettingsSheetProps, TripSettingsAction } from './TripSettingsSheet';

export { TripSharingSheet } from './TripSharingSheet';
export type { TripSharingSheetProps, ShareOption } from './TripSharingSheet';

// Phase 6: Profile & Settings Components
export { SettingsList, ProfileSettingsItem, QuickAction } from './SettingsList';
export type { SettingsListProps, SettingsItem, SettingsSection, ProfileSettingsItemProps, QuickActionProps } from './SettingsList';

export { UserStatsDashboard } from './UserStatsDashboard';
export type { UserStatsDashboardProps, UserStats } from './UserStatsDashboard';

// Phase 8: Performance & Polish components
// Performance optimization
export { LazyImage, useLazyLoading, imageCache } from './LazyImage';
export { 
  OptimizedFlatList, 
  useListPerformance, 
  withListItemOptimization 
} from './OptimizedFlatList';

// Error handling & loading states
export { 
  ErrorBoundary, 
  withErrorBoundary, 
  useErrorHandler 
} from './ErrorBoundary';
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonListItem,
  SkeletonTripCard,
  SkeletonEntryCard,
  SkeletonGallery,
  SkeletonScreens,
} from './SkeletonLoader';

// Animations & transitions
export {
  AnimatedEntrance,
  AnimatedPressable,
  PullToRefresh,
  ScreenTransition,
  StaggeredList,
  SuccessFeedback,
  AnimationUtils,
} from './AnimationComponents';

// Navigation
export { FloatingPillNavigation } from './FloatingPillNavigation'; 
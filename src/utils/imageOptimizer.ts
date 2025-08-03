/**
 * Image Optimization Utilities for Crystal Clear Quality
 * Ensures maximum image quality is preserved throughout the app
 */

export const IMAGE_QUALITY_CONFIG = {
  // Maximum quality settings
  CAMERA_QUALITY: 1.0,
  PICKER_QUALITY: 1.0,
  COMPRESSION_RATIO: 1.0,
  
  // Ultra high resolution settings
  MAX_WIDTH: 3840,
  MAX_HEIGHT: 3840,
  
  // expo-image optimizations
  DECODE_FORMAT: 'rgb' as const,
  CACHE_POLICY: 'memory-disk' as const,
  PRIORITY: 'high' as const,
  TRANSITION_DURATION: 25,
} as const;

/**
 * Ensures image URI uses maximum quality
 */
export const getOptimizedImageUri = (uri: string): string => {
  // Remove any quality parameters that might reduce clarity
  const cleanUri = uri.split('?')[0];
  return cleanUri;
};

/**
 * Camera capture options for crystal clear photos
 */
export const getCrystalClearCameraOptions = () => ({
  quality: IMAGE_QUALITY_CONFIG.CAMERA_QUALITY,
  skipProcessing: false,
  mirror: false,
  exif: true,
});

/**
 * Image picker options for maximum quality
 */
export const getCrystalClearPickerOptions = () => ({
  quality: IMAGE_QUALITY_CONFIG.PICKER_QUALITY,
  allowsEditing: false,
  exif: true,
});

/**
 * expo-image props for crystal clear display
 */
export const getCrystalClearImageProps = () => ({
  priority: IMAGE_QUALITY_CONFIG.PRIORITY,
  cachePolicy: IMAGE_QUALITY_CONFIG.CACHE_POLICY,
  decodeFormat: IMAGE_QUALITY_CONFIG.DECODE_FORMAT,
  transition: IMAGE_QUALITY_CONFIG.TRANSITION_DURATION,
  enableLiveTextInteraction: false,
  accessible: false,
});

export default {
  IMAGE_QUALITY_CONFIG,
  getOptimizedImageUri,
  getCrystalClearCameraOptions,
  getCrystalClearPickerOptions,
  getCrystalClearImageProps,
}; 
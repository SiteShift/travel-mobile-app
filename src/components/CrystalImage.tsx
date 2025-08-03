import React from 'react';
import { Image, ImageProps } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';

interface CrystalImageProps {
  source: { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: 'low' | 'normal' | 'high';
  placeholder?: { uri: string } | number;
  onLoad?: () => void;
  borderRadius?: number;
}

/**
 * Ultra high-quality image component optimized for crystal clear display
 * Uses maximum quality settings and performance optimizations for sharp, clear images
 */
export const CrystalImage: React.FC<CrystalImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  priority = 'high',
  placeholder,
  onLoad,
  borderRadius,
  ...props
}) => {
  return (
    <Image
      source={source}
      style={[style, borderRadius ? { borderRadius } : undefined]}
      contentFit={contentFit}
      priority={priority}
      cachePolicy="memory-disk"
      transition={25} // Ultra fast transition for instant clarity
      decodeFormat="rgb" // Force RGB decoding for maximum quality
      placeholderContentFit={contentFit}
      placeholder={placeholder}
      enableLiveTextInteraction={false} // Disable to prevent quality reduction
      accessible={false} // Disable for performance
      onLoad={onLoad}
      {...props}
    />
  );
};

export default CrystalImage; 
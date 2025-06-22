import React, { useState, useEffect, useRef, memo } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  ImageProps,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingSpinner } from './LoadingSpinner';
import { Icon } from './Icon';
import { SPACING, BORDER_RADIUS } from '../constants/theme';

export interface LazyImageProps extends Omit<ImageProps, 'source' | 'style'> {
  source: { uri: string } | number;
  placeholder?: string; // Blurhash or low-res image
  fallback?: React.ReactNode;
  width?: number;
  height?: number;
  aspectRatio?: number;
  
  // Loading states
  showLoader?: boolean;
  loaderColor?: string;
  
  // Progressive loading
  progressive?: boolean;
  lowResSource?: { uri: string };
  
  // Caching
  cacheable?: boolean;
  cacheKey?: string;
  
  // Animation
  fadeInDuration?: number;
  scaleAnimation?: boolean;
  
  // Error handling
  onError?: (error: any) => void;
  retryCount?: number;
  
  // Optimization
  priority?: 'low' | 'normal' | 'high';
  lazy?: boolean;
  threshold?: number; // Distance from viewport to start loading
  
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  containerStyle?: ViewStyle;
  testID?: string;
}

const LazyImage: React.FC<LazyImageProps> = memo(({
  source,
  placeholder,
  fallback,
  width,
  height,
  aspectRatio = 1,
  showLoader = true,
  loaderColor,
  progressive = true,
  lowResSource,
  cacheable = true,
  cacheKey,
  fadeInDuration = 300,
  scaleAnimation = false,
  onError,
  retryCount = 3,
  priority = 'normal',
  lazy = true,
  threshold = 100,
  style,
  imageStyle,
  containerStyle,
  testID,
  ...imageProps
}) => {
  const { colors } = useTheme();
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [retries, setRetries] = useState(0);
  const [inViewport, setInViewport] = useState(!lazy);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const placeholderFadeAnim = useRef(new Animated.Value(1)).current;
  
  // Progressive loading states
  const [lowResLoaded, setLowResLoaded] = useState(false);
  const [highResLoaded, setHighResLoaded] = useState(false);

  // Determine image source
  const imageSource = typeof source === 'number' ? source : { uri: source.uri };
  const shouldLoad = inViewport && loadingState !== 'loaded';

  // Start loading when in viewport
  useEffect(() => {
    if (shouldLoad) {
      setLoadingState('loading');
    }
  }, [shouldLoad]);

  // Handle image load success
  const handleImageLoad = () => {
    setLoadingState('loaded');
    setRetries(0);
    
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeInDuration,
        useNativeDriver: true,
      }),
      scaleAnimation ? Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }) : Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }),
      // Fade out placeholder
      Animated.timing(placeholderFadeAnim, {
        toValue: 0,
        duration: fadeInDuration / 2,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle image load error
  const handleImageError = (error: any) => {
    if (retries < retryCount) {
      setRetries(prev => prev + 1);
      setLoadingState('loading');
      // Retry after delay
      setTimeout(() => {
        setLoadingState('idle');
      }, Math.pow(2, retries) * 1000); // Exponential backoff
    } else {
      setLoadingState('error');
      onError?.(error);
    }
  };

  // Progressive loading handlers
  const handleLowResLoad = () => {
    setLowResLoaded(true);
    if (!progressive) return;
    
    Animated.timing(fadeAnim, {
      toValue: 0.7,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleHighResLoad = () => {
    setHighResLoaded(true);
    handleImageLoad();
  };

  // Calculate dimensions
  const getDimensions = () => {
    if (width && height) {
      return { width, height };
    }
    if (width) {
      return { width, height: width / aspectRatio };
    }
    if (height) {
      return { height, width: height * aspectRatio };
    }
    return { flex: 1, aspectRatio };
  };

  const dimensions = getDimensions();

  // Container styles
  const containerStyles = [
    styles.container,
    dimensions,
    containerStyle,
    style,
  ];

  // Image styles
  const imageStyles = [
    styles.image,
    imageStyle,
    {
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }],
    },
  ];

  // Placeholder styles
  const placeholderStyles = [
    styles.placeholder,
    {
      backgroundColor: colors.surface.secondary,
      opacity: placeholderFadeAnim,
    },
  ];

  // Render loading state
  const renderLoader = () => {
    if (!showLoader || loadingState !== 'loading') return null;
    
    return (
      <View style={styles.loaderContainer}>
        <LoadingSpinner 
          size="small" 
          color={loaderColor || colors.primary[500]}
          variant="minimal"
        />
      </View>
    );
  };

  // Render error state
  const renderError = () => {
    if (loadingState !== 'error') return null;
    
    if (fallback) {
      return <View style={styles.fallbackContainer}>{fallback}</View>;
    }
    
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surface.secondary }]}>
        <Icon
          name="image-off"
          size="lg"
          color={colors.text.tertiary}
        />
      </View>
    );
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (loadingState === 'loaded' || !placeholder) return null;
    
    return (
      <Animated.View style={placeholderStyles}>
        <Image
          source={{ uri: placeholder }}
          style={styles.image}
          blurRadius={1}
          resizeMode="cover"
        />
      </Animated.View>
    );
  };

  // Progressive loading implementation
  const renderProgressiveImages = () => {
    if (!progressive || !lowResSource) {
      return (
        <Animated.Image
          {...imageProps}
          source={imageSource}
          style={imageStyles}
          onLoad={handleImageLoad}
          onError={handleImageError}
          resizeMode="cover"
          testID={testID}
        />
      );
    }

    return (
      <>
        {/* Low resolution image */}
        <Image
          source={lowResSource}
          style={[
            styles.image,
            {
              opacity: lowResLoaded ? 1 : 0,
            },
          ]}
          onLoad={handleLowResLoad}
          onError={handleImageError}
          resizeMode="cover"
          blurRadius={lowResLoaded && !highResLoaded ? 0.5 : 0}
        />
        
        {/* High resolution image */}
        <Animated.Image
          {...imageProps}
          source={imageSource}
          style={imageStyles}
          onLoad={handleHighResLoad}
          onError={handleImageError}
          resizeMode="cover"
          testID={testID}
        />
      </>
    );
  };

  return (
    <View style={containerStyles} testID={`${testID}-container`}>
      {/* Placeholder */}
      {renderPlaceholder()}
      
      {/* Progressive Images */}
      {shouldLoad && renderProgressiveImages()}
      
      {/* Loading State */}
      {renderLoader()}
      
      {/* Error State */}
      {renderError()}
    </View>
  );
});

LazyImage.displayName = 'LazyImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.md,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export { LazyImage };

// Hook for lazy loading
export const useLazyLoading = (threshold: number = 100) => {
  const [inViewport, setInViewport] = useState(false);
  
  const onLayout = (event: any) => {
    // Simple implementation - in real app would use Intersection Observer equivalent
    // For React Native, you'd typically use onScroll with layout measurements
    setInViewport(true);
  };
  
  return {
    inViewport,
    onLayout,
  };
};

// Image cache manager
class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cache: Map<string, string> = new Map();
  private maxCacheSize: number = 50; // Max cached images
  private cacheOrder: string[] = [];

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  getCachedImage(key: string): string | null {
    return this.cache.get(key) || null;
  }

  setCachedImage(key: string, uri: string): void {
    // Remove oldest if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cacheOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, uri);
    this.cacheOrder.push(key);
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheOrder = [];
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const imageCache = ImageCacheManager.getInstance(); 
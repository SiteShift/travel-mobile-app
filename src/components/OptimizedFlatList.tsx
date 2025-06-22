import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useState, 
  useEffect,
  useRef 
} from 'react';
import {
  FlatList,
  FlatListProps,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ViewToken,
  LayoutAnimation,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import { Icon } from './Icon';
import { SPACING, TYPOGRAPHY } from '../constants/theme';

// Performance configuration
const PERFORMANCE_CONFIG = {
  INITIAL_NUM_TO_RENDER: 10,
  MAX_TO_RENDER_PER_BATCH: 5,
  UPDATE_CELLS_BATCH_PERIOD: 50,
  WINDOW_SIZE: 10,
  VIEWABILITY_CONFIG: {
    minimumViewTime: 300,
    viewAreaCoveragePercentThreshold: 50,
    waitForInteraction: true,
  },
};

export interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor?: (item: T, index: number) => string;
  
  // Performance optimizations
  enableVirtualization?: boolean;
  enableItemAnimations?: boolean;
  
  // Loading states
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  
  // Pagination
  hasNextPage?: boolean;
  loadingNextPage?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  
  // Empty states
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  emptyAction?: {
    title: string;
    onPress: () => void;
  };
  
  // Error states
  error?: string | null;
  onRetry?: () => void;
  
  // Accessibility
  accessibilityLabel?: string;
  
  // Analytics
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  trackViewability?: boolean;
  
  style?: any;
  contentContainerStyle?: any;
  testID?: string;
}

function OptimizedFlatListComponent<T>({
  data,
  renderItem,
  keyExtractor,
  enableVirtualization = true,
  enableItemAnimations = true,
  loading = false,
  refreshing = false,
  onRefresh,
  hasNextPage = false,
  loadingNextPage = false,
  onEndReached,
  onEndReachedThreshold = 0.1,
  emptyTitle = 'No items found',
  emptySubtitle = 'Try adjusting your filters or check back later',
  emptyIcon = 'inbox',
  emptyAction,
  error,
  onRetry,
  accessibilityLabel,
  onViewableItemsChanged,
  trackViewability = false,
  style,
  contentContainerStyle,
  testID,
  ...flatListProps
}: OptimizedFlatListProps<T>) {
  const { colors } = useTheme();
  const [viewableItems, setViewableItems] = useState<ViewToken[]>([]);
  const flatListRef = useRef<FlatList<T>>(null);

  // Performance optimizations
  const memoizedData = useMemo(() => data, [data]);
  
  const memoizedKeyExtractor = useCallback(
    (item: T, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      // Fallback key extraction
      if (typeof item === 'object' && item !== null && 'id' in item) {
        return String((item as any).id);
      }
      return String(index);
    },
    [keyExtractor]
  );

  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      if (enableItemAnimations && Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      return renderItem({ item, index });
    },
    [renderItem, enableItemAnimations]
  );

  // Viewability tracking
  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      if (trackViewability) {
        setViewableItems(info.viewableItems);
      }
      onViewableItemsChanged?.(info);
    },
    [onViewableItemsChanged, trackViewability]
  );

  const viewabilityConfig = useMemo(
    () => PERFORMANCE_CONFIG.VIEWABILITY_CONFIG,
    []
  );

  // Pull to refresh
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.primary[500]}
        colors={[colors.primary[500]]}
        progressBackgroundColor={colors.surface.primary}
        testID={`${testID}-refresh`}
      />
    );
  }, [refreshing, onRefresh, colors, testID]);

  // Loading footer
  const renderFooter = useCallback(() => {
    if (!hasNextPage && !loadingNextPage) return null;
    
    if (loadingNextPage) {
      return (
        <View style={styles.footer}>
          <LoadingSpinner
            size="small"
            variant="minimal"
            showMessage={false}
            testID={`${testID}-footer-loading`}
          />
        </View>
      );
    }
    
    return <View style={styles.footerSpacer} />;
  }, [hasNextPage, loadingNextPage, testID]);

  // Empty state
  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <LoadingSpinner
            size="large"
            message="Loading..."
            testID={`${testID}-empty-loading`}
          />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
                     <Icon
             name="alert-circle"
             size="xxl"
             color={colors.error[500]}
             style={styles.emptyIcon}
           />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            Something went wrong
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            {error}
          </Text>
          {onRetry && (
            <Button
              title="Try Again"
              onPress={onRetry}
              variant="primary"
              size="medium"
              style={styles.retryButton}
              testID={`${testID}-retry`}
            />
          )}
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon
          name={emptyIcon}
          size="xxl"
          color={colors.text.tertiary}
          style={styles.emptyIcon}
        />
        <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
          {emptyTitle}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
          {emptySubtitle}
        </Text>
        {emptyAction && (
          <Button
            title={emptyAction.title}
            onPress={emptyAction.onPress}
            variant="secondary"
            size="medium"
            style={styles.emptyActionButton}
            testID={`${testID}-empty-action`}
          />
        )}
      </View>
    );
  }, [
    loading,
    error,
    emptyTitle,
    emptySubtitle,
    emptyIcon,
    emptyAction,
    onRetry,
    colors,
    testID,
  ]);

  // Handle end reached with debouncing
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !loadingNextPage && onEndReached) {
      onEndReached();
    }
  }, [hasNextPage, loadingNextPage, onEndReached]);

  // Performance settings
  const performanceProps = useMemo(() => {
    if (!enableVirtualization) {
      return {};
    }

    return {
      initialNumToRender: PERFORMANCE_CONFIG.INITIAL_NUM_TO_RENDER,
      maxToRenderPerBatch: PERFORMANCE_CONFIG.MAX_TO_RENDER_PER_BATCH,
      updateCellsBatchingPeriod: PERFORMANCE_CONFIG.UPDATE_CELLS_BATCH_PERIOD,
      windowSize: PERFORMANCE_CONFIG.WINDOW_SIZE,
      removeClippedSubviews: Platform.OS === 'android',
      getItemLayout: flatListProps.getItemLayout,
    };
  }, [enableVirtualization, flatListProps.getItemLayout]);

  // Scroll to top method
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Accessibility
  const accessibilityProps = useMemo(() => ({
    accessibilityLabel: accessibilityLabel || `List with ${data.length} items`,
    accessibilityRole: 'list' as const,
  }), [accessibilityLabel, data.length]);

  return (
    <FlatList<T>
      ref={flatListRef}
      data={memoizedData}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      
      // Performance optimizations
      {...performanceProps}
      
      // Loading and refresh
      refreshControl={refreshControl}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyComponent}
      
      // Pagination
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      
      // Viewability tracking
      onViewableItemsChanged={trackViewability ? handleViewableItemsChanged : undefined}
      viewabilityConfig={trackViewability ? viewabilityConfig : undefined}
      
      // Styling
      style={[styles.container, style]}
      contentContainerStyle={[
        data.length === 0 && styles.emptyContentContainer,
        contentContainerStyle,
      ]}
      
      // Accessibility
      {...accessibilityProps}
      
      // Test ID
      testID={testID}
      
      // Pass through other props
      {...flatListProps}
    />
  );
}

// Memoize the component
export const OptimizedFlatList = memo(OptimizedFlatListComponent) as <T>(
  props: OptimizedFlatListProps<T>
) => React.ReactElement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContentContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.styles.h3,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyActionButton: {
    marginTop: SPACING.md,
  },
  retryButton: {
    marginTop: SPACING.lg,
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  footerSpacer: {
    height: SPACING.lg,
  },
});

// Performance monitoring hook
export const useListPerformance = (listName: string) => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
  });

  const startTime = useRef<number>(0);

  const startRender = useCallback(() => {
    startTime.current = Date.now();
  }, []);

  const endRender = useCallback(() => {
    const renderTime = Date.now() - startTime.current;
    setMetrics(prev => ({
      renderCount: prev.renderCount + 1,
      lastRenderTime: renderTime,
      averageRenderTime: (prev.averageRenderTime * prev.renderCount + renderTime) / (prev.renderCount + 1),
    }));
    
    // Log performance in development
    if (__DEV__) {
      console.log(`[${listName}] Render time: ${renderTime}ms`);
    }
  }, [listName]);

  return {
    metrics,
    startRender,
    endRender,
  };
};

// Optimized list item HOC
export const withListItemOptimization = <P extends {}>(
  Component: React.ComponentType<P>
) => {
  return memo(Component, (prevProps, nextProps) => {
    // Custom comparison logic for list items
    // Override this for specific optimization needs
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });
}; 
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  useAnimatedGestureHandler 
} from 'react-native-reanimated';

import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';


// Components
import { MinimalDayCard } from '../src/components/minimal/MinimalDayCard';
import { MinimalPhotoCard } from '../src/components/minimal/MinimalPhotoCard';
import { PhotoLightbox } from '../src/components/PhotoLightbox';
import { Icon } from '../src/components/Icon';

// Context & Types
import { useTheme } from '../src/contexts/ThemeContext';
import { MinimalTrip, MinimalMemory, MinimalDay, ViewPreferences } from '../src/types/tripDetailMinimal';

// Data & Utils
import { minimalTripData, formatTripDates } from '../src/data/minimalMockData';
import { SPACING, BORDER_RADIUS } from '../src/constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TripDetailMinimalProps {
  tripId?: string;
}

// Helper function to create minimal trip data from trip ID
const createMinimalTripFromId = (tripId: string, tripData?: any): MinimalTrip => {
  if (tripData) {
    // Ensure dates are Date objects
    const startDate = tripData.startDate ? new Date(tripData.startDate) : new Date();
    const endDate = tripData.endDate ? new Date(tripData.endDate) : new Date();
    
    // Process days data to ensure date objects
    let processedDays = tripData.days;
    if (processedDays && Array.isArray(processedDays)) {
      processedDays = processedDays.map((day: any) => ({
        ...day,
        date: day.date ? new Date(day.date) : startDate,
        memories: day.memories || []
      }));
    } else {
      // Create default day if no days exist
      processedDays = [
        {
          day: 1,
          date: startDate,
          memories: [],
          location: tripData.country || 'Adventure'
        }
      ];
    }
    
    return {
      id: tripData.id,
      title: tripData.title,
      coverImage: tripData.coverImage || tripData.image?.uri || require('../assets/images/california-road-trip.jpg'),
      startDate: startDate,
      endDate: endDate,
      days: processedDays,
      totalPhotos: tripData.totalPhotos || (processedDays ? 
        processedDays.reduce((total: number, day: any) => total + (day.memories?.length || 0), 0) : 0)
    };
  }
  
  // Fallback to default data
  return minimalTripData;
};

export default function TripDetailMinimal({ tripId }: TripDetailMinimalProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  // State
  const [trip, setTrip] = useState<MinimalTrip>(minimalTripData);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewPreferences['mode']>('story');
  const [showCaptions, setShowCaptions] = useState(true);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxMemory, setLightboxMemory] = useState<MinimalMemory | null>(null);
  const [showChangePhotoModal, setShowChangePhotoModal] = useState(false);
  const [changingPhotoId, setChangingPhotoId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  
  // Load trip data on mount and when returning to screen
  useFocusEffect(
    useCallback(() => {
      const loadTripData = async () => {
        if (tripId) {
          try {
            console.log('🔄 Loading trip detail for ID:', tripId);
            
            // Try to load from AsyncStorage
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const storedTripData = await AsyncStorage.getItem(`trip_${tripId}`);
            
            if (storedTripData) {
              console.log('📦 Found trip data in storage');
              
              const tripData = JSON.parse(storedTripData);
              console.log('📋 Trip data parsed:', tripData.title);
              
              // Convert date strings back to Date objects
              if (tripData.startDate && typeof tripData.startDate === 'string') {
                tripData.startDate = new Date(tripData.startDate);
              }
              if (tripData.endDate && typeof tripData.endDate === 'string') {
                tripData.endDate = new Date(tripData.endDate);
              }
              
              const minimalTrip = createMinimalTripFromId(tripId, tripData);
              setTrip(minimalTrip);
              console.log('✅ Trip detail reloaded:', tripData.title, 'with', minimalTrip.totalPhotos, 'photos');
            } else {
              console.warn('⚠️ No trip data found in storage for:', `trip_${tripId}`);
            }
          } catch (error) {
            console.error('❌ Error loading trip from storage:', error);
          }
        }
        setIsLoading(false);
      };
      
      loadTripData();
    }, [tripId])
  );

  // Animation Values
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  
  // Computed
  const currentDay = trip.days.find(d => d.day === selectedDay);
  const hasPhotos = currentDay && currentDay.memories.length > 0;
  
  // Effects
  useEffect(() => {
    translateY.setValue(screenHeight);
    Animated.spring(translateY, {
      toValue: 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
    
    StatusBar.setBarStyle('light-content', true);
  }, [translateY]);
  
  // Utility Functions
  const requestPermissions = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to add photos to your memories.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }, []);

  // Handlers
  const handleGestureStateChange = useCallback((event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY: gestureY, velocityY } = event.nativeEvent;
      // Much more sensitive swipe down gesture - reduced threshold and velocity
      if (gestureY > 80 || velocityY > 600) {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }).start(() => router.back());
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [translateY, router]);
  
  const handleGesture = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        // Only allow downward gestures (positive translationY)
        if (event.nativeEvent.translationY > 0) {
          translateY.setValue(event.nativeEvent.translationY);
        }
      }
    }
  );

  const handleHeaderGesture = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleHeaderGestureStateChange = useCallback((event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY: gestureY, velocityY } = event.nativeEvent;
      // Even more sensitive for header area
      if (gestureY > 50 || velocityY > 400) {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }).start(() => router.back());
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [translateY, router]);
  
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );
  
  const handleDaySelect = useCallback((day: number) => {
    setSelectedDay(day);
    // Just select the day, don't auto-open camera as requested
  }, []);
  
  const handlePhotoPress = useCallback((memory: MinimalMemory) => {
    if (viewMode === 'grid') {
      // In grid view, open lightbox
      setLightboxMemory(memory);
      setLightboxVisible(true);
    } else {
      // In story view, just log for now (could add zoom functionality later)
      console.log('Open photo viewer:', memory.id);
    }
  }, [viewMode]);
  
  const handleCaptionEdit = useCallback((memoryId: string) => {
    setEditingCaptionId(memoryId);
    console.log('Edit caption for:', memoryId);
  }, []);

  const handleCaptionUpdate = useCallback((memoryId: string, newCaption: string) => {
    setTrip(prevTrip => {
      const updatedTrip = { ...prevTrip };
      
      // Find and update the memory with the new caption
      for (const day of updatedTrip.days) {
        const memoryIndex = day.memories.findIndex(m => m.id === memoryId);
        if (memoryIndex !== -1) {
          day.memories[memoryIndex] = {
            ...day.memories[memoryIndex],
            caption: newCaption
          };
          break;
        }
      }
      
      return updatedTrip;
    });
    
    // Update the lightbox memory if it's the same one
    if (lightboxMemory?.id === memoryId) {
      setLightboxMemory(prev => prev ? { ...prev, caption: newCaption } : null);
    }
    
    // Clear editing state after update
    setEditingCaptionId(null);
    
    console.log('Updated caption for:', memoryId, 'to:', newCaption);
  }, [lightboxMemory]);

  const handleDeletePhoto = useCallback(async (memoryId: string) => {
    try {
      setTrip(prevTrip => {
        const updatedTrip = { ...prevTrip };
        
        // Find and remove the memory
        for (const day of updatedTrip.days) {
          const memoryIndex = day.memories.findIndex(m => m.id === memoryId);
          if (memoryIndex !== -1) {
            day.memories.splice(memoryIndex, 1);
            break;
          }
        }
        
        return updatedTrip;
      });
      
      // Close lightbox if this photo was being viewed
      if (lightboxMemory?.id === memoryId) {
        setLightboxVisible(false);
        setLightboxMemory(null);
      }
      
      console.log('✅ Photo deleted:', memoryId);
    } catch (error) {
      console.error('❌ Error deleting photo:', error);
    }
  }, [lightboxMemory?.id]);

  const handleChangePhoto = useCallback(async (memoryId: string) => {
    setChangingPhotoId(memoryId);
    setShowChangePhotoModal(true);
  }, []);

  const handleChangePhotoFromCamera = useCallback(async () => {
    if (!changingPhotoId) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1.0, // Maximum quality for ultra-sharp images
        exif: true, // Preserve image metadata
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Update the existing memory with the new photo
        setTrip(prevTrip => {
          const updatedTrip = { ...prevTrip };
          
          // Find and update the memory
          for (const day of updatedTrip.days) {
            const memoryIndex = day.memories.findIndex(m => m.id === changingPhotoId);
            if (memoryIndex !== -1) {
              day.memories[memoryIndex] = {
                ...day.memories[memoryIndex],
                uri: asset.uri,
                thumbnail: asset.uri,
                aspectRatio: asset.width / asset.height,
                timestamp: new Date(), // Update timestamp
              };
              break;
            }
          }
          
          return updatedTrip;
        });
        
        // Update lightbox memory if it's the same one
        if (lightboxMemory?.id === changingPhotoId) {
          setLightboxMemory(prev => prev ? { 
            ...prev, 
            uri: asset.uri,
            thumbnail: asset.uri,
            aspectRatio: asset.width / asset.height,
          } : null);
        }
        
        console.log('✅ Photo changed from camera:', changingPhotoId);
      }
    } catch (error) {
      console.error('❌ Error changing photo from camera:', error);
    } finally {
      setShowChangePhotoModal(false);
      setChangingPhotoId(null);
    }
  }, [changingPhotoId, lightboxMemory?.id]);

  const handleChangePhotoFromLibrary = useCallback(async () => {
    if (!changingPhotoId) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1.0, // Maximum quality for ultra-sharp images
        exif: true, // Preserve image metadata
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Update the existing memory with the new photo
        setTrip(prevTrip => {
          const updatedTrip = { ...prevTrip };
          
          // Find and update the memory
          for (const day of updatedTrip.days) {
            const memoryIndex = day.memories.findIndex(m => m.id === changingPhotoId);
            if (memoryIndex !== -1) {
              day.memories[memoryIndex] = {
                ...day.memories[memoryIndex],
                uri: asset.uri,
                thumbnail: asset.uri,
                aspectRatio: asset.width / asset.height,
                timestamp: new Date(), // Update timestamp
              };
              break;
            }
          }
          
          return updatedTrip;
        });
        
        // Update lightbox memory if it's the same one
        if (lightboxMemory?.id === changingPhotoId) {
          setLightboxMemory(prev => prev ? { 
            ...prev, 
            uri: asset.uri,
            thumbnail: asset.uri,
            aspectRatio: asset.width / asset.height,
          } : null);
        }
        
        console.log('✅ Photo changed from library:', changingPhotoId);
      }
    } catch (error) {
      console.error('❌ Error changing photo from library:', error);
    } finally {
      setShowChangePhotoModal(false);
      setChangingPhotoId(null);
    }
    }, [changingPhotoId, lightboxMemory?.id]);

  const handleReorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    setTrip(prevTrip => {
      const updatedTrip = { ...prevTrip };
      const dayIndex = updatedTrip.days.findIndex(d => d.day === selectedDay);
      
      if (dayIndex !== -1) {
        const memories = [...updatedTrip.days[dayIndex].memories];
        const [movedMemory] = memories.splice(fromIndex, 1);
        memories.splice(toIndex, 0, movedMemory);
        
        updatedTrip.days[dayIndex] = {
          ...updatedTrip.days[dayIndex],
          memories,
        };
      }
      
      return updatedTrip;
    });
    
    console.log('✅ Photo moved from', fromIndex, 'to', toIndex, 'for day:', selectedDay);
  }, [selectedDay]);

  const handleDragStart = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDragging(true);
    setDraggedIndex(index);
  }, []);

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    setIsDragging(false);
    setDraggedIndex(null);
    
    if (fromIndex !== toIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleReorderPhotos(fromIndex, toIndex);
    }
  }, [handleReorderPhotos]);

  // Draggable Photo Component
  const DraggablePhotoItem = useCallback(({ 
    memory, 
    index, 
    isStoryView = true 
  }: { 
    memory: MinimalMemory; 
    index: number; 
    isStoryView?: boolean;
  }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const zIndex = useSharedValue(0);
    
    const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {
        scale.value = withSpring(1.05);
        zIndex.value = 1000;
        runOnJS(handleDragStart)(index);
      },
      onActive: (event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      },
      onEnd: () => {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        zIndex.value = withSpring(0);
        
        // Calculate drop position based on translateY
        const itemHeight = isStoryView ? 300 : 200; // Approximate item height
        const moveDistance = Math.round(translateY.value / itemHeight);
        const newIndex = Math.max(0, Math.min(index + moveDistance, (currentDay?.memories.length || 1) - 1));
        
        runOnJS(handleDragEnd)(index, newIndex);
      },
    });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
      elevation: zIndex.value > 0 ? 8 : 0,
    }));

    const isDraggedItem = draggedIndex === index;

    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Reanimated.View 
          style={[
            isStoryView ? styles.sortableItem : styles.sortableGridItem,
            animatedStyle,
            isDraggedItem && styles.draggedItem
          ]}
        >
          <MinimalPhotoCard
            memory={memory}
            onPress={isDragging ? () => {} : handlePhotoPress}
            onCaptionEdit={isStoryView && !isDragging ? handleCaptionEdit : undefined}
            onCaptionUpdate={isStoryView && !isDragging ? handleCaptionUpdate : undefined}
            onDeletePhoto={!isDragging ? handleDeletePhoto : undefined}
            onChangePhoto={!isDragging ? handleChangePhoto : undefined}
            showCaption={isStoryView}
            isEditingCaption={editingCaptionId === memory.id && !isDragging}
            borderRadius={BORDER_RADIUS.md}
            width={!isStoryView ? screenWidth * 0.4 : undefined}
          />
        </Reanimated.View>
      </PanGestureHandler>
    );
  }, [draggedIndex, isDragging, handleDragStart, handleDragEnd, handlePhotoPress, handleCaptionEdit, handleCaptionUpdate, handleDeletePhoto, handleChangePhoto, editingCaptionId, screenWidth]);

  const handleAddDay = useCallback((dayNumber: number) => {
    console.log('Add day:', dayNumber);
    // Future: Navigate to photo picker or day setup
  }, []);
  
  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'story' ? 'grid' : 'story');
  }, [viewMode]);

  // Optimized helper function to flip image horizontally immediately


  const addMemoryFromSource = useCallback(async (targetDay: number, source: 'camera' | 'library') => {
    try {
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1.0, // Maximum quality for ultra-sharp images
          exif: true, // Preserve image metadata
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1.0, // Maximum quality for ultra-sharp images
          exif: true, // Preserve image metadata
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const originalUri = asset.uri;

        const createMemoryAndUpdate = (imageUri: string) => {
          const newMemory = {
            id: `mem_${Date.now()}`,
            uri: imageUri,
            thumbnail: imageUri,
            caption: 'Add a caption...',
            timestamp: new Date(),
            aspectRatio: asset.width / asset.height,
          };

          // Update the trip data
          setTrip(prevTrip => {
            const updatedTrip = { ...prevTrip };
            const dayIndex = updatedTrip.days.findIndex(d => d.day === targetDay);
            
            if (dayIndex !== -1) {
              updatedTrip.days[dayIndex] = {
                ...updatedTrip.days[dayIndex],
                memories: [...updatedTrip.days[dayIndex].memories, newMemory]
              };
            }
            
            // Update total photos count
            updatedTrip.totalPhotos = updatedTrip.days.reduce((total, day) => total + day.memories.length, 0);
            
            return updatedTrip;
          });

          // Auto-select the day that was just updated
          setSelectedDay(targetDay);
          console.log('Added memory to day', targetDay, 'from', source);
        };

        createMemoryAndUpdate(originalUri);
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Error', 'Failed to add photo. Please try again.');
    }
  }, [setSelectedDay]);

  const handleAddMemory = useCallback(async (dayNumber?: number) => {
    const targetDay = dayNumber || selectedDay;
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Add Memory',
      'How would you like to add a photo?',
      [
        {
          text: 'Take Photo',
          onPress: () => addMemoryFromSource(targetDay, 'camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => addMemoryFromSource(targetDay, 'library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, [selectedDay, requestPermissions, addMemoryFromSource]);
  
  const renderAddNextDay = () => {
    // Find the first day that has no memories.
    const nextDayToAdd = trip.days.find(d => d.memories.length === 0);
    if (!nextDayToAdd) return null;

    // Don't show if the user is currently viewing the day that needs to be added.
    if (currentDay && currentDay.day === nextDayToAdd.day && !hasPhotos) return null;

    return (
      <View style={styles.addNextDayContainer}>
        <TouchableOpacity
          style={[styles.addDayButton, {
            backgroundColor: colors.primary[100],
            borderColor: colors.primary[300],
          }]}
          onPress={() => handleAddDay(nextDayToAdd.day)}
        >
          <Icon name="plus" size="md" color={colors.primary[600]} />
          <Text style={[styles.addDayText, { color: colors.primary[700] }]}>
            Add Day {nextDayToAdd.day}
          </Text>
          {nextDayToAdd.location && (
            <Text style={[styles.addDayLocation, { color: colors.text.secondary }]}>
              {nextDayToAdd.location}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render Methods
  const renderHeader = () => {
    return (
      <PanGestureHandler 
        onGestureEvent={handleHeaderGesture}
        onHandlerStateChange={handleHeaderGestureStateChange}
        simultaneousHandlers={[]}
      >
        <Animated.View style={styles.header}>
          {/* Hero Background */}
          <Image
            source={typeof trip.coverImage === 'string' ? { uri: trip.coverImage } : trip.coverImage}
            style={styles.heroImage}
            contentFit="cover"
            priority="high"
            cachePolicy="memory-disk"
            transition={50}
            decodeFormat="rgb"
            placeholderContentFit="cover"
            enableLiveTextInteraction={false}
            accessible={false}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.1)']}
            style={styles.heroGradient}
          />
          
          {/* Back Button */}
          <View style={styles.headerNav}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Icon name="arrow-left" size="md" color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </PanGestureHandler>
    );
  };
  
  const renderDaySelector = () => {
    // Calculate dynamic font size based on title length
    const getDynamicFontSize = () => {
      const titleLength = trip.title.length;
      if (titleLength <= 15) return 28;
      if (titleLength <= 20) return 26;
      if (titleLength <= 25) return 24;
      if (titleLength <= 30) return 22;
      return 20;
    };

    return (
      <View style={styles.daySelector}>
        {/* Trip Info Header */}
        <View style={styles.daySelectorHeader}>
          <View style={styles.tripInfoContainer}>
            <Text 
              style={[styles.tripTitleInContent, { 
                fontSize: getDynamicFontSize(),
                color: colors.text.primary 
              }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {trip.title}
            </Text>
            <Text style={[styles.tripDatesInContent, { color: colors.text.secondary }]}>
              {formatTripDates(trip.startDate, trip.endDate)}
            </Text>
            <Text style={[styles.photoCountInContent, { color: colors.text.tertiary }]}>
              {trip.totalPhotos} memories
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.viewModeToggle, { borderColor: colors.border.secondary }]}
            onPress={toggleViewMode}
          >
            <Icon 
              name={viewMode === 'story' ? 'grid' : 'journal'} 
              size="sm" 
              color={colors.text.primary} 
            />
            <Text style={[styles.viewModeText, { color: colors.text.primary }]}>
              {viewMode === 'story' ? 'Grid View' : 'Story View'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={getProgressiveDays()}
          keyExtractor={item => `day-${item.day}`}
          renderItem={({ item }) => (
            <MinimalDayCard
              day={item}
              isSelected={item.day === selectedDay}
              onPress={handleDaySelect}
              variant={viewMode === 'grid' ? 'compact' : 'full'}
            />
          )}
          contentContainerStyle={styles.daySelectorContent}
          bounces={false}
        />
      </View>
    );
  };
  
  const getProgressiveDays = () => {
    // Show days progressively: completed days + the next empty day
    const completedDays = trip.days.filter(d => d.memories.length > 0);
    const nextEmptyDay = trip.days.find(d => d.memories.length === 0);
    
    // Always show completed days plus the next available day
    if (nextEmptyDay) {
      return [...completedDays, nextEmptyDay];
    }
    
    // If all days have memories, create the next day dynamically
    const nextDayNumber = Math.max(...trip.days.map(d => d.day)) + 1;
    
    // Don't exceed 100 days
    if (nextDayNumber <= 100) {
      const nextDate = new Date(trip.startDate);
      nextDate.setDate(nextDate.getDate() + nextDayNumber - 1);
      
      const nextDay: MinimalDay = {
        day: nextDayNumber,
        date: nextDate,
        memories: [],
        location: `Day ${nextDayNumber}`
      };
      
      // Add the new day to the trip data
      setTrip(prevTrip => ({
        ...prevTrip,
        days: [...prevTrip.days, nextDay]
      }));
      
      return [...completedDays, nextDay];
    }
    
    // If we've reached the limit, just show completed days
    return completedDays;
  };
  




  const renderStoryView = () => {
    if (!currentDay) return null;
    
    return (
      <View style={styles.storyContainer}>
        {/* Day Header */}
        <View style={styles.dayHeader}>
          <View style={styles.dayTitleRow}>
            <Text style={[styles.dayNumber, { color: colors.text.primary }]}>
              Day {currentDay.day}
            </Text>
          </View>
        </View>
        
        {/* Photos */}
        <View style={styles.photosContainer}>
          {currentDay.memories.map((memory: MinimalMemory, index: number) => (
            <DraggablePhotoItem
              key={memory.id}
              memory={memory}
              index={index}
              isStoryView={true}
            />
          ))}
          
          {/* Add Memory Placeholder */}
          <TouchableOpacity 
            style={[styles.addMemoryPlaceholder, { 
              backgroundColor: colors.surface.secondary,
              borderColor: '#000000', // Black outline moved from Day card
              borderWidth: 2,
            }]}
            onPress={() => handleAddMemory(selectedDay)}
          >
            <Icon name="plus" size="lg" color={colors.text.tertiary} />
            <Text style={[styles.addMemoryText, { color: colors.text.secondary }]}>
              Add Memory
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  


  const renderGridView = () => {
    // Get memories from selected day only (like story mode)
    const currentDay = trip.days.find(d => d.day === selectedDay);
    const currentMemories = currentDay?.memories || [];
    
    if (currentMemories.length === 0) {
      return (
        <View style={styles.gridContainer}>
          {/* Add Memory Button for Grid View */}
          <TouchableOpacity 
            style={[styles.addMemoryPlaceholder, { 
              backgroundColor: colors.surface.secondary,
              borderColor: '#000000', // Black outline moved from Day card
              borderWidth: 2,
            }]}
            onPress={() => handleAddMemory(selectedDay)}
          >
            <Icon name="plus" size="lg" color={colors.text.tertiary} />
            <Text style={[styles.addMemoryText, { color: colors.text.secondary }]}>
              Add Memory
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Perfect grid spacing calculations
    const GRID_PADDING = SPACING.md;
    
    return (
      <View style={[styles.gridContainer, { paddingHorizontal: GRID_PADDING }]}>
        {/* Grid Photos */}
        <View style={styles.gridPhotosWrapper}>
          {currentMemories.map((memory: MinimalMemory, index: number) => (
            <DraggablePhotoItem
              key={memory.id}
              memory={memory}
              index={index}
              isStoryView={false}
            />
          ))}
        </View>
        
        {/* Add Memory Button for Grid View */}
        <TouchableOpacity 
          style={[styles.addMemoryPlaceholder, { 
            backgroundColor: colors.surface.secondary,
            borderColor: '#000000', // Black outline moved from Day card
            borderWidth: 2,
            marginHorizontal: GRID_PADDING,
          }]}
          onPress={() => handleAddMemory(selectedDay)}
        >
          <Icon name="plus" size="lg" color={colors.text.tertiary} />
          <Text style={[styles.addMemoryText, { color: colors.text.secondary }]}>
            Add Memory
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const styles = createStyles(colors);
  
  return (
    <View style={styles.container}>
      <PanGestureHandler 
        onGestureEvent={handleGesture} 
        onHandlerStateChange={handleGestureStateChange}
      >
        <Animated.View 
          style={[
            styles.modal,
            { transform: [{ translateY }] }
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>
          
          {/* Scrollable Content */}
          <Animated.ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            scrollEnabled={!isDragging}
          >
            {/* Header */}
            {renderHeader()}
            
            <View style={styles.contentArea}>
              {/* Day Selector */}
              {renderDaySelector()}
              
              {/* Main Content */}
              {viewMode === 'story' ? renderStoryView() : renderGridView()}
            </View>
            
            {/* Add Next Day Button - Removed as requested */}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </Animated.ScrollView>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Photo Lightbox */}
      {lightboxMemory && (
        <PhotoLightbox
          memory={lightboxMemory}
          visible={lightboxVisible}
          onClose={() => {
            setLightboxVisible(false);
            setLightboxMemory(null);
          }}
          onCaptionUpdate={handleCaptionUpdate}
        />
      )}
      
      {/* Change Photo Modal */}
      <Modal
        visible={showChangePhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowChangePhotoModal(false);
          setChangingPhotoId(null);
        }}
      >
        <View style={styles.changePhotoModalOverlay}>
          <View style={styles.changePhotoModal}>
            {/* Modal Header */}
            <View style={styles.changePhotoHeader}>
              <Text style={styles.changePhotoTitle}>
                Change Photo
              </Text>
              <Text style={styles.changePhotoSubtitle}>
                How would you like to add a photo?
              </Text>
            </View>
            
            {/* Options */}
            <View style={styles.changePhotoOptions}>
              <TouchableOpacity 
                style={[styles.changePhotoOption, { 
                  borderTopWidth: 0.5,
                  borderTopColor: '#E0E0E0',
                }]}
                onPress={handleChangePhotoFromCamera}
              >
                <Text style={styles.changePhotoOptionText}>
                  Take Photo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.changePhotoOption}
                onPress={handleChangePhotoFromLibrary}
              >
                <Text style={styles.changePhotoOptionText}>
                  Choose from Library
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.changePhotoOption, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setShowChangePhotoModal(false);
                  setChangingPhotoId(null);
                }}
              >
                <Text style={styles.changePhotoOptionText}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background for entire screen
  },
  
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Explicitly white background
    overflow: 'hidden',
  },
  
  dragHandleContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  
  dragHandle: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 3,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  
  // Header
  header: {
    height: 380, // Fine-tuned for optimal balance
    position: 'relative',
    overflow: 'hidden',
  },
  
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  headerNav: {
    position: 'absolute',
    top: SPACING.lg + 20, // Account for status bar
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  
  viewToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  titleContainer: {
    position: 'absolute',
    bottom: SPACING.xl * 2, // Moved down from SPACING.xl * 2.5
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'flex-start', // Left align the text
  },
  
  tripTitle: {
    fontSize: 38,
    fontWeight: '400',
    color: 'white',
    marginBottom: SPACING.xs * 0.5, // Reduced from SPACING.xs
    fontFamily: 'Merienda',
    letterSpacing: -2.5, // Much more reduced letter spacing
  },
  
  tripDates: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: SPACING.xs * 0.5, // Reduced gap to memories count
  },
  
  photoCountTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.xs,
  },
  
  // Day Selector
  daySelector: {
    paddingBottom: SPACING.lg,
    marginTop: -SPACING.md, // Add negative margin to move up
  },
  
  daySelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Changed to align to top
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg, // Increased from SPACING.md for bigger gap
  },
  
  tripInfoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  
  tripTitleInContent: {
    fontWeight: '600',
    marginBottom: SPACING.xs * 0.5,
    fontFamily: 'Merienda',
    letterSpacing: -1,
  },
  
  tripDatesInContent: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: SPACING.xs * 0.5,
  },
  
  photoCountInContent: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  daySelectorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  
  viewModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
    borderWidth: 1,
  },
  
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  daySelectorContent: {
    paddingHorizontal: SPACING.md,
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Ensure white background throughout
  },
  
  contentArea: {
    backgroundColor: '#FFFFFF', // Explicitly white for clean overlap
    borderTopLeftRadius: BORDER_RADIUS.xxl * 1.5, // Much more rounded
    borderTopRightRadius: BORDER_RADIUS.xxl * 1.5,
    marginTop: -BORDER_RADIUS.xxl * 1.5, // Increased negative margin for more overlap
    paddingTop: SPACING.xl * 1.5, // More padding to compensate
    // Shadow removed as requested
  },
  
  // Story View
  storyContainer: {
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFFF', // Consistent white background
  },
  
  dayHeader: {
    marginBottom: SPACING.xl,
  },
  
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  
  dayNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  
  dayLocation: {
    fontSize: 18,
    fontWeight: '500',
  },
  
  photosContainer: {
    gap: SPACING.lg,
  },
  
  // Photo styles
  photoItem: {
    marginBottom: SPACING.lg,
  },
  
  gridPhotosWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // Photo styles
  sortableItem: {
    marginBottom: SPACING.lg,
  },
  
  sortableGridItem: {
    marginBottom: SPACING.sm,
    alignItems: 'center',
    width: '50%',
  },
  
  draggedItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  
  addMemoryPlaceholder: {
    height: 120,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl, // Added bottom padding
    gap: SPACING.sm,
  },
  
  addMemoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  addNextDayContainer: {
    padding: SPACING.lg,
  },

  addDayButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  
  addDayText: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  addDayLocation: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Grid View
  gridContainer: {
    backgroundColor: '#FFFFFF', // Consistent white background
    // paddingHorizontal will be set dynamically in the component
  },
  
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // This creates the perfect gap between columns
  },
  
  gridColumn: {
    // width will be set dynamically in the component
  },
  
  gridPhotoWrapper: {
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    gap: SPACING.md,
  },
  
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  bottomSpacing: {
    height: 100,
  },
  
  // Change Photo Modal Styles
  changePhotoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  changePhotoModal: {
    borderRadius: 14,
    width: screenWidth * 0.65,
    maxWidth: 270,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 25,
  },
  
  changePhotoHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  
  changePhotoTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textAlign: 'center',
    color: '#000000',
  },
  
  changePhotoSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    color: '#666666',
  },
  
  changePhotoOptions: {
    // Container for options
  },
  
  changePhotoOption: {
    paddingVertical: SPACING.md + 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  
  changePhotoOptionText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
  },
}); 
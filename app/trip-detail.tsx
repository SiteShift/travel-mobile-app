import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Easing,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Icon } from '../src/components/Icon';
import { SPACING } from '../src/constants/theme';
import { Image } from 'expo-image';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Memory {
  id: string;
  type: 'photo';
  uri: string;
  width: number;
  height: number;
}

interface TripDay {
  day: number;
  memories: Memory[];
}

const mockTripData: { id: string; title: string; days: TripDay[] } = {
  id: '1',
  title: 'California Road Trip',
  days: Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    memories: i === 0 ? [
      { id: '1', type: 'photo', uri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', width: 800, height: 533 }, // Landscape
      { id: '2', type: 'photo', uri: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800', width: 800, height: 1120 }, // Portrait
      { id: '3', type: 'photo', uri: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800', width: 800, height: 1200 }, // Portrait
      { id: '4', type: 'photo', uri: 'https://images.unsplash.com/photo-1499591934337-9195ba476839?w=800', width: 800, height: 800 }, // Square
      { id: '5', type: 'photo', uri: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=800', width: 800, height: 533 }, // Landscape
    ] : []
  }))
};

const HEADER_CONTENT_HEIGHT = 110;
const DAY_NAV_HEIGHT = 70;
const STICKY_HEADER_TOTAL_HEIGHT = HEADER_CONTENT_HEIGHT + DAY_NAV_HEIGHT;
const COLUMN_GAP = 12;

export default function TripDetailModal() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(1);
  const { title, days } = mockTripData;
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const handleGestureStateChange = useCallback((event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY: gestureY, velocityY } = event.nativeEvent;
      if (gestureY > 150 || velocityY > 1200) {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start(() => router.back());
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
      }
    }
  }, [translateY, router]);

  const scrollYValue = useRef(0);
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      scrollYValue.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const handleGesture = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true, listener: (event: { nativeEvent: { translationY: number } }) => {
        const { translationY } = event.nativeEvent;
        if (scrollYValue.current > 0 && translationY > 0) {
            scrollY.setValue(Math.max(0, scrollYValue.current - translationY));
        }
    }}
  );
  
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  useEffect(() => {
    translateY.setValue(screenHeight);
    Animated.spring(translateY, {
      toValue: 0,
      tension: 100,
      friction: 12,
      useNativeDriver: true,
    }).start();
    StatusBar.setBarStyle('light-content', true);
  }, [translateY]);

  const { leftColumn, rightColumn } = useMemo(() => {
    const memories = days.find(d => d.day === selectedDay)?.memories || [];
    const LCol: Memory[] = [];
    const RCol: Memory[] = [];
    const lHeights: number[] = [0];
    const rHeights: number[] = [0];
    const colWidth = (screenWidth - (SPACING.lg * 2) - COLUMN_GAP) / 2;

    memories.forEach(mem => {
      const aspectRatio = mem.width / mem.height;
      const height = colWidth / aspectRatio;
      
      if (lHeights[0] <= rHeights[0]) {
        LCol.push(mem);
        lHeights[0] += height;
      } else {
        RCol.push(mem);
        rHeights[0] += height;
      }
    });

    return { leftColumn: LCol, rightColumn: RCol };
  }, [selectedDay, days]);

  const DayCircle = useCallback(({ day, hasMemories }: { day: number, hasMemories: boolean }) => {
    const isSelected = day === selectedDay;
    return (
      <TouchableOpacity
        style={[styles.dayCircle, isSelected && styles.dayCircleSelected, hasMemories && !isSelected && styles.dayCircleWithMemories]}
        onPress={() => setSelectedDay(day)} activeOpacity={0.7}
      >
        <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected, hasMemories && !isSelected && styles.dayNumberWithMemories]}>{day}</Text>
      </TouchableOpacity>
    );
  }, [selectedDay]);

  const MemoryCard = useCallback(({ memory }: { memory?: Memory }) => {
    const colWidth = (screenWidth - (SPACING.lg * 2) - COLUMN_GAP) / 2;
    if (memory?.uri) {
      const aspectRatio = memory.width / memory.height;
      const height = colWidth / aspectRatio;
      return (
        <View style={[styles.memoryCardWrapper, { height }]}>
          <Image source={{ uri: memory.uri }} style={styles.memoryImage} contentFit="cover" />
        </View>
      );
    }
    return (
      <TouchableOpacity style={[styles.addMemoryCard, { height: colWidth * 1.2 }]} activeOpacity={0.7}>
        <View style={styles.addMemoryIcon}><Icon name="add" size="lg" color="#666666" /></View>
        <Text style={styles.addMemoryText}>Add Memory</Text>
      </TouchableOpacity>
    );
  }, []);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_CONTENT_HEIGHT],
    outputRange: [0, -HEADER_CONTENT_HEIGHT],
    extrapolate: 'clamp',
  });

  const dayNavTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_CONTENT_HEIGHT],
    outputRange: [0, -HEADER_CONTENT_HEIGHT],
    extrapolate: 'clamp',
  });
  
  return (
    <View style={styles.rootContainer}>
      <PanGestureHandler onGestureEvent={handleGesture} onHandlerStateChange={handleGestureStateChange}>
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY }] }]}>
          <View style={styles.dragHandleContainer}><View style={styles.dragHandle} /></View>
          
          <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
            <Text style={styles.tripTitle} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
            <Text style={styles.daysLabel}>Days</Text>
          </Animated.View>
          
          <Animated.View style={[styles.dayNav, { transform: [{ translateY: dayNavTranslateY }] }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayNavigationContent} bounces={false}>
              {days.map(day => <DayCircle key={day.day} day={day.day} hasMemories={day.memories.length > 0} />)}
              <TouchableOpacity style={styles.addDayCircle} activeOpacity={0.7}><Icon name="add" size="md" color="#666666" /></TouchableOpacity>
            </ScrollView>
          </Animated.View>
          
          <Animated.ScrollView
            style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}
            onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
          >
            <View style={{ height: STICKY_HEADER_TOTAL_HEIGHT }} />
            <View style={styles.memoryGrid}>
              <View style={styles.memoryColumn}>
                {leftColumn.map((mem) => <MemoryCard key={mem.id} memory={mem} />)}
                {leftColumn.length === 0 && <MemoryCard />}
              </View>
              <View style={styles.memoryColumn}>
                {rightColumn.map((mem) => <MemoryCard key={mem.id} memory={mem} />)}
                {rightColumn.length === 0 && <MemoryCard />}
              </View>
            </View>
          </Animated.ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: 'transparent' },
  modalContainer: { flex: 1, backgroundColor: '#0a0a0a', marginTop: 60, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  dragHandleContainer: { paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  dragHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_CONTENT_HEIGHT, paddingTop: 27, paddingBottom: 4, paddingHorizontal: SPACING.lg, alignItems: 'center', zIndex: 2, backgroundColor: '#0a0a0a' },
  tripTitle: { fontSize: 48, fontWeight: '400', color: '#ffffff', fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontStyle: 'italic', letterSpacing: -2, lineHeight: 52 },
  daysLabel: { fontSize: 15, color: '#888', fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif', fontWeight: '500', marginTop: 4 },
  dayNav: { position: 'absolute', top: HEADER_CONTENT_HEIGHT, left: 0, right: 0, height: DAY_NAV_HEIGHT, zIndex: 2, backgroundColor: '#0a0a0a', borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  dayNavigationContent: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, alignItems: 'center' },
  dayCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', marginHorizontal: 6 },
  dayCircleSelected: { backgroundColor: '#ffffff' },
  dayCircleWithMemories: { backgroundColor: '#3A3A3C' },
  dayNumber: { fontSize: 16, fontWeight: '400', color: '#8A8A8E', fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif' },
  dayNumberSelected: { color: '#000000', fontWeight: '700' },
  dayNumberWithMemories: { color: '#EAEAF3' },
  addDayCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C', borderStyle: 'dashed', marginLeft: 6 },
  scrollContent: { flex: 1, zIndex: 1 },
  scrollContentContainer: { paddingTop: 10 },
  memoryGrid: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: COLUMN_GAP },
  memoryColumn: { flex: 1, gap: COLUMN_GAP },
  addMemoryCard: { borderRadius: 12, borderWidth: 1, borderColor: '#3A3A3C', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' },
  addMemoryIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  addMemoryText: { fontSize: 15, color: '#8A8A8E', fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif', fontWeight: '500' },
  memoryCardWrapper: { borderRadius: 12, backgroundColor: '#1C1C1E', overflow: 'hidden' },
  memoryImage: { width: '100%', height: '100%' },
}); 
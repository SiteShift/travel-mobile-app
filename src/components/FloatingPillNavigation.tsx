import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

// SVG icon data from the actual files
const bookSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const mapSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M15 5.764v15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9 3.236v15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const userSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const plusSvg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5 12h14" stroke="#333333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 5v14" stroke="#333333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface FloatingPillNavigationProps {
  activeTab?: string;
}

export const FloatingPillNavigation: React.FC<FloatingPillNavigationProps> = ({
  activeTab,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  
  // Single scale animation ref for active tab
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const navigationItems = [
    {
      id: 'journal',
      route: '/(tabs)',
      svg: bookSvg,
      isActive: pathname === '/' || pathname === '/(tabs)' || pathname.includes('index'),
    },
    {
      id: 'map',
      route: '/(tabs)/map',
      svg: mapSvg,
      isActive: pathname.includes('/map'),
    },
    {
      id: 'profile',
      route: '/(tabs)/profile',
      svg: userSvg,
      isActive: pathname.includes('/profile'),
    },
    {
      id: 'add',
      route: '/camera',
      svg: plusSvg,
      isSpecial: true,
      isActive: false,
    },
  ];

  const handleNavPress = (route: string, id: string) => {
    // Light haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Simple press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (id === 'add') {
      router.push('/camera');
    } else {
      router.push(route as any);
    }
  };

  const renderSpecialButton = (item: any) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleNavPress(item.route, item.id)}
      style={{ alignItems: 'center', justifyContent: 'center' }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#FF4444', '#FF8800', '#0099FF', '#00CC44']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.gradientButton}
      >
        <View style={styles.innerWhiteCircle}>
          <SvgXml xml={item.svg} width={32} height={32} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderRegularButton = (item: any) => {
    // Keep icons black when active, use sunset color for background/indicator
    const activeColor = isDark ? '#FFFFFF' : '#000000'; // Black icons when active
    const inactiveColor = isDark ? '#888888' : '#AAAAAA';
    const sunsetColor = '#FF6B6B'; // Beautiful sunset coral color

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleNavPress(item.route, item.id)}
        style={[
          styles.navButton,
          item.isActive && styles.activeNavButton,
          item.isActive && {
            backgroundColor: isDark 
              ? 'rgba(255, 107, 107, 0.12)' // Sunset tint for dark mode
              : 'rgba(255, 107, 107, 0.08)', // Sunset tint for light mode
          }
        ]}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <SvgXml
            xml={item.svg}
            width={24}
            height={24}
            color={item.isActive ? activeColor : inactiveColor}
          />
        </Animated.View>
        
        {/* Clean active indicator with sunset color */}
        {item.isActive && (
          <View
            style={[
              styles.activeIndicator,
              {
                backgroundColor: sunsetColor, // Beautiful sunset coral
              },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Hide navigation on camera screen
  if (pathname.includes('/camera')) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <View 
        style={[
          styles.pillContainer, 
          { 
            backgroundColor: colors.surface.primary,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            shadowColor: isDark ? '#FFFFFF' : '#000000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: isDark ? 0.05 : 0.1,
            shadowRadius: 12,
            elevation: 8,
          }
        ]}
      >
        {navigationItems.map((item) =>
          item.isSpecial ? (
            <View key={item.id} style={styles.specialButtonWrapper}>
              {renderSpecialButton(item)}
            </View>
          ) : (
            <View key={item.id} style={styles.regularButtonWrapper}>
              {renderRegularButton(item)}
            </View>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    marginHorizontal: 32,
    borderWidth: 1,
    minWidth: screenWidth - 64,
  },
  regularButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    position: 'relative',
    minWidth: 50,
    minHeight: 50,
  },
  activeNavButton: {
    borderRadius: 25,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  gradientButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerWhiteCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default FloatingPillNavigation; 
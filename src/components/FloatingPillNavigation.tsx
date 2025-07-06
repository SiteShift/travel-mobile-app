import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';

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

const plusSvg = `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5 12h14" stroke="#333333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 5v14" stroke="#333333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface FloatingPillNavigationProps {
  activeTab?: string;
}

export const FloatingPillNavigation: React.FC<FloatingPillNavigationProps> = ({
  activeTab,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

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
      style={styles.specialButtonContainer}
      activeOpacity={0.8}
    >
             <LinearGradient
         colors={['#FF4444', '#FF8800', '#0099FF', '#00CC44']}
         start={{ x: 0, y: 1 }}
         end={{ x: 0, y: 0 }}
         style={styles.gradientButton}
       >
                 <View style={styles.innerWhiteCircle}>
           <SvgXml xml={item.svg} width={38} height={38} />
         </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderRegularButton = (item: any) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleNavPress(item.route, item.id)}
      style={styles.navButton}
      activeOpacity={0.7}
    >
      <SvgXml
        xml={item.svg}
        width={32}
        height={32}
        color={item.isActive ? colors.text.primary : colors.text.tertiary}
      />
    </TouchableOpacity>
  );

  // Hide navigation on camera screen
  if (pathname.includes('/camera')) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      <View style={[styles.pillContainer, { backgroundColor: colors.surface.primary }]}>
        <View style={styles.regularIconsContainer}>
          {navigationItems.filter(item => !item.isSpecial).map((item) =>
            renderRegularButton(item)
          )}
        </View>
        {navigationItems.filter(item => item.isSpecial).map((item) =>
          renderSpecialButton(item)
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
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 80,
    marginHorizontal: 28,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    minWidth: screenWidth - 56,
  },
  regularIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flex: 1,
    marginRight: 40,
  },
  navButton: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  gradientButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerWhiteCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default FloatingPillNavigation; 
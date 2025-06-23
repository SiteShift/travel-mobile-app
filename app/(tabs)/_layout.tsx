import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, View, Pressable, ImageBackground } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Icon } from '../../src/components/Icon';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const CameraTabButton = ({ onPress }: { onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={{
        marginBottom: Platform.OS === 'ios' ? 25 : 20,
      }}
    >
      <ImageBackground
        source={require('../../public/assets/camera-button.webp')}
        style={{
          width: 80,
          height: 80,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        resizeMode="contain"
      >
        <Icon name="camera" size="xxl" color="#000000" />
      </ImageBackground>
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff', // White for dark theme
        tabBarInactiveTintColor: '#64748b', // Muted gray for inactive
        tabBarStyle: {
          backgroundColor: '#0a0a0a', // Softer dark to match home screen
          borderTopWidth: 0, // Remove top border
          height: Platform.OS === 'ios' ? 100 : 80, // Increased height
          paddingBottom: Platform.OS === 'ios' ? 40 : 20, // Increased padding
          paddingTop: 16, // Increased top padding
          // Add subtle top shadow
          shadowColor: '#ffffff',
          shadowOffset: {
            width: 0,
            height: -1,
          },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 14, // Increased from 12
          fontWeight: '600',
          marginTop: 8, // Increased from 6
          letterSpacing: 0.3, // Reduced from 0.5
        },
        tabBarItemStyle: {
          paddingVertical: 6, // Increased from 4
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: () => null, // Remove label
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              paddingTop: 4, // Increased from 2
              transform: [{ scale: focused ? 1.15 : 1.05 }], // Increased scale
            }}>
              <Icon
                name={focused ? 'book' : 'book-outline'}
                size="lg" // Increased from "md"
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarLabel: () => null, // Remove label
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              paddingTop: 4, // Increased from 2
              transform: [{ scale: focused ? 1.15 : 1.05 }], // Increased scale
            }}>
            <Icon
                name={focused ? 'location' : 'location-outline'}
                size="lg" // Increased from "md"
              color={color}
            />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: () => null, // Remove label
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              paddingTop: 4, // Increased from 2
              transform: [{ scale: focused ? 1.15 : 1.05 }], // Increased scale
            }}>
            <Icon
                name={focused ? 'person' : 'person-outline'}
                size="lg" // Increased from "md"
              color={color}
            />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          tabBarStyle: { display: 'none' }, // Hide tab bar for full viewport
          headerShown: false,
          tabBarButton: () => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <CameraTabButton 
                onPress={() => router.push('/camera')}
              />
            </View>
          ),
        }}
      />
      
      {/* Hide unused tabs */}
      <Tabs.Screen
        name="trips"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
} 
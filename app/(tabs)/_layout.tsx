import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Pressable } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Icon } from '../../src/components/Icon';

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  // Custom Camera Tab Button Component - Made bigger
  const CameraTabButton = ({ onPress }: { onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={{
        width: 80, // Increased from 72
        height: 80, // Increased from 72
        borderRadius: 40, // Increased from 36
        backgroundColor: '#4ADE80', // Vibrant green
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 30 : 25, // Increased spacing
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 12, // Increased shadow
        },
        shadowOpacity: 0.5, // Increased opacity
        shadowRadius: 18, // Increased blur
        elevation: 18, // Increased elevation
        // Add subtle inner shadow effect
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
      }}
      android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true }}
    >
      <Icon
        name="camera"
        size="xxl" // Increased from "xl"
        color="#ffffff"
      />
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff', // White for dark theme
        tabBarInactiveTintColor: '#64748b', // Muted gray for inactive
        tabBarStyle: {
          backgroundColor: '#000000', // Pure black to match home screen
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
          tabBarIcon: ({ focused }) => (
            <CameraTabButton onPress={() => {
              // Handle camera navigation
              console.log('Camera pressed');
            }} />
          ),
          tabBarLabel: () => null, // Remove label completely
          tabBarButton: (props) => (
            <View style={{ 
              flex: 1, 
              justifyContent: 'center', 
              alignItems: 'center',
              paddingBottom: Platform.OS === 'ios' ? 16 : 12, // Increased padding
            }}>
              <CameraTabButton onPress={() => {
                // Handle camera navigation
                console.log('Camera pressed');
              }} />
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
import React, { memo } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useNavigationState } from '@react-navigation/native';
import { Platform, View, Pressable, ImageBackground } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Icon } from '../../src/components/Icon';
import { FloatingPillNavigation } from '../../src/components/FloatingPillNavigation';

const TabLayout = memo(() => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const state = useNavigationState(state => state);
  const currentRouteName = state ? state.routes[state.index]?.name : 'index';
  const showFloatingNav = currentRouteName !== 'camera';

  const CameraTabButton = ({ onPress }: { onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={{
        marginBottom: Platform.OS === 'ios' ? 25 : 20,
      }}
    >
      <ImageBackground
        source={require('../../public/assets/Travel App (Max & Sam) (4)-Photoroom-min.png')}
        style={{
          width: 80,
          height: 80,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        resizeMode="contain"
      >
        {/* Removed camera icon */}
      </ImageBackground>
    </Pressable>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarStyle: { display: 'none' }, // Hide the default tab bar completely
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Journal',
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Camera',
          }}
        />
        
        {/* Hide unused tabs */}
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
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
      
      {/* Add the floating pill navigation only when not on the camera screen */}
      {showFloatingNav && <FloatingPillNavigation />}
    </>
  );
});

export default TabLayout; 
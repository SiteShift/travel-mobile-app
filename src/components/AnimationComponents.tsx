import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  ViewStyle,
  Pressable,
  View,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animated View with entrance animations
export interface AnimatedEntranceProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'bounce' | 'flip';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  testID?: string;
}

export const AnimatedEntrance: React.FC<AnimatedEntranceProps> = ({
  children,
  type = 'fade',
  direction = 'up',
  duration = 500,
  delay = 0,
  style,
  testID,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = [];

    // Setup initial values and animations based on type
    switch (type) {
      case 'fade':
        fadeAnim.setValue(0);
        animations.push(
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        );
        break;

      case 'slide':
        const slideValue = direction === 'up' || direction === 'down' ? 
          (direction === 'up' ? 50 : -50) : 
          (direction === 'left' ? 50 : -50);
        slideAnim.setValue(slideValue);
        fadeAnim.setValue(0);
        animations.push(
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration,
              delay,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration,
              delay,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'scale':
        scaleAnim.setValue(0.8);
        fadeAnim.setValue(0);
        animations.push(
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              delay,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: duration / 2,
              delay,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'bounce':
        scaleAnim.setValue(0);
        animations.push(
          Animated.spring(scaleAnim, {
            toValue: 1,
            delay,
            tension: 200,
            friction: 6,
            useNativeDriver: true,
          })
        );
        break;

      case 'flip':
        rotateAnim.setValue(0);
        fadeAnim.setValue(0);
        animations.push(
          Animated.parallel([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration,
              delay,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: duration / 2,
              delay: delay + duration / 4,
              useNativeDriver: true,
            }),
          ])
        );
        break;
    }

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }, [type, direction, duration, delay]);

  const getTransform = () => {
    const transforms = [];

    if (type === 'slide') {
      if (direction === 'up' || direction === 'down') {
        transforms.push({ translateY: slideAnim });
      } else {
        transforms.push({ translateX: slideAnim });
      }
    }

    if (type === 'scale' || type === 'bounce') {
      transforms.push({ scale: scaleAnim });
    }

    if (type === 'flip') {
      const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '0deg'],
      });
      transforms.push({ rotateY: rotateInterpolate });
    }

    return transforms;
  };

  const animatedStyle = {
    opacity: type === 'bounce' ? 1 : fadeAnim,
    transform: getTransform(),
  };

  return (
    <Animated.View
      style={[animatedStyle, style]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

// Pressable with micro-interactions
export interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  scaleValue?: number;
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  glowEffect?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
  testID?: string;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  onLongPress,
  scaleValue = 0.95,
  hapticFeedback = true,
  rippleEffect = false,
  glowEffect = false,
  style,
  disabled = false,
  testID,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const animatePress = (pressed: boolean) => {
    Animated.spring(scaleAnim, {
      toValue: pressed ? scaleValue : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 17,
    }).start();

    if (rippleEffect && pressed) {
      rippleAnim.setValue(0);
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }

    if (glowEffect) {
      Animated.timing(glowAnim, {
        toValue: pressed ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    if (disabled) return;
    
    if (hapticFeedback && Platform.OS === 'ios') {
      // Would implement haptic feedback here
      // HapticFeedback.impact(HapticFeedback.ImpactFeedbackStyle.Light);
    }
    
    onPress?.();
    
    // Quick feedback animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: scaleValue,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rippleStyle = rippleEffect ? {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary[500],
    opacity: rippleAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.2, 0],
    }),
    transform: [
      {
        scale: rippleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  } : {};

  const glowStyle = glowEffect ? {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.5],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10],
    }),
    elevation: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10],
    }),
  } : {};

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={() => animatePress(true)}
      onPressOut={() => animatePress(false)}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        style,
        glowStyle,
        {
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        {children}
        {rippleEffect && <Animated.View style={rippleStyle} />}
      </Animated.View>
    </Pressable>
  );
};

// Pull to refresh animation
export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  pullDistance?: number;
  style?: ViewStyle;
  testID?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshing = false,
  pullDistance = 100,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(refreshing);
  const pullAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 0 && gestureState.dx < 30;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        const progress = Math.min(gestureState.dy / pullDistance, 1);
        pullAnim.setValue(gestureState.dy);
        scaleAnim.setValue(progress);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > pullDistance && !isRefreshing) {
        setIsRefreshing(true);
        startRefreshAnimation();
        onRefresh().finally(() => {
          setIsRefreshing(false);
          resetAnimation();
        });
      } else {
        resetAnimation();
      }
    },
  });

  const startRefreshAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const resetAnimation = () => {
    Animated.parallel([
      Animated.timing(pullAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    rotateAnim.setValue(0);
  };

  useEffect(() => {
    if (refreshing && !isRefreshing) {
      setIsRefreshing(true);
      startRefreshAnimation();
    } else if (!refreshing && isRefreshing) {
      setIsRefreshing(false);
      resetAnimation();
    }
  }, [refreshing]);

  const refreshIndicatorStyle = {
    position: 'absolute' as const,
    top: pullAnim.interpolate({
      inputRange: [0, pullDistance],
      outputRange: [-30, 20],
      extrapolate: 'clamp',
    }),
    alignSelf: 'center' as const,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary[500],
    transform: [
      {
        scale: scaleAnim,
      },
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={[{ flex: 1 }, style]} testID={testID}>
      <Animated.View
        style={{
          flex: 1,
          transform: [
            {
              translateY: pullAnim.interpolate({
                inputRange: [0, pullDistance],
                outputRange: [0, pullDistance / 2],
                extrapolate: 'clamp',
              }),
            },
          ],
        }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
      <Animated.View style={refreshIndicatorStyle} />
    </View>
  );
};

// Screen transition wrapper
export interface ScreenTransitionProps {
  children: React.ReactNode;
  type?: 'slide' | 'fade' | 'scale' | 'modal';
  duration?: number;
  style?: ViewStyle;
  testID?: string;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  type = 'slide',
  duration = 300,
  style,
  testID,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const animations = [];

    switch (type) {
      case 'fade':
        animations.push(
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          })
        );
        break;

      case 'slide':
        animations.push(
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'scale':
        animations.push(
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'modal':
        slideAnim.setValue(SCREEN_HEIGHT);
        animations.push(
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          })
        );
        break;
    }

    Animated.parallel(animations).start();
  }, [type, duration]);

  const getAnimatedStyle = () => {
    switch (type) {
      case 'fade':
        return { opacity: fadeAnim };
      case 'slide':
        return {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        };
      case 'scale':
        return {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        };
      case 'modal':
        return {
          transform: [{ translateY: slideAnim }],
        };
      default:
        return {};
    }
  };

  return (
    <Animated.View
      style={[
        { flex: 1 },
        getAnimatedStyle(),
        style,
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

// Staggered list animation
export interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale';
  style?: ViewStyle;
  testID?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 100,
  animationType = 'slide',
  style,
  testID,
}) => {
  return (
    <View style={style} testID={testID}>
      {React.Children.map(children, (child, index) => (
        <AnimatedEntrance
          key={index}
          type={animationType}
          delay={index * staggerDelay}
          testID={`${testID}-item-${index}`}
        >
          {child}
        </AnimatedEntrance>
      ))}
    </View>
  );
};

// Success feedback animation
export const SuccessFeedback: React.FC<{
  children: React.ReactNode;
  showSuccess: boolean;
  style?: ViewStyle;
  testID?: string;
}> = ({ children, showSuccess, style, testID }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showSuccess) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [showSuccess]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.success[500]],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor,
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

// Animation utilities
export const AnimationUtils = {
  // Create a breathing animation
  createBreathingAnimation: (animatedValue: Animated.Value, duration: number = 2000) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.7,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    );
  },

  // Create a pulse animation
  createPulseAnimation: (animatedValue: Animated.Value, duration: number = 1000) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
  },

  // Create a shake animation
  createShakeAnimation: (animatedValue: Animated.Value) => {
    const shakeAnimation = Animated.sequence([
      Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]);
    return shakeAnimation;
  },
}; 
import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

export type SafeAreaVariant = 'full' | 'top' | 'bottom' | 'horizontal' | 'none';
export type SafeAreaMode = 'padding' | 'margin';

export interface SafeAreaWrapperProps {
  children: React.ReactNode;
  variant?: SafeAreaVariant;
  mode?: SafeAreaMode;
  backgroundColor?: string;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  testID?: string;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  variant = 'full',
  mode = 'padding',
  backgroundColor,
  style,
  edges,
  testID,
}) => {
  const { colors, mode: themeMode } = useTheme();

  const getEdges = (): ('top' | 'bottom' | 'left' | 'right')[] => {
    if (edges) return edges;
    
    switch (variant) {
      case 'full':
        return ['top', 'bottom', 'left', 'right'];
      case 'top':
        return ['top', 'left', 'right'];
      case 'bottom':
        return ['bottom', 'left', 'right'];
      case 'horizontal':
        return ['left', 'right'];
      case 'none':
        return [];
      default:
        return ['top', 'bottom', 'left', 'right'];
    }
  };

  const getBackgroundColor = (): string => {
    if (backgroundColor) return backgroundColor;
    return colors.surface.primary;
  };

  const containerStyles: ViewStyle = {
    flex: 1,
    backgroundColor: getBackgroundColor(),
    ...style,
  };

  const safeAreaProps = {
    style: containerStyles,
    edges: getEdges(),
    mode,
    testID,
  };

  return (
    <>
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={getBackgroundColor()}
        translucent={false}
      />
      <SafeAreaView {...safeAreaProps}>
        {children}
      </SafeAreaView>
    </>
  );
};

// Convenience components for common use cases
export const FullSafeArea: React.FC<{
  children: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
  testID?: string;
}> = ({ children, backgroundColor, style, testID }) => (
  <SafeAreaWrapper
    variant="full"
    backgroundColor={backgroundColor}
    style={style}
    testID={testID}
  >
    {children}
  </SafeAreaWrapper>
);

export const TopSafeArea: React.FC<{
  children: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
  testID?: string;
}> = ({ children, backgroundColor, style, testID }) => (
  <SafeAreaWrapper
    variant="top"
    backgroundColor={backgroundColor}
    style={style}
    testID={testID}
  >
    {children}
  </SafeAreaWrapper>
);

export const BottomSafeArea: React.FC<{
  children: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
  testID?: string;
}> = ({ children, backgroundColor, style, testID }) => (
  <SafeAreaWrapper
    variant="bottom"
    backgroundColor={backgroundColor}
    style={style}
    testID={testID}
  >
    {children}
  </SafeAreaWrapper>
);

export default SafeAreaWrapper; 
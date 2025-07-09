import React from 'react';
import { StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BottomGradientProps {
  height?: number;
}

// Use the same color interpolation function
const interpolateColor = (startY: number, screenHeight: number): string => {
  const progress = Math.min(1, Math.max(0, startY / screenHeight));
  const r = Math.round(254 + (217 - 254) * progress);
  const g = Math.round(254 + (217 - 254) * progress);
  const b = Math.round(254 + (217 - 254) * progress);
  return `rgb(${r}, ${g}, ${b})`;
};

export const BottomGradient: React.FC<BottomGradientProps> = ({ height }) => {
  const { height: screenHeight } = useWindowDimensions();
  
  // Use provided height or default platform-specific height
  const gradientHeight = height || getDefaultGradientHeight();
  
  // Calculate color at the middle of the gradient
  const middlePosition = screenHeight - (gradientHeight / 2);
  const middleColor = interpolateColor(middlePosition, screenHeight);
  
  // Parse RGB values for creating RGBA
  const rgbMatch = middleColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
  const r = rgbMatch ? parseInt(rgbMatch[1]) : 254;
  const g = rgbMatch ? parseInt(rgbMatch[2]) : 254;
  const b = rgbMatch ? parseInt(rgbMatch[3]) : 254;
  
  // Create gradient colors with proper opacity
  const colors = [
    `rgba(${r}, ${g}, ${b}, 0)`,    // Top: transparent
    `rgba(${r}, ${g}, ${b}, 1)`,    // Middle: opaque calculated color
    '#D9D9D9'                        // Bottom: opaque #D9D9D9
  ] as const;
  
  return (
    <LinearGradient
      colors={colors}
      locations={[0, 0.5, 1]}
      style={[styles.gradient, { height: gradientHeight }]}
      pointerEvents="none"
    />
  );
};

// Platform-specific gradient heights
const getDefaultGradientHeight = () => Platform.select({
  ios: 250,
  android: 300, // Adjust as needed for Android
  web: 300,     // Adjust as needed for Web
  default: 300,
});

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0, // Start from very bottom of screen
    zIndex: 1, // Below content but above background
  },
});
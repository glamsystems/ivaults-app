import React from 'react';
import { StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TopGradientProps {
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

export const TopGradient: React.FC<TopGradientProps> = ({ height }) => {
  const { height: screenHeight } = useWindowDimensions();
  
  // Use provided height or default platform-specific height
  const gradientHeight = height || getDefaultGradientHeight();
  
  // Calculate color at the middle of the gradient
  const middlePosition = gradientHeight / 2;
  const middleColor = interpolateColor(middlePosition, screenHeight);
  
  // Parse RGB values for creating RGBA
  const rgbMatch = middleColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
  const r = rgbMatch ? parseInt(rgbMatch[1]) : 254;
  const g = rgbMatch ? parseInt(rgbMatch[2]) : 254;
  const b = rgbMatch ? parseInt(rgbMatch[3]) : 254;
  
  // Create gradient colors with proper opacity (inverted from bottom)
  const colors = [
    '#FEFEFE',                       // Top: opaque #FEFEFE (start color)
    `rgba(${r}, ${g}, ${b}, 1)`,    // Middle: opaque calculated color
    `rgba(${r}, ${g}, ${b}, 0)`     // Bottom: transparent
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
  ios: 180,
  android: 180,
  web: 180,
  default: 180,
});

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0, // Start from very top of screen
    zIndex: 10, // Above content
  },
});
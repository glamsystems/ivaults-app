import React from 'react';
import { StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Use the same color interpolation function
const interpolateColor = (startY: number, screenHeight: number): string => {
  const progress = Math.min(1, Math.max(0, startY / screenHeight));
  const r = Math.round(254 + (217 - 254) * progress);
  const g = Math.round(254 + (217 - 254) * progress);
  const b = Math.round(254 + (217 - 254) * progress);
  return `rgb(${r}, ${g}, ${b})`;
};

export const BottomGradient: React.FC = () => {
  const { height: screenHeight } = useWindowDimensions();
  
  // Calculate color at the middle of the gradient (approximately 200px from bottom)
  const middlePosition = screenHeight - 200;
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
  ];
  
  return (
    <LinearGradient
      colors={colors}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
      pointerEvents="none"
    />
  );
};

// Platform-specific gradient heights
const gradientHeight = Platform.select({
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
    height: gradientHeight, // Platform-specific height
    zIndex: 1, // Below content but above background
  },
});
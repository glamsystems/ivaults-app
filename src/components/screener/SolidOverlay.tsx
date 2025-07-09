import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Use the same color interpolation function
const interpolateColor = (startY: number, screenHeight: number): string => {
  const progress = Math.min(1, Math.max(0, startY / screenHeight));
  const r = Math.round(254 + (217 - 254) * progress);
  const g = Math.round(254 + (217 - 254) * progress);
  const b = Math.round(254 + (217 - 254) * progress);
  return `rgb(${r}, ${g}, ${b})`;
};

export const SolidOverlay: React.FC = () => {
  const { height: screenHeight } = useWindowDimensions();
  
  // Calculate color at the position where fade ends (220px from bottom)
  const yPosition = screenHeight - 220; // Position from top
  const startColor = interpolateColor(yPosition, screenHeight);
  
  // End color is always the darkest gradient color
  const endColor = '#D9D9D9';
  
  return (
    <LinearGradient
      colors={[startColor, endColor]}
      style={styles.container}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220, // Cover everything below the fade
    zIndex: 9, // Just below the fade overlay
  },
});
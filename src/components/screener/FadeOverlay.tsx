import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface FadeOverlayProps {
  position: 'top' | 'bottom';
  height?: number;
  startY?: number; // Y position where the fade starts
}

// Interpolate color based on position in gradient
const interpolateColor = (startY: number, screenHeight: number): string => {
  // PageWrapper gradient: #FEFEFE (254, 254, 254) → #D9D9D9 (217, 217, 217)
  const progress = Math.min(1, Math.max(0, startY / screenHeight));
  const r = Math.round(254 + (217 - 254) * progress);
  const g = Math.round(254 + (217 - 254) * progress);
  const b = Math.round(254 + (217 - 254) * progress);
  return `rgb(${r}, ${g}, ${b})`;
};

export const FadeOverlay: React.FC<FadeOverlayProps> = ({ 
  position, 
  height = position === 'top' ? 30 : 200,
  startY = 0
}) => {
  const { height: screenHeight } = useWindowDimensions();
  
  // Calculate the color at the fade position
  // For top: distance from top
  // For bottom: we need to calculate from bottom up
  const yPosition = position === 'top' 
    ? startY
    : screenHeight - (220 + height); // Position from top where fade starts
    
  const baseColor = interpolateColor(yPosition, screenHeight);
  
  // Parse RGB values from the computed color
  const rgbMatch = baseColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
  const r = rgbMatch ? parseInt(rgbMatch[1]) : 254;
  const g = rgbMatch ? parseInt(rgbMatch[2]) : 254;
  const b = rgbMatch ? parseInt(rgbMatch[3]) : 254;
  
  // Create gradient from computed color to transparent using RGBA
  // For bottom fade, we want to ensure color continuity with solid overlay
  const colors = position === 'top' 
    ? [
        `rgba(${r}, ${g}, ${b}, 1)`,      // 100% opacity
        `rgba(${r}, ${g}, ${b}, 0.5)`,    // 50% opacity
        `rgba(${r}, ${g}, ${b}, 0)`       // 0% opacity (transparent)
      ]
    : [
        `rgba(${r}, ${g}, ${b}, 0)`,      // 0% opacity (transparent)
        `rgba(${r}, ${g}, ${b}, 0.5)`,    // 50% opacity
        `rgb(${r}, ${g}, ${b})`           // 100% opacity (solid color for continuity)
      ];

  return (
    <View style={[
      styles.container, 
      position === 'top' ? styles.top : styles.bottom,
      { height }
    ]} 
    pointerEvents="none"
    >
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        locations={position === 'top' ? [0, 0.7, 1] : [0, 0.3, 1]}
        dithering={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 220 // Position well above tab bar icons
  },
  gradient: {
    flex: 1,
  },
});
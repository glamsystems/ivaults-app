import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

interface FadeOverlayProps {
  position: 'top' | 'bottom';
  height?: number;
  startY?: number; // Y position where the fade starts
}

// Parse hex color to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Interpolate color based on position in gradient
const interpolateColor = (
  startY: number, 
  screenHeight: number,
  startColor: { r: number; g: number; b: number },
  endColor: { r: number; g: number; b: number }
): string => {
  const progress = Math.min(1, Math.max(0, startY / screenHeight));
  const r = Math.round(startColor.r + (endColor.r - startColor.r) * progress);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * progress);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * progress);
  return `rgb(${r}, ${g}, ${b})`;
};

export const FadeOverlay: React.FC<FadeOverlayProps> = ({ 
  position, 
  height = position === 'top' ? 30 : 200,
  startY = 0
}) => {
  const { height: screenHeight } = useWindowDimensions();
  const { colors } = useTheme();
  
  // Get start and end colors based on theme
  const startColor = hexToRgb(colors.background.gradientStart);
  const endColor = hexToRgb(colors.background.gradientEnd);
  
  // Calculate the color at the fade position
  // For top: distance from top
  // For bottom: we need to calculate from bottom up
  const yPosition = position === 'top' 
    ? startY
    : screenHeight - (220 + height); // Position from top where fade starts
    
  const baseColor = interpolateColor(yPosition, screenHeight, startColor, endColor);
  
  // Parse RGB values from the computed color
  const rgbMatch = baseColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
  const r = rgbMatch ? parseInt(rgbMatch[1]) : startColor.r;
  const g = rgbMatch ? parseInt(rgbMatch[2]) : startColor.g;
  const b = rgbMatch ? parseInt(rgbMatch[3]) : startColor.b;
  
  // Create gradient from computed color to transparent using RGBA
  // For bottom fade, we want to ensure color continuity with solid overlay
  const gradientColors = position === 'top' 
    ? [
        `rgba(${r}, ${g}, ${b}, 1)`,      // 100% opacity
        `rgba(${r}, ${g}, ${b}, 0.5)`,    // 50% opacity
        `rgba(${r}, ${g}, ${b}, 0)`       // 0% opacity (transparent)
      ] as const
    : [
        `rgba(${r}, ${g}, ${b}, 0)`,      // 0% opacity (transparent)
        `rgba(${r}, ${g}, ${b}, 0.5)`,    // 50% opacity
        `rgb(${r}, ${g}, ${b})`           // 100% opacity (solid color for continuity)
      ] as const;

  return (
    <View style={[
      styles.container, 
      position === 'top' ? styles.top : styles.bottom,
      { height }
    ]} 
    pointerEvents="none"
    >
      <LinearGradient
        colors={gradientColors}
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
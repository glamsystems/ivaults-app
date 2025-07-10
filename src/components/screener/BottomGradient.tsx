import React from 'react';
import { StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

interface BottomGradientProps {
  height?: number;
}

// Color interpolation function for smooth gradient transitions
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

// Parse hex color to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const BottomGradient: React.FC<BottomGradientProps> = ({ height }) => {
  const { height: screenHeight } = useWindowDimensions();
  const { colors, theme } = useTheme();
  
  // Use provided height or default platform-specific height
  const gradientHeight = height || getDefaultGradientHeight();
  
  // Get start and end colors based on theme
  const startColor = hexToRgb(colors.background.gradientStart);
  const endColor = hexToRgb(colors.background.gradientEnd);
  
  // Calculate color at the middle of the gradient
  const middlePosition = screenHeight - (gradientHeight / 2);
  const middleColor = interpolateColor(middlePosition, screenHeight, startColor, endColor);
  
  // Parse RGB values for creating RGBA
  const rgbMatch = middleColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
  const r = rgbMatch ? parseInt(rgbMatch[1]) : startColor.r;
  const g = rgbMatch ? parseInt(rgbMatch[2]) : startColor.g;
  const b = rgbMatch ? parseInt(rgbMatch[3]) : startColor.b;
  
  // Create gradient colors with proper opacity
  const gradientColors = [
    `rgba(${r}, ${g}, ${b}, 0)`,              // Top: transparent
    `rgba(${r}, ${g}, ${b}, 1)`,              // Middle: opaque calculated color
    colors.background.gradientEnd             // Bottom: theme-based end color
  ] as const;
  
  return (
    <LinearGradient
      colors={gradientColors}
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
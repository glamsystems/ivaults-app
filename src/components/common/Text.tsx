import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, Platform } from 'react-native';
import { fonts } from '../../theme';

interface TextProps extends RNTextProps {
  variant?: 'thin' | 'extraLight' | 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold' | 'black';
  italic?: boolean;
  mono?: boolean;
}

export const Text = React.memo<TextProps>(({ 
  style, 
  variant = 'regular', 
  italic = false,
  mono = false,
  ...props 
}) => {
  let fontKey = variant;
  if (italic) {
    // Special case for regular italic in mono
    if (variant === 'regular' && mono) {
      fontKey = 'italic' as any;
    } else {
      fontKey = `${variant}Italic` as any;
    }
  }
  
  const fontFamily = mono 
    ? fonts.mono[fontKey] 
    : fonts.sans[fontKey];


  return (
    <RNText 
      style={[
        styles.defaultText,
        { fontFamily },
        style
      ]} 
      {...props} 
    />
  );
});

const styles = StyleSheet.create({
  defaultText: {
    fontSize: 16,
    // Fix for Android text rendering
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
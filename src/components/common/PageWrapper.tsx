import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { Spacing } from '../../constants';

interface PageWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, style }) => {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.background.gradientStart, colors.background.gradientEnd]}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.page,
  },
});
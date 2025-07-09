import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { Text, PageWrapper } from '../components/common';

export const PortfolioScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <PageWrapper>
      <View style={styles.container}>
      <Text variant="semiBold" style={[styles.text, { color: colors.text.primary }]}>Portfolio Screen</Text>
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 120, // Account for tab bar height
  },
  text: {
    fontSize: 18,
  },
});
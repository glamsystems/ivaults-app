import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../common';
import { FontSizes } from '../../constants/fonts';

interface VaultOverviewProps {
  description?: string;
}

export const VaultOverview: React.FC<VaultOverviewProps> = ({ 
  description = "Automated yield farming strategy across multiple DeFi protocols." 
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text mono variant="regular" style={styles.sectionTitle}>
          Strategy Description
        </Text>
        <Text variant="regular" style={styles.description}>
          {description}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: FontSizes.small,
    color: '#A8A8A8',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: FontSizes.medium,
    color: '#010101',
    lineHeight: 24,
  },
});
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes, Spacing } from '../../constants';
import { useTheme } from '../../theme';

interface VaultDetailHeaderProps {
  vault: Vault;
}

export const VaultDetailHeader: React.FC<VaultDetailHeaderProps> = ({ vault }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={vault.gradientColors || colors.gradient.default}
        style={styles.icon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.textContainer}>
        <Text variant="regular" style={[styles.name, { color: colors.text.primary }]}>
          {vault.name}
        </Text>
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Base Asset
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.tertiary }]}>
            {vault.baseAsset}
          </Text>
        </View>
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            NAV
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.tertiary }]}>
            {vault.nav.toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  icon: {
    width: Spacing.icon.large,
    height: Spacing.icon.large,
    borderRadius: 16,
    marginRight: Spacing.icon.margin + 4,
  },
  textContainer: {
    flex: 1,
    paddingTop: 4, // Add padding to lower the text
  },
  name: {
    fontSize: FontSizes.xLarge,
    marginTop: 4,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: FontSizes.medium,
  },
  value: {
    fontSize: FontSizes.medium,
  },
});
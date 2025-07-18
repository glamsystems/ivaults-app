import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, DisplayPubkey, SparkleImage } from '../common';
import { Vault } from '../../store/vaultStore';
import { FontSizes, Spacing } from '../../constants';
import { useTheme } from '../../theme';

interface VaultDetailHeaderProps {
  vault: Vault;
}

export const VaultDetailHeader = React.memo<VaultDetailHeaderProps>(({ vault }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <SparkleImage
        mintPubkey={vault.mintPubkey}
        size={Spacing.icon.large}
        borderRadius={16}
        fallbackColors={vault.gradientColors}
      />
      <View style={styles.textContainer}>
        <Text 
          variant="regular" 
          style={[styles.name, { color: colors.text.primary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {vault.name}
        </Text>
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            Base Asset
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.secondary }]}>
            <DisplayPubkey pubkey={vault.baseAsset} type="hardcoded" />
          </Text>
        </View>
        <View style={styles.row}>
          <Text mono variant="regular" style={[styles.label, { color: colors.text.tertiary }]}>
            NAV
          </Text>
          <Text variant="regular" style={[styles.value, { color: colors.text.secondary }]}>
            {vault.nav.toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  textContainer: {
    flex: 1,
    paddingTop: 0, // Add padding to lower the text
  },
  name: {
    fontSize: FontSizes.xLarge,
    marginTop: 4,
    marginBottom: 6,
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
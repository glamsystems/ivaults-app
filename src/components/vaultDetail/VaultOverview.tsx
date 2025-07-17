import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../common';
import { FontSizes } from '../../constants/fonts';
import { useTheme } from '../../theme';
import { Vault } from '../../store/vaultStore';
import { formatTokenAmount } from '../../utils/tokenFormatting';
import { useVaultStore } from '../../store/vaultStore';

interface VaultOverviewProps {
  vault: Vault;
  description?: string;
}

export const VaultOverview = React.memo<VaultOverviewProps>(({ 
  vault,
  description = "Automated yield farming strategy across multiple DeFi protocols." 
}) => {
  const { colors } = useTheme();
  const vaults = useVaultStore((state) => state.vaults);
  
  // Memoize dynamic styles
  const dynamicStyles = useMemo(() => ({
    primaryText: { color: colors.text.primary },
    subtleText: { color: colors.text.subtle }
  }), [colors.text.primary, colors.text.subtle]);
  
  // Convert periods to human-readable format
  const formatPeriod = (period: number, type: string): string => {
    if (!period || period === 0) return 'Instant';
    
    // Convert to days if type is seconds
    if (type === 'seconds') {
      const days = Math.round(period / 86400); // 86400 seconds in a day
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    } else if (type === 'slots') {
      // Approximate: 400ms per slot, ~216,000 slots per day
      const days = Math.round(period / 216000);
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
    
    return `${period} ${type}`;
  };
  
  // Format notice period with type
  const formatNoticePeriod = (): React.ReactNode => {
    const period = vault.redemptionNoticePeriod || 0;
    const noticeType = vault.redemptionNoticePeriodType || 'hard';
    const periodText = formatPeriod(period, 'seconds'); // Always use seconds for the period
    
    if (periodText === 'Instant') {
      return 'Instant';
    }
    
    // Capitalize the type (hard -> Hard, soft -> Soft)
    const typeLabel = noticeType.charAt(0).toUpperCase() + noticeType.slice(1);
    
    return (
      <View style={styles.noticeValue}>
        <Text variant="regular" style={dynamicStyles.primaryText}>
          {typeLabel}
        </Text>
        <Text variant="regular" style={[styles.separator, dynamicStyles.subtleText]}>
          {' | '}
        </Text>
        <Text variant="regular" style={dynamicStyles.primaryText}>
          {periodText}
        </Text>
      </View>
    );
  };
  
  // Format amount with decimals and base asset
  const formatAmount = (amount?: string, useVaultToken: boolean = false): string => {
    if (!amount || amount === '0') return 'None';
    
    // Use vault token (mintPubkey) for redemption amounts, base asset for subscription
    const token = useVaultToken && vault.mintPubkey ? vault.mintPubkey : vault.baseAsset;
    
    return formatTokenAmount(amount, token, {
      showSymbol: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: useVaultToken ? 6 : 2,
      vaults
    });
  };
  
  const depositTerms = [
    {
      label: 'Minimum Deposit',
      value: formatAmount(vault.minSubscription)
    }
  ];
  
  const redemptionTerms = [
    {
      label: 'Minimum Withdrawal',
      value: formatAmount(vault.minRedemption, true) // true = use vault token
    },
    { 
      label: 'Notice Period', 
      value: formatNoticePeriod()
    },
    { 
      label: 'Settlement Period', 
      value: formatPeriod(vault.redemptionSettlementPeriod || 0, 'seconds') 
    },
    { 
      label: 'Cancellation Window', 
      value: formatPeriod(vault.redemptionCancellationWindow || 0, 'seconds') 
    },
  ];
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text mono variant="regular" style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
          Strategy Description
        </Text>
        <Text variant="regular" style={[styles.description, { color: colors.text.primary }]}>
          {description}
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text mono variant="regular" style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
          Deposit Terms
        </Text>
        {depositTerms.map((term, index) => (
          <View key={index} style={styles.termRow}>
            <Text variant="regular" style={[styles.termLabel, { color: colors.text.secondary }]}>
              {term.label}
            </Text>
            <Text variant="regular" style={[styles.termValue, { color: colors.text.primary }]}>
              {term.value}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text mono variant="regular" style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
          Withdrawal Terms
        </Text>
        {redemptionTerms.map((term, index) => (
          <View key={index} style={styles.termRow}>
            <Text variant="regular" style={[styles.termLabel, { color: colors.text.secondary }]}>
              {term.label}
            </Text>
            {typeof term.value === 'string' ? (
              <Text variant="regular" style={[styles.termValue, { color: colors.text.primary }]}>
                {term.value}
              </Text>
            ) : (
              <View style={styles.termValue}>
                {term.value}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: FontSizes.small,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: FontSizes.medium,
    lineHeight: 24,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  termLabel: {
    fontSize: FontSizes.medium,
  },
  termValue: {
    fontSize: FontSizes.medium,
  },
  noticeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    fontSize: FontSizes.medium,
  },
});
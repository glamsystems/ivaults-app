import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SecondaryHeader } from '../components/headers';
import { PageWrapper, Text } from '../components/common';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme';
import { Vault } from '../store/vaultStore';
import { FontSizes } from '../constants/fonts';

type RootStackParamList = {
  VaultDetail: { vault: Vault };
};

type VaultDetailRouteProp = RouteProp<RootStackParamList, 'VaultDetail'>;

export const VaultDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<VaultDetailRouteProp>();
  const { vault } = route.params;

  return (
    <PageWrapper>
      <SecondaryHeader onLeftPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.header}>
          <LinearGradient
            colors={vault.gradientColors || ['#FF6B6B', '#4ECDC4']}
            style={styles.icon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text variant="regular" style={styles.name}>
            {vault.name}
          </Text>
          <Text variant="regular" style={styles.symbol}>
            {vault.symbol}
          </Text>
        </View>
        
        {/* Placeholder content */}
        <View style={styles.placeholder}>
          <Text variant="regular" style={[styles.placeholderText, { color: colors.text.secondary }]}>
            Vault details coming soon...
          </Text>
        </View>
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 16,
  },
  name: {
    fontSize: FontSizes.large + 4, // Slightly larger for detail view
    color: '#010101',
    marginBottom: 4,
  },
  symbol: {
    fontSize: FontSizes.medium,
    color: '#A8A8A8',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FontSizes.medium,
  },
});
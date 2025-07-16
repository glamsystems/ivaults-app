import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../common';
import { usePortfolioStore, PortfolioTab } from '../../store/portfolioStore';
import { FontSizes } from '../../constants/fonts';
import { useTheme } from '../../theme';
import { useWalletStore } from '../../store/walletStore';

const ALL_TABS: PortfolioTab[] = ['Positions', 'Requests'];

export const PortfolioTabs: React.FC = () => {
  const { selectedTab, setSelectedTab } = usePortfolioStore();
  const { colors } = useTheme();
  const account = useWalletStore((state) => state.account);
  
  // If wallet disconnects while on Requests tab, switch to Positions
  useEffect(() => {
    if (!account && selectedTab === 'Requests') {
      setSelectedTab('Positions');
    }
  }, [account, selectedTab, setSelectedTab]);

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {ALL_TABS.map((tab) => {
          const isActive = selectedTab === tab;
          const isDisabled = tab === 'Requests' && !account;
          
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => !isDisabled && setSelectedTab(tab)}
              style={styles.tab}
              activeOpacity={0.7}
              disabled={isDisabled}
            >
              <Text
                variant="regular"
                style={[
                  styles.tabText,
                  { 
                    color: isDisabled 
                      ? colors.text.disabled 
                      : isActive 
                        ? colors.text.primary 
                        : colors.text.tertiary 
                  },
                  isActive && !isDisabled && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    marginHorizontal: 12,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: FontSizes.medium,
  },
  activeTabText: {
    textDecorationLine: 'underline',
  },
});
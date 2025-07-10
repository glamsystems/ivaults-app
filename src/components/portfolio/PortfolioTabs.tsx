import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../common';
import { usePortfolioStore, PortfolioTab } from '../../store/portfolioStore';
import { FontSizes } from '../../constants/fonts';
import { useTheme } from '../../theme';

const TAB_OPTIONS: PortfolioTab[] = ['Positions', 'Requests'];

export const PortfolioTabs: React.FC = () => {
  const { selectedTab, setSelectedTab } = usePortfolioStore();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {TAB_OPTIONS.map((tab) => {
          const isActive = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Text
                variant="regular"
                style={[
                  styles.tabText,
                  { color: isActive ? colors.text.primary : colors.text.tertiary },
                  isActive && styles.activeTabText,
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
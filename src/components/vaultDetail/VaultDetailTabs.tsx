import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../common';
import { FontSizes } from '../../constants/fonts';

export type VaultDetailTab = 'Overview' | 'Fees';

interface VaultDetailTabsProps {
  selectedTab: VaultDetailTab;
  onTabChange: (tab: VaultDetailTab) => void;
}

const TAB_OPTIONS: VaultDetailTab[] = ['Overview', 'Fees'];

export const VaultDetailTabs: React.FC<VaultDetailTabsProps> = ({ 
  selectedTab, 
  onTabChange 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {TAB_OPTIONS.map((tab) => {
          const isActive = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabChange(tab)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Text
                variant="regular"
                style={[
                  styles.tabText,
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
    marginBottom: 5,
    width: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -31, // Shift tabs left to align with carousel gap
  },
  tab: {
    marginHorizontal: 12,
    paddingVertical: 4,
  },
  tabText: {
    fontSize: FontSizes.medium,
    color: '#A8A8A8',
  },
  activeTabText: {
    color: '#010101',
    textDecorationLine: 'underline',
  },
});
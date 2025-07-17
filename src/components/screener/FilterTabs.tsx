import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text } from '../common';
import { useVaultStore, VaultCategory } from '../../store/vaultStore';
import { FontSizes } from '../../constants/fonts';
import { useTheme } from '../../theme';

type FilterOption = 'All' | VaultCategory;

const FILTER_OPTIONS: FilterOption[] = ['All', 'SuperVault', 'xStocks'];

interface FilterTabsProps {
  scrollEnabled?: boolean;
}

export const FilterTabs = React.memo<FilterTabsProps>(({ scrollEnabled = true }) => {
  const { selectedFilter, setSelectedFilter } = useVaultStore();
  const { colors } = useTheme();

  const handleFilterPress = useCallback((filter: FilterOption) => {
    setSelectedFilter(filter);
  }, [setSelectedFilter]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={scrollEnabled}
    >
      {FILTER_OPTIONS.map((filter) => {
        const isActive = selectedFilter === filter;
        return (
          <TouchableOpacity
            key={filter}
            onPress={() => handleFilterPress(filter)}
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
              {filter === 'SuperVault' ? 'SuperVaults' : filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    paddingLeft: 8, // Align with vault content visually
    paddingRight: 16,
  },
  tab: {
    marginRight: 24,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: FontSizes.medium,
  },
  activeTabText: {
    textDecorationLine: 'underline',
  },
});
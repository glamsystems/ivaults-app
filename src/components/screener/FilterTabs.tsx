import React, { useCallback, useMemo } from 'react';
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
import { VaultFilterService } from '../../services/vaultFilterService';

type FilterOption = 'All' | string;

interface FilterTabsProps {
  scrollEnabled?: boolean;
}

export const FilterTabs = React.memo<FilterTabsProps>(({ scrollEnabled = true }) => {
  const { selectedFilter, setSelectedFilter, vaults } = useVaultStore();
  const { colors } = useTheme();

  // Get dynamic filter options based on available vault categories
  const filterOptions = useMemo(() => {
    console.log('[FilterTabs] Computing filter options from', vaults.length, 'vaults');
    const categories = VaultFilterService.getCategoriesFromVaults(vaults);
    const options = ['All', ...categories] as FilterOption[];
    console.log('[FilterTabs] Filter options:', options);
    return options;
  }, [vaults]);

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
      {filterOptions.map((filter) => {
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
              {filter}
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
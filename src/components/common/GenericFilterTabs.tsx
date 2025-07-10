import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text } from './Text';
import { FontSizes } from '../../constants/fonts';
import { useTheme } from '../../theme';

interface GenericFilterTabsProps<T> {
  options: T[];
  selectedOption: T;
  onSelectOption: (option: T) => void;
  scrollEnabled?: boolean;
  getOptionLabel?: (option: T) => string;
}

export function GenericFilterTabs<T extends string>({
  options,
  selectedOption,
  onSelectOption,
  scrollEnabled = true,
  getOptionLabel = (option) => option,
}: GenericFilterTabsProps<T>) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={scrollEnabled}
    >
      {options.map((option) => {
        const isActive = selectedOption === option;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelectOption(option)}
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
              {getOptionLabel(option)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

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
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text } from '../common';
import { FontSizes } from '../../constants/fonts';

interface HighlightItem {
  label: string;
  value: string;
  unit?: string;
  colorFormat?: boolean; // Optional: format positive/negative values with colors
  showSign?: boolean; // Optional: show + for positive values
  prefix?: string; // Optional: prefix like $
  suffix?: string; // Optional: suffix like %
}

interface HighlightsCarouselProps {
  items: HighlightItem[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAROUSEL_PADDING = 76; // 38px padding on each side

export const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ items }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  // Check if debug mode is enabled
  const isDebug = process.env.NODE_ENV === 'development' || __DEV__;
  
  // Get color for value based on positive/negative
  const getValueColor = (item: HighlightItem): string => {
    if (!item.colorFormat) return '#010101'; // Default black
    
    // Parse the value to check if it's positive or negative
    const numericValue = parseFloat(item.value.replace(/[^-\d.]/g, ''));
    if (numericValue > 0) return '#0CC578'; // Green
    if (numericValue < 0) return '#FA155A'; // Red
    return '#010101'; // Black for zero
  };
  
  // Format the display value with prefix, suffix, and sign
  const formatValue = (item: HighlightItem): string => {
    let displayValue = item.value;
    
    // Add sign if requested
    if (item.showSign) {
      const numericValue = parseFloat(item.value.replace(/[^-\d.]/g, ''));
      if (numericValue > 0 && !displayValue.includes('+')) {
        displayValue = '+' + displayValue;
      }
    }
    
    // Add prefix and suffix
    const prefix = item.prefix || '';
    const suffix = item.suffix || '';
    
    return `${prefix}${displayValue}${suffix}`;
  };

  const handleScroll = (event: any) => {
    const pageIndex = Math.round(event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - CAROUSEL_PADDING));
    setCurrentPage(pageIndex);
  };

  // Group items into pages
  const pages = [];
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage));
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={totalPages > 1}
        style={styles.scrollView}
      >
        {pages.map((page, pageIndex) => (
          <View key={pageIndex} style={styles.page}>
            <View style={styles.grid}>
              {page.map((item, index) => (
                <View key={index} style={styles.highlightItem}>
                  <Text mono variant="regular" style={styles.label}>
                    {item.label}
                  </Text>
                  <Text variant="regular" style={[styles.value, { color: getValueColor(item) }]}>
                    {formatValue(item)}
                  </Text>
                  {item.unit ? (
                    <Text mono variant="regular" style={styles.unit}>
                      {item.unit}
                    </Text>
                  ) : (
                    <View style={styles.unitPlaceholder} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.pagination}>
        {Array.from({ length: totalPages }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              currentPage === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  scrollView: {
    // Full width carousel
  },
  page: {
    width: SCREEN_WIDTH - 76, // Account for PageWrapper padding (38 * 2)
    paddingHorizontal: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  highlightItem: {
    width: '48%',
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: FontSizes.small,
    color: '#A8A8A8',
    marginBottom: 4,
  },
  value: {
    fontSize: FontSizes.large + 4,
    color: '#010101',
    fontWeight: '300',
    marginTop: 4,
    marginBottom: 4,
  },
  unit: {
    fontSize: FontSizes.small,
    color: '#A8A8A8',
  },
  unitPlaceholder: {
    height: FontSizes.small + 4, // Same height as unit text
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: 'rgba(1, 1, 1, 0.1)', // 10% opacity
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: 'rgba(1, 1, 1, 0.25)', // 25% opacity
  },
});
import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Platform, Animated } from 'react-native';
import { PageWrapper } from '../common';
import { SearchBar, TopGradient, BottomGradient, FadeOverlay } from '../screener';
import { useVaultStore } from '../../store/vaultStore';
import { useActivityStore } from '../../store/activityStore';

interface ScreenLayoutProps {
  type: 'vault' | 'activity';
  children?: React.ReactNode;
  renderItem: any;
  data: any[];
  keyExtractor: (item: any) => string;
  FilterComponent: React.ComponentType<{ scrollEnabled?: boolean }>;
  showTopGradient?: boolean;
  bottomGradientHeight?: number;
  noWrapper?: boolean;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  type,
  children,
  renderItem,
  data,
  keyExtractor,
  FilterComponent,
  showTopGradient = false,
  bottomGradientHeight,
  noWrapper = false,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWidth = useRef(new Animated.Value(40)).current;
  const searchContentOpacity = useRef(new Animated.Value(0)).current;

  // Get appropriate store based on type
  const vaultStore = useVaultStore();
  const activityStore = useActivityStore();
  
  const store = type === 'vault' ? vaultStore : activityStore;

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      // Close search
      store.setSearchQuery('');
      Animated.parallel([
        Animated.timing(searchWidth, {
          toValue: 40,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(searchContentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsSearchOpen(false);
      });
    } else {
      // Open search
      setIsSearchOpen(true);
      Animated.parallel([
        Animated.timing(searchWidth, {
          toValue: 180,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(searchContentOpacity, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <PageWrapper>
      {/* Top gradient - only for activity screen */}
      {showTopGradient && (
        <View style={styles.topGradientWrapper}>
          <TopGradient height={100} />
        </View>
      )}
      
      {children}
      
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <SearchBar 
            isExpanded={isSearchOpen}
            onToggle={handleSearchToggle}
            width={searchWidth}
            contentOpacity={searchContentOpacity}
            type={type}
          />
          
          <FilterComponent scrollEnabled={!isSearchOpen} />
        </View>
        
        <View style={styles.listContainer}>
          <FlatList
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingBottom: type === 'vault' 
                  ? (Platform.OS === 'ios' ? 120 : 140)
                  : (Platform.OS === 'ios' ? 300 : 320),
              }
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={() => <View style={{ height: 60 }} />}
            // Performance optimizations
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            removeClippedSubviews={Platform.OS === 'android'}
          />
          
          {/* Top fade overlay */}
          <FadeOverlay position="top" height={30} startY={type === 'activity' ? 140 : 80} />
        </View>
        
        {/* Bottom gradient - only when specified */}
        {bottomGradientHeight && (
          <View style={styles.bottomGradientWrapper}>
            <BottomGradient height={bottomGradientHeight} />
          </View>
        )}
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 0,
  },
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingTop: 8,
  },
  separator: {
    height: 0,
  },
  topGradientWrapper: {
    position: 'absolute',
    top: 0,
    left: -38, // Negative margin to counteract PageWrapper padding
    right: -38, // Negative margin to counteract PageWrapper padding
    height: 100,
    overflow: 'visible',
    zIndex: 10,
  },
  bottomGradientWrapper: {
    position: 'absolute',
    bottom: 0,
    left: -38, // Negative margin to counteract PageWrapper padding
    right: -38, // Negative margin to counteract PageWrapper padding
    height: 200,
    overflow: 'visible',
  },
});
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Platform, FlatList, Animated, Easing, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { ScreenLayout } from '../components/layout';
import { AnimatedVaultCard, SkeletonVaultCard, FilterTabs } from '../components/screener';
import { useVaultStore } from '../store/vaultStore';
import { VaultFilterService } from '../services/vaultFilterService';
import { 
  DEMO, 
  DEMO_SCROLL_DURATION, 
  DEMO_SCROLL_DELAY, 
  DEMO_PAUSE_AT_BOTTOM,
  DEMO_SCROLL_EASING 
} from '@env';
import { Spacing } from '../constants';

// Constants for scroll calculations
const ITEM_HEIGHT = Spacing.card.vertical * 2 + 44;
const SEPARATOR_HEIGHT = 0; // No gap between items
const HEADER_HEIGHT = 100; // Approximate header height
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Easing function mapping
const getEasingFunction = (easingName: string) => {
  switch (easingName) {
    case 'linear': return Easing.linear;
    case 'quad': return Easing.inOut(Easing.quad);
    case 'cubic': return Easing.inOut(Easing.cubic);
    case 'elastic': return Easing.out(Easing.elastic(1));
    case 'bounce': return Easing.out(Easing.bounce);
    default: return Easing.inOut(Easing.quad);
  }
};

export const ScreenerScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const listRef = useRef<FlatList>(null);
  const [demoShown, setDemoShown] = useState(false);
  
  // Get values from store using separate selectors to avoid infinite loop
  const vaults = useVaultStore((state) => state.vaults);
  const isLoading = useVaultStore((state) => state.isLoading);
  const droppedVaults = useVaultStore((state) => state.droppedVaults);
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const selectedFilter = useVaultStore((state) => state.selectedFilter);
  
  // Memoize the filtered vaults to prevent recalculation on every render
  const filteredVaults = useMemo(() => {
    let filtered = vaults;
    
    // Filter by category
    if (selectedFilter !== 'All') {
      // Convert plural filter name to singular for comparison
      const singularCategory = VaultFilterService.getSingularFromPlural(selectedFilter);
      if (singularCategory) {
        filtered = filtered.filter(vault => vault.category === singularCategory);
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vault => 
        vault.name.toLowerCase().includes(query) || 
        vault.symbol.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [vaults, selectedFilter, searchQuery]);
  
  // Debug log
  let logMessage = `[ScreenerScreen] isLoading: ${isLoading}, vaults: ${vaults.length}, filteredVaults: ${filteredVaults.length}`;
  if (droppedVaults && droppedVaults.length > 0) {
    const droppedInfo = droppedVaults.map(v => `${v.name} [${v.glamStatePubkey}]`).join(', ');
    logMessage += `, droppedVaults: ${droppedVaults.length} (${droppedInfo})`;
  }
  console.log(logMessage);

  const handleVaultPress = (vaultId: string) => {
    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      navigation.navigate('VaultDetail', { vault });
    }
  };
  
  // Demo mode effect with timer-based animation
  useEffect(() => {
    console.log('[ScreenerScreen] Demo effect - checking conditions:', {
      DEMO,
      isLoading,
      filteredVaultsLength: filteredVaults.length,
      demoShown,
      condition: DEMO === 'true' && !isLoading && filteredVaults.length > 0 && !demoShown
    });
    
    let animationTimer: NodeJS.Timeout | null = null;
    let scrollBackTimer: NodeJS.Timeout | null = null;
    
    if (DEMO === 'true' && !isLoading && filteredVaults.length > 0 && !demoShown) {
      console.log('[ScreenerScreen] Starting demo animation');
      setDemoShown(true);
      
      // Parse env variables with defaults
      const scrollDuration = parseInt(DEMO_SCROLL_DURATION || '8000', 10);
      const scrollDelay = parseInt(DEMO_SCROLL_DELAY || '1000', 10);
      const pauseAtBottom = parseInt(DEMO_PAUSE_AT_BOTTOM || '2000', 10);
      const easingName = DEMO_SCROLL_EASING || 'quad';
      
      // Calculate total content height
      const paddingTop = 137; // From ScreenLayout styles
      const paddingBottom = Platform.OS === 'ios' ? 120 : 140;
      const footerHeight = 60; // Virtual footer component
      const fadeBuffer = 80; // Extra buffer to keep content above fade
      const totalItems = filteredVaults.length;
      const contentHeight = 
        paddingTop + 
        (totalItems * ITEM_HEIGHT) + 
        ((totalItems - 1) * SEPARATOR_HEIGHT) +
        footerHeight;
      
      // Calculate scroll distance to show last item while respecting fade
      const viewportHeight = SCREEN_HEIGHT - HEADER_HEIGHT;
      // Add fadeBuffer to ensure last vault is fully visible above fade area
      const maxScroll = Math.max(0, contentHeight - viewportHeight + paddingBottom + fadeBuffer);
      
      console.log('[ScreenerScreen] Demo scroll calculations:', {
        totalItems,
        contentHeight,
        viewportHeight,
        maxScroll,
        scrollDuration
      });
      
      // Start animation after delay
      setTimeout(() => {
        const fps = 60; // frames per second
        const totalFrames = Math.floor((scrollDuration / 1000) * fps);
        let currentFrame = 0;
        
        // Animate scroll down
        animationTimer = setInterval(() => {
          currentFrame++;
          const progress = currentFrame / totalFrames;
          
          // Apply easing
          let easedProgress = progress;
          if (easingName === 'quad') {
            // Ease in-out quad
            easedProgress = progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          } else if (easingName === 'cubic') {
            // Ease in-out cubic
            easedProgress = progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          }
          
          const scrollPosition = easedProgress * maxScroll;
          listRef.current?.scrollToOffset({ offset: scrollPosition, animated: false });
          
          if (currentFrame >= totalFrames) {
            clearInterval(animationTimer!);
            
            // Pause at bottom, then scroll back
            scrollBackTimer = setTimeout(() => {
              // Scroll back to top smoothly
              const scrollBackDuration = scrollDuration / 2;
              const scrollBackFrames = Math.floor((scrollBackDuration / 1000) * fps);
              let scrollBackFrame = 0;
              
              const scrollBackInterval = setInterval(() => {
                scrollBackFrame++;
                const backProgress = scrollBackFrame / scrollBackFrames;
                
                // Apply easing for scroll back
                let easedBackProgress = backProgress;
                if (easingName === 'quad') {
                  easedBackProgress = backProgress < 0.5
                    ? 2 * backProgress * backProgress
                    : 1 - Math.pow(-2 * backProgress + 2, 2) / 2;
                } else if (easingName === 'cubic') {
                  easedBackProgress = backProgress < 0.5
                    ? 4 * backProgress * backProgress * backProgress
                    : 1 - Math.pow(-2 * backProgress + 2, 3) / 2;
                }
                
                const scrollPosition = (1 - easedBackProgress) * maxScroll;
                listRef.current?.scrollToOffset({ offset: scrollPosition, animated: false });
                
                if (scrollBackFrame >= scrollBackFrames) {
                  clearInterval(scrollBackInterval);
                }
              }, 1000 / fps);
            }, pauseAtBottom);
          }
        }, 1000 / fps);
      }, scrollDelay);
    }
    
    // Cleanup on unmount
    return () => {
      if (animationTimer) clearInterval(animationTimer);
      if (scrollBackTimer) clearTimeout(scrollBackTimer);
    };
  }, [isLoading, filteredVaults.length, demoShown]);

  // Generate skeleton data when loading
  const skeletonData = isLoading 
    ? Array.from({ length: 5 }, (_, index) => ({ id: `skeleton-${index}` }))
    : filteredVaults;

  return (
    <ScreenLayout
      type="vault"
      data={skeletonData}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => 
        isLoading ? (
          <SkeletonVaultCard key={item.id} index={index} />
        ) : (
          <AnimatedVaultCard
            vault={item}
            onPress={() => handleVaultPress(item.id)}
            index={index}
          />
        )
      }
      FilterComponent={FilterTabs}
      bottomGradientHeight={Platform.OS === 'ios' ? 200 : 200}
      listRef={listRef}
    >
      {/* Children prop is empty - header is in TabNavigator */}
    </ScreenLayout>
  );
};
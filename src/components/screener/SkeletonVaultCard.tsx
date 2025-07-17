import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated, InteractionManager } from 'react-native';
import { ListCard } from '../common/ListCard';
import { Spacing, FontSizes } from '../../constants';
import { useTheme } from '../../theme';

interface SkeletonVaultCardProps {
  index?: number;
}

export const SkeletonVaultCard: React.FC<SkeletonVaultCardProps> = ({ index = 0 }) => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Generate random widths for variety
  const widths = useMemo(() => ({
    title: 120 + Math.random() * 60, // 120-180
    symbol: 30 + Math.random() * 20, // 30-50
    category: 60 + Math.random() * 40, // 60-100
    performance: 40 + Math.random() * 20, // 40-60
    nav: 60 + Math.random() * 30, // 60-90
  }), []);

  useEffect(() => {
    // Use InteractionManager for better performance
    const handle = InteractionManager.runAfterInteractions(() => {
      // Stagger animation start based on index
      const delay = index * 150; // 150ms delay per row
      
      const timeout = setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);

      return () => clearTimeout(timeout);
    });

    return () => {
      handle.cancel();
    };
  }, [animatedValue, index]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 0.1], // 2% to 10% opacity
  });

  // Create opacity animated skeleton box  
  const SkeletonBox = ({ width }: { width: number }) => (
    <Animated.View 
      style={{ 
        width, 
        height: FontSizes.medium, // Standardize all skeleton heights
        backgroundColor: colors.text.primary,
        borderRadius: 4,
        opacity,
      }}
    />
  );

  // Fixed-size skeleton icon with opacity animation
  const icon = (
    <Animated.View 
      style={[
        styles.iconPlaceholder,
        { 
          backgroundColor: colors.text.primary,
          opacity,
        }
      ]}
    />
  );

  // Skeleton right bottom content (performance and NAV)
  const rightBottomContent = (
    <View style={styles.priceSection}>
      <SkeletonBox width={widths.performance} />
      <SkeletonBox width={widths.nav} />
    </View>
  );

  // Match the exact structure we had before
  return (
    <View style={styles.container}>
      {/* Row 1 */}
      <View style={styles.row}>
        <View style={styles.leftSection}>
          {icon}
          <SkeletonBox width={widths.title} />
        </View>
        <SkeletonBox width={widths.symbol} />
      </View>
      
      {/* Row 2 */}
      <View style={[styles.row, styles.secondRow]}>
        <SkeletonBox width={widths.category} />
        {rightBottomContent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingVertical: Spacing.card.vertical,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondRow: {
    marginTop: 0, // Match ListCard spacing
    paddingLeft: Spacing.icon.standard + Spacing.icon.margin,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconPlaceholder: {
    width: Spacing.icon.standard,
    height: Spacing.icon.standard,
    borderRadius: 8,
    marginRight: Spacing.icon.margin,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
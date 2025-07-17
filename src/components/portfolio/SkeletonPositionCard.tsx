import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated, InteractionManager } from 'react-native';
import { Spacing, FontSizes } from '../../constants';
import { useTheme } from '../../theme';

interface SkeletonPositionCardProps {
  index?: number;
}

export const SkeletonPositionCard: React.FC<SkeletonPositionCardProps> = ({ index = 0 }) => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Generate random widths for variety
  const widths = useMemo(() => ({
    name: 100 + Math.random() * 60, // 100-160
    symbol: 40 + Math.random() * 20, // 40-60
    balance: 80 + Math.random() * 40, // 80-120
    performance: 50 + Math.random() * 20, // 50-70
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left side: icon, name, symbol */}
        <View style={styles.leftSection}>
          {icon}
          <View style={styles.textSection}>
            <SkeletonBox width={widths.name} />
            <View style={{ height: 4 }} />
            <SkeletonBox width={widths.symbol} />
          </View>
        </View>
        
        {/* Right side: balance and performance */}
        <View style={styles.rightSection}>
          <SkeletonBox width={widths.balance} />
          <View style={{ height: 4 }} />
          <SkeletonBox width={widths.performance} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.page,
    paddingVertical: Spacing.card.vertical,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
});
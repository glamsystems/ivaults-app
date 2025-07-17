import React, { useRef, useEffect, useMemo } from 'react';
import { Animated, InteractionManager } from 'react-native';
import { PositionCard } from './PositionCard';
import { Position } from '../../store/portfolioStore';

interface AnimatedPositionCardProps {
  position: Position;
  onPress: () => void;
  index: number;
}

export const AnimatedPositionCard = React.memo<AnimatedPositionCardProps>(({ position, onPress, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const animatedStyle = useMemo(() => ({ opacity: fadeAnim }), [fadeAnim]);

  useEffect(() => {
    // Use InteractionManager for better performance
    const handle = InteractionManager.runAfterInteractions(() => {
      // Stagger animation start based on index
      const delay = index * 50; // 50ms delay per row (same as vault cards)
      
      const timeout = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200, // Fast fade in (same as vault cards)
          useNativeDriver: true,
        }).start();
      }, delay);

      return () => clearTimeout(timeout);
    });

    return () => {
      handle.cancel();
    };
  }, [fadeAnim, index]);

  return (
    <Animated.View style={animatedStyle}>
      <PositionCard position={position} onPress={onPress} />
    </Animated.View>
  );
});
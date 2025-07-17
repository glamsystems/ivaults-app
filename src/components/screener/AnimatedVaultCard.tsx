import React, { useRef, useEffect, useMemo } from 'react';
import { Animated, InteractionManager } from 'react-native';
import { VaultCard } from './VaultCard';
import { Vault } from '../../store/vaultStore';

interface AnimatedVaultCardProps {
  vault: Vault;
  onPress: () => void;
  index: number;
}

export const AnimatedVaultCard = React.memo<AnimatedVaultCardProps>(({ vault, onPress, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const animatedStyle = useMemo(() => ({ opacity: fadeAnim }), [fadeAnim]);

  useEffect(() => {
    // Use InteractionManager for better performance
    const handle = InteractionManager.runAfterInteractions(() => {
      // Stagger animation start based on index
      const delay = index * 50; // 50ms delay per row (smaller offset)
      
      const timeout = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200, // Faster fade in
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
      <VaultCard vault={vault} onPress={onPress} />
    </Animated.View>
  );
});
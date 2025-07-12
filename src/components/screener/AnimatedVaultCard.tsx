import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { VaultCard } from './VaultCard';
import { Vault } from '../../store/vaultStore';

interface AnimatedVaultCardProps {
  vault: Vault;
  onPress: () => void;
  index: number;
}

export const AnimatedVaultCard: React.FC<AnimatedVaultCardProps> = ({ vault, onPress, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [fadeAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <VaultCard vault={vault} onPress={onPress} />
    </Animated.View>
  );
};
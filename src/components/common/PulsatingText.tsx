import React, { useRef, useEffect } from 'react';
import { Animated, TextStyle } from 'react-native';
import { Text } from './Text';

interface PulsatingTextProps {
  text?: string;
  style?: TextStyle | TextStyle[];
  variant?: 'regular' | 'mono';
}

export const PulsatingText: React.FC<PulsatingTextProps> = ({ 
  text = 'Loading...', 
  style,
  variant = 'regular'
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 0.1], // 2% to 10% opacity - very subtle pulsating
  });

  return (
    <Animated.View style={{ opacity }}>
      <Text variant={variant} style={style}>
        {text}
      </Text>
    </Animated.View>
  );
};
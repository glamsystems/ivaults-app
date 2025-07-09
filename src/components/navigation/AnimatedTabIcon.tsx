import React, { useEffect } from 'react';
import { Ionicons as Icon } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedTabIconProps {
  name: string;
  size: number;
  focused: boolean;
  focusedColor: string;
  unfocusedColor: string;
}

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

export const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  name,
  size,
  focused,
  focusedColor,
  unfocusedColor,
}) => {
  const opacity = useSharedValue(focused ? 1 : 0.33);

  useEffect(() => {
    opacity.value = withTiming(focused ? 1 : 0.33, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <AnimatedIcon
      name={name}
      size={size}
      color={focused ? focusedColor : unfocusedColor}
      style={animatedStyle}
    />
  );
};
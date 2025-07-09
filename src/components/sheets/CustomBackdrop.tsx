import React, { useMemo } from "react";
import { TouchableWithoutFeedback } from "react-native";
import { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

interface CustomBackdropProps extends BottomSheetBackdropProps {
  onPress?: () => void;
}

const CustomBackdrop = ({ 
  animatedIndex, 
  style,
  onPress 
}: CustomBackdropProps) => {
  // animated variables
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 0.05], // Very subtle opacity
      Extrapolate.CLAMP
    ),
  }));

  // styles
  const containerStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: "#000000",
      },
      containerAnimatedStyle,
    ],
    [style, containerAnimatedStyle]
  );

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View style={containerStyle} />
    </TouchableWithoutFeedback>
  );
};

export default CustomBackdrop;
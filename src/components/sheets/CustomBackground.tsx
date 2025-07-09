import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import Animated from "react-native-reanimated";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

const CustomBackground: React.FC<BottomSheetBackgroundProps> = ({
  style,
  animatedIndex,
}) => {
  const { colors } = useTheme();
  
  // styles
  const containerStyle = useMemo(
    () => [styles.container, style],
    [style]
  );

  // render
  return (
    <Animated.View pointerEvents="none" style={containerStyle}>
      <LinearGradient
        colors={[colors.background.sheet.start, colors.background.sheet.end]}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 20,
  },
});

export default CustomBackground;
import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { 
  BottomSheetModal, 
  BottomSheetModalProps, 
  BottomSheetBackdrop,
  BottomSheetView
} from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

interface CustomBottomSheetProps extends Partial<BottomSheetModalProps> {
  children: React.ReactNode;
  withKeyboard?: boolean;
}

export const CustomBottomSheet = forwardRef<BottomSheetModal, CustomBottomSheetProps>(
  ({ children, withKeyboard = false, ...props }, ref) => {
    const { colors, theme } = useTheme();

    const snapPoints = useMemo(() => {
      return withKeyboard ? ['50%', '75%'] : ['50%'];
    }, [withKeyboard]);

    const renderBackdrop = useMemo(
      () => (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.01}
          pressBehavior="close"
        />
      ),
      []
    );

    console.log('CustomBottomSheet rendering, snapPoints:', snapPoints);

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        {...props}
      >
        <LinearGradient
          colors={[colors.background.sheet.start, colors.background.sheet.end]}
          style={styles.gradientContainer}
        >
          {children}
        </LinearGradient>
      </BottomSheetModal>
    );
  }
);

CustomBottomSheet.displayName = 'CustomBottomSheet';

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
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
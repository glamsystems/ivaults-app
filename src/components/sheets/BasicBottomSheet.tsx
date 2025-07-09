import React, { forwardRef, useMemo, useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import CustomHandle from './CustomHandle';
import CustomBackdrop from './CustomBackdrop';
import CustomBackground from './CustomBackground';

interface BasicBottomSheetProps {
  children: React.ReactNode;
}

export const BasicBottomSheet = forwardRef<BottomSheetModal, BasicBottomSheetProps>(
  ({ children }, ref) => {
    // snap points
    const snapPoints = useMemo(() => ['50%'], []);
    
    // backdrop callback
    const renderBackdrop = useCallback(
      (props: any) => (
        <CustomBackdrop
          {...props}
          onPress={() => {
            // Dismiss the modal when backdrop is pressed
            (ref as any)?.current?.dismiss();
          }}
        />
      ),
      [ref]
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        handleComponent={CustomHandle}
        backdropComponent={renderBackdrop}
        backgroundComponent={CustomBackground}
        style={styles.sheetShadow}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onChange={(index) => {
          console.log('Sheet changed to index:', index);
        }}
      >
        <BottomSheetView style={styles.contentContainer}>
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

BasicBottomSheet.displayName = 'BasicBottomSheet';

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  sheetShadow: {
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
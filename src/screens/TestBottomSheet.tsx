import React, { useRef } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export const TestBottomSheet: React.FC = () => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentPress = () => {
    console.log('Present button pressed');
    bottomSheetModalRef.current?.present();
  };

  return (
    <View style={styles.container}>
      <Button title="Present Modal" onPress={handlePresentPress} />
      
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={['50%']}
        onChange={(index) => console.log('Sheet index changed:', index)}
      >
        <View style={styles.contentContainer}>
          <Text>This is a test bottom sheet 🎉</Text>
          <Text>This is a test bottom sheet 🎉</Text>
        </View>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
});
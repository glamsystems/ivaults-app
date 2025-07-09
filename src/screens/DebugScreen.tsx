import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '../theme';
import { CustomBottomSheet, BasicBottomSheet } from '../components/sheets';
import { Text } from '../components/common';
export const DebugScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const sheetRef = useRef<BottomSheetModal>(null);
  const keyboardSheetRef = useRef<BottomSheetModal>(null);

  const handleFullScreenPress = () => {
    navigation.navigate('FullScreen');
  };

  const handleSheetPress = () => {
    console.log('Sheet button pressed');
    console.log('Sheet ref:', sheetRef.current);
    sheetRef.current?.present();
  };

  const handleKeyboardSheetPress = () => {
    console.log('Keyboard sheet button pressed');
    console.log('Keyboard sheet ref:', keyboardSheetRef.current);
    keyboardSheetRef.current?.present();
  };

  // Test with a simple modal first
  const testModalRef = useRef<BottomSheetModal>(null);
  
  // Basic bottom sheet ref
  const basicSheetRef = useRef<BottomSheetModal>(null);
  
  // State for number input
  const [inputValue, setInputValue] = useState('');

  return (
    <View style={styles.container}>
      <Text variant="bold" style={[styles.title, { color: colors.text.primary }]}>Debug Screen</Text>

      <Button 
        title="Test Basic v5 Sheet" 
        onPress={() => {
          console.log('Basic sheet button pressed');
          basicSheetRef.current?.present();
          // Ensure it snaps to index 0 (50%)
          setTimeout(() => {
            basicSheetRef.current?.snapToIndex(0);
          }, 100);
        }}
      />
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.text.primary }]}
        onPress={handleFullScreenPress}
      >
        <Text variant="semiBold" style={[styles.buttonText, { color: colors.background.primary }]}>
          Go to Full Screen
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.text.primary }]}
        onPress={handleSheetPress}
      >
        <Text variant="semiBold" style={[styles.buttonText, { color: colors.background.primary }]}>
          Show Bottom Sheet
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.text.primary }]}
        onPress={handleKeyboardSheetPress}
      >
        <Text variant="semiBold" style={[styles.buttonText, { color: colors.background.primary }]}>
          Show Keyboard Sheet
        </Text>
      </TouchableOpacity>

      <CustomBottomSheet ref={sheetRef}>
        <View style={{ flex: 1, padding: 25 }}>
          <Text style={[styles.sheetText, { color: colors.text.primary }]}>
            Bottom Sheet without Keyboard
          </Text>
        </View>
      </CustomBottomSheet>

      <CustomBottomSheet ref={keyboardSheetRef} withKeyboard>
        <View style={{ flex: 1, padding: 25 }}>
          <Text style={[styles.sheetText, { color: colors.text.primary }]}>
            Bottom Sheet with Keyboard Support
          </Text>
        </View>
      </CustomBottomSheet>
      
      {/* Basic v5 Bottom Sheet */}
      <BasicBottomSheet ref={basicSheetRef}>
        <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          Basic v5 Bottom Sheet 🎉
        </Text>
        <BottomSheetTextInput
          style={[styles.numberInput, { color: colors.text.primary, borderColor: colors.text.secondary }]}
          placeholder="Enter a number"
          placeholderTextColor={colors.text.disabled}
          keyboardType="numeric"
          value={inputValue}
          onChangeText={setInputValue}
        />
        <Text style={{ fontSize: 18, textAlign: 'center', marginTop: 20 }}>
          Basic v5 Bottom Sheet 🎉
        </Text>
        <Text style={{ fontSize: 18, textAlign: 'center' }}>
          Basic v5 Bottom Sheet 🎉
        </Text>
      </BasicBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 140, // Account for tab bar height + existing padding
  },
  title: {
    fontSize: 24,
    marginBottom: 40,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
  sheetText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  numberInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginHorizontal: 20,
  },
});
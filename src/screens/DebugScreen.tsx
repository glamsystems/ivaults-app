import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '../theme';
import { CustomBottomSheet, BasicBottomSheet } from '../components/sheets';
import { Text, PageWrapper } from '../components/common';
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
    <PageWrapper>
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
        style={[styles.button]}
        onPress={handleFullScreenPress}
      >
        <Text variant="regular" style={[styles.buttonText, { color: '#FEFEFE' }]}>
          Connect
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.buttonOutline]}
        onPress={handleSheetPress}
      >
        <Text variant="regular" style={[styles.buttonText, { color: '#717171' }]}>
          Show Bottom Sheet
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.buttonDisabled]}
        onPress={handleKeyboardSheetPress}
        disabled={true}
      >
        <Text variant="regular" style={[styles.buttonText, { color: '#A8A8A8' }]}>
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
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 38, // Match header padding
    paddingVertical: 20,
    paddingBottom: 140, // Account for tab bar height + existing padding
  },
  title: {
    fontSize: 24,
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  buttonOutline: {
    paddingHorizontal: 19, // Reduced by 1px to account for border
    paddingVertical: 11, // Reduced by 1px to account for border
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#717171',
    backgroundColor: 'rgba(217, 217, 217, 0.01)',
  },
  buttonDisabled: {
    paddingHorizontal: 19, // Reduced by 1px to account for border
    paddingVertical: 11, // Reduced by 1px to account for border
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A8A8A8',
    backgroundColor: 'rgba(217, 217, 217, 0.01)',
  },
  buttonText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24, // normal line height for 18px font
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
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Text } from '../common';
import { FontSizes, Spacing } from '../../constants';

export const EmptyState: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const handleExploreVaults = () => {
    // Navigate to Screener tab
    navigation.navigate('Screener');
  };

  return (
    <View style={styles.container}>
      <Text variant="regular" style={[styles.message, { color: colors.text.disabled }]}>
        No vault positions yet.
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.button.primary }]}
        onPress={handleExploreVaults}
        activeOpacity={0.7}
      >
        <Text variant="regular" style={[styles.buttonText, { color: colors.button.primaryText }]}>
          Explore Vaults
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100, // Account for header
  },
  message: {
    fontSize: FontSizes.large,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: FontSizes.large,
  },
});
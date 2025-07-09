import React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import { useTheme } from '../theme';
import { Text, PageWrapper } from '../components/common';

export const ScreenerScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <PageWrapper>
      <View style={styles.container}>
      <Text variant="semiBold" style={[styles.text, { color: colors.text.primary }]}>Screener Screen</Text>
      <Text mono variant="semiBold" style={{ color: colors.text.primary, marginTop: 20 }}>
        Test GeistMono Font
      </Text>
      <Text variant="regular" style={{ color: colors.text.primary, marginTop: 10 }}>
        Test Geist Sans Font
      </Text>
      <RNText style={{ color: colors.text.primary, marginTop: 10, fontFamily: 'GeistMono-SemiBold', fontSize: 20 }}>
        Direct RN Text with GeistMono
      </RNText>
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 120, // Account for tab bar height
  },
  text: {
    fontSize: 18,
    fontWeight: 'normal',
  },
});
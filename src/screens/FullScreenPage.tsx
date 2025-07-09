import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SecondaryHeader } from '../components/headers';
import { PageWrapper, Text } from '../components/common';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

export const FullScreenPage: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  return (
    <PageWrapper>
      <SecondaryHeader onLeftPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text variant="bold" style={[styles.text, { color: colors.text.primary }]}>Full Screen Page</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          No tabs, only header with back button
        </Text>
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  text: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
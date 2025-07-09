import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { Text } from '../components/common';
import { SecondaryHeader } from '../components/headers';
import { PageWrapper } from '../components/common/PageWrapper';

export const ActivityScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <PageWrapper>
      <SecondaryHeader onLeftPress={handleGoBack} />
      <View style={styles.container}>
        <Text variant="semiBold" style={[styles.text, { color: colors.text.primary }]}>Activity Screen</Text>
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});
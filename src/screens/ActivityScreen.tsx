import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { SecondaryHeader } from '../components/headers';
import { ScreenLayout } from '../components/layout';
import { ActivityCard, ActivityFilterTabs } from '../components/activity';
import { useActivityStore } from '../store/activityStore';

export const ActivityScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { getFilteredActivities } = useActivityStore();
  const filteredActivities = getFilteredActivities();
  
  // Data is now initialized globally in DataInitializer
  
  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <ScreenLayout
      type="activity"
      data={filteredActivities}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ActivityCard activity={item} />
      )}
      FilterComponent={ActivityFilterTabs}
      bottomGradientHeight={160}
    >
      <SecondaryHeader onLeftPress={handleGoBack} />
    </ScreenLayout>
  );
};
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { SecondaryHeader } from '../components/headers';
import { ScreenLayout } from '../components/layout';
import { ActivityCard, ActivityFilterTabs } from '../components/activity';
import { useActivityStore } from '../store/activityStore';

export const ActivityScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { getFilteredActivities, setActivities } = useActivityStore();
  const filteredActivities = getFilteredActivities();
  
  useEffect(() => {
    // Initialize with mock activity data
    setActivities([
      {
        id: '1',
        type: 'deposit',
        name: 'Deposit',
        symbol: 'DYO',
        date: 'Jul 7, 2025',
        amount: 1234.56,
      },
      {
        id: '2',
        type: 'cancel',
        name: 'Cancel',
        symbol: 'SSP',
        date: 'Jul 4, 2025',
        amount: 123.43,
      },
      {
        id: '3',
        type: 'claim',
        name: 'Claim',
        symbol: 'STY',
        date: 'Jun 30, 2025',
        amount: 42.07,
      },
      {
        id: '4',
        type: 'request',
        name: 'Request',
        symbol: 'STY',
        date: 'Jun 29, 2025',
        amount: 42.07,
      },
      {
        id: '5',
        type: 'request',
        name: 'Request',
        symbol: 'SSP',
        date: 'Jun 21, 2025',
        amount: 123.43,
      },
      {
        id: '6',
        type: 'deposit',
        name: 'Deposit',
        symbol: 'RAY',
        date: 'Jun 20, 2025',
        amount: 567.89,
      },
      {
        id: '7',
        type: 'claim',
        name: 'Claim',
        symbol: 'FTT',
        date: 'Jun 18, 2025',
        amount: 89.45,
      },
      {
        id: '8',
        type: 'deposit',
        name: 'Deposit',
        symbol: 'SRM',
        date: 'Jun 15, 2025',
        amount: 2345.67,
      },
      {
        id: '9',
        type: 'cancel',
        name: 'Cancel',
        symbol: 'DYO',
        date: 'Jun 14, 2025',
        amount: 456.78,
      },
      {
        id: '10',
        type: 'request',
        name: 'Request',
        symbol: 'RAY',
        date: 'Jun 10, 2025',
        amount: 78.90,
      },
      {
        id: '11',
        type: 'claim',
        name: 'Claim',
        symbol: 'MNGO',
        date: 'Jun 8, 2025',
        amount: 234.56,
      },
      {
        id: '12',
        type: 'deposit',
        name: 'Deposit',
        symbol: 'ORCA',
        date: 'Jun 5, 2025',
        amount: 890.12,
      },
      {
        id: '13',
        type: 'cancel',
        name: 'Cancel',
        symbol: 'SBR',
        date: 'Jun 3, 2025',
        amount: 345.67,
      },
      {
        id: '14',
        type: 'request',
        name: 'Request',
        symbol: 'FTT',
        date: 'May 30, 2025',
        amount: 123.45,
      },
      {
        id: '15',
        type: 'deposit',
        name: 'Deposit',
        symbol: 'STY',
        date: 'May 28, 2025',
        amount: 3456.78,
      },
    ]);
  }, []);
  
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
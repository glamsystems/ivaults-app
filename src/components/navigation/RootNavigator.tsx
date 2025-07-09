import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from './TabNavigator';
import { FullScreenPage, ActivityScreen } from '../../screens';
import { MainHeader } from '../headers';
import { useNavigation } from '@react-navigation/native';
import { PageWrapper } from '../common/PageWrapper';

const Stack = createStackNavigator();

const MainTabsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  const handleActivityPress = () => {
    navigation.navigate('Activity');
  };
  
  return (
    <PageWrapper>
      <MainHeader title="iVaults" onRightPress={handleActivityPress} />
      <TabNavigator />
    </PageWrapper>
  );
};

export const RootNavigator: React.FC = () => {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            },
          }),
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabsScreen} />
        <Stack.Screen name="FullScreen" component={FullScreenPage} />
        <Stack.Screen name="Activity" component={ActivityScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
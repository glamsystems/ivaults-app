import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from './TabNavigator';
import { FullScreenPage, ActivityScreen, VaultDetailScreen } from '../../screens';
import { MainHeader } from '../headers';
import { PageWrapper } from '../common/PageWrapper';
import { DeepLinkingHandler } from '../../utils/deepLinkingHandler';

const Stack = createStackNavigator();

const MainTabsScreen: React.FC = () => {
  return (
    <>
      <MainHeader title="iVaults" />
      <TabNavigator />
    </>
  );
};

export const RootNavigator: React.FC = () => {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
    },
  };

  useEffect(() => {
    // Initialize deep linking
    if (navigationRef.current) {
      DeepLinkingHandler.init(navigationRef.current, {
        onWalletReturn: () => {
          console.log('[RootNavigator] Wallet return detected via deep link');
          // You can add custom logic here for wallet returns
        },
        onVaultOpen: (vaultId) => {
          console.log('[RootNavigator] Opening vault via deep link:', vaultId);
        },
      });
    }

    return () => {
      DeepLinkingHandler.cleanup();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
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
        <Stack.Screen name="VaultDetail" component={VaultDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
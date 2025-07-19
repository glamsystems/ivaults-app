import React from 'react';
import { Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons as Icon } from '@expo/vector-icons';
import { DEBUG } from '@env';
import { useTheme } from '../../theme';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useWalletStore } from '../../store/walletStore';
import { useNavigationStore } from '../../store/navigationStore';
import {
  ScreenerScreen,
  PortfolioScreen,
  SettingsScreen,
  DebugScreen,
} from '../../screens';
import { BottomGradient } from '../screener';
import { WebTabIconOverlay } from './WebTabIconOverlay';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const { colors } = useTheme();
  const showDebugTab = DEBUG === 'true';
  const navigation = useNavigation<any>();
  const account = useWalletStore((state) => state.account);
  const pendingVaultReturn = useNavigationStore((state) => state.pendingVaultReturn);
  const clearPendingVaultReturn = useNavigationStore((state) => state.clearPendingVaultReturn);

  return (
    <View style={styles.container}>
      {/* Bottom gradient for consistent appearance - rendered first */}
      <BottomGradient />
      
      <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 120,
          paddingBottom: 0, // Ensure no bottom cutoff
          paddingTop: 0, // Reduced to raise icons higher
          position: 'absolute',
          paddingHorizontal: 40, // Add horizontal padding to center the icons
          zIndex: Platform.select({
            ios: 10,
            android: 10,
            web: 100, // Higher z-index for web
          }),
        },
        ...(Platform.OS === 'android' && {
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.6}
            />
          ),
        }),
        tabBarIcon: ({ focused }) => {
          let iconName: string;

          switch (route.name) {
            case 'Screener':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Portfolio':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            case 'Debug':
              iconName = focused ? 'bug' : 'bug-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return (
            <Icon
              name={iconName}
              size={28}
              color={focused ? colors.text.primary : colors.icon.secondary}
            />
          );
        },
      })}
    >
      <Tab.Screen 
        name="Screener" 
        component={ScreenerScreen}
        listeners={{
          tabPress: (e) => {
            // Check if we have a pending vault return and wallet is connected
            if (pendingVaultReturn && account) {
              // Prevent default navigation to Screener
              e.preventDefault();
              
              console.log('[TabNavigator] Navigating to pending vault:', pendingVaultReturn.name);
              
              // Clear the pending state
              clearPendingVaultReturn();
              
              // Reset navigation to have Screener in the stack, then VaultDetail
              navigation.dispatch(
                CommonActions.reset({
                  index: 1,
                  routes: [
                    { name: 'MainTabs', params: { screen: 'Screener' } },
                    { name: 'VaultDetail', params: { vault: pendingVaultReturn } }
                  ],
                })
              );
            }
            // Otherwise, let normal navigation happen
          },
        }}
      />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      {showDebugTab && <Tab.Screen name="Debug" component={DebugScreen} />}
    </Tab.Navigator>
    <WebTabIconOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
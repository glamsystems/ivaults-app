import React from 'react';
import { Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons as Icon } from '@expo/vector-icons';
import { DEBUG } from '@env';
import { useTheme } from '../../theme';
import {
  ScreenerScreen,
  PortfolioScreen,
  SettingsScreen,
  DebugScreen,
} from '../../screens';
import { BottomGradient } from '../screener';
import { WebTabIconOverlay } from './WebTabIconOverlay';
import { useVaultStore } from '../../store/vaultStore';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const { colors } = useTheme();
  const showDebugTab = DEBUG === 'true';

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
      <Tab.Screen name="Screener" component={ScreenerScreen} />
      <Tab.Screen 
        name="Portfolio" 
        component={PortfolioScreen}
        listeners={{
          tabPress: () => {
            // Trigger vault refresh when tab is pressed
            console.log('[TabNavigator] Portfolio tab pressed, refreshing vaults...');
            const { refreshVaults } = useVaultStore.getState();
            refreshVaults();
          }
        }}
      />
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
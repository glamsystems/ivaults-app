import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { DEBUG } from '@env';
import { useTheme } from '../../theme';
import {
  ScreenerScreen,
  PortfolioScreen,
  SettingsScreen,
  DebugScreen,
} from '../../screens';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const { colors } = useTheme();
  const showDebugTab = DEBUG === 'true';

  return (
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
        },
        tabBarButton: (props) => {
          const {
            delayLongPress,
            disabled,
            onBlur,
            onFocus,
            onPressIn,
            onPressOut,
            onPress,
            onLongPress,
            ...restProps
          } = props;
          const sanitizedDelayLongPress = typeof delayLongPress === 'number' ? delayLongPress : undefined;
          const sanitizedDisabled = typeof disabled === 'boolean' ? disabled : undefined;
          const sanitizedOnBlur = typeof onBlur === 'function' ? onBlur : undefined;
          const sanitizedOnFocus = typeof onFocus === 'function' ? onFocus : undefined;
          const sanitizedOnPressIn = typeof onPressIn === 'function' ? onPressIn : undefined;
          const sanitizedOnPressOut = typeof onPressOut === 'function' ? onPressOut : undefined;
          const sanitizedOnPress = typeof onPress === 'function' ? onPress : undefined;
          const sanitizedOnLongPress = typeof onLongPress === 'function' ? onLongPress : undefined;
          return (
            <TouchableOpacity
              {...restProps}
              delayLongPress={sanitizedDelayLongPress}
              disabled={sanitizedDisabled}
              onBlur={sanitizedOnBlur}
              onFocus={sanitizedOnFocus}
              onPressIn={sanitizedOnPressIn}
              onPressOut={sanitizedOnPressOut}
              onPress={sanitizedOnPress}
              onLongPress={sanitizedOnLongPress}
              activeOpacity={0.6}
            />
          );
        },
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
              color={focused ? colors.icon.primary : colors.icon.secondary}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Screener" component={ScreenerScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      {showDebugTab && <Tab.Screen name="Debug" component={DebugScreen} />}
    </Tab.Navigator>
  );
};
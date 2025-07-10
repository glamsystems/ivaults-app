import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useNavigationState, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { DEBUG } from '@env';

export const WebTabIconOverlay: React.FC = () => {
  const { colors } = useTheme();
  const showDebugTab = DEBUG === 'true';
  
  // Only render on web
  if (Platform.OS !== 'web') {
    return null;
  }
  
  // Get current route name from navigation state
  // We need to look inside the MainTabs route to find the active tab
  const routeName = useNavigationState(state => {
    // Find the MainTabs route
    const mainTabsRoute = state?.routes?.find(r => r.name === 'MainTabs');
    
    // If we're on MainTabs screen, get the nested tab state
    if (mainTabsRoute && mainTabsRoute.state) {
      const tabState = mainTabsRoute.state;
      const activeTabRoute = tabState.routes[tabState.index];
      return activeTabRoute?.name;
    }
    
    // Fallback: try to get from current state if we're already in tabs
    if (state?.type === 'tab') {
      const route = state.routes[state.index];
      return route?.name;
    }
    
    return null;
  });
  
  // Default to Screener tab on initial load
  const activeTabName = routeName || 'Screener';
  
  const tabs = [
    { name: 'Screener', icon: 'list', iconOutline: 'list-outline' },
    { name: 'Portfolio', icon: 'bar-chart', iconOutline: 'bar-chart-outline' },
    { name: 'Settings', icon: 'settings', iconOutline: 'settings-outline' },
    ...(showDebugTab ? [{ name: 'Debug', icon: 'bug', iconOutline: 'bug-outline' }] : []),
  ];
  
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.iconRow}>
        {tabs.map((tab) => {
          const isActive = activeTabName === tab.name;
          const iconName = isActive ? tab.icon : tab.iconOutline;
          
          return (
            <View key={tab.name} style={styles.iconWrapper}>
              <Icon
                name={iconName as any}
                size={28}
                color={isActive ? colors.text.primary : colors.icon.secondary}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 38,
    height: 120,
    zIndex: 150, // Higher than gradient (1) and tab bar (100)
    paddingHorizontal: 40, // Same as tab bar
  },
  iconRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  iconWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60, // Approximate touch target height
  },
});
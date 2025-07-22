import 'react-native-gesture-handler';
import React, { useCallback } from 'react';
import { View, Text as RNText, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/components/navigation';
import { useFonts } from './src/hooks/useFonts';
import { DataInitializer } from './src/components/DataInitializer';
import { ConnectionProvider, NETWORK_ENDPOINTS } from './src/solana/providers/ConnectionProvider';
import { AuthorizationProvider } from './src/solana/providers/AuthorizationProvider';
import { SessionRestoreHandler } from './src/components/SessionRestoreHandler';

// Android font rendering fix
if (Platform.OS === 'android' && RNText.defaultProps == null) {
  RNText.defaultProps = {};
  RNText.defaultProps.allowFontScaling = false;
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function App() {
  const fontsLoaded = useFonts();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ConnectionProvider 
              endpoint={NETWORK_ENDPOINTS.mainnet} 
              config={{ commitment: 'confirmed' }}
            >
              <AuthorizationProvider network="mainnet">
                <SessionRestoreHandler>
                  <DataInitializer>
                    <BottomSheetModalProvider>
                      <StatusBar style="auto" />
                      <RootNavigator />
                    </BottomSheetModalProvider>
                  </DataInitializer>
                </SessionRestoreHandler>
              </AuthorizationProvider>
            </ConnectionProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import React, { useEffect } from 'react';
import { useSessionRestore } from '../hooks/useSessionRestore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface SessionRestoreHandlerProps {
  children: React.ReactNode;
}

export const SessionRestoreHandler: React.FC<SessionRestoreHandlerProps> = ({ children }) => {
  const { isRestoring } = useSessionRestore();
  const { colors } = useTheme();

  // Show a subtle loading indicator while checking for session
  if (isRestoring) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="small" color={colors.text.primary} />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
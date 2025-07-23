import React from 'react';
import { useSessionRestore } from '../hooks/useSessionRestore';

interface SessionRestoreHandlerProps {
  children: React.ReactNode;
}

export const SessionRestoreHandler: React.FC<SessionRestoreHandlerProps> = ({ children }) => {
  const { isRestoring } = useSessionRestore();
  
  // Always render children - let them handle the loading state
  // This allows the app to show skeleton loaders instead of a spinner
  return <>{children}</>;
};
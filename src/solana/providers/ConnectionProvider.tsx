import React, { ReactNode, useMemo } from 'react';
import {
  Connection,
  ConnectionConfig,
} from '@solana/web3.js';
import { DEVNET_RPC, SOLANA_RPC } from '@env';

// Default RPC endpoints
export const RPC_ENDPOINT = SOLANA_RPC || DEVNET_RPC || 'https://api.mainnet-beta.solana.com';

export const NETWORK_ENDPOINTS = {
  devnet: DEVNET_RPC || 'https://api.devnet.solana.com',
  mainnet: SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
} as const;

export type NetworkType = keyof typeof NETWORK_ENDPOINTS;

export interface ConnectionProviderProps {
  children: ReactNode;
  endpoint?: string;
  config?: ConnectionConfig;
}

export interface ConnectionContextState {
  connection: Connection;
}

const ConnectionContext = React.createContext<ConnectionContextState>(
  {} as ConnectionContextState,
);

export function ConnectionProvider({
  children,
  endpoint,
  config = { commitment: 'processed' },
}: ConnectionProviderProps): React.JSX.Element {
  const connection = useMemo(
    () => {
      const rpcUrl = endpoint || RPC_ENDPOINT;
      console.log('[ConnectionProvider] Creating connection with URL:', rpcUrl);
      console.log('[ConnectionProvider] Config:', config);
      const conn = new Connection(rpcUrl, config);
      // Log connection details
      console.log('[ConnectionProvider] Connection created:', {
        endpoint: conn.rpcEndpoint,
        commitment: conn.commitment,
      });
      return conn;
    },
    [endpoint, config],
  );

  return (
    <ConnectionContext.Provider value={{ connection }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export const useConnection = (): ConnectionContextState =>
  React.useContext(ConnectionContext);
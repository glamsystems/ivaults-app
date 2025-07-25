# iVaults by GLAM

A React Native mobile app for discovering and managing investment vaults on Solana through the GLAM protocol.

## Features

- **Vault Discovery**: Browse and search investment vaults with real-time data from Solana
- **Portfolio Management**: Track positions and manage redemption requests
- **Wallet Integration**: Connect via Solana Mobile Wallet Adapter for secure transactions
- **Transaction Support**: Deposit, withdraw, and claim redemptions directly from the app
- **Activity Tracking**: Monitor transaction history and vault performance

## Tech Stack

- **React Native** + **Expo** (SDK 53)
- **TypeScript** for type safety
- **Solana Web3.js** + **@glamsystems/glam-sdk**
- **Zustand** for state management
- **TanStack Query** for data fetching
- **React Native Reanimated** for animations

## Prerequisites

- Node.js v18+
- Expo CLI
- Android Emulator
- Solana wallet app (Phantom, Solflare, etc.)

## Setup

1. Clone and install:
   ```bash
   git clone https://github.com/glamsystems/ivaults-app.git
   cd ivaults-app
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local` with your RPC endpoints:
   ```
   NETWORK=mainnet
   SOLANA_RPC=https://your-mainnet-rpc
   MAINNET_TX_RPC=https://your-tx-rpc
   ```

## Development

```bash
npm start          # Start Expo dev server
npm run android    # Android emulator
npm run web        # Web browser
```

## Project Structure

```
src/
├── components/     # UI components
├── screens/        # App screens
├── store/          # Zustand stores
├── services/       # GLAM/Solana services
├── solana/         # Wallet & RPC providers
└── utils/          # Helpers & formatters
```

## Key Stores

- **vaultStore**: Vault data, search, and filtering
- **walletStore**: Wallet connection and balances
- **portfolioStore**: User positions and redemptions
- **activityStore**: Transaction history

## Notes

- Mainnet configuration by default
- Performance metrics are simulated for display
- Wallet sessions persist between app launches
- Supports deep linking for wallet returns

## License

Private repository - All rights reserved
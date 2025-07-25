# iVaults by GLAM *.+

A React Native Android app for discovering and managing GLAM vaults on Solana.

## Features

- **Vault Discovery**: Browse and search investment vaults with real-time data from Solana
- **Portfolio Management**: Track positions and manage redemption requests
- **Mobile Wallet Integration**: Connect via Solana Mobile Wallet Adapter (MWA) for signing transactions
- **Transaction Support**: Deposit, withdraw, and claim redemptions directly from the app

## Tech Stack

- **React Native** + **Expo** (SDK 53)
- **TypeScript** for type safety
- **Solana Web3.js** + **@glamsystems/glam-sdk**
- **Solana Mobile Wallet Adapter** for Android wallet integration
- **Zustand** for state management
- **TanStack Query** for data fetching
- **React Native Reanimated** for animations

## Prerequisites

- Node.js v18+
- Expo CLI
- Android Studio with Android Emulator
- Android device or emulator with a Solana wallet app (Phantom, Solflare, Backpack, etc.)

## Setup

1. Clone and install:
   ```bash
   git clone https://github.com/glamsystems/glam.git
   cd glam
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
npm run android    # Run on Android emulator/device
```

## Project Structure

```
src/
├── components/     # UI components
├── constants/      # App constants (fonts, spacing, tokens)
├── contexts/       # React contexts
├── data/           # Static data files
├── hooks/          # Custom React hooks
├── screens/        # App screens
├── services/       # GLAM/Solana services
├── solana/         # Wallet & RPC providers
├── store/          # Zustand stores
├── theme/          # Theme system (colors, fonts, context)
├── types/          # TypeScript type definitions
└── utils/          # Helpers & formatters
```

## Key Stores

- **vaultStore**: Vault data, search, and filtering
- **walletStore**: Wallet connection and balances
- **portfolioStore**: User positions and redemptions
- **activityStore**: Transaction history

## Mobile Wallet Adapter (MWA)

iVaults uses the Solana Mobile Wallet Adapter protocol for secure wallet interactions on Android devices. This provides:

- **Secure Transaction Signing**: All transactions are signed within your wallet app
- **Session Persistence**: Wallet authorization persists between app launches
- **Deep Linking**: Automatic return to iVaults after wallet interactions
- **Multi-Wallet Support**: Works with any MWA-compatible wallet (Phantom, Solflare, Backpack, etc.)

## Notes

- Mainnet configuration by default
- Performance metrics are simulated for display
- Wallet sessions persist between app launches
- Supports deep linking for wallet returns

## TODO

- [ ] **Web Support**: Add browser extension wallet support for web platform
- [ ] **iOS Support**: Implement iOS wallet integration
- [ ] **Cross-Platform Wallet Adapter**: Unified wallet connection across all platforms
- [ ] **WalletConnect Integration**: Alternative wallet connection method
- [ ] **Activity Tracking**: Monitor transaction history and vault performance

## License

This project is licensed under the Business Source License 1.1 - see the [LICENSE](LICENSE) file for details.

The license converts to MIT License on 2029-07-25.

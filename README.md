# iVaults App

A React Native application built with Expo and TypeScript for managing digital vaults.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

## Environment Setup

This project uses environment variables for configuration. Follow these steps:

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. The `.env.local` file is git-ignored to keep your local settings private.

3. Available environment variables:
   - `DEBUG` - Set to `true` to enable the debug tab in the app (default: `false`)

**Note:** The app is configured to read from `.env.local` instead of `.env` for better security practices.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/glamsystems/ivaults-app.git
   cd ivaults-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables (see Environment Setup above)

## Development

Start the development server:
```bash
npm start
```

Run on specific platforms:
- iOS: `npm run ios`
- Android: `npm run android`
- Web: `npm run web`

## Technology Stack

- **React Native** - Cross-platform mobile framework
- **Expo** (SDK 53) - Development platform
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation library
- **Zustand** - State management
- **TanStack Query** - Data fetching and caching
- **React Native Reanimated** - Animation library
- **@gorhom/bottom-sheet** - Modal bottom sheets
- **@expo/vector-icons** - Icon library (Ionicons)
- **expo-linear-gradient** - Gradient backgrounds
- **expo-blur** - Blur effects
- **react-native-dotenv** - Environment variables
- **react-native-redash** - Animation utilities
- **react-native-svg** - SVG support

## Project Structure

```
src/
├── components/
│   ├── common/         # Shared components (Text, PageWrapper, etc.)
│   ├── headers/        # Header components
│   ├── navigation/     # Navigation components
│   ├── sheets/         # Bottom sheet components
│   ├── activity/       # Activity tracking components
│   ├── layout/         # Layout components
│   ├── portfolio/      # Portfolio management
│   ├── screener/       # Vault screening/filtering
│   └── vaultDetail/    # Vault detail views
├── screens/            # Screen components
├── theme/              # Theme configuration and colors
├── hooks/              # Custom React hooks
├── store/              # Zustand state management
├── constants/          # App constants (fonts, spacing)
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

## Features

- **Portfolio Management**: Track vault positions and withdrawal requests
- **Vault Screening**: Browse and filter vaults by category with search
- **Activity History**: Track deposits, withdrawals, and claims
- **Vault Details**: View performance metrics and strategy descriptions
- **Transaction Sheets**: Deposit and withdraw using custom numpads
- **Theme Support**: Light/dark mode with system preference detection
- **Cross-Platform**: iOS, Android, and Web support
- **Custom Components**: Bottom sheets, gradient backgrounds, custom fonts
- **Mock Data**: DataInitializer component provides sample data

## Data Architecture

The app uses Zustand for state management with three main stores:
- **vaultStore**: Manages vault data, filtering, and search
- **portfolioStore**: Manages user positions and withdrawal requests
- **activityStore**: Manages transaction history and activity filtering

Data is initialized through the `DataInitializer` component which wraps the app and provides mock data for development.

## Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser

## Known Issues/Notes

- Web navigation icons use a custom overlay component for compatibility
- Theme preference doesn't persist between sessions (temporary limitation)
- All data is mock data initialized at app startup

## License

Private repository - All rights reserved
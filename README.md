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
- **Bottom Sheet** - Modal bottom sheets

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── common/      # Common components (Text, PageWrapper)
│   ├── headers/     # Header components
│   ├── navigation/  # Navigation components
│   └── sheets/      # Bottom sheet components
├── screens/         # Screen components
├── theme/           # Theme configuration
├── hooks/           # Custom React hooks
├── store/           # State management
└── types/           # TypeScript type definitions
```

## Features

- Tab navigation with custom styling
- Light/dark mode support
- Custom fonts (Geist Sans and Geist Mono)
- Bottom sheet modals with keyboard support
- Gradient backgrounds
- Debug mode for development

## Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser

## License

Private repository - All rights reserved
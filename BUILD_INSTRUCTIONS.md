# iVaults Build & Installation Instructions

## Android Production Build

### Prerequisites
- Android Studio installed
- Android SDK configured
- USB debugging enabled on your device (if installing on physical device)
- Android emulator configured (if using emulator)

### Build Steps

1. **Clean previous builds** (optional but recommended):
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. **Create production build**:
   ```bash
   cd android
   ./gradlew assembleRelease
   cd ..
   ```

3. **Locate the APK**:
   The APK will be generated at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

### Installation on Device/Emulator

#### Option 1: Install on USB-connected device
1. Connect your Android device via USB
2. Ensure USB debugging is enabled
3. Run:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

#### Option 2: Install on emulator
1. Start your Android emulator
2. Run:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

#### Option 3: Direct installation
1. Copy the APK to your device
2. Navigate to the file on your device
3. Tap to install (you may need to enable "Install from unknown sources")

### Troubleshooting

**If you get "INSTALL_FAILED_UPDATE_INCOMPATIBLE":**
```bash
# Uninstall the existing app first
adb uninstall com.fabioglam.iVaults
# Then reinstall
adb install android/app/build/outputs/apk/release/app-release.apk
```

**To check connected devices:**
```bash
adb devices
```

**To see installation logs:**
```bash
adb logcat | grep -i install
```

## iOS Production Build

### Prerequisites
- Xcode installed
- Apple Developer account (for device installation)
- CocoaPods dependencies installed

### Build Steps

1. **Install dependencies**:
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Open in Xcode**:
   ```bash
   open ios/iVaults.xcworkspace
   ```

3. **Build for device**:
   - Select your device or simulator in Xcode
   - Choose "Product" → "Archive" (for device) or "Build" (for simulator)
   - Follow the prompts to export and install

### Alternative: Command Line Build
```bash
# For simulator
npx react-native run-ios --configuration Release

# For device (requires proper signing)
npx react-native run-ios --configuration Release --device "Your Device Name"
```

## Environment Variables

The production build will use the environment variables from `.env.local`. Ensure they are properly configured before building:

- `DEMO`: Set to `true` for demo mode with mock vaults
- `NETWORK`: Set to `mainnet` or `devnet`
- Other RPC and API keys as needed

## Verification

After installation, verify:
1. The app launches correctly
2. Demo mode animations work (if DEMO=true)
3. All vaults display in the correct order
4. Network requests work properly

## Notes

- Production builds have better performance than debug builds
- Console logs are disabled in production builds
- The app size will be significantly smaller than debug builds
- Environment variables are embedded at build time, so changes require rebuilding
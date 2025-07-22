# Mobile Wallet Adapter Improvements

## Session Persistence

### Implementation
1. **SessionStorage Service** (`src/services/sessionStorage.ts`)
   - Securely stores auth tokens using `expo-secure-store`
   - 30-day session expiry
   - Stores: auth token, accounts, selected account, network

2. **Session Restore Hook** (`src/hooks/useSessionRestore.ts`)
   - Automatically attempts to restore session on app launch
   - Validates network and expiry
   - Clears invalid sessions

3. **Integration**
   - AuthorizationProvider saves sessions after successful auth
   - Sessions cleared on disconnect
   - SessionRestoreHandler shows loading state during restore

### Benefits
- Users stay logged in between app sessions
- Reduces wallet connection prompts
- Better user experience

## Deep Linking

### Implementation
1. **URL Scheme**: `ivaults://`
   - Configured in `app.json`
   - Automatically handled by Expo

2. **DeepLinkingHandler** (`src/utils/deepLinkingHandler.ts`)
   - Handles incoming deep links
   - Supports paths:
     - `ivaults://wallet-return` - Return from wallet operations
     - `ivaults://vault?id=<vaultId>` - Open specific vault
     - `ivaults://portfolio` - Navigate to portfolio
     - `ivaults://settings` - Navigate to settings

3. **Integration**
   - RootNavigator initializes deep linking
   - Navigation ref passed to handler
   - Automatic navigation to requested screens

### Usage in MWA
When initiating wallet operations, apps can specify a return URL:
```typescript
// Example: In wallet transaction
const returnUrl = DeepLinkingHandler.getWalletReturnURL();
// Pass returnUrl to wallet for automatic return
```

### Benefits
- Seamless return from wallet apps
- Direct vault sharing via links
- Better app-to-app flow

## Testing

### Session Persistence
1. Connect wallet
2. Close app completely
3. Reopen app - should auto-connect
4. Check 30-day expiry works

### Deep Linking
1. Test URL: `ivaults://wallet-return`
2. Test vault link: `ivaults://vault?id=<vaultId>`
3. Verify navigation works correctly

## Notes
- Sessions are network-specific (mainnet/devnet)
- Deep links work when app is closed or backgrounded
- Both features enhance MWA user experience
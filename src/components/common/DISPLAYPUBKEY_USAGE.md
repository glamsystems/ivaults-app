# DisplayPubkey Usage Guide

## Overview

The DisplayPubkey system provides a way to display user-friendly names for Solana public keys. It consists of:
- A utility function `getDisplayPubkey()` in `src/utils/displayPubkey.ts`
- A React component `<DisplayPubkey>` in `src/components/common/DisplayPubkey.tsx`

## Current Implementation

### 1. Utility Function: `getDisplayPubkey()`

The primary way to display pubkeys in the app. It automatically checks multiple sources to find the best display name.

**Usage:**
```typescript
import { getDisplayPubkey } from '../utils/displayPubkey';

// Basic usage - auto mode checks all sources
const displayName = getDisplayPubkey(pubkey);

// With specific type
const tokenName = getDisplayPubkey(pubkey, 'hardcoded', { network });

// With vaults for GLAM token lookup
const vaultToken = getDisplayPubkey(pubkey, 'auto', { vaults });
```

**Parameters:**
- `pubkey`: The Solana public key string
- `type`: Display mode - `'auto'` (default), `'hardcoded'`, `'glam'`, `'token'`, or `'default'`
- `options`: Optional configuration
  - `fallback`: Custom fallback text
  - `network`: Network type (mainnet/devnet)
  - `vaults`: Array of vaults for GLAM token lookup

**Resolution Order (auto mode):**
1. Hardcoded token symbols (USDC, SOL, etc.)
2. GLAM vault token symbols
3. On-chain metadata (future feature)
4. Truncated format: `xxxx...yyyy`

### 2. React Component: `<DisplayPubkey>`

A simpler React component that wraps the utility function with automatic vault store access.

**Usage:**
```tsx
import { DisplayPubkey } from '../components/common';

// Basic usage
<DisplayPubkey pubkey={vault.baseAsset} />

// With specific type
<DisplayPubkey pubkey={vault.baseAsset} type="hardcoded" />

// With fallback
<DisplayPubkey pubkey={manager} fallback="Unknown Manager" />
```

## Current Usage in the App

### VaultDetailScreen.tsx
- Uses `getDisplayPubkey()` for vault details:
  - TVL unit display
  - Manager name
  - Capacity unit

### VaultDetailHeader.tsx
- Uses `<DisplayPubkey>` component for base asset display

### DepositSheet.tsx & WithdrawSheet.tsx
- Uses utility function for token names in transaction sheets

## Adding DisplayPubkey to New Components

### Example: Adding to a vault info card
```tsx
import { getDisplayPubkey } from '../../utils/displayPubkey';
import { useVaultStore } from '../../store/vaultStore';

const VaultInfoCard = ({ vault }) => {
  const vaults = useVaultStore(state => state.vaults);
  
  return (
    <View>
      <Text>Manager: {getDisplayPubkey(vault.manager)}</Text>
      <Text>Base Asset: {getDisplayPubkey(vault.baseAsset, 'hardcoded')}</Text>
      <Text>Vault Token: {getDisplayPubkey(vault.mintPubkey, 'auto', { vaults })}</Text>
    </View>
  );
};
```

### Example: Using the React component
```tsx
import { DisplayPubkey } from '../common';

const ManagerInfo = ({ managerPubkey }) => (
  <View style={{ flexDirection: 'row' }}>
    <Text>Managed by: </Text>
    <DisplayPubkey pubkey={managerPubkey} />
  </View>
);
```

## Best Practices

1. **Use 'auto' mode by default** - It provides the best user experience by checking all sources
2. **Pass vaults when available** - This enables GLAM token symbol resolution
3. **Use specific types only when needed** - e.g., 'hardcoded' when you know it's a base asset
4. **Provide meaningful fallbacks** - For critical UI elements where empty strings would be confusing

## Future Enhancements

- On-chain token metadata fetching
- Caching layer for performance
- Copy/link functionality integration
- ENS-style name resolution for known addresses
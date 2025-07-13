# DisplayPubkey Component Usage Instructions

## Where to implement DisplayPubkey component:

### 1. VaultDetailHeader.tsx
Replace the current manager display with DisplayPubkey:

**Current code (around line 36-38):**
```tsx
<Text variant="small" style={{ color: colors.text.tertiary }}>
  Managed by {vault.manager}
</Text>
```

**Replace with:**
```tsx
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Text variant="small" style={{ color: colors.text.tertiary }}>
    Managed by 
  </Text>
  <DisplayPubkey 
    pubkey={vault.manager} 
    variant="small"
    color={colors.text.tertiary}
    showCopyIcon={true}
    showLinkIcon={true}
  />
</View>
```

### 2. VaultHighlights.tsx  
Add a new highlight card to show the vault's GLAM state pubkey:

**Add this new highlight card (after the existing cards, around line 50):**
```tsx
{vault.glam_state && (
  <HighlightCard
    icon="🔑"
    label="Vault Address"
    value={
      <DisplayPubkey 
        pubkey={vault.glam_state} 
        variant="medium"
        showCopyIcon={true}
        showLinkIcon={true}
      />
    }
  />
)}
```

**Don't forget to import DisplayPubkey at the top of both files:**
```tsx
import { DisplayPubkey } from '../common';
```

## Notes:
- The DisplayPubkey component is already created at `src/components/common/DisplayPubkey.tsx`
- It's already exported from `src/components/common/index.ts`
- The component truncates long pubkeys to show first 4 and last 4 characters
- It includes copy and link (Solscan) functionality
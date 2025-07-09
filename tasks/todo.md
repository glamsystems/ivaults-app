# iVaults Codebase Analysis and Issues

## Issues Found

### 1. MainHeader Component
- **Current State**: The MainHeader doesn't have a background color set, which means it's transparent
- **Issue**: This could cause content to show through when scrolling
- **Location**: `/src/components/headers/MainHeader.tsx`

### 2. Tab Navigation Styling
- **Current State**: Tab bar has `backgroundColor: colors.background.primary` set correctly
- **Issue**: The tab bar background appears to be working as intended
- **Location**: `/src/components/navigation/TabNavigator.tsx`

### 3. Bottom Sheet Implementation
- **Current State**: CustomBottomSheet uses BlurView with LinearGradient background
- **Issue**: The bottom sheet might not be visible due to:
  - Initial index is -1 (hidden state)
  - The blur effect might not be working properly on certain devices
  - The gradient colors use transparency which might make it hard to see
- **Location**: `/src/components/sheets/CustomBottomSheet.tsx`

### 4. Navigation Background Issues
- **Current State**: 
  - RootNavigator sets `cardStyle: { backgroundColor: 'transparent' }`
  - PageWrapper applies LinearGradient with borderRadius: 30
  - Each screen is wrapped in PageWrapper
- **Issues**:
  - The transparent card style might cause background bleeding
  - The 30px borderRadius on PageWrapper might create unexpected visual effects
  - No explicit background color behind the PageWrapper
- **Location**: `/src/components/navigation/RootNavigator.tsx` and `/src/components/common/PageWrapper.tsx`

## Todo List

- [ ] Fix MainHeader background - Add background color to prevent transparency issues
- [ ] Fix navigation background - Remove transparent cardStyle and add proper background
- [ ] Fix PageWrapper borderRadius - Remove or adjust the 30px borderRadius that might cause visual issues
- [ ] Fix CustomBottomSheet visibility - Adjust blur intensity and gradient opacity for better visibility
- [ ] Test bottom sheet functionality - Ensure the sheet properly expands when buttons are pressed
- [ ] Add proper backdrop for navigation screens - Ensure consistent background across all screens

## Additional Notes

The main issues appear to be:
1. Transparent backgrounds in navigation causing visual bleeding
2. PageWrapper with 30px borderRadius causing unexpected rounded corners
3. Bottom sheet might be too transparent or blur effect not working properly
4. MainHeader lacks background color definition
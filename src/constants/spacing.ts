export const Spacing = {
  page: 38,              // Standard page horizontal padding
  
  icon: {
    standard: 44,        // Standard icon size (44x44)
    large: 88,           // Large icon size (88x88) - 2x standard
    margin: 16,          // Standard icon right margin
  },
  
  card: {
    vertical: 23,        // Card vertical padding
    horizontal: 0,       // Card horizontal padding (full width)
  },
  
  button: {
    vertical: 11,        // Button vertical padding
    horizontal: 19,      // Button horizontal padding
    gap: 10,            // Gap between buttons
  },
  
  tab: {
    spacing: 24,         // Horizontal spacing between tabs
    paddingVertical: 14, // Tab container vertical padding
  },
  
  list: {
    itemGap: 0,         // Gap between list items (using paddingVertical instead)
  },
  
  header: {
    portfolio: {
      top: 20,          // Portfolio header top padding
      bottom: 30,       // Portfolio header bottom padding
    },
  },
  
  bottomTab: {
    height: 120,        // Tab bar height
    buttonBottom: 77,   // Bottom padding for buttons above tab bar
  },
} as const;
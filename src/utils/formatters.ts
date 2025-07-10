export const formatNumber = (value: number, options?: {
  decimals?: number;
  forceDecimals?: boolean;
  abbreviate?: boolean;
}): string => {
  const { 
    decimals = 2, 
    forceDecimals = false,
    abbreviate = true 
  } = options || {};

  // Handle abbreviation for large numbers
  if (abbreviate && value >= 10000) {
    if (value >= 1000000) {
      const millions = value / 1000000;
      return `${millions.toLocaleString('en-US', {
        minimumFractionDigits: forceDecimals ? decimals : 0,
        maximumFractionDigits: decimals,
      })}M`;
    } else {
      const thousands = value / 1000;
      return `${thousands.toLocaleString('en-US', {
        minimumFractionDigits: forceDecimals ? decimals : 0,
        maximumFractionDigits: decimals,
      })}K`;
    }
  }

  // Regular formatting with comma separators
  return value.toLocaleString('en-US', {
    minimumFractionDigits: forceDecimals ? decimals : 0,
    maximumFractionDigits: decimals,
  });
};

export const formatCurrency = (value: number, options?: {
  decimals?: number;
  forceDecimals?: boolean;
  abbreviate?: boolean;
}): string => {
  return `$${formatNumber(value, options)}`;
};

export const calculateTrackRecord = (inceptionDate: string): string => {
  const inception = new Date(inceptionDate);
  const today = new Date();
  
  // Calculate difference in milliseconds
  const diffMs = today.getTime() - inception.getTime();
  
  // Convert to days
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Calculate years, months, and days
  const years = Math.floor(diffDays / 365);
  const months = Math.floor(diffDays / 30);
  
  // Return the largest unit
  if (years >= 1) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (months >= 1) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};
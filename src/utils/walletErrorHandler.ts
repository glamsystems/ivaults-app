import { Alert } from 'react-native';

export interface WalletErrorInfo {
  shouldShow: boolean;
  title: string;
  message: string;
  buttonText?: string;
}

export const getWalletErrorInfo = (error: any): WalletErrorInfo => {
  const errorMessage = error?.message || error?.toString() || '';
  const errorMessageLower = errorMessage.toLowerCase();
  
  // User cancelled/declined - don't show any alert
  if (errorMessageLower.includes('cancelled') || 
      errorMessageLower.includes('rejected') || 
      errorMessageLower.includes('user declined') ||
      errorMessageLower.includes('user rejected')) {
    return {
      shouldShow: false,
      title: '',
      message: '',
    };
  }
  
  // Timeout
  if (errorMessageLower.includes('timeout')) {
    return {
      shouldShow: true,
      title: 'Connection Timeout',
      message: 'The wallet took too long to respond. Please try again.',
      buttonText: 'OK'
    };
  }
  
  // Network issues
  if (errorMessageLower.includes('network') || errorMessageLower.includes('offline')) {
    return {
      shouldShow: true,
      title: 'Network Issue',
      message: 'Please check your connection and try again.',
      buttonText: 'OK'
    };
  }
  
  // Generic error
  return {
    shouldShow: true,
    title: 'Unable to Connect',
    message: 'Please try again or check your wallet app.',
    buttonText: 'OK'
  };
};

export const getTransactionErrorInfo = (error: any): WalletErrorInfo => {
  const errorMessage = error?.message || error?.toString() || '';
  const errorMessageLower = errorMessage.toLowerCase();
  
  // User cancelled/rejected transaction
  if (errorMessageLower.includes('user rejected') || 
      errorMessageLower.includes('user declined') ||
      errorMessageLower.includes('user cancelled') ||
      errorMessageLower.includes('rejected the request')) {
    return {
      shouldShow: false,
      title: '',
      message: '',
    };
  }
  
  // Extract the actual error message
  let displayMessage = errorMessage;
  
  // Clean up common error prefixes
  if (displayMessage.includes('Error: ')) {
    displayMessage = displayMessage.replace(/Error:\s*/g, '');
  }
  
  // Remove stack traces
  const stackIndex = displayMessage.indexOf('\n    at ');
  if (stackIndex > 0) {
    displayMessage = displayMessage.substring(0, stackIndex).trim();
  }
  
  // Check for specific error types and set appropriate title
  let title = 'Transaction Failed';
  
  // Insufficient balance
  if (errorMessageLower.includes('insufficient') || 
      errorMessageLower.includes('not enough')) {
    title = 'Insufficient Balance';
  }
  // Network/RPC errors
  else if (errorMessageLower.includes('network') || 
           errorMessageLower.includes('rpc') ||
           errorMessageLower.includes('fetch')) {
    title = 'Network Error';
  }
  // Connection issues
  else if (errorMessageLower.includes('connection') ||
           errorMessageLower.includes('unable to connect')) {
    title = 'Connection Issue';
  }
  // Rate limiting
  else if (errorMessageLower.includes('rate limit') ||
           errorMessageLower.includes('429')) {
    title = 'Rate Limited';
  }
  // Transaction simulation
  else if (errorMessageLower.includes('simulation failed') ||
           errorMessageLower.includes('simulat')) {
    title = 'Transaction Failed';
  }
  
  // Return the actual error message with appropriate title
  return {
    shouldShow: true,
    title,
    message: displayMessage || 'An unexpected error occurred. Please try again.',
    buttonText: 'OK'
  };
};

export const showStyledAlert = (info: WalletErrorInfo) => {
  if (!info.shouldShow) return;
  
  Alert.alert(
    info.title,
    info.message,
    [
      {
        text: info.buttonText || 'OK',
        style: 'default',
        onPress: () => {} // Just dismiss
      }
    ],
    {
      cancelable: true,
    }
  );
};
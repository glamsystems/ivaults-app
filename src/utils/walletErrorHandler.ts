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
  
  // Insufficient balance
  if (errorMessageLower.includes('insufficient') || 
      errorMessageLower.includes('not enough')) {
    return {
      shouldShow: true,
      title: 'Insufficient Balance',
      message: 'You don\'t have enough funds for this transaction.',
      buttonText: 'OK'
    };
  }
  
  // Transaction simulation failed
  if (errorMessageLower.includes('simulation failed') ||
      errorMessageLower.includes('simulat')) {
    return {
      shouldShow: true,
      title: 'Transaction Failed',
      message: 'The transaction couldn\'t be processed. Please try again.',
      buttonText: 'OK'
    };
  }
  
  // Network/RPC errors
  if (errorMessageLower.includes('network') || 
      errorMessageLower.includes('rpc') ||
      errorMessageLower.includes('fetch')) {
    return {
      shouldShow: true,
      title: 'Network Error',
      message: 'Connection issue. Please check your network and try again.',
      buttonText: 'OK'
    };
  }
  
  // Generic transaction error
  return {
    shouldShow: true,
    title: 'Transaction Error',
    message: 'Something went wrong. Please try again.',
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
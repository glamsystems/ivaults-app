import { Alert } from 'react-native';

export const alertAndLog = (title: string, message: any) => {
  setTimeout(async () => {
    Alert.alert(title, message, [{text: 'Ok', style: 'cancel'}]);
  }, 100);
  console.log(message);
};
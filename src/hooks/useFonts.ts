import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

export const useFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Geist Sans
          'Geist-Thin': require('../../assets/fonts/Geist-Thin.otf'),
          'Geist-ThinItalic': require('../../assets/fonts/Geist-ThinItalic.otf'),
          'Geist-ExtraLight': require('../../assets/fonts/Geist-ExtraLight.otf'),
          'Geist-ExtraLightItalic': require('../../assets/fonts/Geist-ExtraLightItalic.otf'),
          'Geist-Light': require('../../assets/fonts/Geist-Light.otf'),
          'Geist-LightItalic': require('../../assets/fonts/Geist-LightItalic.otf'),
          'Geist': require('../../assets/fonts/Geist-Regular.otf'),
          'Geist-RegularItalic': require('../../assets/fonts/Geist-RegularItalic.otf'),
          'Geist-Medium': require('../../assets/fonts/Geist-Medium.otf'),
          'Geist-MediumItalic': require('../../assets/fonts/Geist-MediumItalic.otf'),
          'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.otf'),
          'Geist-SemiBoldItalic': require('../../assets/fonts/Geist-SemiBoldItalic.otf'),
          'Geist-Bold': require('../../assets/fonts/Geist-Bold.otf'),
          'Geist-BoldItalic': require('../../assets/fonts/Geist-BoldItalic.otf'),
          'Geist-ExtraBold': require('../../assets/fonts/Geist-ExtraBold.otf'),
          'Geist-ExtraBoldItalic': require('../../assets/fonts/Geist-ExtraBoldItalic.otf'),
          'Geist-Black': require('../../assets/fonts/Geist-Black.otf'),
          'Geist-BlackItalic': require('../../assets/fonts/Geist-BlackItalic.otf'),
          
          // GeistMono
          'GeistMono-Thin': require('../../assets/fonts/GeistMono-Thin.otf'),
          'GeistMono-ThinItalic': require('../../assets/fonts/GeistMono-ThinItalic.otf'),
          'GeistMono-ExtraLight': require('../../assets/fonts/GeistMono-ExtraLight.otf'),
          'GeistMono-ExtraLightItalic': require('../../assets/fonts/GeistMono-ExtraLightItalic.otf'),
          'GeistMono-Light': require('../../assets/fonts/GeistMono-Light.otf'),
          'GeistMono-LightItalic': require('../../assets/fonts/GeistMono-LightItalic.otf'),
          'GeistMono': require('../../assets/fonts/GeistMono-Regular.otf'),
          'GeistMono-Italic': require('../../assets/fonts/GeistMono-Italic.otf'),
          'GeistMono-Medium': require('../../assets/fonts/GeistMono-Medium.otf'),
          'GeistMono-MediumItalic': require('../../assets/fonts/GeistMono-MediumItalic.otf'),
          'GeistMono-SemiBold': require('../../assets/fonts/GeistMono-SemiBold.otf'),
          'GeistMono-SemiBoldItalic': require('../../assets/fonts/GeistMono-SemiBoldItalic.otf'),
          'GeistMono-Bold': require('../../assets/fonts/GeistMono-Bold.otf'),
          'GeistMono-BoldItalic': require('../../assets/fonts/GeistMono-BoldItalic.otf'),
          'GeistMono-ExtraBold': require('../../assets/fonts/GeistMono-ExtraBold.otf'),
          'GeistMono-ExtraBoldItalic': require('../../assets/fonts/GeistMono-ExtraBoldItalic.otf'),
          'GeistMono-Black': require('../../assets/fonts/GeistMono-Black.otf'),
          'GeistMono-BlackItalic': require('../../assets/fonts/GeistMono-BlackItalic.otf'),
        });
        // Log loaded font names
        console.log('Font.isLoaded("GeistMono-SemiBold"):', Font.isLoaded('GeistMono-SemiBold'));
        console.log('Font.isLoaded("Geist"):', Font.isLoaded('Geist'));
        console.log('All fonts loaded successfully');
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    }
    
    loadFonts();
  }, []);

  return fontsLoaded;
};
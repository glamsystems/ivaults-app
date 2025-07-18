import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { Spacing } from '../../constants';
import { SparkleImageCache } from '../../services/sparkleImageCache';

interface SparkleImageProps {
  mintPubkey?: string;
  size?: number;
  borderRadius?: number;
  fallbackColors?: string[];
}

export const SparkleImage: React.FC<SparkleImageProps> = ({
  mintPubkey,
  size = 40,
  borderRadius = 8,
  fallbackColors
}) => {
  const { colors, themeMode } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Check if image is cached
  const isCached = mintPubkey ? SparkleImageCache.isCached(mintPubkey) : false;

  // Debug logging
  useEffect(() => {
    if (mintPubkey) {
      console.log('[SparkleImage] Rendering with mintPubkey:', mintPubkey, 'Cached:', isCached);
      
      // If not cached, preload it
      if (!isCached && !error) {
        SparkleImageCache.preloadImage(mintPubkey);
      }
    }
  }, [mintPubkey, isCached, error]);

  // Reset states when mintPubkey changes
  useEffect(() => {
    setImageLoaded(false);
    setError(false);
  }, [mintPubkey]);

  const sparkleUrl = mintPubkey && !error 
    ? SparkleImageCache.getUrl(mintPubkey)
    : null;

  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        borderRadius,
        overflow: 'hidden',
      }
    ]}>
      {/* Show gradient only if not cached AND not loaded yet */}
      {(!sparkleUrl || (!isCached && !imageLoaded)) && (
        <View style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}>
          <LinearGradient
            colors={
              themeMode === 'dark' 
                ? ['#FEFEFE', '#D9D9D9'] // Light gradient in dark mode
                : ['#262626', '#010101'] // Dark gradient in light mode
            }
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
      )}
      
      {/* Show sparkle image when available */}
      {sparkleUrl && (
        <Image
          source={{ uri: sparkleUrl }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              opacity: imageLoaded || isCached ? 1 : 0,
            }
          ]}
          onLoad={() => {
            console.log('[SparkleImage] PNG loaded for:', mintPubkey);
            setImageLoaded(true);
          }}
          onError={(e) => {
            console.log('[SparkleImage] PNG failed to load for:', mintPubkey, e.nativeEvent?.error);
            setError(true);
          }}
          resizeMode="cover"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.icon.margin,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
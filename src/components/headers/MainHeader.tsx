import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { Text } from '../common';

interface MainHeaderProps {
  title: string;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  title,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.primary]}
      style={[styles.container, { paddingTop: insets.top + 12.5 }]}
    >
      <View style={styles.content}>
        <Text 
          mono
          variant="regular"
          style={[
            styles.title, 
            { 
              color: colors.text.disabled
            }
          ]}
        >
          {title}
        </Text>
        <Text 
          variant="regular"
          style={[
            styles.byGlam, 
            { 
              color: colors.text.disabled
            }
          ]}
        >
          by GLAM *.+
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 38, // 50 * 0.75 = 37.5, rounded to 38
    paddingBottom: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: 'normal', // Let the font file handle the weight
  },
  byGlam: {
    fontSize: 16,
    fontWeight: 'light',
    marginTop: 4,
  },
});
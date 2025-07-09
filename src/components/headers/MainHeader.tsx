import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { Text } from '../common';

interface MainHeaderProps {
  title: string;
  rightIcon?: string;
  onRightPress?: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  title,
  rightIcon = 'timer-outline',
  onRightPress,
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
        <Icon
          name={rightIcon}
          size={25}
          color={colors.icon.secondary}
          onPress={onRightPress}
          style={styles.icon}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 38, // 50 * 0.75 = 37.5, rounded to 38
    paddingBottom: 30,
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
  icon: {
    padding: 8, // Reduced from 10 to 8 to match SecondaryHeader
  },
});
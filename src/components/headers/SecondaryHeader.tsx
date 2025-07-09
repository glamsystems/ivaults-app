import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme';

interface SecondaryHeaderProps {
  leftIcon?: string;
  onLeftPress?: () => void;
}

export const SecondaryHeader: React.FC<SecondaryHeaderProps> = ({
  leftIcon = 'chevron-back',
  onLeftPress,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12.5 }]}>
      <View style={styles.content}>
        <Icon
          name={leftIcon}
          size={25}
          color={colors.icon.primary}
          onPress={onLeftPress}
          style={styles.icon}
        />
        <View style={styles.rightSpace} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5, // 50 * 0.75 = 37.5, rounded to 38
    paddingBottom: 30,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
    marginLeft: -12, // Move icon left to align with text
  },
  rightSpace: {
    width: 44, // Adjusted for 28px icon + padding
  },
});
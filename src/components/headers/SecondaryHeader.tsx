import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
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
        <TouchableOpacity
          onPress={onLeftPress}
          activeOpacity={0.6}
          style={styles.icon}
        >
          <Icon
            name={leftIcon}
            size={25}
            color={colors.icon.primary}
          />
        </TouchableOpacity>
        <View style={styles.rightSpace} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {  
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
  },
  rightSpace: {
    width: 44, // Adjusted for 28px icon + padding
  },
});
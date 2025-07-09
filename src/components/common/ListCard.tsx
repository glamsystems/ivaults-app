import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { FontSizes } from '../../constants/fonts';

interface ListCardProps {
  leftIcon: ReactNode;
  title: string;
  rightText: string;
  leftBottomText: string;
  rightBottomContent: ReactNode;
  onPress?: () => void;
}

export const ListCard: React.FC<ListCardProps> = ({
  leftIcon,
  title,
  rightText,
  leftBottomText,
  rightBottomContent,
  onPress,
}) => {
  const content = (
    <>
      {/* Row 1 */}
      <View style={styles.row}>
        <View style={styles.leftSection}>
          {leftIcon}
          <Text variant="regular" style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </View>
        <Text variant="regular" style={styles.rightText}>{rightText}</Text>
      </View>
      
      {/* Row 2 */}
      <View style={[styles.row, styles.secondRow]}>
        <Text variant="regular" style={styles.leftBottomText}>{leftBottomText}</Text>
        {rightBottomContent}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingVertical: 25,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondRow: {
    marginTop: 0,
    paddingLeft: 60, // Icon width (44) + margin (16)
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: FontSizes.large,
    color: '#010101',
  },
  rightText: {
    fontSize: FontSizes.medium,
    color: '#A8A8A8',
  },
  leftBottomText: {
    fontSize: FontSizes.medium,
    color: '#717171',
  },
});
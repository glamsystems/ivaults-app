import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { FontSizes, Spacing } from '../../constants';
import { useTheme } from '../../theme';

interface ListCardProps {
  leftIcon: ReactNode;
  title: string;
  rightText: string;
  leftBottomText?: string;
  leftBottomContent?: ReactNode;
  rightBottomContent: ReactNode;
  onPress?: () => void;
}

export const ListCard: React.FC<ListCardProps> = ({
  leftIcon,
  title,
  rightText,
  leftBottomText,
  leftBottomContent,
  rightBottomContent,
  onPress,
}) => {
  const { colors } = useTheme();
  const content = (
    <>
      {/* Row 1 */}
      <View style={styles.row}>
        <View style={styles.leftSection}>
          {leftIcon}
          <Text variant="regular" style={[styles.title, { color: colors.text.primary }]} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </View>
        <Text variant="regular" style={[styles.rightText, { color: colors.text.tertiary }]}>{rightText}</Text>
      </View>
      
      {/* Row 2 */}
      <View style={[styles.row, styles.secondRow]}>
        {leftBottomContent || (leftBottomText && (
          <Text variant="regular" style={[styles.leftBottomText, { color: colors.text.secondary }]}>{leftBottomText}</Text>
        ))}
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
    paddingVertical: Spacing.card.vertical,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondRow: {
    marginTop: 0,
    paddingLeft: Spacing.icon.standard + Spacing.icon.margin,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12, // Add margin to prevent overlap
  },
  title: {
    fontSize: FontSizes.large,
    flexShrink: 1, // Allow title to shrink if needed
  },
  rightText: {
    fontSize: FontSizes.medium,
    marginLeft: 8, // Add some spacing
  },
  leftBottomText: {
    fontSize: FontSizes.medium,
  },
});
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { ListCard } from '../common/ListCard';
import { Text } from '../common';
import { Activity, ActivityType } from '../../store/activityStore';
import { FontSizes } from '../../constants/fonts';

interface ActivityCardProps {
  activity: Activity;
}

const getActivityIcon = (type: ActivityType): keyof typeof Icon.glyphMap => {
  switch (type) {
    case 'deposit':
      return 'add-circle-outline';
    case 'cancel':
      return 'close-circle-outline';
    case 'claim':
      return 'checkmark-circle-outline';
    case 'request':
      return 'remove-circle-outline';
  }
};

const getAmountColor = (type: ActivityType): string => {
  switch (type) {
    case 'deposit':
      return '#0CC578'; // Green
    case 'cancel':
    case 'request':
      return '#FA155A'; // Red
    case 'claim':
      return '#010101'; // Black
  }
};

const formatAmount = (type: ActivityType, amount: number): string => {
  const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  switch (type) {
    case 'deposit':
      return `+${formattedAmount}`;
    case 'cancel':
    case 'request':
      return `-${formattedAmount}`;
    case 'claim':
      return formattedAmount;
  }
};

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const icon = (
    <View style={styles.iconContainer}>
      <Icon
        name={getActivityIcon(activity.type)}
        size={24}
        color="#717171"
      />
    </View>
  );

  const rightBottomContent = (
    <Text 
      variant="regular" 
      style={[
        styles.amount,
        { color: getAmountColor(activity.type) }
      ]}
    >
      {formatAmount(activity.type, activity.amount)}
    </Text>
  );

  // Capitalize first letter of activity type
  const activityTitle = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);

  return (
    <ListCard
      leftIcon={icon}
      title={activityTitle}
      rightText={activity.symbol}
      leftBottomText={activity.date}
      rightBottomContent={rightBottomContent}
    />
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E6E6E6',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: FontSizes.medium,
  },
});
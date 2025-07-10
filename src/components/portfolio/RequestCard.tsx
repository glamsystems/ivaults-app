import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { ListCard } from '../common/ListCard';
import { Text } from '../common';
import { Activity } from '../../store/activityStore';
import { FontSizes } from '../../constants/fonts';

interface RequestCardProps {
  request: Activity;
  canClaim?: boolean;
  canCancel?: boolean;
  daysRemaining?: string; // e.g., "7 days 3 hours"
  onClaim?: () => void;
  onCancel?: () => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ 
  request, 
  canClaim = false,
  canCancel = false,
  daysRemaining,
  onClaim,
  onCancel 
}) => {
  const icon = (
    <View style={styles.iconContainer}>
      <Icon
        name="remove-circle-outline"
        size={24}
        color="#717171"
      />
    </View>
  );

  const rightBottomContent = (
    <View style={styles.buttonContainer}>
      {canClaim ? (
        <TouchableOpacity 
          style={styles.claimButton}
          onPress={onClaim}
          activeOpacity={0.7}
        >
          <Text variant="regular" style={styles.claimButtonText}>
            Claim
          </Text>
        </TouchableOpacity>
      ) : canCancel ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text variant="regular" style={styles.cancelButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>
          <View style={styles.countdownButtonInRow}>
            <Text variant="regular" style={styles.countdownText}>
              {daysRemaining || '7 days 3 hours'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.countdownButtonFull}>
          <Text variant="regular" style={styles.countdownText}>
            {daysRemaining || '7 days 3 hours'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View>
      <ListCard
        leftIcon={icon}
        title="Request"
        rightText={request.symbol}
        leftBottomText={request.date}
        rightBottomContent={
          <Text 
            variant="regular" 
            style={[styles.amount, { color: '#FA155A' }]}
          >
            -{Math.abs(request.amount).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        }
      />
      {rightBottomContent}
    </View>
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
  buttonContainer: {
    marginBottom: 8,
  },
  claimButton: {
    backgroundColor: '#3A3A3A',
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 18,
    color: '#FEFEFE',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(113, 113, 113, 0.25)', // 25% opacity
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 18,
    color: 'rgba(113, 113, 113, 0.25)', // 25% opacity
  },
  countdownButtonInRow: {
    flex: 2,
    backgroundColor: 'transparent',
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(113, 113, 113, 0.25)', // 25% opacity
    alignItems: 'center',
  },
  countdownButtonFull: {
    backgroundColor: 'transparent',
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(113, 113, 113, 0.25)', // 25% opacity
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 18,
    color: 'rgba(113, 113, 113, 0.25)', // 25% opacity
  },
});
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { ListCard } from '../common/ListCard';
import { Text } from '../common';
import { RedemptionRequest } from '../../store/redemptionStore';
import { Activity } from '../../store/activityStore';
import { FontSizes } from '../../constants/fonts';
import { useTheme } from '../../theme';

interface RequestCardProps {
  request: RedemptionRequest | Activity;
  canClaim?: boolean;
  canCancel?: boolean;
  isClaimLoading?: boolean;
  daysRemaining?: string; // e.g., "7 days 3 hours"
  onClaim?: () => void;
  onCancel?: () => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ 
  request, 
  canClaim = false,
  canCancel = false,
  isClaimLoading = false,
  daysRemaining,
  onClaim,
  onCancel 
}) => {
  const { colors } = useTheme();
  
  const icon = (
    <View style={[styles.iconContainer, { backgroundColor: colors.icon.container }]}>
      <Icon
        name="remove-circle-outline"
        size={24}
        color={colors.icon.secondary}
      />
    </View>
  );

  const rightBottomContent = (
    <View style={styles.buttonContainer}>
      {canClaim ? (
        <TouchableOpacity 
          style={[
            styles.claimButton, 
            { backgroundColor: colors.button.primary },
            isClaimLoading && { opacity: 0.5 }
          ]}
          onPress={onClaim}
          activeOpacity={0.7}
          disabled={isClaimLoading}
        >
          <Text variant="regular" style={[styles.claimButtonText, { color: colors.button.primaryText }]}>
            {isClaimLoading ? 'Claiming...' : 'Claim'}
          </Text>
        </TouchableOpacity>
      ) : canCancel ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: colors.border.secondary }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text variant="regular" style={[styles.cancelButtonText, { color: colors.text.disabled }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <View style={[styles.countdownButtonInRow, { borderColor: colors.border.secondary }]}>
            <Text variant="regular" style={[styles.countdownText, { color: colors.text.disabled }]}>
              {daysRemaining || '7 days 3 hours'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.countdownButtonFull, { borderColor: colors.border.secondary }]}>
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
        rightText={'vaultSymbol' in request ? request.vaultSymbol : request.symbol}
        leftBottomText={'requestDate' in request ? request.requestDate.toLocaleDateString() : request.date}
        rightBottomContent={
          <Text 
            variant="regular" 
            style={[styles.amount, { color: colors.status.error }]}
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
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 18,
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
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 18,
  },
  countdownButtonInRow: {
    flex: 2,
    backgroundColor: 'transparent',
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderWidth: 1,
    alignItems: 'center',
  },
  countdownButtonFull: {
    backgroundColor: 'transparent',
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderWidth: 1,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 18,
  },
});
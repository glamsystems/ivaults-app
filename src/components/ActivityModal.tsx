import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { Text } from './common';
import { Spacing } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'deposit' | 'cancel' | 'claim' | 'request';
  amount: string;
  symbol: string;
  assetSymbol?: string; // Optional: symbol of the asset being deposited/withdrawn
  autoClose?: boolean;
}

const getActivityIcon = (type: ActivityModalProps['type']): keyof typeof Icon.glyphMap => {
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

const getAmountColor = (type: ActivityModalProps['type'], colors: any): string => {
  switch (type) {
    case 'deposit':
      return colors.status.success;
    case 'cancel':
    case 'request':
      return colors.status.error;
    case 'claim':
      return colors.text.primary;
  }
};

const formatAmount = (type: ActivityModalProps['type'], amount: string): string => {
  const numAmount = parseFloat(amount);
  const formattedAmount = Math.abs(numAmount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
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

export const ActivityModal: React.FC<ActivityModalProps> = ({
  visible,
  onClose,
  type,
  amount,
  symbol,
  assetSymbol,
  autoClose = true,
}) => {
  const { colors } = useTheme();
  const [slideAnim] = useState(new Animated.Value(-100));
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleClose = useCallback(() => {
    // Slide out to top
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose, slideAnim, fadeAnim]);

  useEffect(() => {
    if (visible) {
      // Slide in from top
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      if (autoClose) {
        const closeTimer = setTimeout(() => {
          handleClose();
        }, 3000);
        return () => {
          clearTimeout(closeTimer);
        };
      }
    } else {
      // Reset animations when modal is hidden
      setTimeout(() => {
        slideAnim.setValue(-100);
        fadeAnim.setValue(0);
      }, 0);
    }
  }, [visible, handleClose, autoClose, slideAnim, fadeAnim]);

  // Capitalize first letter of activity type
  const activityTitle = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient
              colors={[colors.background.sheet.start, colors.background.sheet.end]}
              style={styles.gradientContainer}
            >
              <View style={styles.cardContent}>
                {/* Row 1 */}
                <View style={styles.row}>
                  <View style={styles.leftSection}>
                    <View style={[styles.iconContainer]}>
                      <Icon
                        name={getActivityIcon(type)}
                        size={24}
                        color={colors.icon.secondary}
                      />
                    </View>
                    <Text variant="regular" style={[styles.title, { color: colors.text.primary }]}>
                      {activityTitle}
                    </Text>
                  </View>
                  <Text variant="regular" style={[styles.symbol, { color: colors.text.tertiary }]}>
                    {assetSymbol || symbol}
                  </Text>
                </View>
                
                {/* Row 2 */}
                <View style={[styles.row, styles.secondRow]}>
                  <Text variant="regular" style={[styles.timestamp, { color: colors.text.secondary }]}>
                    Just now
                  </Text>
                  <Text 
                    variant="regular" 
                    style={[
                      styles.amount,
                      { color: getAmountColor(type, colors) }
                    ]}
                  >
                    {formatAmount(type, amount)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60, // Position below status bar
  },
  modalContainer: {
    width: SCREEN_WIDTH - (Spacing.page * 2),
    maxWidth: 400,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: Spacing.card.vertical,
    paddingLeft: 19,
    paddingRight: 38,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondRow: {
    marginTop: 4,
    paddingLeft: 44 + 16, // Icon width + margin
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    flexShrink: 1,
  },
  symbol: {
    fontSize: 16,
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 16,
    flex: 1,
  },
  amount: {
    fontSize: 16,
  },
});
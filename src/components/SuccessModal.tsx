import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Clipboard,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text } from './common';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  details?: {
    label: string;
    value: string;
    copyable?: boolean;
  }[];
  autoClose?: boolean;
  type?: 'success' | 'error';
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title,
  message,
  details,
  autoClose = true,
  type = 'success',
}) => {
  const { colors } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      // Simple scale animation for smooth appearance
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();

      if (autoClose) {
        const closeTimer = setTimeout(() => {
          handleClose();
        }, 5000);
        return () => {
          clearTimeout(closeTimer);
        };
      }
    } else {
      // Reset scale when modal is hidden
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleCopy = (value: string, index: number) => {
    Clipboard.setString(value);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const truncateValue = (value: string, maxLength: number = 20) => {
    if (value.length <= maxLength) return value;
    const start = value.slice(0, 6);
    const end = value.slice(-6);
    return `${start}...${end}`;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background.primary,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: type === 'success' ? '#4CAF5020' : '#F4433620',
                },
              ]}
            >
              <Feather
                name={type === 'success' ? 'check' : 'x'}
                size={32}
                color={type === 'success' ? '#4CAF50' : '#F44336'}
              />
            </View>
          </View>

          <Text variant="bold" style={[styles.title, { color: colors.text.primary }]}>
            {title}
          </Text>

          {message && (
            <Text variant="regular" style={[styles.message, { color: colors.text.secondary }]}>
              {message}
            </Text>
          )}

          {details && details.length > 0 && (
            <View style={[styles.detailsContainer, { backgroundColor: colors.background.secondary }]}>
              {details.map((detail, index) => (
                <View key={index} style={styles.detailRow}>
                  <Text variant="regular" style={[styles.detailLabel, { color: colors.text.tertiary }]}>
                    {detail.label}
                  </Text>
                  <View style={styles.detailValueContainer}>
                    <Text
                      variant="regular"
                      style={[styles.detailValue, { color: colors.text.primary }]}
                    >
                      {truncateValue(detail.value)}
                    </Text>
                    {detail.copyable && (
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => handleCopy(detail.value, index)}
                      >
                        <Feather
                          name={copiedIndex === index ? 'check' : 'copy'}
                          size={14}
                          color={copiedIndex === index ? '#4CAF50' : colors.text.tertiary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
            onPress={handleClose}
          >
            <Text variant="bold" style={[styles.closeButtonText, { color: colors.text.primary }]}>
              Close
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    // Enhanced shadow for floating effect
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  closeButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
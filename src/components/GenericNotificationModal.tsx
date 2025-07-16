import React, { useEffect, useState } from 'react';
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

interface GenericNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  message: string;
  autoClose?: boolean;
}

const getNotificationIcon = (type: GenericNotificationModalProps['type']): keyof typeof Icon.glyphMap => {
  switch (type) {
    case 'success':
      return 'checkmark-circle-outline';
    case 'error':
      return 'alert-circle-outline';
  }
};

const getNotificationColor = (type: GenericNotificationModalProps['type'], colors: any): string => {
  switch (type) {
    case 'success':
      return colors.status.success;
    case 'error':
      return colors.status.error;
  }
};

export const GenericNotificationModal: React.FC<GenericNotificationModalProps> = ({
  visible,
  onClose,
  type,
  message,
  autoClose = true,
}) => {
  const { colors } = useTheme();
  const [slideAnim] = useState(new Animated.Value(-100));
  const [fadeAnim] = useState(new Animated.Value(0));

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
      slideAnim.setValue(-100);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
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
  };

  // Capitalize first letter of type
  const notificationTitle = type.charAt(0).toUpperCase() + type.slice(1);

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
                        name={getNotificationIcon(type)}
                        size={24}
                        color={getNotificationColor(type, colors)}
                      />
                    </View>
                    <Text variant="regular" style={[styles.title, { color: colors.text.primary }]}>
                      {notificationTitle}
                    </Text>
                  </View>
                </View>
                
                {/* Row 2 */}
                <View style={[styles.row, styles.secondRow]}>
                  <Text variant="regular" style={[styles.message, { color: colors.text.secondary }]}>
                    {message}
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
  message: {
    fontSize: 16,
    flex: 1,
  },
});
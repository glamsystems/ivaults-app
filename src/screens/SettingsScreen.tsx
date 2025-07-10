import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text, PageWrapper } from '../components/common';
import { FontSizes, Spacing } from '../constants';

export const SettingsScreen: React.FC = () => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnected(!isConnected);
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const IconButton = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <View style={styles.iconButtonContainer}>
      <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.icon.container }]} onPress={onPress}>
        <Icon name={icon} size={24} color={colors.icon.secondary} />
      </TouchableOpacity>
      <Text variant="regular" style={[styles.iconLabel, { color: colors.text.primary }]}>
        {label}
      </Text>
    </View>
  );

  const ThemeButton = ({ theme, label }: { theme: 'light' | 'dark' | 'system'; label: string }) => (
    <TouchableOpacity
      style={[
        themeMode === theme ? styles.themeButtonActive : styles.themeButtonInactive,
        {
          backgroundColor: themeMode === theme ? colors.button.primary : colors.button.secondary,
          borderColor: themeMode === theme ? colors.button.primary : colors.button.secondaryBorder,
        }
      ]}
      onPress={() => setThemeMode(theme)}
    >
      <Text 
        variant="regular" 
        style={[
          styles.themeButtonText,
          { color: themeMode === theme ? colors.button.primaryText : colors.text.primary }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <PageWrapper>
      <View style={styles.container}>
        {/* Top Section - Links */}
        <View style={styles.topSection}>
          <TouchableOpacity onPress={() => handleLinkPress('https://example.com/terms')}>
            <Text variant="regular" style={[styles.link, { color: colors.text.secondary }]}>
              Terms & Conditions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => handleLinkPress('https://example.com/privacy')}>
            <Text variant="regular" style={[styles.link, { color: colors.text.secondary }]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
          
          <Text mono variant="regular" style={[styles.version, { color: colors.text.tertiary }]}>
            v0.0.10
          </Text>
        </View>

        {/* Middle Section - Icon Buttons */}
        <View style={styles.middleSection}>
          <IconButton
            icon="help-circle-outline"
            label="Contact Support"
            onPress={() => handleLinkPress('mailto:support@ivaults.com')}
          />
          
          <IconButton
            icon="logo-twitter"
            label="Follow @iVaultsxyz"
            onPress={() => handleLinkPress('https://twitter.com/iVaultsxyz')}
          />
          
          <IconButton
            icon="logo-twitter"
            label="Follow @glamsystems"
            onPress={() => handleLinkPress('https://twitter.com/glamsystems')}
          />
        </View>

        {/* Theme Selector */}
        <View style={styles.themeSelector}>
          <ThemeButton theme="light" label="Light" />
          <ThemeButton theme="dark" label="Dark" />
          <ThemeButton theme="system" label="System" />
        </View>

        {/* Connect/Disconnect Section */}
        <View style={styles.connectSection}>
          {!isConnected ? (
            <>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.button.primary, borderColor: colors.button.primary }]}
                onPress={handleConnect}
              >
                <Text variant="regular" style={[styles.buttonText, { color: colors.button.primaryText }]}>
                  Connect
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.buttonOutline, { 
                  borderColor: colors.button.secondaryBorder,
                  backgroundColor: colors.button.secondary 
                }]}
                onPress={handleConnect}
              >
                <Text variant="regular" style={[styles.buttonText, { color: colors.button.secondaryText }]}>
                  Disconnect
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.button.primary, borderColor: colors.button.primary }]}
              >
                <Text variant="regular" style={[styles.buttonText, { color: colors.button.primaryText }]}>
                  0x3c46...ec4b
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 80 : 100,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  link: {
    fontSize: 16,
    marginVertical: 8,
  },
  version: {
    fontSize: 14,
    marginTop: 16,
  },
  middleSection: {
    marginBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  iconButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconLabel: {
    fontSize: 16,
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  themeButtonActive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeButtonInactive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 16,
  },
  connectSection: {
    marginTop: 20,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 19,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: FontSizes.large,
  },
  buttonOutline: {
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 19,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
});
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text, PageWrapper } from '../components/common';

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
      <TouchableOpacity style={styles.iconButton} onPress={onPress}>
        <Icon name={icon} size={24} color="#717171" />
      </TouchableOpacity>
      <Text variant="regular" style={[styles.iconLabel, { color: '#3A3A3A' }]}>
        {label}
      </Text>
    </View>
  );

  const ThemeButton = ({ theme, label }: { theme: 'light' | 'dark' | 'system'; label: string }) => (
    <TouchableOpacity
      style={[
        themeMode === theme ? styles.themeButtonActive : styles.themeButtonInactive
      ]}
      onPress={() => setThemeMode(theme)}
    >
      <Text 
        variant="regular" 
        style={[
          styles.themeButtonText,
          { color: themeMode === theme ? '#FEFEFE' : '#3A3A3A' }
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
            <Text variant="regular" style={[styles.link, { color: '#717171' }]}>
              Terms of Service
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => handleLinkPress('https://example.com/privacy')}>
            <Text variant="regular" style={[styles.link, { color: '#717171' }]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
          
          <Text mono variant="regular" style={[styles.version, { color: '#A8A8A8' }]}>
            v0.0.7
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

        {/* Bottom Section - Connect Button */}
        <View style={styles.bottomSection}>
          {!isConnected ? (
            <>
              <View style={styles.spacer} />
              <TouchableOpacity 
                style={[styles.button]}
                onPress={handleConnect}
              >
                <Text variant="regular" style={[styles.buttonText, { color: '#FEFEFE' }]}>
                  Connect
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.buttonOutline]}
                onPress={handleConnect}
              >
                <Text variant="regular" style={[styles.buttonText, { color: '#717171' }]}>
                  Disconnect
                </Text>
              </TouchableOpacity>
              
              <View style={[styles.button, styles.addressButton]}>
                <Text variant="regular" style={[styles.buttonText, { color: '#FEFEFE' }]}>
                  J8enw...p9vv5
                </Text>
              </View>
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
    marginVertical: 12,
  },
  iconButton: {
    width: 44, // Same height as buttons
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconLabel: {
    fontSize: 18,
  },
  themeSelector: {
    flexDirection: 'row',
    marginBottom: Platform.OS === 'ios' ? 20 : 30,
    gap: 10,
  },
  themeButtonActive: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  themeButtonInactive: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: 'rgba(217, 217, 217, 0.01)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#717171',
  },
  themeButtonText: {
    fontSize: 16,
  },
  bottomSection: {
  },
  button: {
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  buttonOutline: {
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#717171',
    backgroundColor: 'rgba(217, 217, 217, 0.01)',
  },
  buttonText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  addressButton: {
    backgroundColor: '#3A3A3A',
  },
  spacer: {
    height: 48, // Exact button height: 24 (line-height) + 22 (padding) + 2 (border)
    marginVertical: 10, // Same margin as button
  },
});
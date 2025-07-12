import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Clipboard,
  Animated,
} from 'react-native';
import { useTheme } from '../theme';
import { Text } from './common';
import { useConnection } from '../solana/providers/ConnectionProvider';
import { NetworkType } from '../solana/providers/ConnectionProvider';
import { GlamService, GlamVault, GlamServiceResult } from '../services/glamService';
import { DEBUG, DEBUGLOAD } from '@env';

interface GlamVaultsListProps {
  network: NetworkType;
}

// Skeleton Row Component
const SkeletonRow: React.FC<{ colors: any }> = ({ colors }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 0.1], // 2% to 10% opacity
  });

  const SkeletonItem = ({ width, height, style }: any) => (
    <Animated.View 
      style={[
        { 
          width, 
          height, 
          backgroundColor: colors.text.primary,
          borderRadius: 4,
          opacity,
        }, 
        style
      ]} 
    />
  );

  return (
    <View style={[styles.tableRow, { borderColor: colors.background.tertiary }]}>
      {/* Name skeleton */}
      <View style={[styles.tableCell, { flex: 2 }]}>
        <SkeletonItem width="80%" height={16} />
      </View>
      
      {/* Type skeleton */}
      <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
        <SkeletonItem width="60%" height={16} />
      </View>
      
      {/* Inception date skeleton */}
      <View style={[styles.tableCell, { flex: 1, alignItems: 'flex-end' }]}>
        <SkeletonItem width="70%" height={14} />
      </View>
      
      {/* Copy button skeleton */}
      <SkeletonItem width={40} height={24} style={{ marginLeft: 8, borderRadius: 6 }} />
    </View>
  );
};

export const GlamVaultsList: React.FC<GlamVaultsListProps> = ({ network }) => {
  const { colors } = useTheme();
  const { connection } = useConnection();
  const [vaults, setVaults] = useState<GlamVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedVaultId, setCopiedVaultId] = useState<string | null>(null);

  const fetchVaults = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const glamService = new GlamService(connection, network);
      const result = await glamService.fetchVaults();
      
      setVaults(result.vaults);
      setDebugInfo(result.debugInfo);
      
      if (result.error && result.vaults.length === 0) {
        setError(result.error);
      }
    } catch (err) {
      console.error('[GlamVaultsList] Error:', err);
      setError('Failed to fetch vaults');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [connection, network]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyDebugInfo = () => {
    const debugText = debugInfo.join('\n');
    const fullText = error ? `Error: ${error}\n\n${debugText}` : debugText;
    Clipboard.setString(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if we should show skeletons
  const showSkeletons = loading || (DEBUGLOAD === 'true' && DEBUG === 'true');
  
  // Debug log
  console.log('[GlamVaultsList] showSkeletons:', showSkeletons, 'loading:', loading, 'DEBUGLOAD:', DEBUGLOAD, 'DEBUG:', DEBUG);

  if (error && vaults.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="regular" style={[styles.errorText, { color: colors.text.tertiary }]}>
            {error}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => fetchVaults()}
        >
          <Text variant="regular" style={{ color: '#FFFFFF' }}>
            Retry
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchVaults(true)}
          tintColor={colors.text.primary}
        />
      }
    >
      <View style={[styles.table, { borderColor: colors.background.tertiary }]}>
        <View style={[styles.tableHeader, { backgroundColor: colors.background.secondary }]}>
          <Text variant="bold" style={[styles.tableHeaderText, { color: colors.text.primary, flex: 2 }]}>
            Name
          </Text>
          <Text variant="bold" style={[styles.tableHeaderText, { color: colors.text.primary, flex: 1, textAlign: 'center' }]}>
            Type
          </Text>
          <Text variant="bold" style={[styles.tableHeaderText, { color: colors.text.primary, flex: 1, textAlign: 'right' }]}>
            Inception
          </Text>
        </View>
        
        {showSkeletons ? (
          // Show 5 skeleton rows
          Array.from({ length: 5 }).map((_, index) => (
            <SkeletonRow key={`skeleton-${index}`} colors={colors} />
          ))
        ) : vaults.length === 0 ? (
          <View style={[styles.tableRow, { borderColor: colors.background.tertiary }]}>
            <Text 
              variant="regular" 
              style={[styles.emptyText, { color: colors.text.tertiary }]}
            >
              No vaults found on {network}
            </Text>
          </View>
        ) : (
          vaults.map((vault) => (
            <View
              key={vault.pubkey}
              style={[styles.tableRow, { borderColor: colors.background.tertiary }]}
            >
              <Text 
                variant="regular" 
                style={[styles.tableCell, { color: colors.text.primary, flex: 2 }]}
                numberOfLines={1}
              >
                {vault.name}{vault.symbol ? ` (${vault.symbol})` : ''}
              </Text>
              <Text 
                variant="regular" 
                style={[styles.tableCell, { color: colors.text.secondary, flex: 1, textAlign: 'center' }]}
              >
                {vault.productType}
              </Text>
              <Text 
                variant="regular" 
                style={[styles.tableCell, { color: colors.text.tertiary, flex: 1, textAlign: 'right', fontSize: 12 }]}
              >
                {vault.inceptionDate}
              </Text>
              <TouchableOpacity
                style={[styles.copyButton, { 
                  backgroundColor: copiedVaultId === vault.pubkey ? colors.success : colors.primary 
                }]}
                onPress={() => {
                  if (vault.glamStatePubkey) {
                    Clipboard.setString(vault.glamStatePubkey);
                    setCopiedVaultId(vault.pubkey);
                    console.log(`Copied GLAM state: ${vault.glamStatePubkey}`);
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                      setCopiedVaultId(null);
                    }, 2000);
                  }
                }}
              >
                <Text variant="regular" style={{ color: '#FFFFFF', fontSize: 10 }}>
                  {copiedVaultId === vault.pubkey ? '✓' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
      
      {!showSkeletons && (
        <Text variant="regular" style={[styles.countText, { color: colors.text.tertiary }]}>
          {vaults.length} vault{vaults.length !== 1 ? 's' : ''} found
        </Text>
      )}
      
      {/* Debug info hidden for now */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  table: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    paddingRight: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  countText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  debugContainer: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debugTitle: {
    fontSize: 16,
  },
  debugText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
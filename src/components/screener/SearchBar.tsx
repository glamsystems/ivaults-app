import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useVaultStore } from '../../store/vaultStore';

interface SearchBarProps {
  isExpanded: boolean;
  onToggle: () => void;
  width: Animated.Value;
  contentOpacity: Animated.Value;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  isExpanded, 
  onToggle, 
  width,
  contentOpacity 
}) => {
  const { searchQuery, setSearchQuery } = useVaultStore();
  const inputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    if (isExpanded) {
      // Small delay to ensure animation starts before focus
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isExpanded]);

  const handleClose = () => {
    inputRef.current?.blur();
    setSearchQuery('');
    onToggle();
  };

  return (
    <Animated.View style={[styles.container, { width }]}>
      <TouchableOpacity onPress={onToggle} style={styles.iconButton}>
        <Icon 
          name="search" 
          size={20} 
          color="#717171" 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <Animated.View style={[styles.inputContainer, { opacity: contentOpacity }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search vaults..."
            placeholderTextColor="#A8A8A8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={18} color="#717171" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#010101',
    paddingRight: 8,
  },
  closeButton: {
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
  },
});
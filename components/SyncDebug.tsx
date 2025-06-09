import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { debugSyncState, fullSyncTasks, forceSyncTasks } from '../utils/TasksAPI';

const SyncDebug = () => {
  const { theme } = useTheme();

  const handleDebugSync = () => {
    debugSyncState();
    Alert.alert('Debug Info', 'Check the console for sync debug information');
  };

  const handleFullSync = async () => {
    await fullSyncTasks();
    Alert.alert('Full Sync', 'Full sync triggered - check console for details');
  };

  const handleForceSync = () => {
    forceSyncTasks();
    Alert.alert('Force Sync', 'Force sync triggered');
  };

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginVertical: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 8,
      borderRadius: 6,
      marginVertical: 4,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
    debugButton: {
      backgroundColor: theme.colors.warning || '#FFC107',
    },
    fullSyncButton: {
      backgroundColor: theme.colors.success || '#28A745',
    },
    description: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
  });

  // Only show in development
  if (__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔧 Sync Debug Tools</Text>
        <Text style={styles.description}>
          Use these tools to test real-time sync between devices
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.debugButton]} 
          onPress={handleDebugSync}
        >
          <Text style={styles.buttonText}>Debug Sync State</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.fullSyncButton]} 
          onPress={handleFullSync}
        >
          <Text style={styles.buttonText}>Full Sync</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleForceSync}
        >
          <Text style={styles.buttonText}>Force Sync</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

export default SyncDebug; 
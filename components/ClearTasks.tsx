import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { observer } from '@legendapp/state/react';
import { useTheme } from '../context/ThemeContext';
import { getTasks, clearCompletedTasks } from '../utils/SupaLegend';

const ClearTasks = observer(() => {
  const [isClearing, setIsClearing] = useState(false);
  const { theme } = useTheme();

  // Get completed tasks count reactively from Legend State
  const completedTasks = getTasks().filter(task => task.status === 'completed');
  const completedCount = completedTasks.length;

  const handleClearCompleted = async () => {
    if (completedCount === 0) return;

    Alert.alert(
      'Clear Completed Tasks',
      `Are you sure you want to permanently delete ${completedCount} completed task${completedCount === 1 ? '' : 's'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              // Clear all completed tasks using Legend State
              clearCompletedTasks();
              
              Alert.alert('Success', `${completedCount} completed task${completedCount === 1 ? '' : 's'} cleared!`);
            } catch (error) {
              console.error('Error clearing completed tasks:', error);
              Alert.alert('Error', 'Failed to clear completed tasks. Please try again.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  if (completedCount === 0) {
    return null; // Don't show the button if there are no completed tasks
  }

  const styles = StyleSheet.create({
    container: {
      marginTop: 20,
      alignItems: 'center',
    },
    button: {
      backgroundColor: theme.colors.error,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      opacity: isClearing ? 0.6 : 1,
    },
    buttonText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    countText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      marginBottom: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.countText}>
        {completedCount} completed task{completedCount === 1 ? '' : 's'}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleClearCompleted}
        disabled={isClearing}
      >
        <Text style={styles.buttonText}>
          {isClearing ? 'Clearing...' : 'Clear Completed'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

export default ClearTasks; 
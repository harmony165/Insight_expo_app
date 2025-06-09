import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Task, toggleTaskStatus, deleteTask } from '../utils/TasksAPI';

interface TaskItemProps {
  task: Task;
  onTaskChange: () => void;
}

const TaskItem = ({ task, onTaskChange }: TaskItemProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { theme } = useTheme();

  const handleToggle = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await toggleTaskStatus(task.id);
      onTaskChange();
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              onTaskChange();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const isCompleted = task.status === 'completed';

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      marginBottom: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      opacity: isUpdating ? 0.6 : (isCompleted ? 0.7 : 1),
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isCompleted ? '#34C759' : theme.colors.border,
      backgroundColor: isCompleted ? '#34C759' : 'transparent',
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmark: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: 'bold',
    },
    textContainer: {
      flex: 1,
      marginRight: 12,
    },
    taskName: {
      fontSize: 16,
      color: isCompleted ? theme.colors.textSecondary : theme.colors.text,
      textDecorationLine: isCompleted ? 'line-through' : 'none',
    },
    taskDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    deleteButton: {
      padding: 8,
    },
    deleteText: {
      color: theme.colors.error,
      fontSize: 18,
    },
    priorityIndicator: {
      width: 4,
      height: '100%',
      backgroundColor: getPriorityColor(task.priority, theme),
      marginRight: 8,
      borderRadius: 2,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.priorityIndicator} />
      <TouchableOpacity 
        style={styles.checkbox} 
        onPress={handleToggle}
        disabled={isUpdating}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.taskName}>{task.name}</Text>
        {task.description && (
          <Text style={styles.taskDescription}>{task.description}</Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={handleDelete}
      >
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
};

// Helper function to get priority color
function getPriorityColor(priority: number, theme: any): string {
  switch (priority) {
    case 1:
      return theme.colors.error; // High priority - red
    case 2:
      return theme.colors.warning || '#FF9500'; // Medium-high priority - orange
    case 3:
      return theme.colors.primary; // Normal priority - primary color
    case 4:
      return theme.colors.success || '#34C759'; // Low priority - green
    case 5:
      return theme.colors.textSecondary; // Very low priority - gray
    default:
      return theme.colors.primary;
  }
}

export default TaskItem; 
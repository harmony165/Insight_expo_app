import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useTheme } from '../context/ThemeContext';
import { Task, toggleTaskStatus, deleteTask } from '../utils/SupaLegend';

interface SwipeableTaskItemProps {
  task: Task;
  onTaskChange: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRANSLATE_X_THRESHOLD = -100;

const SwipeableTaskItem = ({ task, onTaskChange }: SwipeableTaskItemProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const handleToggle = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      toggleTaskStatus(task.id);
      onTaskChange();
      // Reset position after toggle
      translateX.value = withSpring(0);
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            translateX.value = withSpring(0);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Start delete immediately with optimistic update
            optimisticDelete();
          },
        },
      ]
    );
  };

  const optimisticDelete = () => {
    try {
      // Delete using Legend State (will handle sync automatically)
      deleteTask(task.id);
      
      // Immediate snappy animation (100ms instead of 200ms)
      opacity.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(0.7, { duration: 100 });
      translateX.value = withTiming(-30, { duration: 100 }, () => {
        // Call onTaskChange after animation for immediate UI update
        runOnJS(onTaskChange)();
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task. Please try again.');
      // Reset animations on error
      opacity.value = withSpring(1);
      scale.value = withSpring(1);
      translateX.value = withSpring(0);
    }
  };

  const handleTimer = () => {
    Alert.alert('Timer', 'Timer feature coming soon in the Focus tab!');
    translateX.value = withSpring(0);
  };

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      // No need for hint management
    },
    onActive: (event) => {
      translateX.value = Math.min(0, event.translationX);
    },
    onEnd: (event) => {
      const shouldOpenActions = translateX.value < TRANSLATE_X_THRESHOLD;
      
      if (shouldOpenActions) {
        translateX.value = withSpring(TRANSLATE_X_THRESHOLD);
      } else {
        translateX.value = withSpring(0);
      }
    },
  });

  const rTaskStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
    scale: scale.value,
  }));

  const rActionsStyle = useAnimatedStyle(() => {
    const actionOpacity = interpolate(
      translateX.value,
      [TRANSLATE_X_THRESHOLD, 0],
      [1, 0]
    );
    
    const actionScale = interpolate(
      translateX.value,
      [TRANSLATE_X_THRESHOLD, 0],
      [1, 0.8]
    );

    return {
      opacity: actionOpacity,
      transform: [{ scale: actionScale }],
    };
  });

  const isCompleted = task.status === 'completed';

  const styles = StyleSheet.create({
    container: {
      marginBottom: 8,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    taskContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      minHeight: 70,
      opacity: isUpdating ? 0.6 : (isCompleted ? 0.7 : 1),
    },
    priorityIndicator: {
      width: 4,
      height: 48,
      backgroundColor: getPriorityColor(task.priority, theme),
      marginRight: 12,
      borderRadius: 2,
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 14,
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
      justifyContent: 'center',
    },
    taskName: {
      fontSize: 16,
      fontWeight: '600',
      color: isCompleted ? theme.colors.textSecondary : theme.colors.text,
      textDecorationLine: isCompleted ? 'line-through' : 'none',
      marginBottom: task.description ? 4 : 0,
    },
    taskDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    actionsContainer: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: 16,
      width: Math.abs(TRANSLATE_X_THRESHOLD),
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    timerButton: {
      backgroundColor: theme.colors.primary,
    },
    deleteButton: {
      backgroundColor: theme.colors.error,
    },
    actionIcon: {
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      {/* Actions Container (Hidden behind task) */}
      <Animated.View style={[styles.actionsContainer, rActionsStyle]}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.timerButton]}
          onPress={handleTimer}
        >
          <Text style={styles.actionIcon}>⏱️</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Task Content */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.taskContent, rTaskStyle]}>
          <View style={styles.priorityIndicator} />
          
          <TouchableOpacity 
            style={styles.checkbox} 
            onPress={handleToggle}
            disabled={isUpdating}
          >
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <View style={styles.textContainer}>
            <Text style={styles.taskName} numberOfLines={2}>
              {task.name}
            </Text>
            {task.description && (
              <Text style={styles.taskDescription} numberOfLines={2}>
                {task.description}
              </Text>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Helper function to get priority color
function getPriorityColor(priority: number, theme: any): string {
  switch (priority) {
    case 1:
      return theme.colors.error; // High priority - red
    case 2:
      return '#FF9500'; // Medium-high priority - orange
    case 3:
      return theme.colors.primary; // Normal priority - primary color
    case 4:
      return '#34C759'; // Low priority - green
    case 5:
      return theme.colors.textSecondary; // Very low priority - gray
    default:
      return theme.colors.primary;
  }
}

export default SwipeableTaskItem; 
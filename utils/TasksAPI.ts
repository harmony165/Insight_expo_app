import { Task } from 'react-native';
import { toggleTaskStatus, getTasks } from './SupaLegend';

// Re-export everything from SupaLegend for backwards compatibility
export { 
  type Task,
  addTask,
  toggleTaskStatus,
  deleteTask,
  getTasks,
  clearCompletedTasks,
  initializeUserTasks,
  clearUserTasks,
  debugSyncState,
  fullSyncTasks,
  forceSyncTasks
} from './SupaLegend';

// Backwards compatibility functions
export const toggleTask = toggleTaskStatus;
export const getCompletedTasks = () => getTasks().filter(task => task.status === 'completed');

// Subscription function for backwards compatibility
export const subscribeToTasks = (callback: (tasks: Task[]) => void) => {
  // Since we're using Legend State, we'll return a simple subscription
  return {
    unsubscribe: () => {
      // Legend State handles subscriptions automatically through observables
    }
  };
}; 
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { observable } from '@legendapp/state';
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { configureSynced } from '@legendapp/state/sync';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Task interface for the app (derived from todos table)
export interface Task {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'pending' | 'completed';
  priority: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Create Supabase client with auth configuration
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Provide a function to generate ids locally
const generateId = () => uuidv4();

// Create a configured sync function with proper real-time settings
const customSynced = configureSynced(syncedSupabase, {
  // Use React Native Async Storage for persistence
  persist: {
    plugin: observablePersistAsyncStorage({
      AsyncStorage,
    }),
  },
  generateId,
  supabase,
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',
  fieldDeleted: 'deleted',
  // Sync configuration for real-time updates
  debounceSet: 500, // Wait 500ms before syncing changes
});

// Function to create user-specific todos observable with proper real-time sync
export function createUserTodos$(userId: string) {
  const syncConfig = customSynced({
    supabase,
    collection: 'todos',
    select: (from) =>
      from.select('*')
        .eq('user_id', userId)
        .eq('deleted', false)
        .order('updated_at', { ascending: false }),
    actions: ['read', 'create', 'update', 'delete'],
    realtime: true,
    // Enhanced persistence settings
    persist: {
      name: `todos-${userId}`,
      retrySync: true,
    },
    retry: {
      infinite: true,
    },
    // Transform for consistent data
    transform: {
      // Ensure all todos have required fields
      save: (value: any) => ({
        ...value,
        updated_at: new Date().toISOString(),
        created_at: value.created_at || new Date().toISOString(),
        counter: value.counter || 0,
        deleted: value.deleted || false,
      }),
    },
  });

  // Add error handling for sync
  const observable$ = observable(syncConfig);
  
  // Log sync events for debugging
  if (__DEV__) {
    console.log(`Created todos observable for user: ${userId}`);
  }
  
  return observable$;
}

// Global todos observable - will be set when user authenticates
export let todos$: ReturnType<typeof createUserTodos$> | null = null;
export let currentUserId: string | null = null;

// Initialize todos for a specific user
export async function initializeUserTasks(userId: string) {
  // Clear previous user's data
  if (todos$ && currentUserId !== userId) {
    clearUserTasks();
  }
  
  currentUserId = userId;
  
  if (__DEV__) {
    console.log(`Initializing tasks for user: ${userId}`);
  }
  
  todos$ = createUserTodos$(userId);
  
  // Wait for initial sync to complete
  try {
    // Force an initial sync to ensure we have the latest data
    await new Promise((resolve) => {
      if (todos$) {
        // Wait a bit for the initial sync to complete
        setTimeout(() => {
          if (__DEV__) {
            console.log('Initial sync wait completed');
          }
          resolve(undefined);
        }, 1000);
      } else {
        resolve(undefined);
      }
    });
  } catch (error) {
    console.error('Error during initial sync:', error);
  }
}

// Clear todos when user logs out
export function clearUserTasks() {
  if (__DEV__) {
    console.log('Clearing user tasks');
  }
  todos$ = null;
  currentUserId = null;
}

// Helper function to convert todo to task format
function todoToTask(todo: any): Task {
  return {
    id: todo.id,
    user_id: todo.user_id,
    name: todo.text || '',
    description: undefined,
    status: todo.done ? 'completed' : 'pending',
    priority: 3,
    created_at: todo.created_at || new Date().toISOString(),
    updated_at: todo.updated_at || new Date().toISOString(),
    completed_at: todo.done ? (todo.updated_at || new Date().toISOString()) : undefined,
  };
}

// Task management functions
export async function addTask(name: string, description?: string): Promise<void> {
  const user = await supabase.auth.getUser();
  
  if (!user.data.user) {
    throw new Error('User must be authenticated to add tasks');
  }

  if (!todos$) {
    throw new Error('Tasks not initialized for user');
  }

  const id = generateId();
  const now = new Date().toISOString();

  if (__DEV__) {
    console.log(`Adding task: ${name} for user: ${user.data.user.id}`);
  }

  // Add to todos table with proper sync
  todos$[id].assign({
    id,
    text: name.trim(),
    user_id: user.data.user.id,
    done: false,
    deleted: false,
    created_at: now,
    updated_at: now,
    counter: 0,
  });
}

export function toggleTaskStatus(taskId: string): void {
  if (!todos$) {
    throw new Error('Tasks not initialized for user');
  }

  const todo = todos$[taskId];
  if (todo && todo.get()) {
    const currentDone = todo.done.get();
    const now = new Date().toISOString();
    
    if (__DEV__) {
      console.log(`Toggling task ${taskId}: ${currentDone} -> ${!currentDone}`);
    }
    
    todo.assign({
      done: !currentDone,
      updated_at: now,
    });
  }
}

export function deleteTask(taskId: string): void {
  if (!todos$) {
    throw new Error('Tasks not initialized for user');
  }

  const todo = todos$[taskId];
  if (todo && todo.get()) {
    if (__DEV__) {
      console.log(`Deleting task: ${taskId}`);
    }
    
    todo.assign({
      deleted: true,
      updated_at: new Date().toISOString(),
    });
  }
}

// Get tasks as array (reactive)
export function getTasks(): Task[] {
  if (!todos$) {
    return [];
  }

  const todosData = todos$.get();
  if (!todosData) {
    return [];
  }

  return Object.values(todosData)
    .filter((todo: any) => todo && !todo.deleted)
    .map(todoToTask)
    .sort((a, b) => {
      // Sort by status first (pending first), then by created_at
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

// Clear all completed tasks
export function clearCompletedTasks(): void {
  if (!todos$) {
    return;
  }

  const allTodos = todos$.get() || {};
  const now = new Date().toISOString();
  
  if (__DEV__) {
    console.log('Clearing completed tasks');
  }
  
  Object.entries(allTodos).forEach(([id, todo]: [string, any]) => {
    if (todo && todo.done) {
      todos$![id].assign({
        deleted: true,
        updated_at: now,
      });
    }
  });
}

// Force sync function for testing
export function forceSyncTasks(): void {
  if (todos$) {
    // Legend State will handle the sync automatically
    console.log('Force sync triggered');
  }
}

// Debug functions to help troubleshoot sync issues
export function debugSyncState(): void {
  console.log('=== SYNC DEBUG INFO ===');
  console.log('Current user ID:', currentUserId);
  console.log('Todos observable exists:', !!todos$);
  
  if (todos$) {
    const data = todos$.get();
    console.log('Local todos count:', Object.keys(data || {}).length);
    console.log('Local todos:', Object.values(data || {}));
  }
  
  // Check Supabase connection
  supabase.auth.getUser().then(({ data: { user }, error }) => {
    console.log('Supabase user:', user?.id);
    console.log('Supabase error:', error);
  });
  
  // Test Supabase realtime connection
  console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log('Realtime enabled:', !!supabase.realtime);
}

// Function to manually trigger a full sync
export async function fullSyncTasks(): Promise<void> {
  if (!todos$ || !currentUserId) {
    console.log('Cannot sync: no user or todos observable');
    return;
  }
  
  try {
    console.log('Starting full sync...');
    
    // Fetch latest data from Supabase
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('deleted', false)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Sync error:', error);
      return;
    }
    
    console.log('Fetched from server:', data?.length, 'todos');
    console.log('Server data:', data);
    
    // The Legend State sync should handle this automatically,
    // but this helps us see what's in the database
    
  } catch (error) {
    console.error('Full sync failed:', error);
  }
}

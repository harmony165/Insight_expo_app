import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { observable } from '@legendapp/state';
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { configureSynced } from '@legendapp/state/sync';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Supabase client with auth configuration
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Provide a function to generate ids locally
const generateId = () => uuidv4();

// Create a configured sync function
const customSynced = configureSynced(syncedSupabase, {
  // Use React Native Async Storage
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
  // Optionally enable soft deletes
  fieldDeleted: 'deleted',
});

// Function to create user-specific todos observable
export function createUserTodos$(userId: string) {
  return observable(
    customSynced({
      supabase,
      collection: 'todos',
      select: (from) =>
        from.select('id,counter,text,done,created_at,updated_at,deleted,user_id')
          .eq('user_id', userId),
      actions: ['read', 'create', 'update', 'delete'],
      realtime: true,
      // Persist data and pending changes locally
      persist: {
        name: `todos-${userId}`,
        retrySync: true, // Persist pending changes and retry
      },
      retry: {
        infinite: true, // Retry changes with exponential backoff
      },
    })
  );
}

// Global todos observable - will be set when user authenticates
export let todos$: ReturnType<typeof createUserTodos$> | null = null;

// Initialize todos for a specific user
export function initializeUserTodos(userId: string) {
  todos$ = createUserTodos$(userId);
}

// Clear todos when user logs out
export function clearUserTodos() {
  todos$ = null;
}

export async function addTodo(text: string) {
  const user = await supabase.auth.getUser();
  
  if (!user.data.user) {
    throw new Error('User must be authenticated to add todos');
  }

  if (!todos$) {
    throw new Error('Todos not initialized for user');
  }

  const id = generateId();
  // Add keyed by id to the todos$ observable to trigger a create in Supabase
  todos$[id].assign({
    id,
    text,
    user_id: user.data.user.id,
  });
}

export function toggleDone(id: string) {
  if (!todos$) {
    throw new Error('Todos not initialized for user');
  }
  todos$[id].done.set((prev) => !prev);
}

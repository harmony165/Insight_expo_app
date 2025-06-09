// TypeScript types for the improved database schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      habits: {
        Row: Habit;
        Insert: HabitInsert;
        Update: HabitUpdate;
      };
      habit_completions: {
        Row: HabitCompletion;
        Insert: HabitCompletionInsert;
        Update: HabitCompletionUpdate;
      };
      tasks: {
        Row: Task;
        Insert: TaskInsert;
        Update: TaskUpdate;
      };
      timer_sessions: {
        Row: TimerSession;
        Insert: TimerSessionInsert;
        Update: TimerSessionUpdate;
      };
      habit_collaborators: {
        Row: HabitCollaborator;
        Insert: HabitCollaboratorInsert;
        Update: HabitCollaboratorUpdate;
      };
    };
    Views: {
      habit_streaks: {
        Row: HabitStreak;
      };
    };
  };
}

// Base Types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  id?: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserUpdate {
  email?: string;
  updated_at?: string;
}

// Frequency Configuration Types
export interface FrequencyConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  days_of_week?: number[]; // 0=Sunday, 1=Monday, etc.
  target_count?: number; // How many times per period
  custom_pattern?: string | null;
}

// Habit Types
export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string; // Hex color code
  frequency_config: FrequencyConfig;
  default_timer_duration: number | null; // in seconds
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitInsert {
  id?: string;
  user_id: string;
  name: string;
  description?: string | null;
  color?: string;
  frequency_config?: FrequencyConfig;
  default_timer_duration?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HabitUpdate {
  name?: string;
  description?: string | null;
  color?: string;
  frequency_config?: FrequencyConfig;
  default_timer_duration?: number | null;
  is_active?: boolean;
  updated_at?: string;
}

// Habit Completion Types
export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string; // Date string
  completion_count: number;
  notes: string | null;
  timer_duration: number | null; // actual time spent in seconds
  created_at: string;
}

export interface HabitCompletionInsert {
  id?: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  completion_count?: number;
  notes?: string | null;
  timer_duration?: number | null;
  created_at?: string;
}

export interface HabitCompletionUpdate {
  completion_count?: number;
  notes?: string | null;
  timer_duration?: number | null;
}

// Task Types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 1 | 2 | 3 | 4 | 5; // 1=highest, 5=lowest

export interface Task {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  parent_task_id: string | null;
  linked_habit_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null; // Date string
  completed_at: string | null;
  estimated_duration: number | null; // in seconds
  actual_duration: number | null; // in seconds
  created_at: string;
  updated_at: string;
}

export interface TaskInsert {
  id?: string;
  user_id: string;
  name: string;
  description?: string | null;
  parent_task_id?: string | null;
  linked_habit_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  completed_at?: string | null;
  estimated_duration?: number | null;
  actual_duration?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface TaskUpdate {
  name?: string;
  description?: string | null;
  parent_task_id?: string | null;
  linked_habit_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  completed_at?: string | null;
  estimated_duration?: number | null;
  actual_duration?: number | null;
  updated_at?: string;
}

// Timer Session Types
export type SessionType = 'focus' | 'pomodoro' | 'break';

export interface TimerSession {
  id: string;
  user_id: string;
  habit_id: string | null;
  task_id: string | null;
  planned_duration: number; // in seconds
  actual_duration: number; // in seconds
  started_at: string;
  ended_at: string | null;
  session_type: SessionType;
  notes: string | null;
  interruption_count: number;
  created_at: string;
}

export interface TimerSessionInsert {
  id?: string;
  user_id: string;
  habit_id?: string | null;
  task_id?: string | null;
  planned_duration: number;
  actual_duration: number;
  started_at: string;
  ended_at?: string | null;
  session_type?: SessionType;
  notes?: string | null;
  interruption_count?: number;
  created_at?: string;
}

export interface TimerSessionUpdate {
  planned_duration?: number;
  actual_duration?: number;
  started_at?: string;
  ended_at?: string | null;
  session_type?: SessionType;
  notes?: string | null;
  interruption_count?: number;
}

// Habit Collaborator Types
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';
export type CollaboratorStatus = 'pending' | 'accepted' | 'declined';

export interface HabitCollaborator {
  id: string;
  habit_id: string;
  user_id: string;
  invited_by: string;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  invited_at: string;
  responded_at: string | null;
}

export interface HabitCollaboratorInsert {
  id?: string;
  habit_id: string;
  user_id: string;
  invited_by: string;
  role?: CollaboratorRole;
  status?: CollaboratorStatus;
  invited_at?: string;
  responded_at?: string | null;
}

export interface HabitCollaboratorUpdate {
  role?: CollaboratorRole;
  status?: CollaboratorStatus;
  responded_at?: string | null;
}

// View Types
export interface HabitStreak {
  habit_id: string;
  user_id: string;
  name: string;
  current_streak: number;
  highest_streak: number;
}

// Extended Types with Relations
export interface HabitWithStreaks extends Habit {
  current_streak: number;
  highest_streak: number;
  recent_completions?: HabitCompletion[];
  linked_tasks?: Task[];
}

export interface TaskWithSubtasks extends Task {
  subtasks?: Task[];
  parent_task?: Task | null;
  linked_habit?: Habit | null;
}

export interface TimerSessionWithRelations extends TimerSession {
  habit?: Habit | null;
  task?: Task | null;
}

// Utility Types for API responses
export interface HabitAnalytics {
  habit_id: string;
  total_completions: number;
  completion_rate: number; // percentage
  average_streak: number;
  longest_streak: number;
  total_time_spent: number; // in seconds
  recent_trend: 'up' | 'down' | 'stable';
}

export interface ProductivityStats {
  user_id: string;
  date: string;
  total_sessions: number;
  total_focus_time: number; // in seconds
  average_session_length: number; // in seconds
  habits_completed: number;
  tasks_completed: number;
}

// Query helper types
export interface HabitFilters {
  is_active?: boolean;
  color?: string;
  has_timer?: boolean;
  frequency_type?: FrequencyConfig['type'];
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  has_due_date?: boolean;
  linked_habit_id?: string;
  parent_task_id?: string | null;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

// Export commonly used table types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']; 
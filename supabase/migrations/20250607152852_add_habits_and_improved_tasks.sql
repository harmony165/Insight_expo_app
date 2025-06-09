-- Migration: Add Habits and Improved Tasks Schema
-- This migration preserves existing todos while adding new features

-- =====================================================
-- STEP 1: Create new tables (habits and supporting tables)
-- =====================================================

-- Create habits table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#007AFF', -- Hex color code
  
  -- Frequency Configuration (JSON for flexibility)
  frequency_config JSONB NOT NULL DEFAULT '{
    "type": "daily",
    "days_of_week": [],
    "target_count": 1,
    "custom_pattern": null
  }',
  
  -- Timer Settings
  default_timer_duration INTEGER, -- in seconds
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT habits_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255),
  CONSTRAINT habits_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create habit_completions table
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completion_count INTEGER DEFAULT 1,
  notes TEXT,
  timer_duration INTEGER, -- actual time spent (if timer was used)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate completions for same habit/date
  UNIQUE(habit_id, user_id, completed_date)
);

-- =====================================================
-- STEP 2: Create new tasks table (improved structure)
-- =====================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Hierarchy (for subtasks)
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Optional habit linking
  linked_habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  
  -- Status and completion
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1=highest, 5=lowest
  
  -- Timing
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER, -- in seconds
  actual_duration INTEGER, -- in seconds (tracked via timer)
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT tasks_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
);

-- =====================================================
-- STEP 3: Create timer sessions table
-- =====================================================

CREATE TABLE timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Can be linked to either habit or task
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Session details
  planned_duration INTEGER NOT NULL, -- in seconds
  actual_duration INTEGER NOT NULL, -- in seconds
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Session type
  session_type VARCHAR(20) DEFAULT 'focus' CHECK (session_type IN ('focus', 'pomodoro', 'break')),
  
  -- Notes and interruptions
  notes TEXT,
  interruption_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure either habit_id or task_id is set, but not both
  CONSTRAINT timer_sessions_link_check CHECK (
    (habit_id IS NOT NULL AND task_id IS NULL) OR 
    (habit_id IS NULL AND task_id IS NOT NULL)
  )
);

-- =====================================================
-- STEP 4: Create habit collaborators table (for future)
-- =====================================================

CREATE TABLE habit_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Permission levels
  role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  
  -- Timestamps
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate invitations
  UNIQUE(habit_id, user_id)
);

-- =====================================================
-- STEP 5: Migrate existing todos to new tasks table
-- =====================================================

-- Insert existing todos into the new tasks table
INSERT INTO tasks (
  user_id,
  name,
  description,
  status,
  priority,
  completed_at,
  created_at,
  updated_at
)
SELECT 
  user_id,
  text as name,
  NULL as description,
  CASE 
    WHEN done = true THEN 'completed'
    ELSE 'pending'
  END as status,
  3 as priority, -- default priority
  CASE 
    WHEN done = true THEN updated_at
    ELSE NULL
  END as completed_at,
  created_at,
  updated_at
FROM todos
WHERE deleted = false;

-- =====================================================
-- STEP 6: Create views for computed values
-- =====================================================

-- View for habit streaks (computed, not stored)
CREATE VIEW habit_streaks AS
SELECT 
  h.id as habit_id,
  h.user_id,
  h.name,
  COALESCE(current_streak.streak, 0) as current_streak,
  COALESCE(highest_streak.max_streak, 0) as highest_streak
FROM habits h
LEFT JOIN (
  -- Calculate current streak
  WITH RECURSIVE streak_calc AS (
    -- Base case: most recent completion
    SELECT 
      habit_id,
      completed_date,
      1 as streak
    FROM habit_completions hc1
    WHERE completed_date = (
      SELECT MAX(completed_date) 
      FROM habit_completions hc2 
      WHERE hc2.habit_id = hc1.habit_id
    )
    
    UNION ALL
    
    -- Recursive case: extend streak backwards
    SELECT 
      sc.habit_id,
      hc.completed_date,
      sc.streak + 1
    FROM streak_calc sc
    JOIN habit_completions hc ON hc.habit_id = sc.habit_id
    WHERE hc.completed_date = sc.completed_date - INTERVAL '1 day'
  )
  SELECT habit_id, MAX(streak) as streak
  FROM streak_calc
  GROUP BY habit_id
) current_streak ON h.id = current_streak.habit_id
LEFT JOIN (
  -- Calculate highest streak ever
  SELECT 
    habit_id,
    MAX(consecutive_days) as max_streak
  FROM (
    SELECT 
      habit_id,
      COUNT(*) as consecutive_days
    FROM (
      SELECT 
        habit_id,
        completed_date,
        completed_date - ROW_NUMBER() OVER (PARTITION BY habit_id ORDER BY completed_date) * INTERVAL '1 day' as grp
      FROM habit_completions
    ) grouped
    GROUP BY habit_id, grp
  ) streaks
  GROUP BY habit_id
) highest_streak ON h.id = highest_streak.habit_id;

-- =====================================================
-- STEP 7: Create indexes for performance
-- =====================================================

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_active ON habits(user_id, is_active);
CREATE INDEX idx_habit_completions_habit_date ON habit_completions(habit_id, completed_date);
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completed_date);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_habit ON tasks(linked_habit_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_timer_sessions_user ON timer_sessions(user_id, started_at);

-- =====================================================
-- STEP 8: Create functions for automatic updates
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to new tables
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 9: Set up Row Level Security
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE habits ENABLE row level security;
ALTER TABLE habit_completions ENABLE row level security;
ALTER TABLE tasks ENABLE row level security;
ALTER TABLE timer_sessions ENABLE row level security;
ALTER TABLE habit_collaborators ENABLE row level security;

-- Create policies for habits
CREATE POLICY "Users can create their own habits" ON habits FOR
    INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own habits" ON habits FOR
    SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON habits FOR
    UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON habits FOR
    DELETE USING (auth.uid() = user_id);

-- Create policies for habit_completions
CREATE POLICY "Users can create their own habit completions" ON habit_completions FOR
    INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own habit completions" ON habit_completions FOR
    SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own habit completions" ON habit_completions FOR
    UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habit completions" ON habit_completions FOR
    DELETE USING (auth.uid() = user_id);

-- Create policies for tasks
CREATE POLICY "Users can create their own tasks" ON tasks FOR
    INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own tasks" ON tasks FOR
    SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR
    UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR
    DELETE USING (auth.uid() = user_id);

-- Create policies for timer_sessions
CREATE POLICY "Users can create their own timer sessions" ON timer_sessions FOR
    INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own timer sessions" ON timer_sessions FOR
    SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own timer sessions" ON timer_sessions FOR
    UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own timer sessions" ON timer_sessions FOR
    DELETE USING (auth.uid() = user_id);

-- Create policies for habit_collaborators (more complex - includes shared access)
CREATE POLICY "Users can view habit collaborations they're part of" ON habit_collaborators FOR
    SELECT USING (auth.uid() = user_id OR auth.uid() = invited_by);
CREATE POLICY "Users can invite others to their habits" ON habit_collaborators FOR
    INSERT WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Users can update their collaboration responses" ON habit_collaborators FOR
    UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Habit owners can manage collaborators" ON habit_collaborators FOR
    DELETE USING (auth.uid() = invited_by);

-- =====================================================
-- STEP 10: Enable realtime subscriptions
-- =====================================================

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE habits;
ALTER PUBLICATION supabase_realtime ADD TABLE habit_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE timer_sessions;

-- =====================================================
-- STEP 11: Add comment for future reference
-- =====================================================

COMMENT ON TABLE habits IS 'User habits with flexible frequency patterns and color coding';
COMMENT ON TABLE habit_completions IS 'Daily completions tracking for habits with streak calculation';
COMMENT ON TABLE tasks IS 'Improved tasks table with hierarchy, priorities, and habit linking';
COMMENT ON TABLE timer_sessions IS 'Detailed time tracking sessions for habits and tasks';
COMMENT ON TABLE habit_collaborators IS 'Collaboration system for sharing habits between users';

-- Migration completed successfully!

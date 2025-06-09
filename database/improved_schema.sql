-- Improved Schema for Habits and Tasks System
-- Following database normalization and best practices

-- =====================================================
-- USERS TABLE (assuming you already have this)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HABITS TABLE
-- =====================================================
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  
  -- Indexes
  CONSTRAINT habits_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255),
  CONSTRAINT habits_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- =====================================================
-- HABIT COMPLETIONS TABLE (replaces completed_dates array)
-- =====================================================
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completion_count INTEGER DEFAULT 1, -- for habits that can be done multiple times per day
  notes TEXT,
  timer_duration INTEGER, -- actual time spent (if timer was used)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate completions for same habit/date
  UNIQUE(habit_id, user_id, completed_date)
);

-- =====================================================
-- TASKS TABLE (improved structure)
-- =====================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
-- TIMER SESSIONS TABLE (for detailed time tracking)
-- =====================================================
CREATE TABLE timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
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
-- HABIT COLLABORATORS TABLE (for future sharing feature)
-- =====================================================
CREATE TABLE habit_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id),
  
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
-- VIEWS FOR COMPUTED VALUES
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
-- INDEXES FOR PERFORMANCE
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
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables that need automatic updated_at
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
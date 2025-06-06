-- Add user_id column to todos table (nullable initially)
ALTER TABLE todos ADD COLUMN user_id uuid REFERENCES auth.users;

-- For existing todos: either delete them or assign to a test user
-- Option 1: Delete existing todos (safer for production)
DELETE FROM todos WHERE user_id IS NULL;

-- Option 2: If you want to keep existing todos, uncomment the following line instead:
-- UPDATE todos SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Now make user_id required for new todos
ALTER TABLE todos ALTER COLUMN user_id SET NOT NULL;

-- Enable Row Level Security on todos table
ALTER TABLE todos ENABLE row level security;

-- Create policies for todos
CREATE POLICY "Users can create their own todos" ON todos FOR
    INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own todos" ON todos FOR
    SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON todos FOR
    UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON todos FOR
    DELETE USING (auth.uid() = user_id);

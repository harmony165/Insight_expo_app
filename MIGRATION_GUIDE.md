# 🚀 Database Migration Guide

## Overview
This guide will help you safely migrate your existing Supabase database to the improved schema while preserving all your current todos data.

## ⚠️ **IMPORTANT: Before You Start**

### 1. **Backup Your Database**
```bash
# Export your current data (run in Supabase dashboard SQL editor)
COPY todos TO STDOUT WITH CSV HEADER;
```

### 2. **Test in Development First**
If you have a staging/development environment, test there first.

## 🔄 **Migration Steps**

### **Step 1: Run the Main Migration**

**Option A: Using Supabase CLI (Recommended)**
```bash
# From your project root
cd supabase
npx supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250607152852_add_habits_and_improved_tasks.sql`
4. Run the migration

### **Step 2: Verify Migration Success**

Run these verification queries in your Supabase SQL editor:

```sql
-- 1. Check that all todos were migrated
SELECT 
  (SELECT COUNT(*) FROM todos WHERE deleted = false) as original_todos,
  (SELECT COUNT(*) FROM tasks) as migrated_tasks;

-- 2. Verify sample data looks correct
SELECT 
  t.name,
  t.status,
  t.created_at,
  tod.text as original_text,
  tod.done as original_done
FROM tasks t
JOIN todos tod ON tod.text = t.name
ORDER BY t.created_at DESC
LIMIT 5;

-- 3. Check new tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('habits', 'habit_completions', 'tasks', 'timer_sessions', 'habit_collaborators');
```

### **Step 3: Update Your Application Code**

**Before migrating, your current code uses:**
```typescript
// Old todos structure
interface Todo {
  id: string;
  text: string;
  done: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

**After migration, update to use:**
```typescript
// New tasks structure
import { Tables } from './types/database.types';
type Task = Tables<'tasks'>;

// Your existing TodoApp component will need updates
```

### **Step 4: Update Your Supabase Utilities**

Create a new utilities file for the new schema:

```typescript
// utils/SupabaseNew.ts
import { supabase } from './SupaLegend';
import { Task, TaskInsert, TaskUpdate, Habit, HabitInsert } from '../types/database.types';

// Task operations (replaces todo operations)
export const addTask = async (name: string, description?: string): Promise<Task> => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ name, description })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
};

export const toggleTaskStatus = async (id: string): Promise<void> => {
  // Get current task
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('status')
    .eq('id', id)
    .single();
    
  if (fetchError) throw fetchError;
  
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  const completed_at = newStatus === 'completed' ? new Date().toISOString() : null;
  
  const { error } = await supabase
    .from('tasks')
    .update({ status: newStatus, completed_at })
    .eq('id', id);
    
  if (error) throw error;
};

// Habit operations (new functionality)
export const addHabit = async (habit: HabitInsert): Promise<Habit> => {
  const { data, error } = await supabase
    .from('habits')
    .insert(habit)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getHabits = async (): Promise<Habit[]> => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
};
```

### **Step 5: Gradually Update Components**

**Phase 1: Update TasksScreen to use new schema**
```typescript
// In screens/TasksScreen.tsx
import { getTasks, addTask, toggleTaskStatus } from '../utils/SupabaseNew';
// Update all function calls to use new schema
```

**Phase 2: Keep old todos as backup**
Don't delete the old todos table immediately. Keep it as a backup until you're confident everything works.

**Phase 3: Implement new features**
Start building habit tracking and other new features using the new schema.

## 🔧 **Code Migration Example**

### **Before (Old Todo System):**
```typescript
// components/NewTodo.tsx
const handleSubmitEditing = async ({ nativeEvent: { text } }) => {
  setText('');
  try {
    await addTodo(text); // Old function
  } catch (error) {
    console.error('Error adding todo:', error);
  }
};
```

### **After (New Task System):**
```typescript
// components/NewTodo.tsx
const handleSubmitEditing = async ({ nativeEvent: { text } }) => {
  setText('');
  try {
    await addTask(text); // New function
  } catch (error) {
    console.error('Error adding task:', error);
  }
};
```

## 🧪 **Testing Your Migration**

### **1. Functional Testing**
- [ ] Can create new tasks
- [ ] Can mark tasks as complete
- [ ] Can view all tasks
- [ ] User authentication still works
- [ ] Task data persists after app restart

### **2. Data Integrity Testing**
- [ ] All old todos appear as tasks
- [ ] Completion status preserved
- [ ] Timestamps are correct
- [ ] No data loss occurred

### **3. Performance Testing**
- [ ] App loads quickly
- [ ] Task operations are responsive
- [ ] No database timeout errors

## 🔄 **Rollback Plan (If Needed)**

If something goes wrong, you can rollback:

### **Option 1: Revert to old todos table**
```sql
-- Temporarily switch back to old todos table in your app
-- Update your SupaLegend.ts to use 'todos' table again
```

### **Option 2: Re-run migration**
```bash
# Reset and re-run if needed
npx supabase db reset
npx supabase db push
```

## 🎯 **After Migration is Complete**

### **Phase 1: Cleanup (after 1-2 weeks)**
```sql
-- Archive old todos table
ALTER TABLE todos RENAME TO todos_archived;
```

### **Phase 2: Implement New Features**
- Start building habit tracking UI
- Add timer functionality
- Implement subtasks
- Add priority management

## 📞 **Troubleshooting**

### **Common Issues:**

**1. Migration fails with constraint error**
```sql
-- Check for data issues
SELECT * FROM todos WHERE user_id IS NULL;
```

**2. App can't find tasks**
- Check your API calls are using the new `tasks` table
- Verify Row Level Security policies are correct

**3. Performance issues**
- Check indexes were created correctly
- Monitor database performance in Supabase dashboard

### **Need Help?**
- Check Supabase logs in dashboard
- Test queries manually in SQL editor
- Verify environment variables are correct

## ✅ **Migration Checklist**

- [ ] Backed up existing data
- [ ] Tested migration in development
- [ ] Ran main migration successfully
- [ ] Verified data integrity
- [ ] Updated application code
- [ ] Tested all functionality
- [ ] Performance looks good
- [ ] Ready to build new features!

---

**🎉 Congratulations!** Once this migration is complete, you'll have a robust, scalable database schema ready for advanced habit tracking and productivity features! 
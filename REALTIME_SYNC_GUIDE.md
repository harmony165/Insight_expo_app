# Real-time Sync Testing Guide

## Overview

Your app now has enhanced real-time sync capabilities using Legend State with Supabase. This guide will help you test and troubleshoot sync issues between devices.

## 🔧 Debug Tools Available

In development mode, you'll see a "Sync Debug Tools" section with:

1. **Debug Sync State** - Shows current sync status in console
2. **Full Sync** - Manually fetches latest data from server
3. **Force Sync** - Triggers sync process

## 🧪 Testing Real-time Sync

### Test 1: Same Device Real-time Sync
1. Open app on Device A
2. Add a new task
3. Task should appear immediately
4. Check console for sync messages

### Test 2: Cross-Device Real-time Sync  
1. Login with same user on Device A and Device B
2. On Device A: Add a task called "Test from Device A"
3. On Device B: The task should appear within 1-2 seconds
4. On Device B: Add a task called "Test from Device B"  
5. On Device A: The task should appear within 1-2 seconds

### Test 3: Offline-to-Online Sync
1. On Device A: Turn off internet/wifi
2. Add several tasks while offline
3. Tasks appear immediately in local UI
4. Turn internet back on
5. Tasks should sync to server within 5-10 seconds
6. On Device B: New tasks should appear

### Test 4: Conflict Resolution
1. Go offline on both devices
2. Add different tasks on each device
3. Come back online
4. Both sets of tasks should appear on both devices

## 🛠️ Troubleshooting

### Problem: Tasks don't sync between devices

**Check 1: Supabase Realtime Configuration**
```sql
-- In Supabase SQL Editor, run:
SELECT * FROM information_schema.tables 
WHERE table_name = 'todos';

-- Enable realtime for todos table:
ALTER TABLE todos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
```

**Check 2: User Authentication**
- Ensure both devices are logged in with the same user
- Check console for "Supabase user:" messages
- User IDs should be identical

**Check 3: Network Connectivity**
- Ensure both devices have internet
- Check console for any network errors
- Try the "Full Sync" button

**Check 4: Legend State Configuration**
- Use "Debug Sync State" button
- Check console for observable state
- Verify user_id is correctly set

### Problem: Offline changes don't sync when coming back online

**Solutions:**
1. Use "Force Sync" button after coming online
2. Check console for retry messages
3. Verify `updated_at` timestamps are being set correctly

### Problem: Real-time updates are slow

**Possible Causes:**
1. **Network latency** - Normal for some environments
2. **Supabase plan limits** - Free tier has some restrictions
3. **Debouncing** - Changes are debounced by 500ms

**Solutions:**
1. Check Supabase dashboard for realtime connection status
2. Reduce debounceSet value in SupaLegend.ts (currently 500ms)

## 📊 Console Messages to Look For

### Successful Sync Messages:
```
=== SYNC DEBUG INFO ===
Current user ID: [user-id]
Todos observable exists: true
Local todos count: 3
Supabase user: [user-id]
```

### Error Messages to Watch For:
```
Sync error: [error details]
Cannot sync: no user or todos observable
Tasks not initialized for user
```

## ⚙️ Configuration Details

### Current Sync Settings:
- **Debounce**: 500ms (changes are batched)
- **Retry**: Infinite with exponential backoff
- **Realtime**: Enabled for cross-device sync
- **Persistence**: AsyncStorage for offline storage
- **Change Detection**: Based on `updated_at` timestamps

### Key Files:
- `utils/SupaLegend.ts` - Main sync configuration
- `components/SyncDebug.tsx` - Debug tools
- `screens/TasksScreen.tsx` - Includes debug component

## 🚀 Performance Tips

1. **Minimize unnecessary updates** - Only update `updated_at` when needed
2. **Use soft deletes** - Keeps sync history intact
3. **Batch operations** - Multiple changes are automatically batched
4. **Monitor console** - Use debug tools to verify sync behavior

## 📱 Testing Checklist

- [ ] Login with same user on multiple devices
- [ ] Add task on Device A → appears on Device B
- [ ] Delete task on Device B → disappears on Device A  
- [ ] Toggle completion on Device A → updates on Device B
- [ ] Go offline → add tasks → come online → sync works
- [ ] Check debug console for sync messages
- [ ] Test with poor network conditions
- [ ] Verify tasks persist after app restart

---

**Need more help?** Use the debug tools and check the console messages. The sync system is designed to be robust and self-healing. 
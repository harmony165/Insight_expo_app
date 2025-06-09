# React Native Reanimated Features Guide

This guide explains how to implement advanced task management features using React Native Reanimated 3.x.

## ✅ Implemented: Swipe-to-Delete

The `SwipeableTaskItem` component demonstrates:

### Key Concepts Used:
- **`useSharedValue`**: Stores animation values on the UI thread
- **`useAnimatedGestureHandler`**: Handles pan gestures efficiently
- **`useAnimatedStyle`**: Creates animated styles that update on UI thread
- **`interpolate`**: Maps input ranges to output ranges for smooth animations
- **`withSpring`**: Provides natural spring animations

### How It Works:
```typescript
const translateX = useSharedValue(0);

const panGesture = useAnimatedGestureHandler({
  onActive: (event) => {
    translateX.value = Math.min(0, event.translationX); // Only allow left swipe
  },
  onEnd: () => {
    if (translateX.value < THRESHOLD) {
      translateX.value = withSpring(THRESHOLD); // Keep revealed
    } else {
      translateX.value = withSpring(0); // Spring back
    }
  },
});
```

## 🔄 Drag-to-Reorder Implementation

### 1. Basic Drag Implementation

```typescript
// DraggableTaskItem.tsx
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const DraggableTaskItem = ({ task, index, onReorder }) => {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const originalIndex = useSharedValue(index);

  const panGesture = useAnimatedGestureHandler({
    onStart: () => {
      isDragging.value = true;
      // Add haptic feedback
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    },
    onActive: (event) => {
      translateY.value = event.translationY;
      
      // Calculate which position we're hovering over
      const newIndex = Math.round(event.absoluteY / ITEM_HEIGHT);
      
      if (newIndex !== originalIndex.value && newIndex >= 0) {
        runOnJS(onReorder)(originalIndex.value, newIndex);
        originalIndex.value = newIndex;
      }
    },
    onEnd: () => {
      isDragging.value = false;
      translateY.value = withSpring(0);
    },
  });

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      zIndex: isDragging.value ? 999 : 1,
      elevation: isDragging.value ? 5 : 1,
      opacity: isDragging.value ? 0.9 : 1,
    };
  });

  return (
    <PanGestureHandler onGestureEvent={panGesture}>
      <Animated.View style={[styles.taskItem, rStyle]}>
        {/* Task content */}
      </Animated.View>
    </PanGestureHandler>
  );
};
```

### 2. Advanced Drag with Long Press

```typescript
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';

const LongPressDraggableTask = ({ task, onDragStart, onDragEnd }) => {
  const scale = useSharedValue(1);
  
  const longPressHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(1.05);
      runOnJS(onDragStart)(task.id);
    },
    onEnd: () => {
      scale.value = withSpring(1);
      runOnJS(onDragEnd)();
    },
  });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <LongPressGestureHandler
      onGestureEvent={longPressHandler}
      minDurationMs={500}
    >
      <Animated.View style={[styles.container, rStyle]}>
        {/* Content */}
      </Animated.View>
    </LongPressGestureHandler>
  );
};
```

## 🎯 Task Nesting Implementation

### 1. Hierarchical Data Structure

```typescript
interface NestedTask extends Task {
  children?: NestedTask[];
  depth: number;
  isExpanded?: boolean;
}

const TaskNestingManager = {
  // Check if drop position creates valid nesting
  canNestTask: (draggedTask: Task, targetTask: Task) => {
    return draggedTask.id !== targetTask.id && 
           !isDescendant(targetTask, draggedTask);
  },

  // Create parent-child relationship
  nestTask: (childId: string, parentId: string) => {
    return updateTask(childId, { parent_task_id: parentId });
  },

  // Remove from parent
  unnestTask: (taskId: string) => {
    return updateTask(taskId, { parent_task_id: null });
  },
};
```

### 2. Visual Nesting with Animations

```typescript
const NestedTaskView = ({ task, depth = 0 }) => {
  const indentAnimation = useSharedValue(depth * 20);
  const expandAnimation = useSharedValue(task.isExpanded ? 1 : 0);

  const rIndentStyle = useAnimatedStyle(() => ({
    marginLeft: withSpring(indentAnimation.value),
  }));

  const rExpandStyle = useAnimatedStyle(() => ({
    height: withSpring(expandAnimation.value * 100), // Adjust based on content
    opacity: expandAnimation.value,
  }));

  return (
    <Animated.View style={rIndentStyle}>
      <TaskItem task={task} />
      {task.children && (
        <Animated.View style={rExpandStyle}>
          {task.children.map(child => (
            <NestedTaskView 
              key={child.id} 
              task={child} 
              depth={depth + 1} 
            />
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
};
```

### 3. Drop Zones for Nesting

```typescript
const DroppableTaskArea = ({ task, onDrop }) => {
  const dropZoneScale = useSharedValue(1);
  const isHovering = useSharedValue(false);

  const rDropZoneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dropZoneScale.value }],
    backgroundColor: interpolateColor(
      isHovering.value ? 1 : 0,
      [0, 1],
      ['transparent', 'rgba(0, 122, 255, 0.1)']
    ),
  }));

  return (
    <Animated.View 
      style={[styles.dropZone, rDropZoneStyle]}
      onLayout={(event) => {
        // Handle drop detection logic
      }}
    >
      <TaskItem task={task} />
      <View style={styles.nestingIndicator}>
        <Text>↳ Drop here to nest</Text>
      </View>
    </Animated.View>
  );
};
```

## ⏱️ Timer Integration for Focus Feature

### 1. Timer Button with Animations

```typescript
const TimerButton = ({ task, onStartTimer }) => {
  const rotation = useSharedValue(0);
  const isTimerActive = useSharedValue(false);

  useEffect(() => {
    // Rotate continuously when timer is active
    if (isTimerActive.value) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1, // Infinite repeat
        false
      );
    } else {
      rotation.value = withSpring(0);
    }
  }, [isTimerActive.value]);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <TouchableOpacity onPress={() => onStartTimer(task)}>
      <Animated.View style={rStyle}>
        <Text style={styles.timerIcon}>⏱️</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};
```

### 2. Focus Mode Integration

```typescript
const FocusIntegration = {
  // Navigate to Focus tab with task
  startTaskTimer: (task: Task) => {
    // Store active task in global state
    TaskTimerStore.setActiveTask(task);
    
    // Navigate to Focus tab
    NavigationService.navigate('Focus', { taskId: task.id });
  },

  // Update task time tracking
  updateTaskTime: (taskId: string, timeSpent: number) => {
    const duration = formatDuration(timeSpent);
    return updateTask(taskId, { 
      actual_duration: duration 
    });
  },
};
```

## 🎨 Advanced Animation Patterns

### 1. Layout Animations

```typescript
import { Layout, FadeIn, FadeOut } from 'react-native-reanimated';

const AnimatedTaskList = ({ tasks }) => {
  return (
    <FlatList
      data={tasks}
      renderItem={({ item }) => (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={Layout.springify()}
        >
          <TaskItem task={item} />
        </Animated.View>
      )}
    />
  );
};
```

### 2. Shared Element Transitions

```typescript
import { SharedTransition } from 'react-native-reanimated';

const TaskDetailTransition = () => {
  return (
    <SharedTransition>
      <Animated.View sharedTransitionTag="task-detail">
        {/* Task detail content */}
      </Animated.View>
    </SharedTransition>
  );
};
```

### 3. Complex Gesture Combinations

```typescript
const MultiGestureTask = ({ task }) => {
  const simultaneousGestures = useMemo(() => [
    longPressRef,
    panRef,
    tapRef,
  ], []);

  return (
    <SimultaneousGestureHandler refs={simultaneousGestures}>
      <LongPressGestureHandler ref={longPressRef}>
        <PanGestureHandler ref={panRef}>
          <TapGestureHandler ref={tapRef}>
            <Animated.View>
              {/* Task content */}
            </Animated.View>
          </TapGestureHandler>
        </PanGestureHandler>
      </LongPressGestureHandler>
    </SimultaneousGestureHandler>
  );
};
```

## 🔧 Implementation Steps

### Phase 1: Enhanced Swipe Actions
1. ✅ Swipe-to-delete implemented
2. Add swipe-to-complete (right swipe)
3. Add multiple action buttons (edit, priority, etc.)

### Phase 2: Drag and Drop
1. Implement basic drag-to-reorder
2. Add visual feedback during drag
3. Add haptic feedback
4. Implement drop zones

### Phase 3: Task Nesting
1. Update database schema for hierarchy
2. Implement tree-view rendering
3. Add drag-to-nest functionality
4. Add expand/collapse animations

### Phase 4: Focus Integration
1. Add timer button to tasks
2. Integrate with Focus tab
3. Track time spent on tasks
4. Add visual timer indicators

## 📱 Performance Considerations

### 1. Use UI Thread Operations
```typescript
// Good: Runs on UI thread
const animatedStyle = useAnimatedStyle(() => {
  return {
    transform: [{ translateX: translateX.value }],
  };
});

// Avoid: Frequent runOnJS calls
```

### 2. Optimize List Rendering
```typescript
// Use FlatList with proper optimization
<FlatList
  data={tasks}
  keyExtractor={item => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
/>
```

### 3. Memory Management
```typescript
// Clean up animations on unmount
useEffect(() => {
  return () => {
    cancelAnimation(translateX);
    cancelAnimation(opacity);
  };
}, []);
```

## 🎯 Next Steps

1. **Test the current swipe implementation** - Try swiping left on tasks
2. **Choose your next feature** - Drag-to-reorder or task nesting
3. **Set up database changes** - For nesting functionality
4. **Implement gesture handlers** - Following the patterns above

The swipeable delete is now ready to use! Each pattern shown above can be implemented incrementally to build a powerful, animated task management experience. 
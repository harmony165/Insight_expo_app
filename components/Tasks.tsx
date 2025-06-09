import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { observer } from '@legendapp/state/react';
import { useTheme } from '../context/ThemeContext';
import { getTasks } from '../utils/SupaLegend';
import SwipeableTaskItem from './SwipeableTaskItem';
// import SimpleTaskItem from './SimpleTaskItem'; // Fallback component - not needed now

const Tasks = observer(() => {
  const { theme } = useTheme();
  
  // Get tasks reactively from Legend State
  const tasks = getTasks();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
      textAlign: 'center',
    },
  });

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No tasks yet.{'\n'}Add your first task above! ✨
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeableTaskItem 
            task={item} 
            onTaskChange={() => {
              // No need to reload tasks manually - Legend State handles reactivity
            }}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
});

export default Tasks; 
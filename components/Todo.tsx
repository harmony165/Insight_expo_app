import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { toggleTaskStatus, Task } from '../utils/SupaLegend';
import { NOT_DONE_ICON, DONE_ICON } from '../constants/icons';
import { useTheme } from '../context/ThemeContext';

interface TodoProps {
  todo: Task;
}

const Todo = ({ todo }: TodoProps) => {
  const { theme } = useTheme();
  
  const handlePress = () => {
    toggleTaskStatus(todo.id);
  };

  const isCompleted = todo.status === 'completed';

  const styles = StyleSheet.create({
    todo: {
      borderRadius: 8,
      marginBottom: 16,
      padding: 16,
      backgroundColor: isCompleted ? theme.colors.todoDone : theme.colors.todoNotDone,
    },
    todoText: {
      fontSize: 20,
      color: theme.colors.text,
    },
  });

  return (
    <TouchableOpacity
      key={todo.id}
      onPress={handlePress}
      style={styles.todo}
    >
      <Text style={styles.todoText}>
        {isCompleted ? DONE_ICON : NOT_DONE_ICON} {todo.name}
      </Text>
    </TouchableOpacity>
  );
};

export default Todo; 
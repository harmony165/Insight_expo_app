import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { observer } from '@legendapp/state/react';
import { getTasks, Task } from '../utils/SupaLegend';
import Todo from './Todo';

const Todos = observer(() => {
  // Get the tasks from the state and subscribe to updates
  const tasks = getTasks();
  
  const renderItem = ({ item: task }: { item: Task }) => (
    <Todo todo={task} />
  );
  
  if (tasks.length > 0) {
    return (
      <FlatList
        data={tasks}
        renderItem={renderItem}
        style={styles.todos}
      />
    );
  }

  return <></>;
});

const styles = StyleSheet.create({
  todos: {
    flex: 1,
    marginTop: 16,
  },
});

export default Todos; 
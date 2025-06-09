import React, { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { addTask } from '../utils/SupaLegend';
import { useTheme } from '../context/ThemeContext';

const NewTodo = () => {
  const [text, setText] = useState('');
  const { theme } = useTheme();
  
  const handleSubmitEditing = async ({ nativeEvent: { text } }) => {
    setText('');
    try {
      await addTask(text);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const styles = StyleSheet.create({
    input: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      borderRadius: 8,
      borderWidth: 2,
      flex: 0,
      height: 64,
      marginTop: 16,
      padding: 16,
      fontSize: 20,
    },
  });

  return (
    <TextInput
      value={text}
      onChangeText={(text) => setText(text)}
      onSubmitEditing={handleSubmitEditing}
      placeholder="What do you want to do today?"
      placeholderTextColor={theme.colors.textSecondary}
      style={styles.input}
    />
  );
};

export default NewTodo; 
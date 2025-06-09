import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { observer } from '@legendapp/state/react';
import { useTheme } from '../context/ThemeContext';
import { addTask } from '../utils/SupaLegend';

const NewTask = observer(() => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const handleAddTask = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    setIsLoading(true);
    try {
      await addTask(trimmedText);
      setInputText('');
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      marginBottom: 20,
      alignItems: 'center',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      marginRight: 12,
      fontSize: 16,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      minWidth: 60,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isLoading ? 0.6 : 1,
    },
    addButtonText: {
      color: theme.colors.surface,
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={inputText}
        onChangeText={setInputText}
        placeholder="Add a new task..."
        placeholderTextColor={theme.colors.textSecondary}
        onSubmitEditing={handleAddTask}
        returnKeyType="done"
        editable={!isLoading}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddTask}
        disabled={isLoading || !inputText.trim()}
      >
        <Text style={styles.addButtonText}>
          {isLoading ? '...' : '+'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

export default NewTask; 
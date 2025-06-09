import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ClearTodos = () => {
  const { theme } = useTheme();
  
  const handlePress = () => {
    console.log('delete');
  };

  const styles = StyleSheet.create({
    clearTodos: {
      margin: 16,
      flex: 0,
      textAlign: 'center',
      fontSize: 16,
      color: theme.colors.error,
    },
  });

  return [].length ? (
    <TouchableOpacity onPress={handlePress}>
      <Text style={styles.clearTodos}>Clear all</Text>
    </TouchableOpacity>
  ) : null;
};

export default ClearTodos; 
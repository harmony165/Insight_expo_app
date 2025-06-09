import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <TouchableOpacity 
      onPress={toggleTheme}
      style={[
        styles.toggleButton, 
        { 
          backgroundColor: isDark ? theme.colors.surface : '#FFF3CD',
          borderColor: isDark ? theme.colors.border : '#FFC107'
        }
      ]}
    >
      <Text style={[styles.toggleIcon, { color: isDark ? '#F39C12' : '#FFC107' }]}>
        {isDark ? '🌙' : '☀️'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  toggleIcon: {
    fontSize: 16,
  },
});

export default ThemeToggle; 
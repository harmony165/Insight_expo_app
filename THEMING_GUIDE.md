# 🎨 Theming Guide for Insight App

## Overview
This app implements a comprehensive dark/light mode theming system using React Context. The theme automatically persists user preferences and provides a seamless experience across app restarts.

## 🏗️ Architecture

### Theme Context Structure
```typescript
interface Theme {
  colors: {
    primary: string;        // Main accent color (buttons, links)
    background: string;     // Main app background
    surface: string;        // Card/component backgrounds
    text: string;          // Primary text color
    textSecondary: string; // Secondary text (placeholders, descriptions)
    border: string;        // Border colors
    success: string;       // Success states
    warning: string;       // Warning states
    error: string;         // Error states
    todoDone: string;      // Completed todo background
    todoNotDone: string;   // Pending todo background
    input: string;         // Input field backgrounds
    shadow: string;        // Shadow colors
  };
  isDark: boolean;
}
```

## 🔧 How to Create Theme-Aware Components

### Pattern 1: Basic Component with Theme
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 8,
    },
    text: {
      color: theme.colors.text,
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
};
```

### Pattern 2: Component with Dynamic Styling
```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
}

const ThemedButton = ({ title, variant = 'primary', onPress }: ButtonProps) => {
  const { theme } = useTheme();
  
  const getButtonColor = () => {
    switch (variant) {
      case 'primary': return theme.colors.primary;
      case 'secondary': return theme.colors.surface;
      case 'danger': return theme.colors.error;
      default: return theme.colors.primary;
    }
  };

  const styles = StyleSheet.create({
    button: {
      backgroundColor: getButtonColor(),
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    text: {
      color: variant === 'secondary' ? theme.colors.text : 'white',
      fontWeight: 'bold',
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};
```

## 📱 Best Practices

### ✅ DO:
1. **Always use theme colors**: Never hardcode colors in components
2. **Move styles inside component**: Create styles inside the component to access theme
3. **Use semantic color names**: Use `theme.colors.text` not `theme.colors.black`
4. **Consider both themes**: Test your component in both light and dark modes
5. **Use proper contrast**: Ensure text is readable on backgrounds

### ❌ DON'T:
1. **Don't hardcode colors**: Avoid `color: '#000000'`
2. **Don't create styles outside component**: StyleSheet.create should be inside component
3. **Don't forget placeholders**: Always set `placeholderTextColor` for TextInputs
4. **Don't ignore shadows**: Use theme-appropriate shadow colors

## 🎯 Key Components Updated

### 1. App.tsx
- Wrapped with `ThemeProvider`
- Uses theme colors for background and text

### 2. ThemeToggle.tsx
- Connected to theme context
- Persists theme changes
- Visual feedback for current theme

### 3. All UI Components
- UserInfo, NewTodo, Todo, ClearTodos
- All use theme colors appropriately
- Responsive to theme changes

## 🔄 Theme Persistence

The theme preference is automatically saved to AsyncStorage and restored when the app launches:

```typescript
// Automatic persistence in ThemeContext
const saveThemePreference = async (darkMode: boolean) => {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(darkMode));
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
};
```

## 🎨 Color Scheme

### Light Theme
- Background: Pure white (#ffffff)
- Surface: Light gray (#f5f5f5)
- Primary: iOS blue (#007AFF)
- Text: Black (#000000)

### Dark Theme
- Background: Pure black (#000000)
- Surface: Dark gray (#1C1C1E)
- Primary: Lighter blue (#0A84FF)
- Text: White (#FFFFFF)

## 🧪 Testing Your Components

1. **Toggle Test**: Switch between themes and verify all colors update
2. **Contrast Test**: Ensure text is readable in both themes
3. **Input Test**: Check TextInput placeholder colors
4. **Persistence Test**: Restart app and verify theme persists

## 🚀 Adding New Theme Colors

To add new theme colors:

1. Add to both `lightTheme` and `darkTheme` in `ThemeContext.tsx`
2. Update the `Theme` interface
3. Use in components via `theme.colors.yourNewColor`

Example:
```typescript
// In ThemeContext.tsx
export const lightTheme: Theme = {
  colors: {
    // ... existing colors
    newColor: '#FF6B6B',
  },
  isDark: false,
};

// In your component
const styles = StyleSheet.create({
  element: {
    backgroundColor: theme.colors.newColor,
  },
});
```

## 📋 Checklist for New Components

- [ ] Import `useTheme` hook
- [ ] Move StyleSheet.create inside component
- [ ] Replace all hardcoded colors with theme colors
- [ ] Set placeholderTextColor for TextInputs
- [ ] Test in both light and dark modes
- [ ] Ensure proper contrast ratios

---

**Remember**: Great theming is invisible to users but makes the app feel polished and professional! 🎨✨ 
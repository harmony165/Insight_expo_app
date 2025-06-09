import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from '@legendapp/state/react';
import { Session } from '@supabase/supabase-js';
import Account from './Account';
import UserInfo from './UserInfo';
import ThemeToggle from './ThemeToggle';
import NewTodo from './NewTodo';
import Todos from './Todos';
import ClearTodos from './ClearTodos';
import { useTheme } from '../context/ThemeContext';

interface TodoAppProps {
  session: Session;
}

const TodoApp = observer(({ session }: TodoAppProps) => {
  const [showAccount, setShowAccount] = useState(false);
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      flex: 1,
      color: theme.colors.text,
    },
    backButton: {
      marginBottom: 16,
    },
    backButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
    },
  });
  
  if (showAccount) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity 
            onPress={() => setShowAccount(false)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back to Todos</Text>
          </TouchableOpacity>
          <Account session={session} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemeToggle />
          <Text style={styles.heading}>Insight</Text>
          <UserInfo 
            session={session}
            onProfilePress={() => setShowAccount(true)}
          />
        </View>
        <NewTodo />
        <Todos />
        <ClearTodos />
      </View>
    </SafeAreaView>
  );
});

export default TodoApp; 
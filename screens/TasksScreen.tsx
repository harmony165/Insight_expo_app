import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';
import UserInfo from '../components/UserInfo';
import ThemeToggle from '../components/ThemeToggle';
import NewTask from '../components/NewTask';
import Tasks from '../components/Tasks';
import ClearTasks from '../components/ClearTasks';
import SyncDebug from '../components/SyncDebug';
import Account from '../components/Account';

interface TasksScreenProps {
  session: Session;
}

const TasksScreen = ({ session }: TasksScreenProps) => {
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
      paddingTop: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 4,
      paddingTop: 2,
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
            <Text style={styles.backButtonText}>← Back to Tasks</Text>
          </TouchableOpacity>
          <Account session={session} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemeToggle />
          <Text style={styles.heading}>Tasks</Text>
          <UserInfo 
            session={session}
            onProfilePress={() => setShowAccount(true)}
          />
        </View>
        <NewTask />
        <SyncDebug />
        <Tasks />
        <ClearTasks />
      </View>
    </SafeAreaView>
  );
};

export default TasksScreen; 
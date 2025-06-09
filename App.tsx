import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { observer } from '@legendapp/state/react';
import { supabase } from './utils/SupaLegend';
import { initializeUserTasks, clearUserTasks } from './utils/TasksAPI';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import SimpleTabNavigator from './navigation/SimpleTabNavigator';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Inner App component that uses theme
const AppContent = observer(() => {
  const [session, setSession] = useState<Session | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        initializeUserTasks(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        initializeUserTasks(session.user.id);
      } else {
        clearUserTasks();
      }
    });
  }, []);

  const styles = StyleSheet.create({
    safeAreaProvider: {
      backgroundColor: theme.colors.background,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      color: theme.colors.text,
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={styles.safeAreaProvider}>
        <StatusBar 
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        {session && session.user ? (
          <SimpleTabNavigator session={session} />
        ) : (
          <SafeAreaView style={styles.container}>
            <Text style={styles.heading}>Welcome to Insight</Text>
            <Auth />
          </SafeAreaView>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});

// The main app wrapped with ThemeProvider
const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;

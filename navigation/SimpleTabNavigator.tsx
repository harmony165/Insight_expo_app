import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';
import {
  HabitsScreen,
  TasksScreen,
  FocusScreen,
  CalendarScreen,
  SettingsScreen,
} from '../screens';

interface TabNavigatorProps {
  session: Session;
}

type TabName = 'Habits' | 'Tasks' | 'Focus' | 'Calendar' | 'Settings';

const TabIcons = {
  Habits: '🎯',
  Tasks: '✅',
  Focus: '🎧',
  Calendar: '📅',
  Settings: '⚙️',
};

const SimpleTabNavigator = ({ session }: TabNavigatorProps) => {
  const [activeTab, setActiveTab] = useState<TabName>('Tasks');
  const { theme } = useTheme();

  const renderScreen = () => {
    switch (activeTab) {
      case 'Habits':
        return <HabitsScreen />;
      case 'Tasks':
        return <TasksScreen session={session} />;
      case 'Focus':
        return <FocusScreen />;
      case 'Calendar':
        return <CalendarScreen />;
      case 'Settings':
        return <SettingsScreen session={session} />;
      default:
        return <TasksScreen session={session} />;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      paddingBottom: 8,
      paddingTop: 8,
      height: 88,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabIcon: {
      marginBottom: 4,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
  });

  const renderTabItem = (tabName: TabName) => {
    const isActive = activeTab === tabName;
    
    return (
      <TouchableOpacity
        key={tabName}
        style={styles.tabItem}
        onPress={() => setActiveTab(tabName)}
      >
        <Text style={[
          styles.tabIcon,
          {
            fontSize: isActive ? 24 : 20,
            opacity: isActive ? 1 : 0.7,
          }
        ]}>
          {TabIcons[tabName]}
        </Text>
        <Text style={[
          styles.tabLabel,
          {
            color: isActive ? theme.colors.primary : theme.colors.textSecondary,
          }
        ]}>
          {tabName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <View style={styles.tabBar}>
        {(['Habits', 'Tasks', 'Focus', 'Calendar', 'Settings'] as TabName[]).map(renderTabItem)}
      </View>
    </SafeAreaView>
  );
};

export default SimpleTabNavigator; 
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Session } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';
import {
  HabitsScreen,
  TasksScreen,
  FocusScreen,
  CalendarScreen,
  SettingsScreen,
} from '../screens';

// Tab bar icons (using emojis for simplicity - you can replace with proper icon libraries)
const getTabIcon = (routeName: string, focused: boolean) => {
  const icons = {
    Habits: '🎯',
    Tasks: '✅',
    Focus: '🎧',
    Calendar: '📅',
    Settings: '⚙️',
  };
  
  return (
    <Text style={{ 
      fontSize: focused ? 24 : 20, 
      opacity: focused ? 1 : 0.7 
    }}>
      {icons[routeName as keyof typeof icons]}
    </Text>
  );
};

interface TabNavigatorProps {
  session: Session;
}

const Tab = createBottomTabNavigator();

const TabNavigator = ({ session }: TabNavigatorProps) => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="Tasks"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Habits" 
        component={HabitsScreen} 
        options={{
          tabBarIcon: ({ focused }) => getTabIcon('Habits', focused),
        }}
      />
      <Tab.Screen 
        name="Tasks"
        options={{
          tabBarIcon: ({ focused }) => getTabIcon('Tasks', focused),
        }}
      >
        {() => <TasksScreen session={session} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Focus" 
        component={FocusScreen} 
        options={{
          tabBarIcon: ({ focused }) => getTabIcon('Focus', focused),
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{
          tabBarIcon: ({ focused }) => getTabIcon('Calendar', focused),
        }}
      />
      <Tab.Screen 
        name="Settings"
        options={{
          tabBarIcon: ({ focused }) => getTabIcon('Settings', focused),
        }}
      >
        {() => <SettingsScreen session={session} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default TabNavigator; 
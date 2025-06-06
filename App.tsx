import { useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { observer } from '@legendapp/state/react';
import { addTodo, todos$ as _todos$, toggleDone, supabase } from './utils/SupaLegend';
import { Tables } from './utils/database.types';
import React from 'react';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import Account from './components/Account';

// Emojis to decorate each todo.
const NOT_DONE_ICON = String.fromCodePoint(0x1f7e0);
const DONE_ICON = String.fromCodePoint(0x2705);

// The text input component to add a new todo.
const NewTodo = () => {
  const [text, setText] = useState('');
  const handleSubmitEditing = async ({ nativeEvent: { text } }) => {
    setText('');
    try {
      await addTodo(text);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };
  return (
    <TextInput
      value={text}
      onChangeText={(text) => setText(text)}
      onSubmitEditing={handleSubmitEditing}
      placeholder="What do you want to do today?"
      style={styles.input}
    />
  );
};

// A single todo component, either 'not done' or 'done': press to toggle.
const Todo = ({ todo }: { todo: Tables<'todos'> }) => {
  const handlePress = () => {
    toggleDone(todo.id);
  };
  return (
    <TouchableOpacity
      key={todo.id}
      onPress={handlePress}
      style={[styles.todo, todo.done ? styles.done : null]}
    >
      <Text style={styles.todoText}>
        {todo.done ? DONE_ICON : NOT_DONE_ICON} {todo.text}
      </Text>
    </TouchableOpacity>
  );
};

// A list component to show all the todos.
const Todos = observer(({ todos$ }: { todos$: typeof _todos$ }) => {
  // Get the todos from the state and subscribe to updates
  const todos = todos$.get();
  const renderItem = ({ item: todo }: { item: Tables<'todos'> }) => (
    <Todo todo={todo} />
  );
  if (todos)
    return (
      <FlatList
        data={Object.values(todos)}
        renderItem={renderItem}
        style={styles.todos}
      />
    );

  return <></>;
});

// User info component showing current user and sign out button
const UserInfo = ({ session }: { session: Session }) => {
  const [showAccount, setShowAccount] = useState(false);
  
  if (showAccount) {
    return (
      <View>
        <TouchableOpacity 
          onPress={() => setShowAccount(false)}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back to Todos</Text>
        </TouchableOpacity>
        <Account session={session} />
      </View>
    );
  }

  return (
    <View style={styles.userInfo}>
      <Text style={styles.userEmail}>Welcome, {session.user.email}</Text>
      <TouchableOpacity 
        onPress={() => setShowAccount(true)}
        style={styles.profileButton}
      >
        <Text style={styles.profileButtonText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

// A button component to delete all the todos, only shows when there are some.
const ClearTodos = () => {
  const handlePress = () => {
    console.log('delete');
  };
  return [].length ? (
    <TouchableOpacity onPress={handlePress}>
      <Text style={styles.clearTodos}>Clear all</Text>
    </TouchableOpacity>
  ) : null;
};

// Todo App Component (when authenticated)
const TodoApp = observer(({ session }: { session: Session }) => {
  const [showAccount, setShowAccount] = useState(false);
  
  if (showAccount) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity 
          onPress={() => setShowAccount(false)}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back to Todos</Text>
        </TouchableOpacity>
        <Account session={session} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Insight</Text>
      <View style={styles.userInfo}>
        <Text style={styles.userEmail}>Welcome, {session.user.email}</Text>
        <TouchableOpacity 
          onPress={() => setShowAccount(true)}
          style={styles.profileButton}
        >
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>
      <NewTodo />
      <Todos todos$={_todos$} />
      <ClearTodos />
    </SafeAreaView>
  );
});

// The main app.
const App = observer(() => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <SafeAreaProvider>
      {session && session.user ? (
        <TodoApp session={session} />
      ) : (
        <SafeAreaView style={styles.container}>
          <Text style={styles.heading}>Welcome to Insight</Text>
          <Auth />
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
});

// Styles for the app.
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    margin: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  profileButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  profileButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  input: {
    borderColor: '#999',
    borderRadius: 8,
    borderWidth: 2,
    flex: 0,
    height: 64,
    marginTop: 16,
    padding: 16,
    fontSize: 20,
  },
  todos: {
    flex: 1,
    marginTop: 16,
  },
  todo: {
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#ffd',
  },
  done: {
    backgroundColor: '#dfd',
  },
  todoText: {
    fontSize: 20,
  },
  clearTodos: {
    margin: 16,
    flex: 0,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default App;

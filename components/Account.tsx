import { useState, useEffect } from 'react';
import { supabase } from '../utils/SupaLegend';
import { StyleSheet, View, Alert, Text, TextInput, TouchableOpacity } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';

interface Props {
  session: Session;
}

export default function Account({ session }: Props) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username || '');
        setWebsite(data.website || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string;
    website: string;
    avatar_url: string;
  }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const styles = StyleSheet.create({
    container: {
      marginTop: 40,
      padding: 12,
      backgroundColor: theme.colors.background,
    },
    verticallySpaced: {
      paddingTop: 4,
      paddingBottom: 4,
      alignSelf: 'stretch',
    },
    mt20: {
      marginTop: 20,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 8,
      fontWeight: '500',
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    inputDisabled: {
      backgroundColor: theme.colors.border,
      color: theme.colors.textSecondary,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    buttonSecondary: {
      backgroundColor: theme.colors.error,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.textSecondary,
      opacity: 0.6,
    },
    buttonText: {
      color: theme.colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonTextDisabled: {
      color: theme.colors.background,
      opacity: 0.8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>📧 Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={session?.user?.email}
            editable={false}
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
      </View>
      <View style={styles.verticallySpaced}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>👤 Username</Text>
          <TextInput
            style={styles.input}
            value={username || ''}
            onChangeText={(text) => setUsername(text)}
            placeholder="Enter username"
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize={'none'}
          />
        </View>
      </View>
      <View style={styles.verticallySpaced}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>🌐 Website</Text>
          <TextInput
            style={styles.input}
            value={website || ''}
            onChangeText={(text) => setWebsite(text)}
            placeholder="https://yourwebsite.com"
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize={'none'}
            keyboardType="url"
          />
        </View>
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => updateProfile({ username, website, avatar_url: avatarUrl })}
          disabled={loading}
        >
          <Text style={[styles.buttonText, loading && styles.buttonTextDisabled]}>
            {loading ? 'Loading ...' : 'Update'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.verticallySpaced}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]} 
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';

interface UserInfoProps {
  session: Session;
  onProfilePress: () => void;
}

const UserInfo = ({ session, onProfilePress }: UserInfoProps) => {
  const { theme } = useTheme();
  
  // Get user's initials for the profile icon
  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const styles = StyleSheet.create({
    profileButton: {
      width: 40,
      height: 40,
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileIcon: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <TouchableOpacity 
      onPress={onProfilePress}
      style={styles.profileButton}
    >
      <Text style={styles.profileIcon}>
        {getInitials(session.user.email || 'U')}
      </Text>
    </TouchableOpacity>
  );
};

export default UserInfo; 
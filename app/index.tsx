import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { colors } from '../src/constants/theme';

export default function SplashScreen() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        if (user.role === 'teacher' || user.role === 'admin') {
          router.replace('/(teacher)');
        } else if (user.role === 'parent') {
          router.replace('/(parent)/' as any);
        } else {
          router.replace('/(student)');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>M</Text>
      </View>
      <Text style={styles.title}>Mathpia</Text>
      <Text style={styles.subtitle}>수학을 더 쉽게</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.primary,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.surface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.surface,
    opacity: 0.9,
  },
});

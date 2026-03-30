import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors, getThemeColors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@govassist_onboarded';

function RootNavigator() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const t = getThemeColors(isDark);
  const segments = useSegments();
  const router   = useRouter();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  // Re-check onboarding status every time segments change (i.e. after navigation)
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setOnboarded(val === 'true');
    });
  }, [segments]);

  useEffect(() => {
    if (loading || onboarded === null) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const inOnboarding = (segments[0] as string) === 'onboarding';

    if (!onboarded && !inOnboarding) {
      router.replace('/onboarding' as any);
    } else if (onboarded && !user && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (user && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)' as any);
    }
  }, [user, loading, segments, onboarded]);

  if (loading || onboarded === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="requests/create"
          options={{
            headerShown: true,
            title: 'New Request',
            headerStyle: { backgroundColor: t.card },
            headerTintColor: t.text,
            headerTitleStyle: { color: t.text },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="requests/[id]"
          options={{
            headerShown: true,
            title: 'Request Details',
            headerStyle: { backgroundColor: t.card },
            headerTintColor: t.text,
            headerTitleStyle: { color: t.text },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="messages/[userId]"
          options={{
            headerShown: true,
            title: 'Conversation',
            headerStyle: { backgroundColor: t.card },
            headerTintColor: t.text,
            headerTitleStyle: { color: t.text },
            headerShadowVisible: false,
          }}
        />
      </Stack>
      <StatusBar style={t.statusBar} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

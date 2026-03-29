import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.darkBg }}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="requests/create"
          options={{ headerShown: true, title: 'New Request', headerStyle: { backgroundColor: Colors.darkCard }, headerTintColor: Colors.textPrimary, headerTitleStyle: { color: Colors.textPrimary } }}
        />
        <Stack.Screen
          name="requests/[id]"
          options={{ headerShown: true, title: 'Request Details', headerStyle: { backgroundColor: Colors.darkCard }, headerTintColor: Colors.textPrimary, headerTitleStyle: { color: Colors.textPrimary } }}
        />
        <Stack.Screen
          name="messages/[userId]"
          options={{ headerShown: true, title: 'Conversation', headerStyle: { backgroundColor: Colors.darkCard }, headerTintColor: Colors.textPrimary, headerTitleStyle: { color: Colors.textPrimary } }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

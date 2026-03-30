import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const { token } = await authApi.login(email.trim(), password);
      await AsyncStorage.setItem('@govassist_token', token);
      const user      = await authApi.getUser();

      if (user.role !== 'citizen') {
        setError('This app is for citizens only. Please use the web portal.');
        return;
      }

      await login(token, user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons name="shield-checkmark" size={36} color="#fff" />
          </View>
          <Text style={styles.brandTitle}>Welcome Back</Text>
          <Text style={styles.brandSubtitle}>Sign in to your GovAssist account</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.errorText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <Ionicons name="mail" size={12} color={Colors.orange} />  Email Address
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <Ionicons name="lock-closed" size={12} color={Colors.orange} />  Password
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithToggle]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login button */}
          <TouchableOpacity style={styles.btnLogin} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnLoginText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.btnRegister}>
                <Ionicons name="person-add" size={16} color={Colors.orange} />
                <Text style={styles.btnRegisterText}>Create an account</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.orange} />
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.darkBg },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },

  brand: { alignItems: 'center', marginBottom: 32 },
  brandIcon: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.orange,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  brandTitle: {
    fontSize: 28, fontWeight: '800',
    color: Colors.textPrimary, marginBottom: 6,
  },
  brandSubtitle: { fontSize: 14, color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.darkCard, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorBg, borderWidth: 1, borderColor: Colors.errorText,
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: Colors.errorText, fontSize: 13, flex: 1 },

  formGroup: { marginBottom: 18 },
  label: { color: Colors.textSecondary, fontWeight: '600', fontSize: 12, marginBottom: 8 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 14,
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1, color: Colors.textPrimary, fontSize: 15,
    paddingVertical: 14, paddingHorizontal: 10,
  },
  inputWithToggle: { paddingRight: 0 },
  eyeBtn: { padding: 14 },

  btnLogin: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16,
    marginTop: 4,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  btnLoginText: { color: '#fff', fontWeight: '700', fontSize: 17 },

  registerSection: {
    alignItems: 'center', marginTop: 24, paddingTop: 24,
    borderTopWidth: 1, borderTopColor: Colors.darkBorder,
  },
  registerText: { color: Colors.textSecondary, marginBottom: 10, fontSize: 13 },
  btnRegister: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.orangeLight, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10,
  },
  btnRegisterText: { color: Colors.orange, fontWeight: '600', fontSize: 14 },
});

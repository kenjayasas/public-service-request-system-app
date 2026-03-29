import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Link } from 'expo-router';
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
            <Ionicons name="settings" size={40} color="#fff" />
          </View>
          <Text style={styles.brandTitle}>Welcome Back!</Text>
          <Text style={styles.brandSubtitle}>Sign in to access your account</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.errorText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <Ionicons name="mail" size={14} color={Colors.orange} /> Email Address
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textSecondary}
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
              <Ionicons name="lock-closed" size={14} color={Colors.orange} /> Password
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithToggle]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textSecondary}
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
          <TouchableOpacity style={styles.btnLogin} onPress={handleLogin} disabled={loading}>
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
            <Text style={styles.registerText}>Don`t have an account?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.btnRegister}>
                <Ionicons name="person-add" size={16} color={Colors.orange} />
                <Text style={styles.btnRegisterText}>Create an account</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.orange} />
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <Text style={styles.footer}>© {new Date().getFullYear()} GovAssist. All rights reserved.</Text>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.orange,
    marginBottom: 6,
  },
  brandSubtitle: { fontSize: 15, color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.darkCard,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorText,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.errorText, fontSize: 14, flex: 1 },

  formGroup: { marginBottom: 20 },
  label: { color: Colors.textPrimary, fontWeight: '500', fontSize: 14, marginBottom: 8 },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  inputWithToggle: { paddingRight: 0 },
  eyeBtn: { padding: 14 },

  btnLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnLoginText: { color: '#fff', fontWeight: '700', fontSize: 17 },

  registerSection: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.darkBorder,
  },
  registerText: { color: Colors.textSecondary, marginBottom: 10 },
  btnRegister: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.orangeLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  btnRegisterText: { color: Colors.orange, fontWeight: '600', fontSize: 15 },

  footer: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 24,
  },
});

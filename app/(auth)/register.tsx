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

export default function RegisterScreen() {
  const { login } = useAuth();

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleRegister = async () => {
    setError('');
    setFieldErrors({});

    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const { token } = await authApi.register(name.trim(), email.trim(), password);
      const user      = await authApi.getUser();
      await login(token, user);
    } catch (err: any) {
      if (err.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(err.errors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setFieldErrors(mapped);
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons name="person-add" size={36} color="#fff" />
          </View>
          <Text style={styles.brandTitle}>Create Account</Text>
          <Text style={styles.brandSubtitle}>Join GovAssist as a citizen</Text>
        </View>

        <View style={styles.card}>
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.errorText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={[styles.inputWrapper, !!fieldErrors.name && styles.inputError]}>
              <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            {!!fieldErrors.name && <Text style={styles.fieldError}>{fieldErrors.name}</Text>}
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={[styles.inputWrapper, !!fieldErrors.email && styles.inputError]}>
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
            {!!fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={[styles.inputWrapper, !!fieldErrors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithToggle]}
                placeholder="Minimum 6 characters"
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
            {!!fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}
          </View>

          <TouchableOpacity style={styles.btnRegister} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.btnRegisterText}>Create Account</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.btnLogin}>
                <Ionicons name="log-in" size={16} color={Colors.orange} />
                <Text style={styles.btnLoginText}>Sign In</Text>
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
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },

  brand: { alignItems: 'center', marginBottom: 32 },
  brandIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.orange,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  brandTitle: { fontSize: 28, fontWeight: '700', color: Colors.orange, marginBottom: 6 },
  brandSubtitle: { fontSize: 15, color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.darkCard, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.darkBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorBg, borderWidth: 1, borderColor: Colors.errorText,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: Colors.errorText, fontSize: 14, flex: 1 },

  formGroup: { marginBottom: 20 },
  label: { color: Colors.textPrimary, fontWeight: '500', fontSize: 14, marginBottom: 8 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBg, borderWidth: 2, borderColor: Colors.inputBorder, borderRadius: 12,
  },
  inputError: { borderColor: Colors.errorText },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 16, paddingVertical: 14, paddingHorizontal: 10 },
  inputWithToggle: { paddingRight: 0 },
  eyeBtn: { padding: 14 },
  fieldError: { color: Colors.errorText, fontSize: 12, marginTop: 4 },

  btnRegister: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.orange, borderRadius: 12, paddingVertical: 16,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  btnRegisterText: { color: '#fff', fontWeight: '700', fontSize: 17 },

  loginSection: {
    alignItems: 'center', marginTop: 24, paddingTop: 24,
    borderTopWidth: 1, borderTopColor: Colors.darkBorder,
  },
  loginText: { color: Colors.textSecondary, marginBottom: 10 },
  btnLogin: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.orangeLight, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10,
  },
  btnLoginText: { color: Colors.orange, fontWeight: '600', fontSize: 15 },

  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: 24 },
});

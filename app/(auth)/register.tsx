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
  const [phone, setPhone]         = useState('');
  const [address, setAddress]     = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleRegister = async () => {
    setError('');
    setFieldErrors({});

    if (!name.trim() || !email.trim() || !password || !phone.trim() || !address.trim()) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await authApi.register(
        name.trim(), email.trim(), password, phone.trim(), address.trim()
      );
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
            <Ionicons name="person-add" size={32} color="#fff" />
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
          <InputField
            label="Full Name"
            icon="person-outline"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            error={fieldErrors.name}
            autoCapitalize="words"
          />

          {/* Email */}
          <InputField
            label="Email Address"
            icon="mail-outline"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Phone */}
          <InputField
            label="Phone Number"
            icon="call-outline"
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            error={fieldErrors.phone}
            keyboardType="phone-pad"
          />

          {/* Address */}
          <InputField
            label="Address"
            icon="location-outline"
            placeholder="Street, barangay, city..."
            value={address}
            onChangeText={setAddress}
            error={fieldErrors.address}
          />

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <Ionicons name="lock-closed" size={12} color={Colors.orange} />  Password *
            </Text>
            <View style={[styles.inputWrapper, !!fieldErrors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithToggle]}
                placeholder="Minimum 6 characters"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  label, icon, placeholder, value, onChangeText, error,
  keyboardType, autoCapitalize,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>
        <Ionicons name={icon as any} size={12} color={Colors.orange} />  {label} *
      </Text>
      <View style={[styles.inputWrapper, !!error && styles.inputError]}>
        <Ionicons name={icon} size={18} color={Colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.darkBg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },

  brand: { alignItems: 'center', marginBottom: 28 },
  brandIcon: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: Colors.orange,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  brandTitle: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  brandSubtitle: { fontSize: 14, color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.darkCard, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorBg, borderWidth: 1, borderColor: Colors.errorText,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: Colors.errorText, fontSize: 13, flex: 1 },

  formGroup: { marginBottom: 16 },
  label: { color: Colors.textSecondary, fontWeight: '600', fontSize: 12, marginBottom: 6 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12,
  },
  inputError: { borderColor: Colors.errorText },
  inputIcon: { paddingLeft: 12 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 15, paddingVertical: 12, paddingHorizontal: 10 },
  inputWithToggle: { paddingRight: 0 },
  eyeBtn: { padding: 12 },
  fieldError: { color: Colors.errorText, fontSize: 11, marginTop: 4 },

  btnRegister: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, marginTop: 4,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  btnRegisterText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  loginSection: {
    alignItems: 'center', marginTop: 20, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: Colors.darkBorder,
  },
  loginText: { color: Colors.textSecondary, marginBottom: 10, fontSize: 13 },
  btnLogin: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.orangeLight, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10,
  },
  btnLoginText: { color: Colors.orange, fontWeight: '600', fontSize: 14 },
});

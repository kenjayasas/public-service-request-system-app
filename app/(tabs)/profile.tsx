import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();

  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [name, setName]         = useState(user?.name ?? '');
  const [phone, setPhone]       = useState(user?.phone ?? '');
  const [address, setAddress]   = useState(user?.address ?? '');
  const [error, setError]       = useState('');

  const initials = (user?.name ?? '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await authApi.updateProfile({ name, phone, address });
      await updateUser(updated);
      setEditing(false);
    } catch (e: any) {
      setError(e.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const cancelEdit = () => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setAddress(user?.address ?? '');
    setError('');
    setEditing(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {!editing && (
          <>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
            </View>
          </>
        )}
      </View>

      {/* Error */}
      {error !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Profile Info / Edit Form */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Profile Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="pencil" size={18} color={Colors.orange} />
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={address}
                onChangeText={setAddress}
                placeholder="Your address"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.saveBtnText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <InfoRow icon="person-outline" label="Name"    value={user?.name ?? '—'} />
            <InfoRow icon="mail-outline"   label="Email"   value={user?.email ?? '—'} />
            <InfoRow icon="call-outline"   label="Phone"   value={user?.phone || '—'} />
            <InfoRow icon="location-outline" label="Address" value={user?.address || '—'} />
          </>
        )}
      </View>

      {/* Logout */}
      {!editing && (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.errorText} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon} size={16} color={Colors.textMuted} style={infoStyles.icon} />
      <View>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  icon:  { marginRight: 12, marginTop: 2 },
  label: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  value: { fontSize: 14, color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.darkBg },
  content: { padding: 20, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.orange + '33', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: Colors.orange, fontWeight: '700', fontSize: 26 },
  userName:   { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  userEmail:  { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  roleBadge:  {
    marginTop: 8, backgroundColor: Colors.orange + '22',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  roleText: { color: Colors.orange, fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  errorBox:  { backgroundColor: Colors.errorBg, borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: Colors.errorText, fontSize: 13 },

  card: {
    backgroundColor: Colors.darkCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.darkBorder, marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },

  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: Colors.inputBorder,
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:   {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: Colors.darkSecondary, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn:   { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.orange, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.errorBg, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.errorText + '44',
  },
  logoutText: { color: Colors.errorText, fontWeight: '600', fontSize: 15 },
});

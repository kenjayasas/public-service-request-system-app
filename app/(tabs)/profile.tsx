import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { authApi } from '@/services/api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const t = getThemeColors(isDark);

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
    <ScrollView style={[styles.screen, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: Colors.orange + '20' }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {!editing && (
          <>
            <Text style={[styles.userName, { color: t.text }]}>{user?.name}</Text>
            <Text style={[styles.userEmail, { color: t.textSecondary }]}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
            </View>
          </>
        )}
      </View>

      {error !== '' && (
        <View style={[styles.errorBox, { backgroundColor: Colors.errorBg }]}>
          <Ionicons name="alert-circle" size={16} color={Colors.errorText} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Profile Card */}
      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="person-circle-outline" size={20} color={Colors.orange} />
            <Text style={[styles.cardTitle, { color: t.text }]}>Profile Information</Text>
          </View>
          {!editing && (
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: Colors.orange + '15' }]}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="pencil" size={14} color={Colors.orange} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <EditField label="Name" value={name} onChangeText={setName} placeholder="Full name" t={t} />
            <EditField label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" t={t} />
            <EditField label="Address" value={address} onChangeText={setAddress} placeholder="Your address" multiline t={t} />
            <View style={styles.editActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: t.secondary, borderColor: t.border }]} onPress={cancelEdit}>
                <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.saveBtnText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <InfoRow icon="person-outline" label="Name" value={user?.name ?? '—'} t={t} />
            <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '—'} t={t} />
            <InfoRow icon="call-outline" label="Phone" value={user?.phone || 'Not set'} t={t} />
            <InfoRow icon="location-outline" label="Address" value={user?.address || 'Not set'} t={t} />
          </>
        )}
      </View>

      {/* Settings Card */}
      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="settings-outline" size={20} color={Colors.orange} />
            <Text style={[styles.cardTitle, { color: t.text }]}>Settings</Text>
          </View>
        </View>

        {/* Color Mode Toggle */}
        <View style={[styles.settingRow, { borderBottomColor: t.border }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: isDark ? '#6366f115' : '#f59e0b15' }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={18}
                color={isDark ? '#818cf8' : '#f59e0b'}
              />
            </View>
            <View>
              <Text style={[styles.settingLabel, { color: t.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSub, { color: t.textMuted }]}>
                {isDark ? 'Currently dark theme' : 'Currently light theme'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#cbd5e1', true: Colors.orange + '60' }}
            thumbColor={isDark ? Colors.orange : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Logout */}
      {!editing && (
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: Colors.errorBg, borderColor: Colors.errorText + '30' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.errorText} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.version, { color: t.textMuted }]}>GovAssist v1.0.0</Text>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, t }: { icon: any; label: string; value: string; t: any }) {
  return (
    <View style={[infoStyles.row, { borderBottomColor: t.border }]}>
      <View style={[infoStyles.iconWrap, { backgroundColor: Colors.orange + '10' }]}>
        <Ionicons name={icon} size={16} color={Colors.orange} />
      </View>
      <View style={infoStyles.content}>
        <Text style={[infoStyles.label, { color: t.textMuted }]}>{label}</Text>
        <Text style={[infoStyles.value, { color: t.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function EditField({ label, value, onChangeText, placeholder, keyboardType, multiline, t }: any) {
  return (
    <View style={editStyles.group}>
      <Text style={[editStyles.label, { color: t.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          editStyles.input,
          { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text },
          multiline && editStyles.multiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  label: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '500' },
});

const editStyles = StyleSheet.create({
  group: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, borderWidth: 1,
  },
  multiline: { height: 80, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', paddingBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: Colors.orange, fontWeight: '700', fontSize: 26 },
  userName:   { fontSize: 20, fontWeight: '700' },
  userEmail:  { fontSize: 13, marginTop: 2 },
  roleBadge: {
    marginTop: 8, backgroundColor: Colors.orange + '15',
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  roleText: { color: Colors.orange, fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: Colors.errorText, fontSize: 13 },

  card: {
    borderRadius: 16, padding: 16,
    borderWidth: 1, marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  editBtnText: { color: Colors.orange, fontSize: 12, fontWeight: '600' },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 0,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingSub: { fontSize: 11, marginTop: 1 },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', borderWidth: 1,
  },
  cancelBtnText: { fontWeight: '600' },
  saveBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.orange, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14, borderWidth: 1,
  },
  logoutText: { color: Colors.errorText, fontWeight: '600', fontSize: 15 },

  version: { textAlign: 'center', fontSize: 12, marginTop: 20 },
});

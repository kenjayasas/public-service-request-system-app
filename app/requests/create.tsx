import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { categoryApi, requestApi } from '@/services/api';

export default function CreateRequestScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const t = getThemeColors(isDark);

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [location, setLocation]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  useEffect(() => {
    categoryApi.getAll()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim())       e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!categoryId)         e.category = 'Please select a category';
    if (!location.trim())    e.location = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('category_id', String(categoryId));
      fd.append('location', location.trim());

      await requestApi.create(fd);
      Alert.alert('Success', 'Your request has been submitted.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      if (e.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(e.errors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
        });
        setErrors(mapped);
      } else {
        Alert.alert('Error', e.message ?? 'Submission failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: t.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: t.textSecondary }]}>
          Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: t.inputBg, borderColor: errors.title ? Colors.errorText : t.inputBorder, color: t.text }]}
          value={title}
          onChangeText={txt => { setTitle(txt); setErrors(p => ({ ...p, title: '' })); }}
          placeholder="Brief title of your request"
          placeholderTextColor={t.textMuted}
        />
        {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: t.textSecondary }]}>
          Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textarea, { backgroundColor: t.inputBg, borderColor: errors.description ? Colors.errorText : t.inputBorder, color: t.text }]}
          value={description}
          onChangeText={txt => { setDescription(txt); setErrors(p => ({ ...p, description: '' })); }}
          placeholder="Describe the issue in detail..."
          placeholderTextColor={t.textMuted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
      </View>

      {/* Category */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: t.textSecondary }]}>
          Category <Text style={styles.required}>*</Text>
        </Text>
        {loadingCats ? (
          <ActivityIndicator color={Colors.orange} style={{ marginTop: 8 }} />
        ) : (
          <View style={styles.chipGrid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip,
                  { backgroundColor: t.card, borderColor: t.border },
                  categoryId === cat.id && styles.chipActive,
                ]}
                onPress={() => { setCategoryId(cat.id); setErrors(p => ({ ...p, category: '' })); }}
              >
                <Text style={[styles.chipText, { color: t.textSecondary }, categoryId === cat.id && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
      </View>

      {/* Location */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: t.textSecondary }]}>
          Location <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputRow}>
          <Ionicons name="location-outline" size={16} color={t.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.inputFlex, { backgroundColor: t.inputBg, borderColor: errors.location ? Colors.errorText : t.inputBorder, color: t.text }]}
            value={location}
            onChangeText={txt => { setLocation(txt); setErrors(p => ({ ...p, location: '' })); }}
            placeholder="Street, barangay, city..."
            placeholderTextColor={t.textMuted}
          />
        </View>
        {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
      </View>

      {/* Submit */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
        {submitting
          ? <ActivityIndicator color="#fff" />
          : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitText}>Submit Request</Text>
            </>
          )
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  fieldGroup: { marginBottom: 20 },
  label:     { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  required:  { color: Colors.orange },

  input: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, borderWidth: 1,
  },
  textarea:   { height: 110 },
  inputRow:   { flexDirection: 'row', alignItems: 'center' },
  inputIcon:  { position: 'absolute', left: 14, zIndex: 1 },
  inputFlex:  { flex: 1, paddingLeft: 36 },

  errorText: { color: Colors.errorText, fontSize: 12, marginTop: 4 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  chipActive:     { backgroundColor: Colors.orange, borderColor: Colors.orange },
  chipText:       { fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, marginTop: 8,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

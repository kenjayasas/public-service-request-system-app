import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusColors, StatusLabels, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { requestApi, feedbackApi } from '@/services/api';

const STARS = [1, 2, 3, 4, 5];

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const t = getThemeColors(isDark);

  const [req, setReq]           = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating]             = useState(0);
  const [comment, setComment]           = useState('');
  const [submittingFb, setSubmittingFb] = useState(false);

  useEffect(() => {
    requestApi.getOne(Number(id))
      .then(setReq)
      .catch(() => Alert.alert('Error', 'Could not load request'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Request', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            await requestApi.delete(Number(id));
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Delete failed');
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleFeedbackSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating.');
      return;
    }
    setSubmittingFb(true);
    try {
      await feedbackApi.submit(Number(id), rating, comment || undefined);
      Alert.alert('Thank you!', 'Your feedback has been submitted.', [
        { text: 'OK', onPress: () => {
          setShowFeedback(false);
          requestApi.getOne(Number(id)).then(setReq).catch(() => {});
        }},
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Feedback submission failed');
    } finally {
      setSubmittingFb(false);
    }
  };

  const openMessages = () => {
    const staffId = req?.assigned_staff?.id;
    if (!staffId) {
      Alert.alert('Not assigned', 'This request has no assigned staff yet.');
      return;
    }
    router.push(`/messages/${staffId}?service_request_id=${id}` as any);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  if (!req) return null;

  const canDelete   = req.status === 'pending';
  const canFeedback = req.status === 'completed' && !req.feedback;
  const hasFeedback = !!req.feedback;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      {/* Status Badge */}
      <View style={[styles.statusBanner, { backgroundColor: StatusColors[req.status]?.bg }]}>
        <Ionicons
          name={req.status === 'completed' ? 'checkmark-circle' : req.status === 'pending' ? 'time' : req.status === 'rejected' ? 'close-circle' : 'sync'}
          size={16}
          color={StatusColors[req.status]?.text}
        />
        <Text style={[styles.statusLabel, { color: StatusColors[req.status]?.text }]}>
          {StatusLabels[req.status] ?? req.status}
        </Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: t.text }]}>{req.title}</Text>

      {/* Meta chips */}
      <View style={styles.metaChips}>
        <View style={[styles.metaChip, { backgroundColor: t.card, borderColor: t.border }]}>
          <Ionicons name="folder-outline" size={13} color={Colors.orange} />
          <Text style={[styles.metaChipText, { color: t.textSecondary }]}>{req.category?.name ?? '—'}</Text>
        </View>
        <View style={[styles.metaChip, { backgroundColor: t.card, borderColor: t.border }]}>
          <Ionicons name="location-outline" size={13} color={Colors.orange} />
          <Text style={[styles.metaChipText, { color: t.textSecondary }]}>{req.location}</Text>
        </View>
        <View style={[styles.metaChip, { backgroundColor: t.card, borderColor: t.border }]}>
          <Ionicons name="calendar-outline" size={13} color={Colors.orange} />
          <Text style={[styles.metaChipText, { color: t.textSecondary }]}>
            {new Date(req.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={[styles.section, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>Description</Text>
        <Text style={[styles.description, { color: t.text }]}>{req.description}</Text>
      </View>

      {/* Assigned Staff */}
      {req.assigned_staff && (
        <View style={[styles.section, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>Assigned Staff</Text>
          <View style={styles.staffRow}>
            <View style={[styles.staffAvatar, { backgroundColor: Colors.orange + '20' }]}>
              <Text style={styles.staffAvatarText}>
                {req.assigned_staff.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={[styles.staffName, { color: t.text }]}>{req.assigned_staff.name}</Text>
              <Text style={[styles.staffEmail, { color: t.textMuted }]}>{req.assigned_staff.email}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.msgBtn} onPress={openMessages} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={18} color={Colors.orange} />
          <Text style={styles.msgBtnText}>Message Staff</Text>
        </TouchableOpacity>

        {canDelete && (
          <TouchableOpacity style={[styles.deleteBtn, { borderColor: Colors.errorText + '30' }]} onPress={handleDelete} disabled={deleting}>
            {deleting
              ? <ActivityIndicator size="small" color={Colors.errorText} />
              : <Ionicons name="trash-outline" size={18} color={Colors.errorText} />
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Feedback CTA */}
      {canFeedback && !showFeedback && (
        <TouchableOpacity
          style={[styles.feedbackCta, { borderColor: Colors.orange + '30' }]}
          onPress={() => setShowFeedback(true)}
        >
          <Ionicons name="star-outline" size={18} color={Colors.orange} />
          <Text style={styles.feedbackCtaText}>Rate this service</Text>
        </TouchableOpacity>
      )}

      {canFeedback && showFeedback && (
        <View style={[styles.feedbackCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>Rate this service</Text>
          <View style={styles.starsRow}>
            {STARS.map(s => (
              <TouchableOpacity key={s} onPress={() => setRating(s)} style={styles.starBtn}>
                <Ionicons
                  name={s <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={s <= rating ? '#fbbf24' : t.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.commentInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
            value={comment}
            onChangeText={setComment}
            placeholder="Additional comments (optional)"
            placeholderTextColor={t.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={styles.feedbackActions}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: t.secondary, borderColor: t.border }]}
              onPress={() => setShowFeedback(false)}
            >
              <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleFeedbackSubmit} disabled={submittingFb}>
              {submittingFb
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.submitBtnText}>Submit</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Existing Feedback */}
      {hasFeedback && (
        <View style={[styles.feedbackCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>Your Feedback</Text>
          <View style={styles.starsRow}>
            {STARS.map(s => (
              <Ionicons
                key={s}
                name={s <= req.feedback.rating ? 'star' : 'star-outline'}
                size={24}
                color={s <= req.feedback.rating ? '#fbbf24' : t.textMuted}
              />
            ))}
          </View>
          {req.feedback.comment ? (
            <Text style={[styles.feedbackComment, { color: t.textSecondary }]}>{req.feedback.comment}</Text>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  content:  { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  statusBanner: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16,
  },
  statusLabel: { fontSize: 13, fontWeight: '700' },

  title: { fontSize: 22, fontWeight: '800', marginBottom: 14 },

  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  metaChipText: { fontSize: 12, fontWeight: '500' },

  section: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  description:  { fontSize: 14, lineHeight: 22 },

  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  staffAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  staffAvatarText: { color: Colors.orange, fontWeight: '700', fontSize: 14 },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 15, fontWeight: '600' },
  staffEmail: { fontSize: 12, marginTop: 2 },

  actions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  msgBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.orange + '15', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.orange + '30',
  },
  msgBtnText: { color: Colors.orange, fontWeight: '600', fontSize: 15 },
  deleteBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.errorBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  feedbackCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.orange + '10', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, marginBottom: 16,
  },
  feedbackCtaText: { color: Colors.orange, fontWeight: '600', fontSize: 15 },

  feedbackCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16,
  },
  starsRow: { flexDirection: 'row', gap: 4, marginBottom: 14 },
  starBtn: { padding: 2 },
  commentInput: {
    borderRadius: 12, padding: 12,
    fontSize: 14, borderWidth: 1, height: 80, marginBottom: 12,
  },
  feedbackActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1,
  },
  cancelBtnText: { fontWeight: '600' },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.orange },
  submitBtnText: { color: '#fff', fontWeight: '700' },

  feedbackComment: { fontSize: 13, fontStyle: 'italic' },
});

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusColors, StatusLabels } from '@/constants/theme';
import { requestApi, feedbackApi, messageApi } from '@/services/api';

const STARS = [1, 2, 3, 4, 5];

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const [req, setReq]           = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Feedback
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
          // Refresh request to show feedback
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  if (!req) return null;

  const canDelete    = req.status === 'pending';
  const canFeedback  = req.status === 'completed' && !req.feedback;
  const hasFeedback  = !!req.feedback;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: StatusColors[req.status]?.bg }]}>
        <Text style={[styles.statusLabel, { color: StatusColors[req.status]?.text }]}>
          {StatusLabels[req.status] ?? req.status}
        </Text>
      </View>

      {/* Title & Meta */}
      <Text style={styles.title}>{req.title}</Text>
      <View style={styles.metaRow}>
        <Ionicons name="pricetag-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.metaText}>{req.category?.name ?? '—'}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.metaText}>{req.location}</Text>
      </View>
      <Text style={styles.dateText}>
        Submitted {new Date(req.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
      </Text>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{req.description}</Text>
      </View>

      {/* Assigned Staff */}
      {req.assigned_staff && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Staff</Text>
          <View style={styles.staffRow}>
            <View style={styles.staffAvatar}>
              <Text style={styles.staffAvatarText}>
                {req.assigned_staff.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.staffName}>{req.assigned_staff.name}</Text>
              <Text style={styles.staffEmail}>{req.assigned_staff.email}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.msgBtn} onPress={openMessages}>
          <Ionicons name="chatbubble-outline" size={18} color={Colors.orange} />
          <Text style={styles.msgBtnText}>Message Staff</Text>
        </TouchableOpacity>

        {canDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
            {deleting
              ? <ActivityIndicator size="small" color={Colors.errorText} />
              : <Ionicons name="trash-outline" size={18} color={Colors.errorText} />
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Feedback Section */}
      {canFeedback && !showFeedback && (
        <TouchableOpacity style={styles.feedbackCta} onPress={() => setShowFeedback(true)}>
          <Ionicons name="star-outline" size={18} color={Colors.orange} />
          <Text style={styles.feedbackCtaText}>Leave Feedback</Text>
        </TouchableOpacity>
      )}

      {canFeedback && showFeedback && (
        <View style={styles.feedbackCard}>
          <Text style={styles.sectionTitle}>Rate this service</Text>
          <View style={styles.starsRow}>
            {STARS.map(s => (
              <TouchableOpacity key={s} onPress={() => setRating(s)}>
                <Ionicons
                  name={s <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={s <= rating ? '#fbbf24' : Colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Additional comments (optional)"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={styles.feedbackActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowFeedback(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
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
        <View style={styles.feedbackCard}>
          <Text style={styles.sectionTitle}>Your Feedback</Text>
          <View style={styles.starsRow}>
            {STARS.map(s => (
              <Ionicons
                key={s}
                name={s <= req.feedback.rating ? 'star' : 'star-outline'}
                size={24}
                color={s <= req.feedback.rating ? '#fbbf24' : Colors.textMuted}
              />
            ))}
          </View>
          {req.feedback.comment ? (
            <Text style={styles.feedbackComment}>{req.feedback.comment}</Text>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.darkBg },
  content:  { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.darkBg },

  statusBanner: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10, marginBottom: 12,
  },
  statusLabel: { fontSize: 12, fontWeight: '700' },

  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
  metaDot:  { fontSize: 12, color: Colors.textMuted },
  dateText: { fontSize: 11, color: Colors.textMuted, marginBottom: 20 },

  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  description:  { fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },

  staffRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  staffAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.orange + '33', alignItems: 'center', justifyContent: 'center',
  },
  staffAvatarText: { color: Colors.orange, fontWeight: '700', fontSize: 13 },
  staffName:       { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  staffEmail:      { fontSize: 12, color: Colors.textMuted },

  actions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  msgBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.orange + '22', borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.orange + '44',
  },
  msgBtnText: { color: Colors.orange, fontWeight: '600' },
  deleteBtn: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: Colors.errorBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.errorText + '44',
  },

  feedbackCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.orange + '15', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.orange + '44', marginBottom: 20,
  },
  feedbackCtaText: { color: Colors.orange, fontWeight: '600', fontSize: 15 },

  feedbackCard: {
    backgroundColor: Colors.darkCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.darkBorder, marginBottom: 20,
  },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  commentInput: {
    backgroundColor: Colors.inputBg, borderRadius: 10, padding: 12,
    color: Colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: Colors.inputBorder,
    height: 80, marginBottom: 12,
  },
  feedbackActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center',
    backgroundColor: Colors.darkSecondary, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  submitBtn:     { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.orange },
  submitBtnText: { color: '#fff', fontWeight: '700' },

  feedbackComment: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
});

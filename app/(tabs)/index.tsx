import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusColors, StatusLabels, getThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { requestApi, messageApi } from '@/services/api';

interface StatsCard {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const t = getThemeColors(isDark);
  const router = useRouter();

  const [requests, setRequests]     = useState<any[]>([]);
  const [unread, setUnread]         = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [reqs, convs] = await Promise.all([
        requestApi.getAll(),
        messageApi.getConversations(),
      ]);
      setRequests(reqs);
      const totalUnread = (convs as any[]).reduce(
        (acc: number, c: any) => acc + (c.unread_count || 0), 0,
      );
      setUnread(totalUnread);
    } catch (_) {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload data when screen is focused (fixes recent requests not showing)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const countByStatus = (status: string) =>
    requests.filter(r => r.status === status).length;

  const stats: StatsCard[] = [
    { label: 'Total',       value: requests.length,              icon: 'documents',        color: Colors.orange },
    { label: 'Pending',     value: countByStatus('pending'),     icon: 'time',             color: Colors.statusPending },
    { label: 'In Progress', value: countByStatus('in_progress'), icon: 'sync',             color: Colors.statusInProgress },
    { label: 'Completed',   value: countByStatus('completed'),   icon: 'checkmark-circle', color: Colors.statusCompleted },
  ];

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: t.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerAvatar, { backgroundColor: Colors.orange + '20' }]}>
            <Text style={styles.headerAvatarText}>
              {(user?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.greeting, { color: t.text }]}>
              Hello, {user?.name?.split(' ')[0]}!
            </Text>
            <Text style={[styles.headerSub, { color: t.textSecondary }]}>Welcome back</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: t.card }]}
          onPress={() => router.push('/(tabs)/messages' as any)}
        >
          <Ionicons name="notifications-outline" size={22} color={t.textSecondary} />
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={[styles.statIconWrap, { backgroundColor: s.color + '15' }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: t.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={() => router.push('/requests/create' as any)}
        activeOpacity={0.85}
      >
        <View style={styles.ctaContent}>
          <View style={styles.ctaIconWrap}>
            <Ionicons name="add" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.ctaBtnText}>New Service Request</Text>
            <Text style={styles.ctaSub}>Submit a request for government services</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      {/* Recent Requests */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Recent Requests</Text>
        {requests.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/requests' as any)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {requests.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: Colors.orange + '15' }]}>
            <Ionicons name="document-outline" size={32} color={Colors.orange} />
          </View>
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>No service requests yet</Text>
          <Text style={[styles.emptySubtext, { color: t.textMuted }]}>Submit your first request above</Text>
        </View>
      ) : (
        requests.slice(0, 3).map(req => (
          <TouchableOpacity
            key={req.id}
            style={[styles.requestCard, { backgroundColor: t.card, borderColor: t.border }]}
            onPress={() => router.push(`/requests/${req.id}` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.requestCardLeft}>
              <View style={[styles.requestDot, { backgroundColor: StatusColors[req.status]?.text }]} />
              <View style={styles.requestInfo}>
                <Text style={[styles.requestTitle, { color: t.text }]} numberOfLines={1}>{req.title}</Text>
                <Text style={[styles.requestMeta, { color: t.textMuted }]}>
                  {req.category?.name ?? '—'}  ·  {new Date(req.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: StatusColors[req.status]?.bg }]}>
              <Text style={[styles.statusText, { color: StatusColors[req.status]?.text }]}>
                {StatusLabels[req.status] ?? req.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: t.text, marginTop: 24, marginBottom: 12 }]}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {[
          { label: 'Requests',  icon: 'document-text' as const, color: Colors.orange,          route: '/(tabs)/requests' },
          { label: 'Messages',  icon: 'chatbubbles' as const,   color: Colors.statusInProgress, route: '/(tabs)/messages' },
          { label: 'Profile',   icon: 'person' as const,        color: Colors.statusCompleted,  route: '/(tabs)/profile' },
        ].map(a => (
          <TouchableOpacity
            key={a.label}
            style={[styles.quickCard, { backgroundColor: t.card, borderColor: t.border }]}
            onPress={() => router.push(a.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: a.color + '15' }]}>
              <Ionicons name={a.icon} size={22} color={a.color} />
            </View>
            <Text style={[styles.quickLabel, { color: t.text }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  content:  { padding: 20, paddingTop: 56, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: Colors.orange, fontWeight: '700', fontSize: 15 },
  greeting:  { fontSize: 20, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 1 },
  notifBtn:  {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: Colors.orange, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '47.5%', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2, fontWeight: '500' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.orange, borderRadius: 16, padding: 16, marginBottom: 24,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  ctaIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ctaSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { color: Colors.orange, fontSize: 13, fontWeight: '600' },

  emptyCard: {
    borderRadius: 16, padding: 32,
    alignItems: 'center', borderWidth: 1,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyText:    { fontSize: 15, marginTop: 4 },
  emptySubtext: { fontSize: 13, marginTop: 4 },

  requestCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1,
  },
  requestCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  requestDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  requestInfo: { flex: 1 },
  requestTitle: { fontSize: 14, fontWeight: '600' },
  requestMeta:  { fontSize: 12, marginTop: 2 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText:   { fontSize: 11, fontWeight: '600' },

  quickActions: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1,
  },
  quickIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 12, fontWeight: '600' },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusColors, StatusLabels } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { requestApi, messageApi } from '@/services/api';

interface StatsCard {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router   = useRouter();

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
    } catch (_) {
      // ignore on load errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}!</Text>
          <Text style={styles.headerSub}>GovAssist Citizen Portal</Text>
        </View>
        {unread > 0 && (
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(tabs)/messages' as any)}>
            <Ionicons name="chatbubble" size={22} color={Colors.orange} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {stats.map(s => (
          <View key={s.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
              <Ionicons name={s.icon} size={22} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={() => router.push('/requests/create' as any)}
      >
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.ctaBtnText}>Submit New Service Request</Text>
      </TouchableOpacity>

      {/* Recent Requests */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Requests</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/requests' as any)}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No service requests yet</Text>
          <Text style={styles.emptySubtext}>Submit your first request above</Text>
        </View>
      ) : (
        requests.slice(0, 3).map(req => (
          <TouchableOpacity
            key={req.id}
            style={styles.requestCard}
            onPress={() => router.push(`/requests/${req.id}` as any)}
          >
            <View style={styles.requestCardTop}>
              <Text style={styles.requestTitle} numberOfLines={1}>{req.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: StatusColors[req.status]?.bg }]}>
                <Text style={[styles.statusText, { color: StatusColors[req.status]?.text }]}>
                  {StatusLabels[req.status] ?? req.status}
                </Text>
              </View>
            </View>
            <Text style={styles.requestMeta}>
              {req.category?.name ?? '—'}  •  {req.location}
            </Text>
          </TouchableOpacity>
        ))
      )}

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {[
          { label: 'My Requests', icon: 'document-text' as const, color: Colors.orange,          route: '/(tabs)/requests' },
          { label: 'Messages',    icon: 'chatbubbles' as const,    color: Colors.statusInProgress, route: '/(tabs)/messages' },
          { label: 'Profile',     icon: 'person-circle' as const,  color: Colors.statusCompleted,  route: '/(tabs)/profile'  },
        ].map(a => (
          <TouchableOpacity key={a.label} style={styles.quickCard} onPress={() => router.push(a.route as any)}>
            <Ionicons name={a.icon} size={26} color={a.color} />
            <Text style={styles.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.darkBg },
  content:  { padding: 20, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.darkBg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, paddingTop: 8,
  },
  greeting:  { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  notifBtn:  { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: Colors.orange, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '47%', backgroundColor: Colors.darkCard, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.darkBorder,
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, marginBottom: 24,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  seeAll: { color: Colors.orange, fontSize: 13, fontWeight: '600' },

  emptyCard: {
    backgroundColor: Colors.darkCard, borderRadius: 16, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.darkBorder,
  },
  emptyText:    { color: Colors.textSecondary, fontSize: 15, marginTop: 12 },
  emptySubtext: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },

  requestCard: {
    backgroundColor: Colors.darkCard, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  requestCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  requestTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginRight: 8 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText:   { fontSize: 11, fontWeight: '600' },
  requestMeta:  { fontSize: 12, color: Colors.textSecondary },

  quickActions: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, backgroundColor: Colors.darkCard, borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  quickLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
});

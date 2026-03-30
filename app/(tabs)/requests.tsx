import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusColors, StatusLabels, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { requestApi } from '@/services/api';

const STATUSES = ['', 'pending', 'in_progress', 'completed', 'rejected'] as const;
const STATUS_LABELS: Record<string, string> = {
  '': 'All', pending: 'Pending', in_progress: 'In Progress',
  completed: 'Completed', rejected: 'Rejected',
};

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  '': 'apps',
  pending: 'time-outline',
  in_progress: 'sync-outline',
  completed: 'checkmark-circle-outline',
  rejected: 'close-circle-outline',
};

export default function RequestsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const t = getThemeColors(isDark);

  const [requests, setRequests]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');

  const load = useCallback(async (s = search, st = status) => {
    try {
      const data = await requestApi.getAll({
        search: s || undefined,
        status: st || undefined,
      });
      setRequests(data);
    } catch (_) {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status]);

  // Reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = () => { setRefreshing(true); load(); };

  const onSearch = (text: string) => {
    setSearch(text);
    load(text, status);
  };

  const onStatusFilter = (s: string) => {
    setStatus(s);
    load(search, s);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>My Requests</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/requests/create' as any)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
        <Ionicons name="search" size={18} color={t.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: t.text }]}
          placeholder="Search requests..."
          placeholderTextColor={t.textMuted}
          value={search}
          onChangeText={onSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => onSearch('')}>
            <Ionicons name="close-circle" size={18} color={t.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter */}
      <FlatList
        horizontal
        data={STATUSES}
        keyExtractor={item => item || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: t.card, borderColor: t.border },
              status === item && styles.filterChipActive,
            ]}
            onPress={() => onStatusFilter(item)}
          >
            <Ionicons
              name={STATUS_ICONS[item]}
              size={14}
              color={status === item ? '#fff' : t.textSecondary}
            />
            <Text style={[
              styles.filterChipText, { color: t.textSecondary },
              status === item && styles.filterChipTextActive,
            ]}>
              {STATUS_LABELS[item]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Requests */}
      <FlatList
        data={requests}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
        contentContainerStyle={requests.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={[styles.emptyIconWrap, { backgroundColor: Colors.orange + '15' }]}>
              <Ionicons name="document-outline" size={36} color={Colors.orange} />
            </View>
            <Text style={[styles.emptyText, { color: t.textSecondary }]}>No requests found</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/requests/create' as any)}>
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Submit a Request</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}
            onPress={() => router.push(`/requests/${item.id}` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardDot, { backgroundColor: StatusColors[item.status]?.text }]} />
                <Text style={[styles.cardTitle, { color: t.text }]} numberOfLines={1}>{item.title}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: StatusColors[item.status]?.bg }]}>
                <Text style={[styles.badgeText, { color: StatusColors[item.status]?.text }]}>
                  {StatusLabels[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            <View style={styles.cardBottom}>
              <View style={styles.cardMetaRow}>
                <Ionicons name="folder-outline" size={12} color={t.textMuted} />
                <Text style={[styles.cardMeta, { color: t.textMuted }]}>{item.category?.name ?? '—'}</Text>
              </View>
              <View style={styles.cardMetaRow}>
                <Ionicons name="location-outline" size={12} color={t.textMuted} />
                <Text style={[styles.cardMeta, { color: t.textMuted }]} numberOfLines={1}>{item.location}</Text>
              </View>
              <View style={styles.cardMetaRow}>
                <Ionicons name="calendar-outline" size={12} color={t.textMuted} />
                <Text style={[styles.cardMeta, { color: t.textMuted }]}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800' },
  addBtn: {
    backgroundColor: Colors.orange, width: 40, height: 40,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
    borderRadius: 12, marginBottom: 12, paddingHorizontal: 14, gap: 8,
    borderWidth: 1,
  },
  searchInput: { flex: 1, height: 44, fontSize: 14 },

  filterList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  filterChipText:   { fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },

  listContent:    { padding: 16, gap: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyCard:      { alignItems: 'center', gap: 12 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText:     { fontSize: 15 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.orange, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  emptyBtnText:  { color: '#fff', fontWeight: '600' },

  card: {
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  cardDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  badge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMeta:  { fontSize: 12 },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusColors, StatusLabels } from '@/constants/theme';
import { requestApi } from '@/services/api';

const STATUSES = ['', 'pending', 'in_progress', 'completed', 'rejected'] as const;
const STATUS_LABELS: Record<string, string> = {
  '': 'All', pending: 'Pending', in_progress: 'In Progress',
  completed: 'Completed', rejected: 'Rejected',
};

export default function RequestsScreen() {
  const router = useRouter();

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
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status]);

  useEffect(() => { load(); }, []);

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Requests</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/requests/create' as any)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={onSearch}
        />
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
            style={[styles.filterChip, status === item && styles.filterChipActive]}
            onPress={() => onStatusFilter(item)}
          >
            <Text style={[styles.filterChipText, status === item && styles.filterChipTextActive]}>
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
            <Ionicons name="document-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No requests found</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/requests/create' as any)}>
              <Text style={styles.emptyBtnText}>Submit a Request</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/requests/${item.id}` as any)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: StatusColors[item.status]?.bg }]}>
                <Text style={[styles.badgeText, { color: StatusColors[item.status]?.text }]}>
                  {StatusLabels[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {item.category?.name ?? '—'}  •  {item.location}
            </Text>
            <Text style={styles.cardDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.darkBg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.darkBg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.orange, width: 38, height: 38,
    borderRadius: 19, alignItems: 'center', justifyContent: 'center',
  },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
    backgroundColor: Colors.inputBg, borderRadius: 12, marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, height: 42, color: Colors.textPrimary, fontSize: 14 },

  filterList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  filterChipActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  filterChipText:   { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },

  listContent:   { padding: 16, gap: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyCard:     { alignItems: 'center', gap: 12 },
  emptyText:     { color: Colors.textSecondary, fontSize: 15 },
  emptyBtn:      { backgroundColor: Colors.orange, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText:  { color: '#fff', fontWeight: '600' },

  card: {
    backgroundColor: Colors.darkCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginRight: 8 },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardMeta:  { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  cardDate:  { fontSize: 11, color: Colors.textMuted },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { messageApi } from '@/services/api';

export default function MessagesScreen() {
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await messageApi.getConversations();
      setConversations(data);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const openConversation = (conv: any) => {
    const userId = conv.other_user?.id;
    const srId   = conv.service_request?.id;
    const qs     = srId ? `?service_request_id=${srId}` : '';
    router.push(`/messages/${userId}${qs}` as any);
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
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={item => item.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const other = item.other_user;
          const initials = (other?.name ?? '?')
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <TouchableOpacity style={styles.card} onPress={() => openConversation(item)}>
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              {/* Content */}
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName}>{other?.name ?? 'Unknown'}</Text>
                  <Text style={styles.cardTime}>
                    {item.last_at ? new Date(item.last_at).toLocaleDateString() : ''}
                  </Text>
                </View>
                {item.service_request && (
                  <Text style={styles.cardReqLabel} numberOfLines={1}>
                    Re: {item.service_request.title}
                  </Text>
                )}
                <Text style={styles.cardPreview} numberOfLines={1}>{item.last_message}</Text>
              </View>

              {/* Unread badge */}
              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.darkBg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.darkBg },

  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },

  listContent:    { padding: 16, gap: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyCard:      { alignItems: 'center', gap: 12 },
  emptyText:      { color: Colors.textSecondary, fontSize: 15 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.darkCard, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.orange + '33', alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: Colors.orange, fontWeight: '700', fontSize: 15 },

  cardBody:  { flex: 1 },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardName:  { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  cardTime:  { fontSize: 11, color: Colors.textMuted },
  cardReqLabel: { fontSize: 11, color: Colors.orange, marginBottom: 2 },
  cardPreview:  { fontSize: 13, color: Colors.textSecondary },

  unreadBadge: {
    backgroundColor: Colors.orange, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5, marginLeft: 8,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

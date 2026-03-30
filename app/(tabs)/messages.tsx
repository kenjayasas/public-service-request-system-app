import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { messageApi } from '@/services/api';

export default function MessagesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const t = getThemeColors(isDark);

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await messageApi.getConversations();
      setConversations(data);
    } catch (_) {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => { setRefreshing(true); load(); };

  const openConversation = (conv: any) => {
    const userId = conv.other_user?.id;
    const srId   = conv.service_request?.id;
    const qs     = srId ? `?service_request_id=${srId}` : '';
    router.push(`/messages/${userId}${qs}` as any);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: t.text }]}>Messages</Text>
          {totalUnread > 0 && (
            <Text style={[styles.headerSub, { color: t.textSecondary }]}>
              {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={item => item.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={[styles.emptyIconWrap, { backgroundColor: Colors.statusInProgress + '15' }]}>
              <Ionicons name="chatbubbles-outline" size={36} color={Colors.statusInProgress} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No conversations yet</Text>
            <Text style={[styles.emptyText, { color: t.textSecondary }]}>
              Messages with staff will appear here when you submit a service request
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: t.border }]} />}
        renderItem={({ item }) => {
          const other = item.other_user;
          const initials = (other?.name ?? '?')
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          const hasUnread = item.unread_count > 0;
          const timeAgo = formatTimeAgo(item.last_at);

          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: hasUnread ? (isDark ? Colors.orange + '08' : Colors.orange + '06') : 'transparent' }]}
              onPress={() => openConversation(item)}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: Colors.orange + '20' }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                {hasUnread && <View style={styles.onlineDot} />}
              </View>

              {/* Content */}
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardName, { color: t.text }, hasUnread && styles.cardNameBold]}>
                    {other?.name ?? 'Unknown'}
                  </Text>
                  <Text style={[styles.cardTime, { color: hasUnread ? Colors.orange : t.textMuted }]}>
                    {timeAgo}
                  </Text>
                </View>
                {item.service_request && (
                  <View style={styles.reqBadge}>
                    <Ionicons name="document-text-outline" size={10} color={Colors.orange} />
                    <Text style={styles.cardReqLabel} numberOfLines={1}>
                      {item.service_request.title}
                    </Text>
                  </View>
                )}
                <Text
                  style={[styles.cardPreview, { color: hasUnread ? t.text : t.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.last_message}
                </Text>
              </View>

              {/* Unread badge */}
              {hasUnread && (
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

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },

  listContent:    { paddingBottom: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyCard:      { alignItems: 'center', gap: 8 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyText:  { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  separator: { height: 1, marginLeft: 82 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  avatarWrap: { position: 'relative', marginRight: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.orange, fontWeight: '700', fontSize: 16 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.orange,
    borderWidth: 2, borderColor: Colors.darkBg,
  },

  cardBody:  { flex: 1 },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cardName:  { fontSize: 15, fontWeight: '500' },
  cardNameBold: { fontWeight: '700' },
  cardTime:  { fontSize: 12 },
  reqBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3,
  },
  cardReqLabel: { fontSize: 11, color: Colors.orange },
  cardPreview:  { fontSize: 13 },

  unreadBadge: {
    backgroundColor: Colors.orange, borderRadius: 12,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, marginLeft: 8,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

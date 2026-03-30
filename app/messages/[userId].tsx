import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { messageApi } from '@/services/api';

export default function ConversationScreen() {
  const { userId, service_request_id } = useLocalSearchParams<{ userId: string; service_request_id?: string }>();
  const { user: me } = useAuth();
  const { isDark } = useTheme();
  const t = getThemeColors(isDark);

  const [messages, setMessages]   = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const listRef = useRef<FlatList>(null);

  const srId = service_request_id ? Number(service_request_id) : undefined;

  const load = useCallback(async (initial = false) => {
    try {
      const data = await messageApi.getMessages(Number(userId), srId);
      setMessages(data.messages ?? []);
      if (initial) setOtherUser(data.other_user);
    } catch (_) {}
    finally {
      if (initial) setLoading(false);
    }
  }, [userId, srId]);

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 5000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText('');
    try {
      await messageApi.send(Number(userId), trimmed, srId);
      await load(false);
    } catch (_) {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Other user header */}
      {otherUser && (
        <View style={[styles.subHeader, { backgroundColor: t.card, borderBottomColor: t.border }]}>
          <View style={[styles.subAvatar, { backgroundColor: Colors.orange + '20' }]}>
            <Text style={styles.subAvatarText}>
              {otherUser.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.subInfo}>
            <Text style={[styles.subName, { color: t.text }]}>{otherUser.name}</Text>
            <View style={styles.subRoleBadge}>
              <View style={[styles.statusDot, { backgroundColor: Colors.statusCompleted }]} />
              <Text style={[styles.subRole, { color: t.textMuted }]}>{otherUser.role}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconWrap, { backgroundColor: Colors.statusInProgress + '15' }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color={Colors.statusInProgress} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.text }]}>Start the conversation</Text>
            <Text style={[styles.emptyText, { color: t.textSecondary }]}>
              Send a message to communicate with staff about your request
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMe = item.sender_id === me?.id;
          const showDate = index === 0 || !isSameDay(
            new Date(messages[index - 1].created_at),
            new Date(item.created_at),
          );

          return (
            <>
              {showDate && (
                <View style={styles.dateSeparator}>
                  <View style={[styles.dateLine, { backgroundColor: t.border }]} />
                  <Text style={[styles.dateLabel, { color: t.textMuted, backgroundColor: t.bg }]}>
                    {formatDate(item.created_at)}
                  </Text>
                  <View style={[styles.dateLine, { backgroundColor: t.border }]} />
                </View>
              )}
              <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
                {!isMe && (
                  <View style={[styles.bubbleAvatar, { backgroundColor: Colors.orange + '20' }]}>
                    <Text style={styles.bubbleAvatarText}>
                      {otherUser?.name?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
                <View style={[
                  styles.bubble,
                  isMe ? [styles.bubbleMe, { backgroundColor: Colors.orange }] : [styles.bubbleThem, { backgroundColor: t.card, borderColor: t.border }],
                ]}>
                  <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : { color: t.text }]}>
                    {item.message}
                  </Text>
                  <View style={styles.bubbleFooter}>
                    <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : { color: t.textMuted }]}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isMe && (
                      <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.6)" />
                    )}
                  </View>
                </View>
              </View>
            </>
          );
        }}
      />

      {/* Input */}
      <View style={[styles.inputBar, { backgroundColor: t.card, borderTopColor: t.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={t.textMuted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={sending || !text.trim()}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  if (isSameDay(date, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  subHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  subAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  subAvatarText: { color: Colors.orange, fontWeight: '700', fontSize: 14 },
  subInfo: { flex: 1 },
  subName: { fontSize: 15, fontWeight: '600' },
  subRoleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  subRole: { fontSize: 12, textTransform: 'capitalize' },

  listContent: { padding: 16, gap: 4, flexGrow: 1, justifyContent: 'flex-end' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  dateSeparator: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8,
  },
  dateLine: { flex: 1, height: 1 },
  dateLabel: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8 },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  bubbleAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  bubbleAvatarText: { color: Colors.orange, fontWeight: '700', fontSize: 12 },

  bubble: {
    maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    borderWidth: 1, borderBottomLeftRadius: 4,
  },
  bubbleText:     { fontSize: 14, lineHeight: 20 },
  bubbleTextMe:   { color: '#fff' },
  bubbleFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  bubbleTime:     { fontSize: 10 },
  bubbleTimeMe:   { color: 'rgba(255,255,255,0.6)' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, borderWidth: 1, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  sendBtnDisabled: { opacity: 0.5 },
});

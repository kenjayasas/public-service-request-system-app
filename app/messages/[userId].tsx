import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { messageApi } from '@/services/api';

export default function ConversationScreen() {
  const { userId, service_request_id } = useLocalSearchParams<{ userId: string; service_request_id?: string }>();
  const { user: me } = useAuth();

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
    } catch (_) {
    } finally {
      if (initial) setLoading(false);
    }
  }, [userId, srId]);

  useEffect(() => {
    load(true);
    // Poll every 5 seconds for new messages
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
      setText(trimmed); // restore on error
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Other user header info */}
      {otherUser && (
        <View style={styles.subHeader}>
          <View style={styles.subAvatar}>
            <Text style={styles.subAvatarText}>
              {otherUser.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.subName}>{otherUser.name}</Text>
            <Text style={styles.subRole}>{otherUser.role}</Text>
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
            <Ionicons name="chatbubbles-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMe = item.sender_id === me?.id;
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.message}
              </Text>
              <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending || !text.trim()}>
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.darkBg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.darkBg },

  subHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
    backgroundColor: Colors.darkCard,
  },
  subAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.orange + '33', alignItems: 'center', justifyContent: 'center',
  },
  subAvatarText: { color: Colors.orange, fontWeight: '700', fontSize: 13 },
  subName:       { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  subRole:       { fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize' },

  listContent: { padding: 16, gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  emptyWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyText:   { color: Colors.textSecondary, fontSize: 14 },

  bubble: {
    maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9,
  },
  bubbleMe: {
    alignSelf: 'flex-end', backgroundColor: Colors.orange,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start', backgroundColor: Colors.darkCard,
    borderWidth: 1, borderColor: Colors.darkBorder, borderBottomLeftRadius: 4,
  },
  bubbleText:     { fontSize: 14, lineHeight: 20 },
  bubbleTextMe:   { color: '#fff' },
  bubbleTextThem: { color: Colors.textPrimary },
  bubbleTime:     { fontSize: 10, marginTop: 4 },
  bubbleTimeMe:   { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeThem: { color: Colors.textMuted },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.darkBorder,
    backgroundColor: Colors.darkCard,
  },
  input: {
    flex: 1, backgroundColor: Colors.inputBg, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14,
    borderWidth: 1, borderColor: Colors.inputBorder,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center',
  },
});

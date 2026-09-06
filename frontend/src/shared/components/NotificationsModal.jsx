import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,  TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/supabase';
import { NOTIFICATIONS_API_BASE } from '../api/client';
import { useRouter } from 'expo-router';

export default function NotificationsModal({ visible, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible]);

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (!session) return;
      const response = await fetch(NOTIFICATIONS_API_BASE, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await response.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.error('[Notifications] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, referenceId, type) => {
    try {
      const session = await getSession();
      if (!session) return;
      await fetch(`${NOTIFICATIONS_API_BASE}/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      
      // Update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

      // Navigate based on type
      onClose();
      if (type.startsWith('wiki_') && referenceId) {
        router.push({ pathname: '/(tabs)/Wiki/SubmissionDetail', params: { id: referenceId } });
      }
    } catch (err) {
      console.error('[Notifications] Mark read error:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const session = await getSession();
      if (!session) return;
      await fetch(`${NOTIFICATIONS_API_BASE}/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('[Notifications] Mark all read error:', err);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
      onPress={() => markAsRead(item.id, item.reference_id, item.type)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={item.type.includes('approved') || item.type.includes('verified') ? 'checkmark-circle' : 'notifications'} 
          size={24} 
          color={item.is_read ? '#9CA3AF' : '#F59E0B'} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent={true}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerRight}>
              {notifications.some(n => !n.is_read) && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FBBF24" style={{ marginTop: 40 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  markAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  unreadCard: {
    backgroundColor: '#FFFBEB',
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  }
});

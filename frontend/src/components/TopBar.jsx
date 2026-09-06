import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../shared/api/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NotificationsModal from '../shared/components/NotificationsModal';
import { NOTIFICATIONS_API_BASE } from '../shared/api/client';

const availableAvatars = [
  { id: 1, name: 'maria_clara.png', source: require('../../assets/avatars/maria_clara.png') },
  { id: 2, name: '1.png', source: require('../../assets/avatars/1.png') },
  { id: 3, name: '2.png', source: require('../../assets/avatars/2.png') },
  { id: 4, name: '3.png', source: require('../../assets/avatars/3.png') },
  { id: 5, name: '4.png', source: require('../../assets/avatars/4.png') },
];

import { useProfileContext } from '../shared/context/ProfileContext';

const TopBar = ({
  titlePrimary,
  titleSecondary,
  screenType = 'home',
  titleMode = 'column',
  onHistoryPress,
  onSaveWordsPress
}) => {
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const { userAvatar } = useProfileContext();

  useEffect(() => {
    fetchTopBarData();
  }, []);

  const fetchTopBarData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch unread count
      const response = await fetch(NOTIFICATIONS_API_BASE, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await response.json();
      if (json.success) {
        setUnreadCount(json.data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.log('[TopBar] fetch error:', err);
    }
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          {/* Left Section (Dynamic Titles) */}
          <View style={styles.leftSection}>
            {titleMode === 'brand' ? (
              <View style={styles.titleWrapperRow}>
                <Text style={styles.headerTitleBlack}>Dialect</Text>
                <Text style={styles.headerTitleYellowRow}>Go</Text>
              </View>
            ) : titlePrimary || titleSecondary ? (
              <View style={styles.titleWrapper}>
                {titlePrimary ? <Text style={styles.headerTitleYellow}>{titlePrimary}</Text> : null}
                {titleSecondary ? <Text style={styles.headerTitleBlack}>{titleSecondary}</Text> : null}
              </View>
            ) : null}
          </View>

          {/* Right Section (Glassmorphism Pill Buttons) */}
          <View style={styles.rightSection}>

            {screenType === 'dictionary' ? (
              <>
                <TouchableOpacity
                  style={styles.iconWrap}
                  onPress={onHistoryPress}
                >
                  <Image source={require('../../assets/icons/nav/search_history_icon.png')} style={styles.historyIcon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconWrap}
                  onPress={onSaveWordsPress}
                >
                  <Image source={require('../../assets/icons/nav/save_word_icon.png')} style={styles.starIcon} />
                </TouchableOpacity>
              </>
            ) : screenType === 'translator' ? (
              <>
                <TouchableOpacity
                  style={styles.iconWrap}
                  onPress={onHistoryPress}
                >
                  <Image source={require('../../assets/icons/nav/search_history_icon.png')} style={styles.topIcon} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.glassBtn}
                  onPress={() => handleNavigation('/Account/Profile')}
                >
                  <View style={styles.avatarWrapper}>
                    <Image source={userAvatar} style={styles.avatarIcon} />
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.glassBtn}
                  onPress={() => {
                    setNotificationsVisible(true);
                    setUnreadCount(0); // Optimistic clear
                  }}
                >
                  <Image
                    source={require('../../assets/icons/nav/notification_icon.png')}
                    style={styles.notificationIcon}
                    resizeMode="contain"
                  />

                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.glassBtn}
                  onPress={() => handleNavigation('/Account/Profile')}
                >
                  <View style={styles.avatarWrapper}>
                    <Image source={userAvatar} style={styles.avatarIcon} />
                  </View>
                </TouchableOpacity>
              </>
            )}

          </View>
        </View>
      </SafeAreaView>

      {/* --- NOTIFICATIONS MODAL --- */}
      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => {
          setNotificationsVisible(false);
          fetchTopBarData(); // Refresh count on close
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 55,
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
  },
  miniLogoHeader: {
    width: 32,
    height: 32,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // Space between glass buttons
  },
glassBtn: {
  backgroundColor: 'transparent',
  padding: 0,
  margin: 0,
  justifyContent: 'center',
  alignItems: 'center',
},
  avatarWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFD54F',
  },
  avatarIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    resizeMode: 'contain',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  titleWrapper: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: -5,
  },
  titleWrapperRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: -5,
  },
  headerTitleYellow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD54F',
    marginBottom: -6,
    letterSpacing: 0.5,
  },
  headerTitleYellowRow: {
    fontSize: 28,
    color: '#FFD54F',
    fontWeight: '900',
  },
  headerTitleBlack: {
    fontSize: 28,
    color: '#421C00',
    fontWeight: '900',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    padding: 0,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },

  historyButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',

    shadowColor: '#421C00',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,

    elevation: 5,
  },

  historyIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  starButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',

    shadowColor: '#421C00',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,

    elevation: 5,
  },

  starIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  notificationIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
});

export default TopBar;
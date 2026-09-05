import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, FlatList, ActivityIndicator, Platform, Image,
  Keyboard, Animated, TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../api/supabase';
import { WIKI_API_BASE } from '../../api/client';
import { colors } from '../../theme/colorPalette';

const BEE_LOGO = require('../../../../assets/logo/bee.png');

export default function GlobalWikiAssistantModal({ visible, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Track focus to guard against spurious keyboardWillHide during typing
  const inputFocusedRef = useRef(false);

  // Animated values for keyboard handling
  const keyboardAnim = useRef(new Animated.Value(0)).current; // iOS modal offset
  const paddingBottomAnim = useRef(new Animated.Value(Math.max(32, insets.bottom + 8))).current;

  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Kamusta! 👋 I'm Dialect Wiki. Ask me anything about Philippine languages, regional dialects, or Filipino culture!`,
      }]);
    }
  }, [visible]);

  // iOS: keyboard listeners for modal margin offset
  // Android: adjustResize handles it, no listeners needed
  // iOS: keyboard listeners for modal margin offset
  // Android: adjustResize handles it natively now that edgeToEdge is false
  useEffect(() => {
    if (Platform.OS !== 'ios' || !visible) return;

    const showSub = Keyboard.addListener('keyboardWillShow', (e) => {
      Animated.timing(keyboardAnim, {
        toValue: e.endCoordinates.height,
        duration: e.duration || 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener('keyboardWillHide', () => {
      // Only animate down if input lost focus — prevents bounce during typing
      if (!inputFocusedRef.current) {
        Animated.timing(keyboardAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    });

    return () => { showSub.remove(); hideSub.remove(); };
  }, [visible]);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      keyboardAnim.setValue(0);
      paddingBottomAnim.setValue(Math.max(32, insets.bottom + 8));
      inputFocusedRef.current = false;
    }
  }, [visible]);

  // When input gains focus, reduce bottom padding (keyboard covers safe area)
  const handleInputFocus = () => {
    inputFocusedRef.current = true;
    Animated.timing(paddingBottomAnim, {
      toValue: 8,
      duration: Platform.OS === 'ios' ? 250 : 200,
      useNativeDriver: false,
    }).start();
  };

  // When input loses focus, restore safe area bottom padding + reset keyboard offset
  const handleInputBlur = () => {
    inputFocusedRef.current = false;
    Animated.timing(paddingBottomAnim, {
      toValue: Math.max(32, insets.bottom + 8),
      duration: Platform.OS === 'ios' ? 250 : 200,
      useNativeDriver: false,
    }).start();
    // On iOS, also reset keyboard offset (in case keyboardWillHide already fired while focused)
    if (Platform.OS === 'ios') {
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    const userMsg = { id: `user-${Date.now()}`, role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(`${WIKI_API_BASE}/ask-global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          history,
        }),
      });

      const json = await response.json();

      if (json.success) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: json.response,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I couldn\'t process that. Please try again.',
        }]);
      }
    } catch (err) {
      console.error('[GlobalWikiAssistant] Error:', err);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Network error. Please check your connection.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setMessages([]);
    setInput('');
    onClose();
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Image source={BEE_LOGO} style={{ width: 18, height: 18 }} resizeMode="contain" />
          </View>
        )}
        <View style={[styles.messageContent, isUser ? styles.userContent : styles.aiContent]}>
          <Text style={[styles.messageText, isUser && styles.userText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent={true}>
      <View style={styles.overlay}>
        {/* Tappable backdrop to dismiss keyboard */}
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>

        <Animated.View style={[
          styles.container,
          // iOS: manually push modal up by keyboard height
          // Android: adjustResize handles it naturally
          Platform.OS === 'ios' && { marginBottom: keyboardAnim }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiIcon}>
                <Image source={BEE_LOGO} style={{ width: 22, height: 22 }} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Dialect Wiki</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  Ask about dialects & culture
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              isLoading ? (
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <View style={styles.aiAvatar}>
                    <Image source={BEE_LOGO} style={{ width: 18, height: 18 }} resizeMode="contain" />
                  </View>
                  <View style={[styles.messageContent, styles.aiContent]}>
                    <View style={styles.typingRow}>
                      <ActivityIndicator size="small" color="#FBBF24" />
                      <Text style={styles.typingText}>Thinking...</Text>
                    </View>
                  </View>
                </View>
              ) : null
            }
          />

          {/* Input */}
          <Animated.View style={[styles.inputContainer, { paddingBottom: paddingBottomAnim }]}>
            <TextInput
              style={styles.input}
              placeholder="Ask a general question..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              editable={!isLoading}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Ionicons name="send" size={20} color={input.trim() && !isLoading ? '#1F2937' : '#D1D5DB'} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    maxWidth: 200,
  },
  closeBtn: {
    padding: 4,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  messageContent: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userContent: {
    backgroundColor: '#FBBF24',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  aiContent: {
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 21,
  },
  userText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
});

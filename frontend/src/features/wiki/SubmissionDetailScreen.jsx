import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Image, Keyboard, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import TopBar from '../../components/TopBar';
import { colors } from '../../shared/theme/colorPalette';
import WikiAssistantModal from '../../shared/components/wiki/WikiAssistantModal';
import SubmissionDetailCard from '../../shared/components/wiki/SubmissionDetailCard';
import SubmissionComments from '../../shared/components/wiki/SubmissionComments';
import { useSubmissionDetail } from '../../shared/hooks/wiki/useSubmissionDetail';
import { availableAvatars } from '../../shared/hooks/profile/constants';

export default function SubmissionDetailScreen({ id }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  // Animated padding for smooth transition when keyboard opens/closes
  const paddingBottomAnim = useRef(new Animated.Value(Math.max(insets.bottom, 12))).current;
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;
  const [inputFocused, setInputFocused] = useState(false);
  
  // Custom precise keyboard handling for Android (bypasses KeyboardAvoidingView sticky bugs)
  // Reverted: custom padding isn't perfectly aligning, relying on KeyboardAvoidingView with enabled toggle instead.
  
  const getAvatarSource = (avatarName) => {
    if (!avatarName || avatarName === 'null') return null;
    const matched = availableAvatars.find(a => a.name === avatarName);
    return matched ? matched.source : null;
  };
  
  const {
    submission,
    loading,
    userVote,
    bookmarked,
    comments,
    commentText,
    setCommentText,
    postingComment,
    loadingComments,
    showAssistant,
    setShowAssistant,
    handleVote,
    handleBookmark,
    handlePostComment,
  } = useSubmissionDetail(id);

  // When input gains focus, reduce bottom padding (keyboard covers safe area)
  const handleInputFocus = () => {
    setInputFocused(true);
    Animated.timing(paddingBottomAnim, {
      toValue: 8,
      duration: Platform.OS === 'ios' ? 250 : 200,
      useNativeDriver: false,
    }).start();
  };

  // When input loses focus, restore safe area bottom padding
  const handleInputBlur = () => {
    setInputFocused(false);
    Animated.timing(paddingBottomAnim, {
      toValue: Math.max(insets.bottom, 12),
      duration: Platform.OS === 'ios' ? 250 : 200,
      useNativeDriver: false,
    }).start();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.fixedHeaderRow, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FBBF24" />
        </View>
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.fixedHeaderRow, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Submission not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior="padding"
      enabled={Platform.OS === 'ios' ? true : inputFocused}
    >
      <StatusBar barStyle="dark-content" />

      {/* Fixed Header */}
      <View style={[styles.fixedHeaderRow, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.authorAvatar}>
            {getAvatarSource(submission.profiles?.profile_avatar_url) ? (
              <Image 
                source={getAvatarSource(submission.profiles.profile_avatar_url)} 
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB' }} 
              />
            ) : (
              <Ionicons name="person-circle" size={40} color="#D1D5DB" />
            )}
          </View>
          <View style={styles.headerAuthorInfo}>
            <Text style={styles.headerAuthorName}>
              {submission.profiles?.username || `${submission.profiles?.first_name || ''} ${submission.profiles?.last_name || ''}`.trim() || 'Anonymous'}
            </Text>
            <Text style={styles.headerAuthorDate}>
              {new Date(submission.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkBtn}>
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={bookmarked ? '#FBBF24' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <SubmissionDetailCard
          submission={submission}
          userVote={userVote}
          handleVote={handleVote}
          commentsCount={comments.length}
          styles={styles}
        />

        <SubmissionComments
          comments={comments}
          loadingComments={loadingComments}
          styles={styles}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating AI Fab - hidden when keyboard is open */}
      {!inputFocused && (
        <TouchableOpacity
          style={[styles.aiFab, { bottom: insets.bottom + 80 }]}
          activeOpacity={0.85}
          onPress={() => setShowAssistant(true)}
        >
          <Image
            source={require('../../../assets/icons/wiki/wiki_ai_chatbot_icon.png')}
            style={styles.aiFabIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

      {/* Facebook style fixed comment input */}
      <Animated.View style={[styles.bottomInputContainer, { paddingBottom: paddingBottomAnim }]}>
        <View style={styles.commentInputWrapperFb}>
          <TextInput
            style={styles.commentInputFb}
            placeholder="Share your thoughts..."
            placeholderTextColor="#9CA3AF"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={2000}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          {commentText.trim().length > 0 && (
            <TouchableOpacity
              style={styles.commentSendBtnFb}
              onPress={handlePostComment}
              disabled={postingComment}
            >
              {postingComment ? (
                <ActivityIndicator size="small" color={colors.primaryDeep} />
              ) : (
                <Ionicons name="send" size={20} color={colors.primaryDeep} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <WikiAssistantModal
        visible={showAssistant}
        onClose={() => setShowAssistant(false)}
        submissionId={id}
        submissionTitle={submission.source_term}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#9CA3AF' },
  
  fixedHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { paddingVertical: 8, paddingRight: 12, justifyContent: 'center' },
  authorAvatar: { marginRight: 10 },
  headerAuthorInfo: { justifyContent: 'center' },
  headerAuthorName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  headerAuthorDate: { fontSize: 11, color: colors.textHint, marginTop: 2 },
  bookmarkBtn: { padding: 6 },

  contentContainer: { 
    backgroundColor: colors.surface,
    padding: 24, 
    justifyContent: 'center', 
    minHeight: 180,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8
  },
  contentHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  contentTitle: { fontSize: 13, fontWeight: '700', color: colors.textHint, letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  verifiedStatus: { backgroundColor: '#D1FAE5' },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.primaryDeep },
  verifiedStatusText: { color: '#059669' },
  
  mainTerm: { fontSize: 24, fontWeight: '900', color: colors.textPrimary, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textHint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  translationText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, lineHeight: 24, marginBottom: 12 },
  exampleText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary, fontStyle: 'italic', lineHeight: 22 },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 20 },
  tagBadge: { 
    backgroundColor: colors.surfaceLight, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderGold
  },
  tagText: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },

  engagementRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingHorizontal: 4, gap: 24, paddingBottom: 8 },
  engagementBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  engagementText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  commentsSection: { marginTop: 4 },
  commentsSectionTitle: { fontSize: 13, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  noComments: { alignItems: 'center', paddingVertical: 30 },
  noCommentsText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  commentAvatarCol: { marginRight: 10, paddingTop: 2 },
  commentContentWrapper: { flex: 1 },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#111827' },
  commentDot: { fontSize: 13, color: '#9CA3AF', marginHorizontal: 2 },
  commentDate: { fontSize: 12, color: '#9CA3AF' },
  commentContent: { fontSize: 14, color: '#374151', lineHeight: 20 },

  bottomInputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  commentAvatarFb: { marginRight: 10, paddingBottom: 4 },
  commentInputWrapperFb: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, minHeight: 40, maxHeight: 100 },
  commentInputFb: { flex: 1, fontSize: 15, color: '#1F2937', paddingTop: 10, paddingBottom: 10, paddingRight: 8 },
  commentSendBtnFb: { paddingLeft: 8, paddingVertical: 8 },

  aiFab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: colors.shadowGold, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5, elevation: 5 },
  aiFabIcon: { width: 42, height: 42, resizeMode: 'contain' },
});

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../api/supabase';
import { WIKI_API_BASE } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import SwipeableBottomSheet from '../SwipeableBottomSheet';

const REGIONS = ['Batangueño', 'Boholano', 'General Cebuano', 'General Tagalog'];
const TERM_CATEGORIES = ['Slang', 'Idiom', 'Colloquial', 'Literal'];
const QUESTION_CATEGORIES = ['Cultural', 'General', 'Colloquial', 'Literal'];
const SENTIMENTS = ['Casual', 'Humorous', 'Aggressive', 'Affectionate', 'Formal', 'Sarcastic'];

const Dropdown = ({ label, options, selectedValue, onSelect, required, isOpen, toggleOpen, isSentiment }) => {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.dropdownHeader, isOpen && styles.dropdownHeaderOpen]}
        onPress={toggleOpen}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownHeaderText, !selectedValue && { color: '#9CA3AF' }]}>
          {selectedValue || `Select ${label}`}
        </Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={isOpen ? "#FFD54F" : "#6B7280"} />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownList}>
          {options.map((opt) => {
            const isActive = selectedValue === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.dropdownItem, 
                  isActive && styles.dropdownItemActive
                ]}
                onPress={() => onSelect(opt)}
              >
                <Text style={[
                  styles.dropdownItemText, 
                  isActive && styles.activeDropdownText
                ]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default function SubmitTermModal({ visible, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [sourceTerm, setSourceTerm] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [translation, setTranslation] = useState('');
  const [usageExample, setUsageExample] = useState('');
  const [sentimentTag, setSentimentTag] = useState('');
  const [submissionType, setSubmissionType] = useState('Term');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const isQuestion = submissionType === 'Question';
  const CATEGORIES = isQuestion ? QUESTION_CATEGORIES : TERM_CATEGORIES;

  const resetForm = () => {
    setSourceTerm('');
    setRegion('');
    setCategory('');
    setTranslation('');
    setUsageExample('');
    setSentimentTag('');
    setSubmissionType('Term');
  };

  const handleSubmit = async () => {
    if (!sourceTerm.trim() || !region || !category || !translation.trim()) {
      showToast('Please fill in all required fields.', 'error', 'Missing Fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Please log in to submit.', 'error', 'Auth Required');
        return;
      }

      const response = await fetch(WIKI_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          source_term: sourceTerm.trim(),
          region,
          category,
          translation: translation.trim(),
          usage_example: usageExample.trim() || null,
          sentiment_tag: sentimentTag || null,
          type: submissionType,
        }),
      });

      const json = await response.json();

      if (json.success) {
        showToast('Your contribution has been submitted for community review.', 'success', 'Salamat! 🎉');
        resetForm();
        onSuccess?.();
      } else {
        showToast(json.message || 'Submission failed.', 'error', 'Oops');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SwipeableBottomSheet visible={visible} onClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flexShrink: 1 }}>
        <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {isQuestion ? 'Ask a Question' : 'Contribute a Term'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, !isQuestion && styles.typeBtnActive]}
                onPress={() => { setSubmissionType('Term'); setCategory(''); }}
              >
                <Ionicons name="text-outline" size={16} color={!isQuestion ? '#421C00' : '#9CA3AF'} />
                <Text style={[styles.typeBtnText, !isQuestion && styles.typeBtnTextActive]}>Term</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, isQuestion && styles.typeBtnActive]}
                onPress={() => { setSubmissionType('Question'); setCategory(''); }}
              >
                <Ionicons name="help-circle-outline" size={16} color={isQuestion ? '#421C00' : '#9CA3AF'} />
                <Text style={[styles.typeBtnText, isQuestion && styles.typeBtnTextActive]}>Question</Text>
              </TouchableOpacity>
            </View>
            {/* Source Term / Question */}
            <Text style={styles.label}>
              {isQuestion ? 'Your Question' : 'Source Term / Phrase'} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, isQuestion && styles.multilineInput]}
              placeholder={isQuestion
                ? 'e.g., "Ano mas magandang sabihin sa isang Batangueño na Magulang?"'
                : 'e.g., "Ala eh", "Buang"'
              }
              placeholderTextColor="#9CA3AF"
              value={sourceTerm}
              onChangeText={setSourceTerm}
              multiline={isQuestion}
              numberOfLines={isQuestion ? 3 : 1}
            />

            {/* Region Dropdown */}
            <Dropdown 
              label="Region" 
              options={REGIONS} 
              selectedValue={region} 
              onSelect={(val) => { setRegion(val); setOpenDropdown(null); }} 
              required 
              isOpen={openDropdown === 'region'} 
              toggleOpen={() => setOpenDropdown(openDropdown === 'region' ? null : 'region')} 
            />

            {/* Category Dropdown */}
            <Dropdown 
              label="Category" 
              options={CATEGORIES} 
              selectedValue={category} 
              onSelect={(val) => { setCategory(val); setOpenDropdown(null); }} 
              required 
              isOpen={openDropdown === 'category'} 
              toggleOpen={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')} 
            />

            {/* Standard Translation / Context */}
            <Text style={styles.label}>
              {isQuestion ? 'Context / Background' : 'Standard Translation'} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, isQuestion && styles.multilineInput]}
              placeholder={isQuestion
                ? 'Provide context about your situation...'
                : 'What it means in English or standard language'
              }
              placeholderTextColor="#9CA3AF"
              value={translation}
              onChangeText={setTranslation}
              multiline={isQuestion}
              numberOfLines={isQuestion ? 3 : 1}
            />

            {/* Usage Example */}
            <Text style={styles.label}>Usage Example (Optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder='e.g., "Ala eh, ang ganda naman niyan!"'
              placeholderTextColor="#9CA3AF"
              value={usageExample}
              onChangeText={setUsageExample}
              multiline
              numberOfLines={3}
            />

            {/* Sentiment Tag Dropdown */}
            <Dropdown 
              label="Tone / Sentiment (Optional)" 
              options={SENTIMENTS} 
              selectedValue={sentimentTag} 
              onSelect={(val) => { setSentimentTag(sentimentTag === val ? '' : val); setOpenDropdown(null); }} 
              isOpen={openDropdown === 'sentiment'} 
              toggleOpen={() => setOpenDropdown(openDropdown === 'sentiment' ? null : 'sentiment')} 
              isSentiment={true}
            />

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Sticky Submit Button */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#1F2937" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Contribution</Text>
              )}
            </TouchableOpacity>
          </View>
      </KeyboardAvoidingView>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: '#FFD54F',
    shadowColor: '#8A6200',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  typeBtnTextActive: {
    color: '#421C00',
    fontWeight: '800',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.3,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    fontWeight: '500',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  activeChip: {
    backgroundColor: '#FBBF24',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeChipText: {
    color: '#1F2937',
    fontWeight: '800',
  },
  sentimentOption: {
    backgroundColor: '#F5F3FF',
  },
  activeSentiment: {
    backgroundColor: '#7C3AED',
  },
  activeSentimentText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#FBBF24',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  footerContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dropdownHeaderOpen: {
    borderColor: '#FFD54F',
    backgroundColor: '#FFFDF5',
  },
  dropdownHeaderText: {
    fontSize: 15,
    color: '#421C00',
    fontWeight: '500',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD54F',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#8A6200',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E9D8',
  },
  dropdownItemActive: {
    backgroundColor: '#FFF7D6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#634F4B',
    fontWeight: '500',
  },
  activeDropdownText: {
    color: '#8A6200',
    fontWeight: '800',
  }
});

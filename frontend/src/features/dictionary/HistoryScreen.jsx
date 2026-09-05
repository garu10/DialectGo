import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import RefreshContainer from '../../shared/components/RefreshContainer';
import ProfileTopBar from '../../components/ProfileTopBar';
import { useDictionaryHistory } from '../../shared/hooks/dictionary/useDictionaryHistory';
import DictionaryHistoryCard from '../../shared/components/dictionary/DictionaryHistoryCard';
import ConfirmOverlay from '../../shared/components/ConfirmOverlay';

export default function HistoryScreen() {
  const router = useRouter();
  
  const {
    historyItems,
    loading,
    refreshing,
    selectedIds,
    isDeleting,
    handleRefresh,
    toggleSelect,
    toggleSelectAll,
    confirmDelete,
    showConfirmModal,
    setShowConfirmModal,
    processDeletion
  } = useDictionaryHistory();

  const renderItem = (item, index) => {
    return (
      <DictionaryHistoryCard
        key={item.id?.toString() || index.toString()}
        item={item}
        index={index}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        router={router}
        styles={styles}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ProfileTopBar title="Recent History" />

      {/* LIST / LOADING SECTION WRAPPED IN THE REFRESH CONTAINER */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD54F" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <RefreshContainer
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listPadding}
          >
            {historyItems.length > 0 ? (
              // ✅ MAPPED RENDERING PREVENTS FLATLIST WITHIN SCROLLVIEW COMPATIBILITY CRASHES
              <View style={{ paddingBottom: 40 }}>
                {historyItems.map((item, index) => renderItem(item, index))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No recent searches yet.</Text>
              </View>
            )}
          </RefreshContainer>

          {/* FOOTER FIXED SELECTION NAVIGATION */}
          {/* FOOTER FIXED SELECTION NAVIGATION */}
          {historyItems.length > 0 && (
            <View style={styles.footerNav}>
              <TouchableOpacity style={styles.selectAllContainer} onPress={toggleSelectAll}>
                <View style={[
                  styles.checkbox, 
                  selectedIds.size === historyItems.length && historyItems.length > 0 && styles.checkboxActive
                ]}>
                  {selectedIds.size === historyItems.length && historyItems.length > 0 && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
                <Text style={styles.selectAllText}>All</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.deleteBtn, selectedIds.size === 0 && styles.deleteBtnDisabled]} 
                onPress={confirmDelete}
                disabled={selectedIds.size === 0 || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.deleteBtnText}>Delete ({selectedIds.size})</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      
      <ConfirmOverlay 
        visible={showConfirmModal}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${selectedIds.size} history item(s)?`}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={processDeletion}
        isConfirming={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 15,
  },
  backBtn: { padding: 5 },
  backImg: { width: 22, height: 22, tintColor: '#421C00' },
  title: { 
    fontSize: 22, 
    fontFamily: 'Poppins-Bold', 
    color: '#FFB800' 
  },
  listPadding: { 
    paddingHorizontal: 20,
    paddingBottom: 120, // Expanded padding to clear space above footer controls cleanly
    paddingTop: 10,
    flexGrow: 1
  },
  cardContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  checkboxContainer: { paddingRight: 10 },
  checkbox: { 
    width: 22, 
    height: 22, 
    borderWidth: 2, 
    borderColor: '#FFB800', 
    borderRadius: 6, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkboxActive: { backgroundColor: '#FFB800' },
  checkboxInner: { width: 10, height: 10, backgroundColor: '#FFF', borderRadius: 2 },
  historyCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  wordText: { 
    fontSize: 18, 
    fontFamily: 'Poppins-Bold', 
    color: '#421C00' 
  },
  timeText: { 
    fontSize: 12, 
    color: '#8E8E8E', 
    fontFamily: 'Poppins-Regular',
    marginTop: 2
  },
  arrowIcon: { 
    width: 16, 
    height: 16, 
    transform: [{ rotate: '180deg' }], 
    tintColor: '#FFD54F' 
  },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 60, // Better center layout when rendering empty inside the container
    paddingHorizontal: 40 
  },
  emptyIcon: { width: 50, height: 50, marginBottom: 15 },
  emptyText: { 
    color: '#ADB5BD', 
    fontFamily: 'Poppins-Medium',
    fontSize: 16 
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  footerNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  selectAllContainer: { flexDirection: 'row', alignItems: 'center' },
  selectAllText: { marginLeft: 10, fontSize: 16, color: '#421C00', fontFamily: 'Poppins-Bold' },
  deleteBtn: { backgroundColor: '#FF5252', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 12 },
  deleteBtnDisabled: { backgroundColor: '#FFCDD2' },
  deleteBtnText: { color: '#FFF', fontFamily: 'Poppins-Bold' }
});
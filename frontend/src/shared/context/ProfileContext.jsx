import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import { useProfileData } from '../hooks/profile/useProfileData';
import { useProfileNetwork } from '../hooks/profile/useProfileNetwork';
import { getUserRoleAndMode, getAuthSession } from '../services/profile/userService';
import { supabase } from '../api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasInitialized = useRef(false);

  const { isConnected } = useProfileNetwork();
  const profileData = useProfileData();
  const { resetProfileData } = profileData;

  const loadProfileData = useCallback(async (isManualRefresh = false) => {
    if (!isConnected) {
      setRefreshing(false);
      return; 
    }
    
    if (!hasInitialized.current && !isManualRefresh) {
      setLoading(true);
    }

    try {
      const session = await getAuthSession();

      if (!session) {
        resetProfileData();
        return;
      }

      // 1. INSTANT HYDRATION: Read from cache if available so UI doesn't say "User"
      try {
        const cachedStr = await AsyncStorage.getItem('dialectgo_saved_profiles_cache');
        if (cachedStr) {
          const cachedProfiles = JSON.parse(cachedStr);
          const myProfile = cachedProfiles.find(p => p.user_id === session.user.id);
          if (myProfile) {
            profileData.hydrateProfileData(myProfile);
          }
        }
      } catch (cacheErr) {
        // ignore cache errors
      }

      // 2. BACKGROUND FETCH: Get fresh data from the server
      await Promise.all([
        profileData.fetchUserProfile(session.access_token),
        profileData.fetchStreak(session.access_token)
      ]);

    } catch (error) {
      console.log('Profile load error:', error);
      resetProfileData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isConnected, profileData.fetchUserProfile, profileData.fetchStreak, profileData.resetProfileData]);

  useEffect(() => {
    if (!isConnected) {
      setLoading(false); 
      setRefreshing(false);
      resetProfileData();
      return;
    }

    // Subscribe to auth state changes so we correctly handle app restarts
    // and wait for Supabase to finish reading from AsyncStorage.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          loadProfileData();
        } else {
          resetProfileData();
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        resetProfileData();
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [isConnected, loadProfileData, resetProfileData]);

  const refreshProfile = () => {
    setRefreshing(true);
    loadProfileData(true);
  };

  return (
    <ProfileContext.Provider value={{
      loading,
      refreshing,
      isConnected,
      refreshProfile,
      ...profileData
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => useContext(ProfileContext);

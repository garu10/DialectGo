import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { endpoints } from '../../api/client';
import { getValidSession } from '../authService';
import { supabase } from '../../api/supabase';

const DEVICE_ID_KEY = 'dialectgo_device_id';

/**
 * Get or generate a persistent device UUID.
 * Stored in SecureStore (survives reinstall on iOS via Keychain,
 * and on Android if backup is enabled).
 */
export const getDeviceId = async () => {
  try {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Failed to get/create device ID:', error);
    // Fallback: generate a UUID but it won't persist across reinstalls
    return Crypto.randomUUID();
  }
};

/**
 * Save the current user's profile to this device's saved profiles list.
 * Requires an active auth session.
 */
export const saveProfileToDevice = async ({ email, first_name, last_name, avatar_url, auth_provider }) => {
  try {
    const session = await getValidSession();
    if (!session) return null;

    const deviceId = await getDeviceId();

    const response = await fetch(endpoints.DEVICE_PROFILES_SAVE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: deviceId,
        email,
        first_name,
        last_name,
        avatar_url,
        auth_provider: auth_provider || 'email',
      }),
    });

    const result = await response.json();
    if (result.success) {
      // Store the refresh token securely for one-click login
      if (session.refresh_token && session.user?.id) {
        await SecureStore.setItemAsync(`dialectgo_refresh_${session.user.id}`, session.refresh_token);
      }
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to save device profile:', error);
    return null;
  }
};

/**
 * Get all saved profiles for this device.
 * Does NOT require auth (pre-login screen).
 */
export const getSavedProfiles = async () => {
  try {
    // 1. Instantly return cached profiles (Stale-While-Revalidate pattern)
    const cachedData = await AsyncStorage.getItem('dialectgo_saved_profiles_cache');
    
    const deviceId = await getDeviceId();
    const url = endpoints.DEVICE_PROFILES_GET(deviceId);

    // 2. Fire the network request silently in the background
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          AsyncStorage.setItem('dialectgo_saved_profiles_cache', JSON.stringify(result.data));
        }
        return result.success ? result.data : [];
      })
      .catch(err => {
        console.error('Background profile sync failed:', err);
        return [];
      });

    // 3. If we have cached data, return it immediately to unblock the UI!
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // 4. If no cache exists (first ever app load), await the network request
    return await fetchPromise;
  } catch (error) {
    console.error('Failed to get saved profiles:', error);
    return [];
  }
};

/**
 * Remove a saved profile from this device.
 * Does NOT require auth (pre-login removal).
 */
export const removeProfileFromDevice = async (userId) => {
  try {
    const deviceId = await getDeviceId();
    const url = endpoints.DEVICE_PROFILES_REMOVE(deviceId, userId);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    if (result.success) {
      await SecureStore.deleteItemAsync(`dialectgo_refresh_${userId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to remove device profile:', error);
    return false;
  }
};

/**
 * Perform a passwordless login using a saved refresh token.
 */
export const loginWithSavedProfile = async (userId) => {
  try {
    const token = await SecureStore.getItemAsync(`dialectgo_refresh_${userId}`);
    console.log("Passwordless login: Retrieved token?", !!token);
    if (!token) return false;
    
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });
    console.log("Passwordless login: Supabase result ->", data?.session ? "Success" : "Failed", error);
    
    if (error || !data?.session) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Passwordless login failed:', error);
    return false;
  }
};

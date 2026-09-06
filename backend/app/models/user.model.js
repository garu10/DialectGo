import { supabase, supabaseAdmin, getAuthClient } from '../config/db.js';
import { createClient } from '@supabase/supabase-js';
import { updateUser } from './user.model.js';

const getAuthenticatedClient = (token) => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }
  );
};
// AUTH
export const registerUser = async (data) => {
  const { email, password, ...meta } = data;

  const { data: result, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: meta }
  });

  if (error) throw error;

  // Supabase secure email enumeration protection returns a fake user with an empty identities array if the email already exists
  if (result?.user?.identities && result.user.identities.length === 0) {
    throw new Error("This email is already registered.");
  }

  // Explicitly sync additional metadata into the public.profiles table
  // because the Postgres trigger misses these non-standard camelCase keys.
  if (result.user) {
    try {
      await updateUser(result.user.id, {
        birth_date: meta.birthDate || null,
        country: meta.country || null,
        province: meta.province || null,
        city: meta.city || null,
        username: meta.username || null,
        preferred_language_code: meta.preferredLanguageCode || null
      });
    } catch (syncError) {
      console.error("Warning: Could not sync additional profile data:", syncError);
    }
  }

  return result.user;
};

export const loginUser = async (email, password) => {
  // Log the email attempting to authenticate for debugging (do NOT log passwords)
  console.log('Attempting signInWithPassword for:', email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
};

// PROFILE (RLS SAFE)
export const getProfileById = async (id, token) => {
  const client = getAuthClient(token);
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateProfileById = async (userId, updateData, token) => {
    const client = getAuthClient(token);
    // Complete mapping: Ensure these keys match your Database column names exactly
    const mapping = {
        firstName: 'first_name',
        lastName: 'last_name',
        middleName: 'middle_name',
        birthDate: 'birth_date',
        addressLine: 'address_line',
        country: 'country',
        province: 'province',
        city: 'city',
        username: 'username',
        preferredLanguageCode: 'preferred_language_code'
    };

    // Transform the incoming data
    const dbData = {};
    for (const [key, value] of Object.entries(updateData)) {
        // Use mapped name if it exists, otherwise assume the key is already the correct column name
        const dbKey = mapping[key] || key; 
        dbData[dbKey] = value;
    }

    // Perform the update
    const { data, error } = await client
        .from('profiles')
        .update(dbData)
        .eq('id', userId)
        .select();
    
    if (error) throw error;
    return data;
};

// ADMIN (uses service role)
export const getAllUsers = async () => {
  const { data, error } = await supabaseAdmin.from('profiles').select('*');
  if (error) throw error;
  return data;
};

export const getUserById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateUser = async (id, dataUpdate) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(dataUpdate)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};

export const deleteUser = async (id) => {
  const { error } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Add to user.model.js
// user.model.js

export const calculateAndSyncStreak = async (userId, token) => {
  const client = getAuthClient(token);
  // 1. Fetch all translation timestamps for this user
  // Helper to reliably get Manila date in YYYY-MM-DD
  const getManilaDateString = (dateObj) => {
    return dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  };

  const { data, error } = await client
    .from('translation_history')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // 2. Map translations to unique dates and count them
  const dayCounts = {};
  data.forEach(row => {
    // Convert UTC timestamp from DB to Manila local date string (YYYY-MM-DD)
    const date = getManilaDateString(new Date(row.created_at));
    dayCounts[date] = (dayCounts[date] || 0) + 1;
  });

  // 3. Identify "Active Days" (days with 3 or more translations)
  const activeDays = Object.keys(dayCounts)
    .filter(date => dayCounts[date] >= 3)
    .sort((a, b) => new Date(b) - new Date(a)); // Newest first

  if (activeDays.length === 0) {
    await client.from('profiles').update({ streak_count: 0 }).eq('id', userId);
    return { streak: 0, activeDays: [] };
  }

  // 4. Calculate consecutive days
  let streak = 0;
  const todayObj = new Date();
  const today = getManilaDateString(todayObj);
  
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = getManilaDateString(yesterdayObj);

  // Check if the user is active today or was at least active yesterday
  // If not, the streak has already broken.
  if (activeDays[0] === today || activeDays[0] === yesterdayStr) {
    streak = 1;
    for (let i = 0; i < activeDays.length - 1; i++) {
      const current = new Date(activeDays[i]);
      const next = new Date(activeDays[i + 1]);
      
      // Calculate difference in days
      const diffTime = Math.abs(current - next);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else {
        break; // Streak broken
      }
    }
  }

  // 5. Sync to profile
  await client
    .from('profiles')
    .update({ streak_count: streak })
    .eq('id', userId);

  return { streak, activeDays };
};

export const loginAsGuest = async () => {
  // Utilizing Supabase's native anonymous sign-in feature
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        role: 'guest',
        is_anonymous: true
      }
    }
  });

  if (error) throw error;
  return data; // Returns session token, refresh token, and user properties
};
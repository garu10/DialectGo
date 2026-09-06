import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router'; // Para sa auto-redirect
import { supabase } from '../src/shared/api/supabase';
import OpeningAnimation from '../src/components/OpeningAnimation';
import AutoSplash from '../src/components/AutoSplash';
import Onboarding from '../src/components/Onboarding';
import AuthTransition from './auth/AuthTransition';

import { getSavedProfiles } from '../src/shared/services/profile/deviceProfileService';

export default function MainIndex() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [session, setSession] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // 1. Check session once when the app starts
  useEffect(() => {
    const checkState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        setCurrentScreen('home'); // Skip everything if they have a session
        return; // Fast path!
      }

      // SLOW PATH: Only fetch saved profiles if they are not logged in
      const profiles = await getSavedProfiles();

      if (profiles && profiles.length > 0) {
        setCurrentScreen('auth'); // Skip animations and go to Profile List
      } else {
        setCurrentScreen('intro-splash'); // First-time user, no profiles
      }
    };

    checkState();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleIntroFinish = () => setCurrentScreen('onboarding');
  const handleAutoFinish = () => setCurrentScreen('home');
  const handleOnboardingFinish = () => session ? setCurrentScreen('home') : setCurrentScreen('auth');

  // STEP 4: Redirect to Tabs if authenticated
  if (currentScreen === 'home' || (currentScreen === 'auth' && session)) {
    return <Redirect href="/(tabs)/Home" />;
  }

return (
    <View style={styles.container}>
      {/* 1. Loading state while checking Supabase */}
      {currentScreen === 'loading' && <ActivityIndicator size="large" color="#FFD54F" />}

      {/* 2. New User: Shows Opening Animation */}
      {currentScreen === 'intro-splash' && (
        <OpeningAnimation onFinish={handleIntroFinish} />
      )}

      {/* 3. Existing User: Shows Splash that fades out automatically */}
      {currentScreen === 'auto-splash' && (
        <AutoSplash onFinish={handleAutoFinish} />
      )}

      {currentScreen === 'onboarding' && (
        <Onboarding onFinish={handleOnboardingFinish} />
      )}

      {currentScreen === 'auth' && !session && (
        <AuthTransition />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
});
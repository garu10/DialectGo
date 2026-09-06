import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  Keyboard
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { endpoints } from '../../src/shared/api/client';
import { styles } from '../../src/features/auth/styles/AuthTransitionStyles';
import { useToast } from '../../src/shared/context/ToastContext';
import { getSavedProfiles, loginWithSavedProfile } from '../../src/shared/services/profile/deviceProfileService';
import { useProfileContext } from '../../src/shared/context/ProfileContext';
import SavedProfileCard from '../../src/features/auth/components/SavedProfileCard';

// FIXED IMPORTS: 
// 1. '../login' dahil nasa app/login.jsx (lowercase 'l')
// 2. './Register' dahil magkatabi sila sa auth/ folder
import LogIn from '../login'; 
import SignUp from './Register'; 

const { height } = Dimensions.get('window');
const MAX_UP = 0; // Snap to very top of screen
const MIN_DOWN = height + 300;      

export default function AuthTransition() {
  const router = useRouter();
  const translateY = useRef(new Animated.Value(height + 300)).current; 
  const lastY = useRef(height + 300);
  const gestureStartY = useRef(height + 300);
  const [activeForm, setActiveForm] = useState('login'); 
  const [initialEmail, setInitialEmail] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);
  const { showToast } = useToast();
  const { hydrateProfileData } = useProfileContext();

  useFocusEffect(
    React.useCallback(() => {
      const fetchProfiles = async () => {
        const data = await getSavedProfiles();
        setProfiles(data || []);
        setIsLoadingProfiles(false);
      };
      fetchProfiles();
    }, [])
  );

  React.useEffect(() => {
    const listener = translateY.addListener(({ value }) => {
      lastY.current = value;
    });
    return () => translateY.removeListener(listener);
  }, [translateY]);

  // --- ANIMATION LOGIC (PAN RESPONDER) ---
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        gestureStartY.current = lastY.current;
        translateY.setOffset(lastY.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (e, gestureState) => {
        const newY = gestureStartY.current + gestureState.dy;
        if (newY < -180) {
          translateY.setValue(-180 - gestureStartY.current);
        } else {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        translateY.flattenOffset();
        const finalY = gestureStartY.current + gestureState.dy;

        // Swipe down fast, or pulled down significantly
        if (gestureState.vy > 0.2 || gestureState.dy > 40 || finalY > 100) {
          closeSheet();
        } 
        // Swipe up fast, or pulled up significantly
        else if (gestureState.vy < -0.5 || gestureState.dy < -40 || finalY < -50) {
          Animated.spring(translateY, {
            toValue: -180,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        } 
        // Snap back to default open state
        else {
          openSheet();
        }
      },
    })
  ).current;

  const handlePress = (formType, email = '') => {
    setActiveForm(formType);
    setInitialEmail(email);
    openSheet();
  };

  const openSheet = () => {
    Animated.spring(translateY, {
      toValue: MAX_UP,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: MIN_DOWN,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // SUCCESS REDIRECT: Kapag naka-login na, pupunta sa Home
  const handleLoginSuccess = () => {
    router.replace('/(tabs)/Home');
  };

  const parseJsonResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
    }

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch (err) {
        throw new Error(`Invalid JSON response: ${text}`);
      }
    }

    throw new Error(`Expected JSON response but got ${contentType}: ${text}`);
  };



  return (
    <View style={styles.container}>
      {/* Quick Login Overlay */}
      {isQuickLoggingIn && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(28, 36, 44, 0.7)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#FFD54F" />
        </View>
      )}

      {/* Dynamic Content Based on Profiles */}
      {isLoadingProfiles ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FFC107" />
        </View>
      ) : profiles.length > 0 ? (
        // --- MULTI-PROFILE VIEW ---
        <View style={{ flex: 1, width: '100%', paddingHorizontal: 20, paddingTop: 60 }}>
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <Image 
              source={require('../../assets/logo/bee.png')} 
              style={{ width: 60, height: 60 }} 
              resizeMode="contain" 
            />
          </View>

          <View style={{ flex: 1 }}>
            {profiles.map(p => (
              <SavedProfileCard
                key={p.user_id}
                profile={p}
                onPress={async (profile) => {
                  // Pre-hydrate the profile globally BEFORE starting the login request!
                  if (hydrateProfileData) {
                    hydrateProfileData(profile);
                  }
                  
                  setIsQuickLoggingIn(true);
                  const success = await loginWithSavedProfile(profile.user_id);
                  setIsQuickLoggingIn(false);
                  
                  if (success) {
                    showToast(`Welcome back, ${profile.first_name || 'User'}!`, 'success');
                    handleLoginSuccess();
                  } else {
                    // Fall back to asking for password
                    showToast('Session expired. Please enter your password.', 'info');
                    handlePress('login', profile.email);
                  }
                }}
              />
            ))}
          </View>
          
          <View style={{ paddingBottom: 60 }}>
            <TouchableOpacity style={[styles.signUpBtn, { marginBottom: 15 }]} onPress={() => handlePress('login')}>
              <Text style={styles.signUpBtnText}>Use another profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={() => handlePress('signup')}>
              <Text style={styles.loginBtnText}>Create new account</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ alignItems: 'center', marginTop: 10 }}
              onPress={() => router.push('/auth/ManageProfiles')}
            >
              <Text style={{ color: '#888', fontFamily: 'Poppins-Medium' }}>Manage Accounts</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // --- ORIGINAL VIEW ---
        <>
          <View style={styles.content}>
            <Image 
              source={require('../../assets/logo/bee.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <Text style={styles.brandText}>DialectGo</Text>
            <Text style={styles.tagline}>Bridge the gap, one word at a time.</Text>
          </View>

          <View style={styles.buttonWrapper}>
            <TouchableOpacity style={styles.loginBtn} onPress={() => handlePress('login')}>
              <Text style={styles.loginBtnText}>LOG IN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signUpBtn} onPress={() => handlePress('signup')}>
              <Text style={styles.signUpBtnText}>SIGN UP</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* --- ANIMATED SHEET --- */}
      <Animated.View 
        style={[
          styles.animatedOverlay, 
          { transform: [{ translateY: translateY }] }
        ]}
      >
        <View style={{ flex: 1 }}>
            {activeForm === 'login' ? (
              <LogIn 
                onSwitch={() => setActiveForm('signup')} 
                onSuccess={handleLoginSuccess} 
                panHandlers={panResponder.panHandlers}
                initialEmail={initialEmail}
              />
            ) : (
              <SignUp 
                onSwitch={() => setActiveForm('login')} 
                onSuccess={handleLoginSuccess} 
                panHandlers={panResponder.panHandlers}
              />
            )}
        </View>
      </Animated.View>
    </View>
  );
}
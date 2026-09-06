import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,

  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from '../../src/features/auth/styles/LoginStyles';
import { useRouter } from 'expo-router';
import { endpoints } from '../../src/shared/api/client';
import { supabase } from '../../src/shared/api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { deriveUsername } from '../../src/shared/utils/stringUtils';
import { formatBirthDate } from '../../src/shared/utils/dateUtils';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useProfileContext } from '../../src/shared/context/ProfileContext';
import { useToast } from '../../src/shared/context/ToastContext';
import TermsAndAgreementModal from '../../src/features/auth/components/TermsAndAgreementModal';
import AnimatedJeep from '../../src/features/auth/components/AnimatedJeep';
import NetInfo from '@react-native-community/netinfo';

WebBrowser.maybeCompleteAuthSession();

const API_URL = endpoints.USER_REGISTER;

export default function SignUp({ onSwitch, onSuccess, panHandlers }) {
  const router = useRouter();
  const { refreshProfile } = useProfileContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Address States
  const [country, setCountry] = useState('Philippines'); // Default value
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');

  // Date of Birth States
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const { showToast } = useToast();

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
      setDateSelected(true);
    }
  };

  const handleRegister = async () => {
    let newErrors = {};
    const fName = firstName.trim();
    const lName = lastName.trim();
    const em = email.trim();
    const pwd = password.trim();
    const cpwd = confirmPassword.trim();
    
    // 1. Empty Field Validation
    if (!fName) newErrors.firstName = "First name is required";
    if (!lName) newErrors.lastName = "Last name is required";
    if (!dateSelected) newErrors.birthDate = "Birthdate is required";
    if (!country) newErrors.country = "Country is required";
    if (!province) newErrors.province = "Province is required";
    if (!city) newErrors.city = "City is required";
    if (!em) newErrors.email = "Email is required";
    if (!pwd) newErrors.password = "Password is required";
    if (!cpwd) newErrors.confirmPassword = "Confirm password is required";
    if (!termsAccepted) newErrors.terms = "You must agree to the Terms and Agreement";

    // 2. Email Format Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (em && !emailRegex.test(em)) {
      newErrors.email = "Please enter a valid Gmail address (e.g. user@gmail.com)";
    }

    // 3. Password Strength & Matching
    if (pwd && pwd.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (pwd && cpwd && pwd !== cpwd) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("Palihug kumpletoha ang tanang fields o sunda ang porma.", "error", "Error");
      return;
    }

    // 4. Network Connectivity Check (Disabled to speed up registration and prevent emulator stalls)
    // const netInfo = await NetInfo.fetch();
    // if (!netInfo.isConnected) {
    //   showToast("No internet connection. Please check your network and try again.", "error", "Offline");
    //   return;
    // }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          birthDate: formatBirthDate(birthDate),
          country,
          province,
          city,
          // addressLine: `${city}, ${province}, ${country}`,
          username: deriveUsername(email),
          preferredLanguageCode: 'en'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      const errMsg = error.message.toLowerCase();
      if (errMsg.includes('already registered') || errMsg.includes('already exists')) {
        setErrors({ email: "This email is already registered." });
      } else {
        showToast(error.message, 'error', 'Sign Up Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const redirectUrl = makeRedirectUri({ scheme: 'dialectgo' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          console.log("Supabase WebBrowser Google Login success!");

          // Extract tokens from the URL hash
          const hashSplit = result.url.split('#');
          if (hashSplit.length > 1) {
            const params = {};
            hashSplit[1].split('&').forEach(param => {
              const [key, value] = param.split('=');
              params[key] = decodeURIComponent(value);
            });

            if (params.access_token && params.refresh_token) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token,
              });
              if (sessionError) throw sessionError;
              console.log("Successfully set Supabase OAuth session!");
            }
          }

          await AsyncStorage.removeItem('@guest_mode');
          await AsyncStorage.setItem('@user_role', 'authenticated');

          refreshProfile();

          if (onSuccess) onSuccess();
          else router.replace('../(tabs)/Home');
        }
      }

    } catch (error) {
      console.error("Google Sign-In Error:", error);
      showToast(error.message || 'Authentication failed', 'error', 'Google Sign-In Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TermsAndAgreementModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        isAccepted={termsAccepted}
        onAccept={() => setTermsAccepted(true)}
      />

      {/* --- SUCCESS MODAL --- */}
      <Modal visible={isSuccess} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', width: '100%', borderRadius: 30, padding: 30, alignItems: 'center' }}>
            <View style={{ backgroundColor: '#4CAF50', width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#FFF', fontSize: 40 }}>✓</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center' }}>Account Registered!</Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10, lineHeight: 20 }}>
              Malipayong pag-abot! Palihug pag-log in gamit ang imong bag-ong credentials.
            </Text>

            <TouchableOpacity
              style={[styles.bubblePrimaryBtn, { marginTop: 30, width: '100%' }]}
              onPress={() => {
                setIsSuccess(false);
                onSwitch(); // Switches the form inside the sheet to Login
                // Optional: call onSuccess() here if you want to close the sheet entirely
              }}
            >
              <Text style={styles.primaryBtnText}>PROCEED TO LOGIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* --- HEADER SECTION --- */}
        <View style={styles.topHalf}>
          <Text style={styles.welcomeTextBold}>Maayong pag-abot!</Text>
          <Text style={styles.welcomeSubtitle}>Learn More. Speak Better. Connect Easier</Text>

          <AnimatedJeep />
        </View>

        {/* --- YELLOW BUBBLE CARD --- */}
        <View style={[styles.loginCard, { paddingBottom: 0, paddingHorizontal: 0 }]}>
          {panHandlers && (
            <View {...panHandlers} style={styles.dragHandler}>
              <View style={styles.closeIndicator} />
            </View>
          )}

          <ScrollView
            contentContainerStyle={[styles.scrollContainer, { paddingBottom: 250, paddingHorizontal: 25 }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.cardLabel}>SIGN UP</Text>

            {/* Name Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <Text style={styles.labelShadow}>First Name</Text>
                <TextInput style={[styles.bubbleInput, errors.firstName ? { borderColor: '#FF4D4D', borderWidth: 1.5 } : null]} placeholder="First" value={firstName} onChangeText={(t) => { setFirstName(t); if (errors.firstName) setErrors({ ...errors, firstName: null }); }} />
                {errors.firstName && <Text style={{ color: '#FF4D4D', fontSize: 12, marginTop: 4, marginLeft: 10, fontWeight: 'bold' }}>{errors.firstName}</Text>}
              </View>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <Text style={styles.labelShadow}>Last Name</Text>
                <TextInput style={[styles.bubbleInput, errors.lastName ? { borderColor: '#FF4D4D', borderWidth: 1.5 } : null]} placeholder="Last" value={lastName} onChangeText={(t) => { setLastName(t); if (errors.lastName) setErrors({ ...errors, lastName: null }); }} />
                {errors.lastName && <Text style={{ color: '#FF4D4D', fontSize: 12, marginTop: 4, marginLeft: 10, fontWeight: 'bold' }}>{errors.lastName}</Text>}
              </View>
            </View>

            {/* Birthdate */}
            <View style={styles.inputGroup}>
              <Text style={styles.labelShadow}>Birthdate</Text>
              <TouchableOpacity
                style={[styles.bubbleInput, { justifyContent: 'center' }, errors.birthDate ? { borderColor: '#FF4D4D', borderWidth: 1.5 } : null]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: dateSelected ? '#000' : '#999' }}>
                  {dateSelected ? birthDate.toDateString() : "Select Birthdate"}
                </Text>
              </TouchableOpacity>
              {errors.birthDate && <Text style={{ color: '#FF4D4D', fontSize: 12, marginTop: 4, marginLeft: 10, fontWeight: 'bold' }}>{errors.birthDate}</Text>}
              {showDatePicker && (
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={onChangeDate}
                />
              )}
            </View>

            {/* Country */}
            <View style={styles.inputGroup}>
              <Text style={styles.labelShadow}>Country</Text>
              <TextInput style={[styles.bubbleInput, errors.country ? { borderColor: '#FF4D4D', borderWidth: 1.5 } : null]} placeholder="Country" value={country} onChangeText={(t) => { setCountry(t); if (errors.country) setErrors({ ...errors, country: null }); }} />
              {errors.country && <Text style={{ color: '#FF4D4D', fontSize: 12, marginTop: 4, marginLeft: 10, fontWeight: 'bold' }}>{errors.country}</Text>}
            </View>

            {/* Province & City Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <Text style={styles.labelShadow}>Province</Text>
                <TextInput style={[styles.bubbleInput, errors.province ? { borderColor: '#FF4D4D', borderWidth: 1.5 } : null]} placeholder="Province" value={province} onChangeText={(t) => { setProvince(t); if (errors.province) setErrors({ ...errors, province: null }); }} />
                {errors.province && <Text style={{ color: '#FF4D4D', fontSize: 12, marginTop: 4, marginLeft: 10, fontWeight: 'bold' }}>{errors.province}</Text>}
              </View>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <Text style={styles.labelShadow}>City</Text>
                <TextInput style={[styles.bubbleInput, errors.city ? { borderColor: '#FF4D4D', borderWidth: 1.5 } : null]} placeholder="City" value={city} onChangeText={(t) => { setCity(t); if (errors.city) setErrors({ ...errors, city: null }); }} />
                {errors.city && <Text style={{ color: '#FF4D4D', fontSize: 12, marginTop: 4, marginLeft: 10, fontWeight: 'bold' }}>{errors.city}</Text>}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelShadow}>Email</Text>
              <TextInput 
                style={[styles.bubbleInput, errors.email ? { borderColor: '#FF4D4D', borderWidth: 1.5 } : null]} 
                placeholder="email@example.com" 
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={email} 
                onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: null }); }} 
                onBlur={() => {
                  const em = email.trim();
                  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
                  if (em && !emailRegex.test(em)) {
                    setErrors(prev => ({ ...prev, email: "Please enter a valid Gmail address (e.g. user@gmail.com)" }));
                  }
                }}
              />
              {errors.email && <Text style={{ color: '#FF4D4D', fontSize: 12, marginTop: 4, marginLeft: 10, fontWeight: 'bold' }}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelShadow}>Password</Text>
              <View style={[styles.bubbleInput, { flexDirection: 'row', alignItems: 'center', paddingRight: 15, paddingVertical: 0 }, errors.password ? { borderColor: '#FF4D4D', borderWidth: 1.5 } : null]}>
                <TextInput
                  style={{ flex: 1, paddingVertical: Platform.OS === 'ios' ? 12 : 10, color: '#000' }}
                  placeholder="••••••••"
                  secureTextEntry={secureTextEntry}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (errors.password) setErrors({ ...errors, password: null, confirmPassword: null }); }}
                />
                <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                  <FontAwesome5 name={secureTextEntry ? "eye-slash" : "eye"} size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={{ color: '#FF4D4D', fontSize: 12, marginTop: 4, marginLeft: 10, fontWeight: 'bold' }}>{errors.password}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelShadow}>Confirm Password</Text>
              <View style={[styles.bubbleInput, { flexDirection: 'row', alignItems: 'center', paddingRight: 15, paddingVertical: 0 }, errors.confirmPassword ? { borderColor: '#FF4D4D', borderWidth: 1.5 } : null]}>
                <TextInput
                  style={{ flex: 1, paddingVertical: Platform.OS === 'ios' ? 12 : 10, color: '#000' }}
                  placeholder="••••••••"
                  secureTextEntry={confirmSecureTextEntry}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null }); }}
                />
                <TouchableOpacity onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}>
                  <FontAwesome5 name={confirmSecureTextEntry ? "eye-slash" : "eye"} size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={{ color: '#FF4D4D', fontSize: 12, marginTop: 4, marginLeft: 10, fontWeight: 'bold' }}>{errors.confirmPassword}</Text>}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, paddingHorizontal: 5 }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 11, color: '#6B7280', marginRight: 4 }}>Do you agree on</Text>
              <TouchableOpacity onPress={() => setShowTerms(true)}>
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 11, color: '#6B7280', textDecorationLine: 'underline', marginRight: 8 }}>Terms and Agreement?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 18,
                  height: 18,
                  backgroundColor: termsAccepted ? '#FFC107' : '#FFD54D',
                  borderRadius: 4,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => setTermsAccepted(!termsAccepted)}
              >
                {termsAccepted && <FontAwesome5 name="check" size={10} color="#421C00" />}
              </TouchableOpacity>
            </View>
            {errors.terms && <Text style={{ color: '#FF4D4D', fontSize: 12, marginTop: 4, marginBottom: 15, marginLeft: 5, fontWeight: 'bold' }}>{errors.terms}</Text>}

            <TouchableOpacity style={[styles.bubblePrimaryBtn, { marginTop: 10 }]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>SIGN UP</Text>}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.lineText}>OR</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.googleBtnContainer}>
              <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={loading}>
                <FontAwesome5 name="google" size={20} color="#DB4437" />
                <Text style={styles.googleBtnText}>Sign Up with Google</Text>
              </TouchableOpacity>
              <Text style={styles.soonText}>More sign-up options coming soon...</Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  if (onSwitch) onSwitch();
                  else router.push('../login');
                }}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
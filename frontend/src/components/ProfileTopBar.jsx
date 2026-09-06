import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { Image,  StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * @param {string} title - The text to display in the center (defaults to "Profile")
 */
const ProfileTopBar = ({ title = "Profile" }) => {
  const router = useRouter();

  return (
    <View style={styles.transparentWrapper}>
      <SafeAreaView edges={['top']}>
        <View style={styles.topBar}>
          
          {/* LEFT: Back Button */}
          <View style={styles.sectionLeft}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backBtn}
              activeOpacity={0.7}
            >
               <Image 
                source={require('../../assets/icons/nav/back_icon.png')} 
                style={styles.backIcon} 
                resizeMode="contain"
               />
            </TouchableOpacity>
          </View>

          {/* CENTER: Dynamic Title */}
          <View style={styles.sectionCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>

          {/* RIGHT: Empty ghost view to keep the title centered */}
          <View style={styles.sectionRight} />

        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  transparentWrapper: {
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sectionLeft: {
    flex: 1, // Balance weight
    alignItems: 'flex-start',
  },
  sectionCenter: {
    flex: 3, // More space for long titles
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRight: {
    flex: 1, // Balance weight (matches sectionLeft)
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'transparent',

    // iOS shadow
    shadowColor: '#421C00',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,

    // Android shadow
    elevation: 3,
  },

  backIcon: {
    width: 36,
    height: 36,

    resizeMode: 'contain',
  },
});

export default ProfileTopBar;
import { Dimensions, StyleSheet, Platform } from 'react-native';
import { colors } from '../../../shared/theme/colorPalette';
import { fonts } from '../../../shared/theme/typography';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({

  // Tarsi Header Styles
  tarsiHeader: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 5, // Reduced gap between greeting and banner
  },
  tarsiDate: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textGray,
    letterSpacing: 1,
    marginBottom: 4,
  },
  tarsiGreeting: {
    fontSize: 26,
    color: colors.textDark,
    fontFamily: 'System', // Use default font but could be custom
  },

  // --- MAIN CONTAINER ---
  container: {
    flex: 1,
    backgroundColor: colors.background, // o kahit anong background color ng app mo
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Para sa Android
  },
  
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 120, // Space para hindi matakpan ng Bottom Tab
    paddingTop: 0,
  },

  // --- TOP BAR (CLEAN VERSION) ---
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 15,
    backgroundColor: colors.white,
  },
  miniLogoHeader: {
    width: 45,
    height: 45,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },

  // --- AESTHETIC HEADER ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  headerTextGroup: {
    flex: 1,
  },
  helloText: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: '#A0A0A0',
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.accent,
    lineHeight: 38,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.success, // Green indicator
  },
  avatarWrapper: {
    position: 'relative',
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarMain: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.white,
  },
  levelText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  // --- SECTION HEADER ---
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.accent,
  },
  titleAccentYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
    marginTop: 8, // Center alignment fix for Poppins
  },

  // --- JEEPNEY PROMO CARD ---
  promoCardWrapper: {
    marginTop: 35, // Binigyan ng space yung mga bees sa itaas
    marginBottom: 120, // Bottom Tab safe zone
    position: 'relative',
    overflow: 'visible', // REQUIRED: Para lumabas ang bees at jeep sa border
  },
  promoCard: {
    backgroundColor: colors.accent,
    borderRadius: 40,
    padding: 25,
    flexDirection: 'row',
    height: 175,
    elevation: 15,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    zIndex: 5, // Baseline layer
  },
  promoTextContainer: {
    flex: 1.4,
    justifyContent: 'center',
  },
  promoLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  promoBrand: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.white,
    lineHeight: 40,
    marginBottom: 15,
  },
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    elevation: 4,
  },
  exploreBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.accent,
    textTransform: 'uppercase',
  },

  // --- JEEPNEY (FIXED LAYER) ---
  jeepneyImageFixed: {
    width: 200,
    height: 140,
    position: 'absolute',
    right: -15,
    bottom: -15, // "Parked" effect sa baba ng card
    zIndex: 10, // Above card, below some bees
  },

  // --- LIVELY BEE SWARM (5 BEES) ---
  flyingBee: {
    position: 'absolute',
    zIndex: 20, // Topmost layer
  },
  // Bee 1: Top Left (Main Bee)
  bee1: {
    top: -25,
    left: 10,
    width: 45,
    height: 45,
    transform: [{ rotate: '-20deg' }],
  },
  // Bee 2: Center Right (Overlap sa Jeep)
  bee2: {
    top: 20,
    right: -25,
    width: 32,
    height: 32,
    transform: [{ rotate: '45deg' }],
  },
  // Bee 3: Bottom Left (Lower Card)
  bee3: {
    bottom: -20,
    left: 40,
    width: 38,
    height: 38,
    transform: [{ rotate: '15deg' }],
  },
  // Bee 4: Top Right (Malayo/Maliit)
  bee4: {
    top: -10,
    right: 60,
    width: 25,
    height: 25,
    opacity: 0.8,
    transform: [{ rotate: '-40deg' }],
  },
  // Bee 5: Bottom Right (Beside Jeep)
  bee5: {
    bottom: -25,
    right: 15,
    width: 42,
    height: 42,
    transform: [{ rotate: '-10deg' }],
  },



// ========================================
// Word of the Day Part
// ========================================

homeHero: {
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  minHeight: 200,
  marginTop: 0,
  marginBottom: 20,
},

// LEFT SIDE — BEE
heroBeeContainer: {
  width: '42%',
  height: 270,
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'visible',
},

heroBee: {
  width: 120,
  height: 180,
},

// RIGHT SIDE
heroContent: {
  width: '58%',
  alignItems: 'center',
  justifyContent: 'center',
  paddingLeft: 8,
},

// DATE
heroDate: {
  fontFamily: fonts.bold,
  fontSize: 13,
  color: colors.accentLight,
  letterSpacing: 0.4,
  textAlign: 'center',
  marginBottom: 2,
},

// GREETING
heroGreeting: {
  fontFamily: fonts.bold,
  fontSize: 21,
  color: colors.greetingYellow,
  textAlign: 'center',
  lineHeight: 28,
  marginBottom: 16,
},

heroUserName: {
  color: colors.accentLight,
},

// WORD OF THE DAY
wordOfDayBubble: {
  width: '96%',
  minHeight: 165,
  backgroundColor: colors.primary,
  borderRadius: 28,
  paddingHorizontal: 20,
  paddingVertical: 18,
  alignItems: 'center',
  justifyContent: 'center',

  // Soft floating effect
  elevation: 8,
  shadowColor: colors.shadowGold,
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.18,
  shadowRadius: 10,
  position: 'relative',
  // subtle border
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.45)',
},

// SPEECH ARROW
wordBubbleArrow: {
  position: 'absolute',
  left: -18,
  top: '50%',
  marginTop: -14,
  width: 0,
  height: 0,
  borderTopWidth: 14,
  borderBottomWidth: 14,
  borderRightWidth: 22,
  borderTopColor: 'transparent',
  borderBottomColor: 'transparent',
  borderRightColor: colors.primary,
},

// WORD
heroWord: {
  fontFamily: fonts.bold,
  fontSize: 24,
  color: colors.accent,
  textAlign: 'center',
  marginBottom: 4,
  letterSpacing: -0.5,
},

// TRANSLATION
heroTranslation: {
  fontFamily: fonts.medium,
  fontSize: 14,
  color: colors.accentLight,
  textAlign: 'center',
  fontStyle: 'italic',
  lineHeight: 18,
  marginBottom: 4,
},

// DEFINITION
heroDefinition: {
  fontFamily: fonts.regular,
  fontSize: 12,
  color: colors.accentLight,
  textAlign: 'center',
  marginBottom: 4,
  lineHeight: 16,
},

// DETAILS
heroDetails: {
  fontFamily: fonts.bold,
  fontSize: 10,
  color: colors.shadowGold,
  textDecorationLine: 'underline',
  marginTop: 4,
},

progressSectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',

  marginTop: 15,
  marginBottom: 14,

  paddingHorizontal: 5,
},

progressSectionTitle: {
  fontFamily: fonts.bold,
  fontSize: 25,
  color: colors.accent,
  letterSpacing: -0.5,
},

progressSubtitle: {
  fontFamily: fonts.medium,
  fontSize: 11,
  color: colors.textMuted,
  marginTop: 1,
},


// STREAK BADGE

streakBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.surfaceLight,
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colors.borderGold,
},

activeDot: {
  width: 7,
  height: 7,
  borderRadius: 4,
  backgroundColor: colors.primaryDark,
  marginRight: 6,
},

streakBadgeText: {
  fontFamily: fonts.bold,
  fontSize: 9,
  color: colors.shadowGold,
  letterSpacing: 0.8,
},

progressCard: {
  backgroundColor: colors.surface,
  borderRadius: 32,
  paddingHorizontal: 22,
  paddingTop: 22,
  paddingBottom: 18,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: colors.border,
  elevation: 7,
  shadowColor: colors.shadowGold,
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  position: 'relative',
  overflow: 'hidden',
},

progressBee: {
  position: 'absolute',
  width: 75,
  height: 75,
  right: -8,
  top: -10,
  opacity: 0.95,
  transform: [
    { rotate: '12deg' }
  ],
},
progressTopRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: 115,
},
streakSmallLabel: {
  fontFamily: fonts.bold,
  fontSize: 10,
  color: colors.textHint,
  letterSpacing: 1.3,
  marginBottom: 2,
},
streakNumberRow: {
  flexDirection: 'row',
  alignItems: 'baseline',
},

streakNumberLarge: {
  fontFamily: fonts.bold,
  fontSize: 58,
  color: colors.accent,
  lineHeight: 64,
  letterSpacing: -2,
},

streakDays: {
  fontFamily: fonts.bold,
  fontSize: 14,
  color: colors.shadowGold,
  marginLeft: 7,
  letterSpacing: 1,
},
superStreakBadge: {
  alignSelf: 'flex-start',
  backgroundColor: colors.accent,
  paddingHorizontal: 11,
  paddingVertical: 5,
  borderRadius: 15,
  marginTop: 4,
},

superStreakText: {
  fontFamily: fonts.bold,
  fontSize: 9,
  color: colors.primary,
  letterSpacing: 0.4,
},

tripleFlameWrapper: {
  width: 105,
  height: 65,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  marginRight: 10,
},

centerFlame: {
  width: 100,
  height: 100,
  zIndex: 2,
},

sideFlame: {
  width: 100,
  height: 100,
  position: 'absolute',
  bottom: 4,
  opacity: 0.65,
},

leftFlame: {
  left: 100,
  transform: [
    { rotate: '-15deg' }
  ],
  zIndex: 1,
},
rightFlame: {
  right: 0,
  transform: [
    { rotate: '15deg' }
  ],
  zIndex: 1,
},
weeklyProgressContainer: {
  backgroundColor: colors.background,
  borderRadius: 23,
  paddingHorizontal: 13,
  paddingVertical: 13,
  borderWidth: 1,
  borderColor: colors.borderLight,
},
weeklyProgressTitle: {
  fontFamily: fonts.bold,
  fontSize: 9,
  color: colors.textHint,
  letterSpacing: 1.2,
  marginBottom: 10,
  textAlign: 'center',
},
largeWeekRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

largeDayBox: {
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
},

dayCircleLarge: {
  width: 28,
  height: 28,
  borderRadius: 14,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 5,
},

dayActive: {
  backgroundColor: colors.primary,
  borderWidth: 2,
  borderColor: colors.primaryDark,
  elevation: 3,
  shadowColor: colors.primaryDeep,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.15,
  shadowRadius: 3,
},

dayInactive: {
  backgroundColor: colors.surfaceMuted,
  borderWidth: 1,
  borderColor: colors.borderMuted,
},

checkMarkLarge: {
  fontSize: 13,
  color: colors.accent,
  fontFamily: fonts.bold,
},

lockIcon: {
  fontSize: 9,
  opacity: 0.35,
},

largeDayText: {
  fontSize: 8.5,
  fontFamily: fonts.bold,
  color: colors.textMuted,
  letterSpacing: 0.2,
},

// ========================================
// CHATBOT PROMO
// ========================================

chatPromoWrapper: {
  width: '100%',
  marginTop: 8,
  marginBottom: 25,
  position: 'relative',
},

chatPromoCard: {
  width: '100%',
  minHeight: 220,
  backgroundColor: colors.surfaceLight,
  borderRadius: 32,
  borderWidth: 1.5,
  borderColor: '#FFD45A',
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 18,
  paddingVertical: 20,
  overflow: 'hidden',
  elevation: 7,
  shadowColor: colors.shadowAmber,
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.13,
  shadowRadius: 10,
},

// ========================================
// BEE
// ========================================

chatBeeContainer: {
  width: '40%',
  height: 180,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
},

chatPromoBee: {
  width: 130,
  height: 175,
  transform: [
    { rotate: '-3deg' }
  ],
},

// ========================================
// BEE CHAT BUBBLE
// ========================================

beeChatBubble: {
  position: 'absolute',
  top: 5,
  right: -2,
  backgroundColor: colors.background,
  paddingHorizontal: 10,
  paddingVertical: 7,
  borderRadius: 15,
  borderWidth: 1,
  borderColor: colors.border,
  elevation: 3,
  shadowColor: colors.shadowGold,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.12,
  shadowRadius: 4,
},

beeChatText: {
  fontFamily: fonts.bold,
  fontSize: 9,
  color: colors.accentLight,
},

// ========================================
// TEXT CONTENT
// ========================================

chatPromoContent: {
  width: '60%',
  paddingLeft: 5,
  paddingRight: 5,
},

chatPromoLabel: {
  fontFamily: fonts.bold,
  fontSize: 9,
  color: colors.chatPromoLabel,
  letterSpacing: 1.1,
  marginBottom: 3,
},

chatPromoTitle: {
  fontFamily: fonts.bold,
  fontSize: 23,
  color: colors.accent,
  lineHeight: 29,
  marginBottom: 7,
},

chatPromoTitleAccent: {
  color: colors.primaryDark,
},

chatPromoDescription: {
  fontFamily: fonts.medium,
  fontSize: 11.5,
  color: colors.textMuted,
  lineHeight: 17,
  marginBottom: 13,
},

// ========================================
// BUTTON
// ========================================

chatExploreBtn: {
  alignSelf: 'flex-start',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.accent,
  paddingLeft: 15,
  paddingRight: 11,
  paddingVertical: 9,
  borderRadius: 18,
  elevation: 3,
  shadowColor: colors.accent,
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.18,
  shadowRadius: 4,
},

chatExploreBtnText: {
  fontFamily: fonts.bold,
  fontSize: 11,
  color: colors.primary,
},

chatExploreArrow: {
  fontFamily: fonts.bold,
  fontSize: 17,
  color: colors.primary,
  marginLeft: 7,
  marginTop: -2,
},

// ========================================
// FLOATING BUBBLES
// ========================================

chatBubbleSmall: {
  position: 'absolute',
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 5,
  elevation: 4,
  shadowColor: colors.shadowAmber,
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.15,
  shadowRadius: 4,
},

chatBubbleOne: {
  right: 15,
  top: -13,
},

chatBubbleTwo: {
  right: 55,
  bottom: -10,
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: colors.surfaceLight,
},

chatBubbleEmoji: {
  fontSize: 14,
},

// ========================================
// WORD OF THE DAY (WOTD) MODAL & DEFINITION
// ========================================

heroDefinition: {
  fontFamily: fonts.regular,
  fontSize: 13,
  color: colors.accentLight,
  textAlign: 'center',
  marginBottom: 8,
},

modalOverlay: {
  flex: 1,
  backgroundColor: colors.overlay,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},

wotdModalCard: {
  backgroundColor: colors.white,
  borderRadius: 20,
  padding: 25,
  width: '100%',
  maxWidth: 400,
  elevation: 5,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
},

wotdModalTitle: {
  fontFamily: fonts.bold,
  fontSize: 24,
  color: colors.accent,
  textAlign: 'center',
  marginBottom: 10,
},

wotdDivider: {
  height: 1,
  backgroundColor: colors.divider,
  width: '100%',
  marginBottom: 15,
},

wotdModalSubtitle: {
  fontFamily: fonts.bold,
  fontSize: 16,
  color: colors.primaryDeep,
  marginBottom: 5,
},

wotdModalText: {
  fontFamily: fonts.regular,
  fontSize: 15,
  color: colors.textDark,
  lineHeight: 22,
},

wotdModalUsage: {
  fontFamily: fonts.regular,
  fontSize: 14,
  color: colors.textDark,
  lineHeight: 20,
  marginBottom: 6,
  fontStyle: 'italic',
},

wotdModalCloseBtn: {
  backgroundColor: colors.primary,
  borderRadius: 25,
  paddingVertical: 12,
  alignItems: 'center',
  marginTop: 25,
},

wotdModalCloseText: {
  fontFamily: fonts.bold,
  fontSize: 16,
  color: colors.accent,
},

});
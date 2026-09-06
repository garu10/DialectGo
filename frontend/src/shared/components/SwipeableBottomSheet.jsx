import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Animated,
  PanResponder,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * A reusable swipe-to-dismiss bottom sheet wrapper.
 * 
 * @param {boolean} visible - Controls the visibility of the modal
 * @param {function} onClose - Callback fired when the sheet is successfully dismissed
 * @param {ReactNode} children - The content to render inside the bottom sheet
 */
export default function SwipeableBottomSheet({ visible, onClose, children }) {
  // We use an Animated.Value for the vertical translation of the sheet
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // The threshold in pixels the user must drag down before it registers as a dismiss
  const DISMISS_THRESHOLD = 150;
  // If the user flicks downwards fast, we also dismiss regardless of threshold
  const VELOCITY_THRESHOLD = 1.0;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
          speed: 12,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, overlayOpacity]);

  // Handle the drag gesture logic
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only claim the pan responder if the user is dragging down (dy > 0)
        // This prevents the bottom sheet from capturing horizontal swipes or upwards scrolling
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging downwards (positive dy)
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Check if dragged past threshold or flicked down
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > VELOCITY_THRESHOLD) {
          // Finish sliding down and trigger close callback
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          // Did not drag far enough; spring back to open state
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  // Don't render modal content if completely hidden to save memory
  // if (!visible && translateY._value === SCREEN_HEIGHT) return null;

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="none" 
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5], // max opacity of 0.5 (semi-transparent black)
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY }] }]}
        >
          {/* Drag Handle Indicator */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>
          
          {/* Inject content here */}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 32, // Restored safe area padding for edge-to-edge
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    maxHeight: '85%',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB', // gray-300
    borderRadius: 2,
  }
});

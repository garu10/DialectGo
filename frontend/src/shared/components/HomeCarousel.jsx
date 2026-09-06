import React, { useRef, useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - 50; // Perfectly matches the 25px horizontal padding of the home screen

const CAROUSEL_DATA = [
  {
    id: '1',
    image: require('../../../assets/images/home_carousel_featured/home_carousel_1.png'),
    btnColor: '#FFD34C',
    btnTextColor: '#000000',
    btnText: 'MAKE IT PERSONAL!',
    route: '/Translator/Translate'
  },
  {
    id: '2',
    image: require('../../../assets/images/home_carousel_featured/home_carousel_2.png'),
    btnColor: '#6F078D',
    btnTextColor: '#FCBA24',
    btnText: 'TRY IT NOW!',
    route: '/Translator/Translate'
  },
  {
    id: '3',
    image: require('../../../assets/images/home_carousel_featured/home_carousel_3.png'),
    btnColor: '#FFD34C',
    btnTextColor: '#000000',
    btnText: 'DROP SOME LINGO!',
    route: '/Wiki/WikiFeed'
  }
];

export default function HomeCarousel() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const scrollNext = () => {
    if (currentIndex < CAROUSEL_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const scrollPrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const getItemLayout = (_, index) => ({
    length: CAROUSEL_WIDTH,
    offset: CAROUSEL_WIDTH * index,
    index,
  });

  const renderItem = ({ item }) => {
    return (
      <View style={[styles.itemContainer, { width: CAROUSEL_WIDTH }]}>
        <View style={styles.imageWrapper}>
          <Image source={item.image} style={styles.image} resizeMode="contain" />
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: item.btnColor }]}
            activeOpacity={0.85}
            onPress={() => router.push(item.route)}
          >
            <Text style={[styles.buttonText, { color: item.btnTextColor }]}>{item.btnText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ width: CAROUSEL_WIDTH, position: 'relative', overflow: 'hidden' }}>
        <FlatList
          ref={flatListRef}
          data={CAROUSEL_DATA}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          bounces={false}
          style={{ width: CAROUSEL_WIDTH }}
          contentContainerStyle={{ paddingHorizontal: 0, marginHorizontal: 0 }}
        />

        {/* Swipe Indicators */}
        {currentIndex < CAROUSEL_DATA.length - 1 && (
          <TouchableOpacity 
            style={styles.rightArrowContainer} 
            onPress={scrollNext}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        {currentIndex > 0 && (
          <TouchableOpacity 
            style={styles.leftArrowContainer} 
            onPress={scrollPrev}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.paginationContainer}>
        {CAROUSEL_DATA.map((_, index) => {
          const isActive = currentIndex === index;
          return (
            <View 
              key={index} 
              style={[
                styles.dot, 
                isActive ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 504 / 674,
    borderRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  button: {
    position: 'absolute',
    bottom: '7%',
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  dot: {
    width: 30, // Make them a bit wider for pill shape similar to screenshot
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFD34C',
  },
  inactiveDot: {
    backgroundColor: '#E5E7EB',
    width: 10,
  },
  rightArrowContainer: {
    position: 'absolute',
    right: 15,
    top: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 20,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftArrowContainer: {
    position: 'absolute',
    left: 15,
    top: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 20,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

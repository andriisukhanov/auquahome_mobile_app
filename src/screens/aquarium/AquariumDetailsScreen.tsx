import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import {
  useTheme,
  Text,
  FAB,
  ActivityIndicator,
  IconButton,
  BottomNavigation,
  TouchableRipple,
} from 'react-native-paper';
import {useRoute, useNavigation} from '@react-navigation/native';
import {getAquariumById} from '../api/aquariumApi';
import {getRecentEvents} from '../api/eventApi';
import StatisticsTab from '../components/aquarium/StatisticsTab';
import GalleryTab from '../components/aquarium/GalleryTab';
import InhabitantsTab from '../components/aquarium/InhabitantsTab';
import ParametersTab from '../components/aquarium/ParametersTab';
import EventFAB from '../components/common/EventFAB';

// Типи для TypeScript
interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  startDate: string;
  isActive: boolean;
  isPublic: boolean;
  imageUrl?: string;
}

interface RouteParams {
  id: string;
}

// Константи для анімації
const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const AquariumDetailsScreen = () => {
  const [aquarium, setAquarium] = useState<Aquarium | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const {id} = route.params as RouteParams;

  // Анімований скролл для хедера
  const scrollY = useRef(new Animated.Value(0)).current;

  // Анімаційні значення
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [30, 0],
    extrapolate: 'clamp',
  });

  // Завантаження даних акваріума
  useEffect(() => {
    const fetchAquariumData = async () => {
      try {
        setError('');
        const data = await getAquariumById(id);
        setAquarium(data);

        // Налаштування заголовка навігації
        navigation.setOptions({
          title: data.name,
          headerShown: false,
        });
      } catch (err: any) {
        setError('Помилка завантаження даних акваріума');
        console.error('Error fetching aquarium details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAquariumData();
  }, [id, navigation]);

  // Переклад типу акваріума
  const getAquariumTypeText = (type: string) => {
    const types: Record<string, string> = {
      freshwater: 'Прісноводний',
      marine: 'Морський',
      brackish: 'Солонуватий',
      planted: 'Рослинний',
    };
    return types[type] || type;
  };

  // Вкладки нижньої навігації
  const renderScene = ({route}: {route: {key: string}}) => {
    switch (route.key) {
      case 'statistics':
        return <StatisticsTab aquariumId={id} />;
      case 'gallery':
        return <GalleryTab aquariumId={id} />;
      case 'inhabitants':
        return <InhabitantsTab aquariumId={id} />;
      case 'parameters':
        return <ParametersTab aquariumId={id} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !aquarium) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Акваріум не знайдено'}</Text>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />

      {/* Анімований заголовок */}
      <Animated.View style={[styles.header, {height: headerHeight}]}>
        <Animated.Image
          style={[styles.headerBackground, {opacity: imageOpacity}]}
          source={
            aquarium.imageUrl
              ? {uri: aquarium.imageUrl}
              : require('../assets/default_aquarium.jpg')
          }
        />

        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: titleOpacity,
              transform: [{translateY: titleTranslateY}],
            },
          ]}>
          <Text style={styles.headerTitle}>{aquarium.name}</Text>
        </Animated.View>

        <TouchableRipple
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          rippleColor="rgba(255, 255, 255, 0.2)">
          <IconButton icon="arrow-left" iconColor="#fff" />
        </TouchableRipple>

        <TouchableRipple
          style={styles.editButton}
          onPress={() => navigation.navigate('EditAquarium', {aquarium})}
          rippleColor="rgba(255, 255, 255, 0.2)">
          <IconButton icon="pencil" iconColor="#fff" />
        </TouchableRipple>
      </Animated.View>

      {/* Основний контент з вкладками */}
      <BottomNavigation
        navigationState={{
          index: activeTab,
          routes: [
            {key: 'statistics', title: 'Загальне', icon: 'chart-box'},
            {key: 'gallery', title: 'Галерея', icon: 'image'},
            {key: 'inhabitants', title: 'Мешканці', icon: 'fish'},
            {key: 'parameters', title: 'Параметри', icon: 'flask'},
          ],
        }}
        onIndexChange={setActiveTab}
        renderScene={renderScene}
        barStyle={{backgroundColor: theme.colors.surface}}
      />

      {/* Кнопка додавання події */}
      <EventFAB aquariumId={id} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'tomato',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: HEADER_MAX_HEIGHT,
    resizeMode: 'cover',
  },
  headerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HEADER_MIN_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: StatusBar.currentHeight,
    left: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  editButton: {
    position: 'absolute',
    top: StatusBar.currentHeight,
    right: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

export default AquariumDetailsScreen;

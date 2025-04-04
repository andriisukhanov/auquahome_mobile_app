import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  ActivityIndicator,
  Button,
  Chip,
  IconButton,
  Divider,
  List,
  ProgressBar,
  Menu,
  Dialog,
  Portal,
  TextInput,
  Title,
  TouchableRipple,
} from 'react-native-paper';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  getInhabitantById,
  updateInhabitant,
  deactivateInhabitant,
  moveInhabitant,
  markInhabitantDeath,
  breedInhabitant,
  InhabitantType,
} from '../../api/inhabitantApi';
import {getAquariums} from '../../api/aquariumApi';
import {formatDateToLocal} from '../../utils/dateUtils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface RouteParams {
  id: string;
  aquariumId: string;
}

// Константи для анімації
const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const InhabitantDetailsScreen: React.FC = () => {
  const [inhabitant, setInhabitant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionsVisible, setActionsVisible] = useState(false);

  // Діалоги для різних дій
  const [moveDialogVisible, setMoveDialogVisible] = useState(false);
  const [deathDialogVisible, setDeathDialogVisible] = useState(false);
  const [breedDialogVisible, setBreedDialogVisible] = useState(false);
  const [deactivateDialogVisible, setDeactivateDialogVisible] = useState(false);

  // Дані для діалогів
  const [availableAquariums, setAvailableAquariums] = useState<any[]>([]);
  const [selectedAquarium, setSelectedAquarium] = useState<string>('');
  const [moveQuantity, setMoveQuantity] = useState<string>('');
  const [deathQuantity, setDeathQuantity] = useState<string>('');
  const [breedQuantity, setBreedQuantity] = useState<string>('');
  const [deathReason, setDeathReason] = useState<string>('');
  const [breedNotes, setBreedNotes] = useState<string>('');
  const [deactivateReason, setDeactivateReason] = useState<string>('');

  // Стани для оновлення
  const [updating, setUpdating] = useState(false);

  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const {id, aquariumId} = route.params as RouteParams;

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

  useEffect(() => {
    loadInhabitantData();
    loadAquariums();
  }, [id, aquariumId]);

  const loadInhabitantData = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getInhabitantById(id);
      setInhabitant(data);

      // Встановлення значень за замовчуванням для діалогів
      setMoveQuantity(data.quantity.toString());
      setDeathQuantity(data.quantity.toString());
      setBriedQuantity(Math.round(data.quantity * 0.5).toString()); // 50% від поточної кількості за замовчуванням
    } catch (err: any) {
      setError('Помилка завантаження даних. Спробуйте знову пізніше.');
      console.error('Error loading inhabitant data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAquariums = async () => {
    try {
      const aquariumsData = await getAquariums();
      // Фільтруємо, виключаючи поточний акваріум
      const filteredAquariums = aquariumsData.filter(
        aq => aq.id !== aquariumId && aq.isActive,
      );
      setAvailableAquariums(filteredAquariums);
    } catch (err) {
      console.error('Error loading aquariums:', err);
    }
  };

  // Переклад типу мешканця
  const getInhabitantTypeText = (type: string) => {
    const types: Record<string, string> = {
      fish: 'Риба',
      invertebrate: 'Безхребетні',
      plant: 'Рослина',
    };
    return types[type] || type;
  };

  // Переклад рівня складності догляду
  const getCareLevelText = (level: string) => {
    const levels: Record<string, string> = {
      easy: 'Легкий',
      medium: 'Середній',
      hard: 'Складний',
    };
    return levels[level] || level;
  };

  // Переклад розташування рослини
  const getPlantPositionText = (position: string) => {
    const positions: Record<string, string> = {
      foreground: 'Передній план',
      middle: 'Середній план',
      background: 'Задній план',
    };
    return positions[position] || position;
  };

  // Переклад потреби в освітленні
  const getLightLevelText = (level: string) => {
    const levels: Record<string, string> = {
      low: 'Низька',
      medium: 'Середня',
      high: 'Висока',
    };
    return levels[level] || level;
  };

  // Переклад швидкості росту
  const getGrowthRateText = (rate: string) => {
    const rates: Record<string, string> = {
      slow: 'Повільна',
      medium: 'Середня',
      fast: 'Швидка',
    };
    return rates[rate] || rate;
  };

  // Обробники для діалогів
  const handleMove = async () => {
    if (!selectedAquarium) {
      Alert.alert('Помилка', 'Виберіть акваріум для переміщення');
      return;
    }

    const qty = parseInt(moveQuantity);
    if (isNaN(qty) || qty < 1 || qty > inhabitant.quantity) {
      Alert.alert('Помилка', 'Введіть коректну кількість');
      return;
    }

    try {
      setUpdating(true);
      await moveInhabitant(id, selectedAquarium, qty);
      setMoveDialogVisible(false);

      // Оновлюємо дані після успішного переміщення
      if (qty === inhabitant.quantity) {
        // Якщо перемістили всіх, повертаємось на попередній екран
        navigation.goBack();
      } else {
        await loadInhabitantData();
      }
    } catch (err: any) {
      Alert.alert('Помилка', err.message || 'Не вдалося перемістити мешканця');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkDeath = async () => {
    const qty = parseInt(deathQuantity);
    if (isNaN(qty) || qty < 1 || qty > inhabitant.quantity) {
      Alert.alert('Помилка', 'Введіть коректну кількість');
      return;
    }

    try {
      setUpdating(true);
      await markInhabitantDeath(id, qty, deathReason);
      setDeathDialogVisible(false);

      // Оновлюємо дані після успішного оновлення
      if (qty === inhabitant.quantity) {
        // Якщо всі загинули, повертаємось на попередній екран
        navigation.goBack();
      } else {
        await loadInhabitantData();
      }
    } catch (err: any) {
      Alert.alert('Помилка', err.message || 'Не вдалося відмітити загибель');
    } finally {
      setUpdating(false);
    }
  };

  const handleBreed = async () => {
    const qty = parseInt(breedQuantity);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Помилка', 'Введіть коректну кількість');
      return;
    }

    try {
      setUpdating(true);
      await breedInhabitant(id, qty, breedNotes);
      setBreedDialogVisible(false);

      // Оновлюємо дані після успішного розмноження
      await loadInhabitantData();
    } catch (err: any) {
      Alert.alert('Помилка', err.message || 'Не вдалося відмітити розмноження');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setUpdating(true);
      await deactivateInhabitant(id, deactivateReason);
      setDeactivateDialogVisible(false);

      // Повертаємось на попередній екран після деактивації
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Помилка', err.message || 'Не вдалося деактивувати мешканця');
    } finally {
      setUpdating(false);
    }
  };

  // Рендер метаданих для риб та безхребетних
  const renderFishDetails = () => {
    if (!inhabitant || !inhabitant.metadata) return null;

    const metadata = inhabitant.metadata;

    return (
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Умови утримання</Text>

        {metadata.temperature && (
          <List.Item
            title="Температура"
            description={`${metadata.temperature.min || '?'} - ${
              metadata.temperature.max || '?'
            } °C`}
            left={props => <List.Icon {...props} icon="thermometer" />}
          />
        )}

        {metadata.ph && (
          <List.Item
            title="pH"
            description={`${metadata.ph.min || '?'} - ${
              metadata.ph.max || '?'
            }`}
            left={props => <List.Icon {...props} icon="test-tube" />}
          />
        )}

        {metadata.origin && (
          <List.Item
            title="Походження"
            description={metadata.origin}
            left={props => <List.Icon {...props} icon="earth" />}
          />
        )}

        {metadata.adultSize && (
          <List.Item
            title="Дорослий розмір"
            description={`${metadata.adultSize} см`}
            left={props => <List.Icon {...props} icon="ruler" />}
          />
        )}

        {metadata.lifespan && (
          <List.Item
            title="Тривалість життя"
            description={`${metadata.lifespan} ${
              metadata.lifespan === 1 ? 'рік' : 'років'
            }`}
            left={props => <List.Icon {...props} icon="calendar-clock" />}
          />
        )}

        {metadata.careLevel && (
          <List.Item
            title="Рівень догляду"
            description={getCareLevelText(metadata.careLevel)}
            left={props => <List.Icon {...props} icon="account-wrench" />}
          />
        )}
      </View>
    );
  };

  // Рендер метаданих для рослин
  const renderPlantDetails = () => {
    if (!inhabitant || !inhabitant.metadata) return null;

    const metadata = inhabitant.metadata;

    return (
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Умови для рослин</Text>

        {metadata.position && (
          <List.Item
            title="Розташування"
            description={getPlantPositionText(metadata.position)}
            left={props => <List.Icon {...props} icon="map-marker" />}
          />
        )}

        {metadata.lightLevel && (
          <List.Item
            title="Потреба в освітленні"
            description={getLightLevelText(metadata.lightLevel)}
            left={props => <List.Icon {...props} icon="white-balance-sunny" />}
          />
        )}

        {metadata.growthRate && (
          <List.Item
            title="Швидкість росту"
            description={getGrowthRateText(metadata.growthRate)}
            left={props => <List.Icon {...props} icon="trending-up" />}
          />
        )}

        {metadata.temperature && (
          <List.Item
            title="Температура"
            description={`${metadata.temperature.min || '?'} - ${
              metadata.temperature.max || '?'
            } °C`}
            left={props => <List.Icon {...props} icon="thermometer" />}
          />
        )}

        {metadata.ph && (
          <List.Item
            title="pH"
            description={`${metadata.ph.min || '?'} - ${
              metadata.ph.max || '?'
            }`}
            left={props => <List.Icon {...props} icon="test-tube" />}
          />
        )}

        {metadata.origin && (
          <List.Item
            title="Походження"
            description={metadata.origin}
            left={props => <List.Icon {...props} icon="earth" />}
          />
        )}
      </View>
    );
  };

  // Рендер нотаток
  const renderNotes = () => {
    if (!inhabitant || !inhabitant.metadata || !inhabitant.metadata.notes)
      return null;

    return (
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Нотатки</Text>
        <Text style={styles.notes}>{inhabitant.metadata.notes}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !inhabitant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Мешканця не знайдено'}</Text>
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
            inhabitant.metadata?.imageUrl
              ? {uri: inhabitant.metadata.imageUrl}
              : require('../../assets/default_inhabitant.jpg')
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
          <Text style={styles.headerTitle}>{inhabitant.species}</Text>
        </Animated.View>

        {/* Кнопка повернення */}
        <TouchableRipple
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          rippleColor="rgba(255, 255, 255, 0.2)">
          <IconButton icon="arrow-left" iconColor="#fff" />
        </TouchableRipple>

        {/* Меню дій */}
        <Menu
          visible={actionsVisible}
          onDismiss={() => setActionsVisible(false)}
          anchor={
            <TouchableRipple
              style={styles.actionsButton}
              onPress={() => setActionsVisible(true)}
              rippleColor="rgba(255, 255, 255, 0.2)">
              <IconButton icon="dots-vertical" iconColor="#fff" />
            </TouchableRipple>
          }>
          <Menu.Item
            leadingIcon="pencil"
            onPress={() => {
              setActionsVisible(false);
              navigation.navigate('EditInhabitant', {
                id: inhabitant.id,
                aquariumId: inhabitant.aquariumId,
              });
            }}
            title="Редагувати"
          />
          <Menu.Item
            leadingIcon="bank-transfer"
            onPress={() => {
              setActionsVisible(false);
              setMoveDialogVisible(true);
            }}
            title="Перемістити"
          />
          {inhabitant.type !== InhabitantType.PLANT && (
            <Menu.Item
              leadingIcon="heart-pulse"
              onPress={() => {
                setActionsVisible(false);
                setDeathDialogVisible(true);
              }}
              title="Відмітити загибель"
            />
          )}
          {inhabitant.type !== InhabitantType.PLANT && (
            <Menu.Item
              leadingIcon="baby-carriage"
              onPress={() => {
                setActionsVisible(false);
                setBreedDialogVisible(true);
              }}
              title="Відмітити розмноження"
            />
          )}
          <Divider />
          <Menu.Item
            leadingIcon="delete"
            onPress={() => {
              setActionsVisible(false);
              setDeactivateDialogVisible(true);
            }}
            title="Видалити"
            titleStyle={{color: theme.colors.error}}
          />
        </Menu>
      </Animated.View>

      {/* Основний вміст */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: false},
        )}>
        {/* Інформація про мешканця */}
        <View style={styles.infoContainer}>
          <View style={styles.basicInfo}>
            <View>
              <Text style={styles.title}>{inhabitant.species}</Text>
              <Chip
                icon={
                  inhabitant.type === InhabitantType.FISH
                    ? 'fish'
                    : inhabitant.type === InhabitantType.INVERTEBRATE
                    ? 'shrimp'
                    : 'flower'
                }>
                {getInhabitantTypeText(inhabitant.type)}
              </Chip>
            </View>

            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Кількість</Text>
              <Text style={styles.quantity}>{inhabitant.quantity}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <Text>Додано: {formatDateToLocal(new Date(inhabitant.addedAt))}</Text>

          {!inhabitant.isActive && (
            <View style={styles.inactiveContainer}>
              <Text style={styles.inactiveText}>Неактивний</Text>
              {inhabitant.removedAt && (
                <Text style={styles.removedText}>
                  Видалено: {formatDateToLocal(new Date(inhabitant.removedAt))}
                </Text>
              )}
              {inhabitant.metadata?.deactivationReason && (
                <Text style={styles.reasonText}>
                  Причина: {inhabitant.metadata.deactivationReason}
                </Text>
              )}
            </View>
          )}

          {/* Специфічні деталі в залежності від типу */}
          {inhabitant.type === InhabitantType.PLANT
            ? renderPlantDetails()
            : renderFishDetails()}

          {/* Нотатки */}
          {renderNotes()}
        </View>

        {/* Історія змін (можна додати в майбутньому) */}
      </Animated.ScrollView>

      {/* Діалоги для дій */}
      <Portal>
        {/* Діалог переміщення */}
        <Dialog
          visible={moveDialogVisible}
          onDismiss={() => setMoveDialogVisible(false)}>
          <Dialog.Title>Перемістити мешканця</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Виберіть акваріум для переміщення:
            </Text>
            <View style={styles.aquariumsContainer}>
              {availableAquariums.length > 0 ? (
                availableAquariums.map(aq => (
                  <Chip
                    key={aq.id}
                    selected={selectedAquarium === aq.id}
                    onPress={() => setSelectedAquarium(aq.id)}
                    style={styles.aquariumChip}>
                    {aq.name}
                  </Chip>
                ))
              ) : (
                <Text>Немає доступних акваріумів для переміщення</Text>
              )}
            </View>

            <TextInput
              label="Кількість для переміщення"
              value={moveQuantity}
              onChangeText={setMoveQuantity}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMoveDialogVisible(false)}>
              Скасувати
            </Button>
            <Button
              onPress={handleMove}
              loading={updating}
              disabled={!selectedAquarium || updating}>
              Перемістити
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Діалог загибелі */}
        <Dialog
          visible={deathDialogVisible}
          onDismiss={() => setDeathDialogVisible(false)}>
          <Dialog.Title>Відмітити загибель</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Кількість загиблих"
              value={deathQuantity}
              onChangeText={setDeathQuantity}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />

            <TextInput
              label="Причина (необов'язково)"
              value={deathReason}
              onChangeText={setDeathReason}
              mode="outlined"
              style={styles.dialogInput}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeathDialogVisible(false)}>
              Скасувати
            </Button>
            <Button
              onPress={handleMarkDeath}
              loading={updating}
              disabled={updating}>
              Зберегти
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Діалог розмноження */}
        <Dialog
          visible={breedDialogVisible}
          onDismiss={() => setBreedDialogVisible(false)}>
          <Dialog.Title>Відмітити розмноження</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Кількість нових особин"
              value={breedQuantity}
              onChangeText={setBreedQuantity}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />

            <TextInput
              label="Нотатки (необов'язково)"
              value={breedNotes}
              onChangeText={setBreedNotes}
              mode="outlined"
              style={styles.dialogInput}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBreedDialogVisible(false)}>
              Скасувати
            </Button>
            <Button
              onPress={handleBreed}
              loading={updating}
              disabled={updating}>
              Зберегти
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Діалог деактивації */}
        <Dialog
          visible={deactivateDialogVisible}
          onDismiss={() => setDeactivateDialogVisible(false)}>
          <Dialog.Title>Видалити мешканця</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Ви впевнені, що хочете видалити {inhabitant.species}?
            </Text>

            <TextInput
              label="Причина (необов'язково)"
              value={deactivateReason}
              onChangeText={setDeactivateReason}
              mode="outlined"
              style={styles.dialogInput}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeactivateDialogVisible(false)}>
              Скасувати
            </Button>
            <Button
              onPress={handleDeactivate}
              loading={updating}
              disabled={updating}
              textColor={theme.colors.error}>
              Видалити
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  actionsButton: {
    position: 'absolute',
    top: StatusBar.currentHeight,
    right: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scrollView: {
    flex: 1,
    marginTop: HEADER_MAX_HEIGHT,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  basicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quantityContainer: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#666',
  },
  quantity: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 16,
  },
  inactiveContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
  inactiveText: {
    color: 'tomato',
    fontWeight: 'bold',
  },
  removedText: {
    fontSize: 12,
    color: '#B71C1C',
    marginTop: 2,
  },
  reasonText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  detailsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  notes: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    lineHeight: 20,
  },
  dialogText: {
    marginBottom: 16,
  },
  dialogInput: {
    marginTop: 8,
  },
  aquariumsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  aquariumChip: {
    margin: 4,
  },
});

export default InhabitantDetailsScreen;

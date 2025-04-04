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
  Card,
  Title,
  Paragraph,
  Chip,
  IconButton,
  Divider,
  List,
  Menu,
  Dialog,
  Portal,
  Button,
  Caption,
  Avatar,
  TouchableRipple,
} from 'react-native-paper';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  getEventById,
  getComplexEvent,
  updateEventStatus,
  deleteEvent,
  EventType,
  EventStatus,
} from '../../api/eventApi';
import {formatDateToLocal, getRelativeTime} from '../../utils/dateUtils';

interface RouteParams {
  id: string;
  aquariumId: string;
}

// Константи для анімації
const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const EventDetailsScreen: React.FC = () => {
  const [event, setEvent] = useState<any>(null);
  const [childEvents, setChildEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionsVisible, setActionsVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
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
    loadEventData();
  }, [id, aquariumId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError('');

      // Перевіряємо, чи це комплексна подія
      try {
        const complexData = await getComplexEvent(id);
        setEvent(complexData.parent);
        setChildEvents(complexData.children);
      } catch (err) {
        // Якщо це не комплексна подія, завантажуємо звичайну
        const data = await getEventById(id);
        setEvent(data);
        setChildEvents([]);
      }
    } catch (err: any) {
      setError('Помилка завантаження даних. Спробуйте знову пізніше.');
      console.error('Error loading event data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Оновлення статусу події
  const handleUpdateStatus = async (status: EventStatus) => {
    try {
      setUpdating(true);
      await updateEventStatus(id, status);
      setStatusDialogVisible(false);

      // Оновлюємо дані події
      await loadEventData();
    } catch (err: any) {
      Alert.alert('Помилка', err.message || 'Не вдалося оновити статус події');
    } finally {
      setUpdating(false);
    }
  };

  // Видалення події
  const handleDelete = async () => {
    try {
      setUpdating(true);
      await deleteEvent(id);
      setDeleteDialogVisible(false);

      // Повертаємось на попередній екран
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Помилка', err.message || 'Не вдалося видалити подію');
    } finally {
      setUpdating(false);
    }
  };

  // Переклад типу події
  const getEventTypeText = (type: string) => {
    const types: Record<string, string> = {
      'water.parameters': 'Параметри води',
      'water.change': 'Заміна води',
      feeding: 'Годування',
      'equipment.maintenance': 'Обслуговування обладнання',
      'inhabitant.added': 'Додано мешканця',
      'inhabitant.removed': 'Видалено мешканця',
      'plant.trimmed': 'Обрізка рослин',
      observation: 'Спостереження',
      'issue.detected': 'Виявлено проблему',
      'issue.resolved': 'Проблему вирішено',
      'complex.maintenance': 'Комплексне обслуговування',
      'media.added': 'Додано фото/відео',
      custom: 'Інша подія',
    };
    return types[type] || type;
  };

  // Переклад статусу події
  const getEventStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      scheduled: 'Заплановано',
      in_progress: 'В процесі',
      completed: 'Завершено',
      cancelled: 'Скасовано',
    };
    return statuses[status] || status;
  };

  // Отримання кольору статусу події
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: '#2196F3',
      in_progress: '#FF9800',
      completed: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || theme.colors.primary;
  };

  // Отримання ікони для типу події
  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'water.parameters': 'test-tube',
      'water.change': 'water',
      feeding: 'food',
      'equipment.maintenance': 'tools',
      'inhabitant.added': 'fish',
      'inhabitant.removed': 'location-exit',
      'plant.trimmed': 'content-cut',
      observation: 'eye',
      'issue.detected': 'alert-circle',
      'issue.resolved': 'check-circle',
      'complex.maintenance': 'wrench',
      'media.added': 'image',
      custom: 'format-list-bulleted',
    };
    return icons[type] || 'calendar';
  };

  // Рендер параметрів води
  const renderWaterParameters = () => {
    if (!event || !event.waterParameters) return null;

    const params = event.waterParameters;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Параметри води</Title>

          <View style={styles.parametersGrid}>
            {params.temperature && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Температура</Text>
                <Text style={styles.parameterValue}>
                  {params.temperature} °C
                </Text>
              </View>
            )}

            {params.pH && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>pH</Text>
                <Text style={styles.parameterValue}>{params.pH}</Text>
              </View>
            )}

            {params.ammonia !== undefined && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Аміак</Text>
                <Text style={styles.parameterValue}>{params.ammonia} ppm</Text>
              </View>
            )}

            {params.nitrite !== undefined && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Нітрити</Text>
                <Text style={styles.parameterValue}>{params.nitrite} ppm</Text>
              </View>
            )}

            {params.nitrate !== undefined && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Нітрати</Text>
                <Text style={styles.parameterValue}>{params.nitrate} ppm</Text>
              </View>
            )}

            {params.kh !== undefined && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>KH</Text>
                <Text style={styles.parameterValue}>{params.kh} dKH</Text>
              </View>
            )}

            {params.gh !== undefined && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>GH</Text>
                <Text style={styles.parameterValue}>{params.gh} dGH</Text>
              </View>
            )}

            {params.phosphate !== undefined && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Фосфати</Text>
                <Text style={styles.parameterValue}>
                  {params.phosphate} ppm
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Рендер даних про заміну води
  const renderWaterChange = () => {
    if (!event || !event.parameters) return null;

    const params = event.parameters;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Заміна води</Title>

          {params.percentage !== undefined && (
            <Paragraph>
              Відсоток заміни:{' '}
              <Text style={styles.highlightText}>{params.percentage}%</Text>
            </Paragraph>
          )}

          {params.amount !== undefined && (
            <Paragraph>
              Об'єм: <Text style={styles.highlightText}>{params.amount} л</Text>
            </Paragraph>
          )}

          {params.additives && (
            <>
              <Text style={styles.sectionTitle}>Додані препарати:</Text>
              <Paragraph style={styles.additives}>{params.additives}</Paragraph>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Рендер даних про годування
  const renderFeeding = () => {
    if (!event || !event.parameters) return null;

    const params = event.parameters;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Годування</Title>

          {params.foodType && (
            <Paragraph>
              Тип корму:{' '}
              <Text style={styles.highlightText}>{params.foodType}</Text>
            </Paragraph>
          )}

          {params.amount && (
            <Paragraph>
              Кількість:{' '}
              <Text style={styles.highlightText}>{params.amount}</Text>
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Рендер дочірніх подій для комплексної події
  const renderChildEvents = () => {
    if (!childEvents || childEvents.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Підзадачі</Title>

          {childEvents.map(childEvent => (
            <List.Item
              key={childEvent.id}
              title={childEvent.title}
              description={getEventTypeText(childEvent.type)}
              left={props => (
                <Avatar.Icon
                  {...props}
                  size={40}
                  icon={getEventTypeIcon(childEvent.type)}
                  style={{backgroundColor: `${theme.colors.primary}20`}}
                  color={theme.colors.primary}
                />
              )}
              right={props => (
                <Chip
                  mode="outlined"
                  style={{borderColor: getStatusColor(childEvent.status)}}
                  textStyle={{color: getStatusColor(childEvent.status)}}>
                  {getEventStatusText(childEvent.status)}
                </Chip>
              )}
              onPress={() => {
                navigation.push('EventDetails', {
                  id: childEvent.id,
                  aquariumId,
                });
              }}
            />
          ))}
        </Card.Content>
      </Card>
    );
  };

  // Рендер галереї медіа
  const renderMediaGallery = () => {
    if (!event || !event.mediaUrls || event.mediaUrls.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Фото</Title>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mediaScroll}>
            {event.mediaUrls.map((url: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.mediaItem}
                onPress={() => {
                  // Відкрити фото на повний екран
                }}>
                <Image
                  source={{uri: url}}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  // Рендер додаткових параметрів
  const renderAdditionalParameters = () => {
    if (!event || !event.parameters) return null;

    const params = event.parameters;
    // Виключаємо параметри, які вже відображені в спеціалізованих картках
    const excludeKeys = [
      'percentage',
      'amount',
      'additives',
      'foodType',
      'amount',
    ];
    const hasAdditionalParams = Object.keys(params).some(
      key => !excludeKeys.includes(key),
    );

    if (!hasAdditionalParams) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Додаткові параметри</Title>

          {Object.entries(params).map(([key, value]) => {
            if (excludeKeys.includes(key)) return null;

            return (
              <Paragraph key={key}>
                {key}: <Text style={styles.highlightText}>{value}</Text>
              </Paragraph>
            );
          })}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Подію не знайдено'}</Text>
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
        <Animated.View
          style={[
            styles.headerBackground,
            {opacity: imageOpacity, backgroundColor: theme.colors.primary},
          ]}>
          <View style={styles.headerIconContainer}>
            <IconButton
              icon={getEventTypeIcon(event.type)}
              size={60}
              color="#fff"
            />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: titleOpacity,
              transform: [{translateY: titleTranslateY}],
            },
          ]}>
          <Text style={styles.headerTitle}>{event.title}</Text>
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
              navigation.navigate('EventForm', {
                id: event.id,
                aquariumId: event.aquariumId,
                edit: true,
              });
            }}
            title="Редагувати"
          />
          <Menu.Item
            leadingIcon="refresh"
            onPress={() => {
              setActionsVisible(false);
              setStatusDialogVisible(true);
            }}
            title="Змінити статус"
          />
          <Divider />
          <Menu.Item
            leadingIcon="delete"
            onPress={() => {
              setActionsVisible(false);
              setDeleteDialogVisible(true);
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
        {/* Інформація про подію */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerInfo}>
              <View>
                <Title>{event.title}</Title>
                <Chip icon={getEventTypeIcon(event.type)}>
                  {getEventTypeText(event.type)}
                </Chip>
              </View>

              <Chip
                mode="outlined"
                style={{borderColor: getStatusColor(event.status)}}
                textStyle={{color: getStatusColor(event.status)}}>
                {getEventStatusText(event.status)}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.timestamp}>
              {formatDateToLocal(new Date(event.timestamp))} (
              {getRelativeTime(new Date(event.timestamp))})
            </Text>

            {event.description && (
              <Paragraph style={styles.description}>
                {event.description}
              </Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Специфічні карти в залежності від типу події */}
        {event.type === EventType.WATER_PARAMETERS && renderWaterParameters()}
        {event.type === EventType.WATER_CHANGE && renderWaterChange()}
        {event.type === EventType.FEEDING && renderFeeding()}

        {/* Дочірні події для комплексної події */}
        {event.type === EventType.COMPLEX_MAINTENANCE && renderChildEvents()}

        {/* Галерея медіа */}
        {renderMediaGallery()}

        {/* Додаткові параметри */}
        {renderAdditionalParameters()}
      </Animated.ScrollView>

      {/* Діалоги */}
      <Portal>
        {/* Діалог зміни статусу */}
        <Dialog
          visible={statusDialogVisible}
          onDismiss={() => setStatusDialogVisible(false)}>
          <Dialog.Title>Змінити статус</Dialog.Title>
          <Dialog.Content>
            <List.Section>
              <List.Item
                title="Заплановано"
                description="Подія ще не розпочата"
                left={props => (
                  <List.Icon {...props} icon="calendar" color="#2196F3" />
                )}
                onPress={() => handleUpdateStatus(EventStatus.SCHEDULED)}
                disabled={updating}
              />
              <List.Item
                title="В процесі"
                description="Подія розпочата, але не завершена"
                left={props => (
                  <List.Icon {...props} icon="progress-clock" color="#FF9800" />
                )}
                onPress={() => handleUpdateStatus(EventStatus.IN_PROGRESS)}
                disabled={updating}
              />
              <List.Item
                title="Завершено"
                description="Подія успішно завершена"
                left={props => (
                  <List.Icon {...props} icon="check-circle" color="#4CAF50" />
                )}
                onPress={() => handleUpdateStatus(EventStatus.COMPLETED)}
                disabled={updating}
              />
              <List.Item
                title="Скасовано"
                description="Подія не відбудеться"
                left={props => (
                  <List.Icon {...props} icon="cancel" color="#F44336" />
                )}
                onPress={() => handleUpdateStatus(EventStatus.CANCELLED)}
                disabled={updating}
              />
            </List.Section>

            {updating && (
              <View style={styles.dialogLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.dialogLoadingText}>
                  Оновлення статусу...
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStatusDialogVisible(false)}>
              Скасувати
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Діалог видалення */}
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Видалити подію</Dialog.Title>
          <Dialog.Content>
            <Text>
              Ви впевнені, що хочете видалити подію "{event.title}"?
              {event.type === EventType.COMPLEX_MAINTENANCE &&
                childEvents.length > 0 && (
                  <Text style={{color: theme.colors.error}}>
                    {'\n\n'}Увага: Разом з цією подією будуть видалені всі{' '}
                    {childEvents.length} підзадачі.
                  </Text>
                )}
            </Text>

            {updating && (
              <View style={styles.dialogLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.dialogLoadingText}>Видалення...</Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Скасувати
            </Button>
            <Button
              onPress={handleDelete}
              textColor={theme.colors.error}
              disabled={updating}>
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
    backgroundColor: '#f5f5f5',
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
    height: HEADER_MAX_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  card: {
    marginBottom: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  divider: {
    marginVertical: 12,
  },
  timestamp: {
    marginBottom: 8,
    color: '#666',
  },
  description: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  highlightText: {
    fontWeight: 'bold',
  },
  additives: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  parameterItem: {
    width: '50%',
    padding: 8,
  },
  parameterLabel: {
    color: '#666',
    fontSize: 12,
  },
  parameterValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mediaScroll: {
    marginTop: 8,
  },
  mediaItem: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 160,
    height: 120,
  },
  dialogLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  dialogLoadingText: {
    marginLeft: 8,
  },
});

export default EventDetailsScreen;

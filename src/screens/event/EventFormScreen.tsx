import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Divider,
  SegmentedButtons,
  Menu,
  Chip,
  HelperText,
  useTheme,
  Switch,
  Card,
  Title,
  List,
} from 'react-native-paper';
import {useNavigation, useRoute} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {format} from 'date-fns';
import {createEvent} from '../api/eventApi';
import {uk} from 'date-fns/locale';

// Типи подій
enum EventType {
  WATER_PARAMETERS = 'water.parameters',
  WATER_CHANGE = 'water.change',
  FEEDING = 'feeding',
  EQUIPMENT_MAINTENANCE = 'equipment.maintenance',
  INHABITANT_ADDED = 'inhabitant.added',
  INHABITANT_REMOVED = 'inhabitant.removed',
  PLANT_TRIMMED = 'plant.trimmed',
  OBSERVATION = 'observation',
  ISSUE_DETECTED = 'issue.detected',
  ISSUE_RESOLVED = 'issue.resolved',
  COMPLEX_MAINTENANCE = 'complex.maintenance',
  MEDIA_ADDED = 'media.added',
  CUSTOM = 'custom',
}

interface RouteParams {
  aquariumId: string;
  eventType?: EventType;
  isComplex?: boolean;
}

interface Photo {
  uri: string;
  name: string;
  type: string;
}

const EventFormScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const {
    aquariumId,
    eventType: initialEventType,
    isComplex,
  } = route.params as RouteParams;

  // Базові поля для події
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>(
    initialEventType || EventType.WATER_PARAMETERS,
  );
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);

  // Поля для параметрів води
  const [waterParameters, setWaterParameters] = useState({
    temperature: '',
    pH: '',
    ammonia: '',
    nitrite: '',
    nitrate: '',
    kh: '',
    gh: '',
  });

  // Поля для заміни води
  const [waterChangeData, setWaterChangeData] = useState({
    percentage: '',
    amount: '',
    additives: '',
  });

  // Поля для годування
  const [feedingData, setFeedingData] = useState({
    foodType: '',
    amount: '',
  });

  // Комплексні події
  const [isComplexEvent, setIsComplexEvent] = useState(!!isComplex);
  const [selectedActions, setSelectedActions] = useState<
    Record<string, boolean>
  >({});

  // Зберігання форми
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Вибір фото
  const [menuVisible, setMenuVisible] = useState(false);

  // Автоматично встановлюємо дефолтний заголовок в залежності від типу події
  useEffect(() => {
    let defaultTitle = '';

    switch (eventType) {
      case EventType.WATER_PARAMETERS:
        defaultTitle = 'Вимірювання параметрів води';
        break;
      case EventType.WATER_CHANGE:
        defaultTitle = 'Заміна води';
        break;
      case EventType.FEEDING:
        defaultTitle = 'Годування';
        break;
      case EventType.EQUIPMENT_MAINTENANCE:
        defaultTitle = 'Обслуговування обладнання';
        break;
      case EventType.COMPLEX_MAINTENANCE:
        defaultTitle = 'Комплексне обслуговування';
        break;
      default:
        defaultTitle = '';
    }

    if (defaultTitle && !title) {
      setTitle(defaultTitle);
    }
  }, [eventType]);

  // Відкриття камери
  const handleCamera = async () => {
    setMenuVisible(false);

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.uri) {
        setPhotos([
          ...photos,
          {
            uri: asset.uri,
            name: asset.fileName || `photo_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          },
        ]);
      }
    }
  };

  // Відкриття галереї
  const handleGallery = async () => {
    setMenuVisible(false);

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 3,
    });

    if (result.assets && result.assets.length > 0) {
      const newPhotos = result.assets.map(asset => ({
        uri: asset.uri || '',
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      }));

      setPhotos([...photos, ...newPhotos]);
    }
  };

  // Видалення фото
  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  // Зміна дати
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Зміна типу події
  const handleEventTypeChange = (value: string) => {
    setEventType(value as EventType);
  };

  // Зміна параметрів води
  const handleWaterParameterChange = (name: string, value: string) => {
    setWaterParameters({
      ...waterParameters,
      [name]: value,
    });
  };

  // Зміна даних заміни води
  const handleWaterChangeDataChange = (name: string, value: string) => {
    setWaterChangeData({
      ...waterChangeData,
      [name]: value,
    });
  };

  // Зміна даних годування
  const handleFeedingDataChange = (name: string, value: string) => {
    setFeedingData({
      ...feedingData,
      [name]: value,
    });
  };

  // Обробка чекбоксів для комплексної події
  const toggleAction = (actionKey: string) => {
    setSelectedActions({
      ...selectedActions,
      [actionKey]: !selectedActions[actionKey],
    });
  };

  // Відправка форми
  const handleSubmit = async () => {
    // Базова валідація
    if (!title.trim()) {
      setError('Вкажіть назву події');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Підготовка даних в залежності від типу події
      let eventData: any = {
        aquariumId,
        type: eventType,
        title,
        description,
        timestamp: date.toISOString(),
      };

      // Додаємо специфічні параметри в залежності від типу події
      switch (eventType) {
        case EventType.WATER_PARAMETERS:
          eventData.parameters = waterParameters;
          break;
        case EventType.WATER_CHANGE:
          eventData.parameters = waterChangeData;
          break;
        case EventType.FEEDING:
          eventData.parameters = feedingData;
          break;
        case EventType.COMPLEX_MAINTENANCE:
          eventData.parameters = {
            actions: selectedActions,
          };
          break;
      }

      // Якщо є фотографії, додаємо їх
      if (photos.length > 0) {
        // Тут буде логіка завантаження фото на сервер і отримання URL
        eventData.mediaUrls = ['sample_url_1', 'sample_url_2']; // Заглушка
      }

      // Відправка на сервер
      const response = await createEvent(eventData);

      // Повернення назад після успіху
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Помилка при створенні події. Спробуйте знову.');
    } finally {
      setLoading(false);
    }
  };

  // Рендер полів в залежності від типу події
  const renderEventTypeFields = () => {
    switch (eventType) {
      case EventType.WATER_PARAMETERS:
        return (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Параметри води</Title>

              <TextInput
                label="Температура (°C)"
                value={waterParameters.temperature}
                onChangeText={value =>
                  handleWaterParameterChange('temperature', value)
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="pH"
                value={waterParameters.pH}
                onChangeText={value => handleWaterParameterChange('pH', value)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Аміак (NH₃/NH₄⁺) ppm"
                value={waterParameters.ammonia}
                onChangeText={value =>
                  handleWaterParameterChange('ammonia', value)
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Нітрити (NO₂⁻) ppm"
                value={waterParameters.nitrite}
                onChangeText={value =>
                  handleWaterParameterChange('nitrite', value)
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Нітрати (NO₃⁻) ppm"
                value={waterParameters.nitrate}
                onChangeText={value =>
                  handleWaterParameterChange('nitrate', value)
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Карбонатна жорсткість (KH) dKH"
                value={waterParameters.kh}
                onChangeText={value => handleWaterParameterChange('kh', value)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Загальна жорсткість (GH) dGH"
                value={waterParameters.gh}
                onChangeText={value => handleWaterParameterChange('gh', value)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
            </Card.Content>
          </Card>
        );

      case EventType.WATER_CHANGE:
        return (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Заміна води</Title>

              <TextInput
                label="Відсоток заміненої води (%)"
                value={waterChangeData.percentage}
                onChangeText={value =>
                  handleWaterChangeDataChange('percentage', value)
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Кількість (літрів)"
                value={waterChangeData.amount}
                onChangeText={value =>
                  handleWaterChangeDataChange('amount', value)
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Додані препарати"
                value={waterChangeData.additives}
                onChangeText={value =>
                  handleWaterChangeDataChange('additives', value)
                }
                mode="outlined"
                style={styles.input}
                multiline
              />
            </Card.Content>
          </Card>
        );

      case EventType.FEEDING:
        return (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Годування</Title>

              <TextInput
                label="Тип корму"
                value={feedingData.foodType}
                onChangeText={value =>
                  handleFeedingDataChange('foodType', value)
                }
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Кількість"
                value={feedingData.amount}
                onChangeText={value => handleFeedingDataChange('amount', value)}
                mode="outlined"
                style={styles.input}
              />
            </Card.Content>
          </Card>
        );

      case EventType.COMPLEX_MAINTENANCE:
        return (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Комплексне обслуговування</Title>

              <List.Section>
                <List.Subheader>Підміна води</List.Subheader>
                <List.Item
                  title="Часткова заміна води"
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={
                        selectedActions['waterChange']
                          ? 'checkbox-marked'
                          : 'checkbox-blank-outline'
                      }
                    />
                  )}
                  onPress={() => toggleAction('waterChange')}
                />

                {selectedActions['waterChange'] && (
                  <View style={styles.nestedFields}>
                    <TextInput
                      label="Відсоток заміненої води (%)"
                      value={waterChangeData.percentage}
                      onChangeText={value =>
                        handleWaterChangeDataChange('percentage', value)
                      }
                      keyboardType="numeric"
                      mode="outlined"
                      style={styles.input}
                    />
                  </View>
                )}

                <List.Subheader>Обладнання</List.Subheader>
                <List.Item
                  title="Чистка фільтра"
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={
                        selectedActions['filterCleaning']
                          ? 'checkbox-marked'
                          : 'checkbox-blank-outline'
                      }
                    />
                  )}
                  onPress={() => toggleAction('filterCleaning')}
                />

                <List.Item
                  title="Чистка скла"
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={
                        selectedActions['glassCleaning']
                          ? 'checkbox-marked'
                          : 'checkbox-blank-outline'
                      }
                    />
                  )}
                  onPress={() => toggleAction('glassCleaning')}
                />

                <List.Subheader>Рослини</List.Subheader>
                <List.Item
                  title="Підрізка рослин"
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={
                        selectedActions['plantTrimming']
                          ? 'checkbox-marked'
                          : 'checkbox-blank-outline'
                      }
                    />
                  )}
                  onPress={() => toggleAction('plantTrimming')}
                />

                <List.Item
                  title="Додавання добрив"
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={
                        selectedActions['fertilization']
                          ? 'checkbox-marked'
                          : 'checkbox-blank-outline'
                      }
                    />
                  )}
                  onPress={() => toggleAction('fertilization')}
                />
              </List.Section>
            </Card.Content>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Заголовок і загальні поля */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Загальна інформація</Title>

            {/* Тип події */}
            <Text style={styles.label}>Тип події</Text>
            <SegmentedButtons
              value={eventType}
              onValueChange={handleEventTypeChange}
              buttons={[
                {value: EventType.WATER_PARAMETERS, label: 'Параметри'},
                {value: EventType.WATER_CHANGE, label: 'Заміна води'},
                {value: EventType.FEEDING, label: 'Годування'},
              ]}
              style={styles.segmentedButtons}
            />

            <View style={styles.complexEventToggle}>
              <Text>Комплексна подія</Text>
              <Switch
                value={isComplexEvent}
                onValueChange={setIsComplexEvent}
                color={theme.colors.primary}
              />
            </View>

            {isComplexEvent && (
              <Chip icon="information" style={styles.infoChip}>
                Комплексне обслуговування акваріума
              </Chip>
            )}

            {/* Заголовок */}
            <TextInput
              label="Назва події"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
            />

            {/* Опис */}
            <TextInput
              label="Опис (необов'язково)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />

            {/* Дата і час */}
            <Text style={styles.label}>Дата і час</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}>
              <Text>{format(date, 'PPpp', {locale: uk})}</Text>
              <IconButton icon="calendar" size={20} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="datetime"
                display="default"
                onChange={onDateChange}
              />
            )}
          </Card.Content>
        </Card>

        {/* Специфічні поля для типу події */}
        {renderEventTypeFields()}

        {/* Секція фото */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Фото</Title>

            <View style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{uri: photo.uri}} style={styles.photo} />
                  <IconButton
                    icon="close-circle"
                    size={20}
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                  />
                </View>
              ))}

              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={() => setMenuVisible(true)}>
                    <IconButton icon="plus" size={24} />
                    <Text>Додати фото</Text>
                  </TouchableOpacity>
                }>
                <Menu.Item
                  leadingIcon="camera"
                  onPress={handleCamera}
                  title="Зробити фото"
                />
                <Menu.Item
                  leadingIcon="image"
                  onPress={handleGallery}
                  title="Обрати з галереї"
                />
              </Menu>
            </View>
          </Card.Content>
        </Card>

        {/* Помилка */}
        {error ? (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        ) : null}

        {/* Кнопки управління */}
        <View style={styles.buttons}>
          <Button
            mode="outlined"
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}>
            Скасувати
          </Button>

          <Button
            mode="contained"
            style={styles.button}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}>
            Зберегти
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    margin: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    borderColor: '#ccc',
  },
  complexEventToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoChip: {
    marginBottom: 16,
  },
  nestedFields: {
    paddingLeft: 40,
    paddingRight: 16,
    marginBottom: 8,
  },
});

export default EventFormScreen;

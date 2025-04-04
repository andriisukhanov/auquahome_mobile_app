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
  SegmentedButtons,
  Chip,
  HelperText,
  useTheme,
  Switch,
  Card,
  Title,
  IconButton,
  Menu,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import {useNavigation, useRoute} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {format} from 'date-fns';
import {uk} from 'date-fns/locale';
import {createInhabitant, InhabitantType} from '../../api/inhabitantApi';

interface RouteParams {
  aquariumId: string;
  initialType?: InhabitantType;
}

interface Photo {
  uri: string;
  name: string;
  type: string;
}

const AddInhabitantScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const {aquariumId, initialType} = route.params as RouteParams;

  // Базові поля для мешканця
  const [type, setType] = useState<InhabitantType>(
    initialType || InhabitantType.FISH,
  );
  const [species, setSpecies] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState('');

  // Додаткові поля для різних типів мешканців
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [minPh, setMinPh] = useState('');
  const [maxPh, setMaxPh] = useState('');
  const [origin, setOrigin] = useState('');
  const [adultSize, setAdultSize] = useState('');
  const [lifespan, setLifespan] = useState('');
  const [careLevel, setCareLevel] = useState('medium');
  const [plantPosition, setPlantPosition] = useState('middle');
  const [plantLightLevel, setPlantLightLevel] = useState('medium');
  const [plantGrowthRate, setPlantGrowthRate] = useState('medium');

  // Стани для форми
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Відправка форми
  const handleSubmit = async () => {
    // Валідація форми
    if (!species.trim()) {
      setError('Вкажіть вид мешканця');
      return;
    }

    if (!quantity.trim() || parseInt(quantity) < 1) {
      setError('Вкажіть коректну кількість (мінімум 1)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Підготовка додаткових даних в залежності від типу мешканця
      let metadataObj: Record<string, any> = {
        notes: notes.trim(),
      };

      if (type === InhabitantType.FISH) {
        metadataObj = {
          ...metadataObj,
          temperature: {
            min: minTemp ? parseFloat(minTemp) : undefined,
            max: maxTemp ? parseFloat(maxTemp) : undefined,
          },
          ph: {
            min: minPh ? parseFloat(minPh) : undefined,
            max: maxPh ? parseFloat(maxPh) : undefined,
          },
          origin: origin.trim(),
          adultSize: adultSize ? parseFloat(adultSize) : undefined,
          lifespan: lifespan ? parseInt(lifespan) : undefined,
          careLevel,
        };
      } else if (type === InhabitantType.INVERTEBRATE) {
        metadataObj = {
          ...metadataObj,
          temperature: {
            min: minTemp ? parseFloat(minTemp) : undefined,
            max: maxTemp ? parseFloat(maxTemp) : undefined,
          },
          ph: {
            min: minPh ? parseFloat(minPh) : undefined,
            max: maxPh ? parseFloat(maxPh) : undefined,
          },
          origin: origin.trim(),
          adultSize: adultSize ? parseFloat(adultSize) : undefined,
          lifespan: lifespan ? parseInt(lifespan) : undefined,
          careLevel,
        };
      } else if (type === InhabitantType.PLANT) {
        metadataObj = {
          ...metadataObj,
          position: plantPosition,
          lightLevel: plantLightLevel,
          growthRate: plantGrowthRate,
          temperature: {
            min: minTemp ? parseFloat(minTemp) : undefined,
            max: maxTemp ? parseFloat(maxTemp) : undefined,
          },
          ph: {
            min: minPh ? parseFloat(minPh) : undefined,
            max: maxPh ? parseFloat(maxPh) : undefined,
          },
          origin: origin.trim(),
        };
      }

      // Підготовка даних для створення мешканця
      const inhabitantData = {
        aquariumId,
        type,
        species,
        quantity: parseInt(quantity),
        addedAt: date.toISOString(),
        metadata: metadataObj,
      };

      // Відправка на сервер
      const response = await createInhabitant(inhabitantData);

      // Якщо є фотографії, додаємо їх
      if (photos.length > 0) {
        // Тут буде логіка завантаження фото на сервер
        console.log('Фото для завантаження:', photos.length);
      }

      // Повернення на попередній екран після успіху
      navigation.goBack();
    } catch (err: any) {
      setError(
        err.message || 'Помилка при створенні мешканця. Спробуйте знову.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Отримання заголовку форми в залежності від типу мешканця
  const getFormTitle = () => {
    switch (type) {
      case InhabitantType.FISH:
        return 'Додати рибу';
      case InhabitantType.INVERTEBRATE:
        return 'Додати безхребетного';
      case InhabitantType.PLANT:
        return 'Додати рослину';
      default:
        return 'Додати мешканця';
    }
  };

  // Отримання підказки для поля "Вид" в залежності від типу мешканця
  const getSpeciesPlaceholder = () => {
    switch (type) {
      case InhabitantType.FISH:
        return 'Наприклад: Неон, Гупі, Скалярія';
      case InhabitantType.INVERTEBRATE:
        return 'Наприклад: Креветка Вишня, Равлик Неретина';
      case InhabitantType.PLANT:
        return 'Наприклад: Анубіас, Валіснерія, Криптокорина';
      default:
        return 'Введіть вид';
    }
  };

  // Рендер полів для риб та безхребетних
  const renderFishFields = () => (
    <>
      <Text style={styles.sectionLabel}>Умови утримання</Text>
      <View style={styles.rowFields}>
        <TextInput
          label="Мін. температура (°C)"
          value={minTemp}
          onChangeText={setMinTemp}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, {flex: 1, marginRight: 8}]}
        />
        <TextInput
          label="Макс. температура (°C)"
          value={maxTemp}
          onChangeText={setMaxTemp}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, {flex: 1}]}
        />
      </View>

      <View style={styles.rowFields}>
        <TextInput
          label="Мін. pH"
          value={minPh}
          onChangeText={setMinPh}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, {flex: 1, marginRight: 8}]}
        />
        <TextInput
          label="Макс. pH"
          value={maxPh}
          onChangeText={setMaxPh}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, {flex: 1}]}
        />
      </View>

      <TextInput
        label="Походження"
        value={origin}
        onChangeText={setOrigin}
        mode="outlined"
        style={styles.input}
        placeholder="Наприклад: Амазонка, Південно-Східна Азія"
      />

      <View style={styles.rowFields}>
        <TextInput
          label="Дорослий розмір (см)"
          value={adultSize}
          onChangeText={setAdultSize}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, {flex: 1, marginRight: 8}]}
        />
        <TextInput
          label="Тривалість життя (роки)"
          value={lifespan}
          onChangeText={setLifespan}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, {flex: 1}]}
        />
      </View>

      <Text style={styles.selectLabel}>Рівень складності догляду</Text>
      <SegmentedButtons
        value={careLevel}
        onValueChange={setCareLevel}
        buttons={[
          {value: 'easy', label: 'Легкий'},
          {value: 'medium', label: 'Середній'},
          {value: 'hard', label: 'Складний'},
        ]}
        style={styles.segmentedButtons}
      />
    </>
  );

  // Рендер полів для рослин
  const renderPlantFields = () => (
    <>
      <Text style={styles.sectionLabel}>Умови для рослин</Text>
      <Text style={styles.selectLabel}>Розташування в акваріумі</Text>
      <SegmentedButtons
        value={plantPosition}
        onValueChange={setPlantPosition}
        buttons={[
          {value: 'foreground', label: 'Передній план'},
          {value: 'middle', label: 'Середній план'},
          {value: 'background', label: 'Задній план'},
        ]}
        style={styles.segmentedButtons}
      />

      <Text style={styles.selectLabel}>Потреба в освітленні</Text>
      <SegmentedButtons
        value={plantLightLevel}
        onValueChange={setPlantLightLevel}
        buttons={[
          {value: 'low', label: 'Низька'},
          {value: 'medium', label: 'Середня'},
          {value: 'high', label: 'Висока'},
        ]}
        style={styles.segmentedButtons}
      />

      <Text style={styles.selectLabel}>Швидкість росту</Text>
      <SegmentedButtons
        value={plantGrowthRate}
        onValueChange={setPlantGrowthRate}
        buttons={[
          {value: 'slow', label: 'Повільна'},
          {value: 'medium', label: 'Середня'},
          {value: 'fast', label: 'Швидка'},
        ]}
        style={styles.segmentedButtons}
      />

      <View style={styles.rowFields}>
        <TextInput
          label="Мін. температура (°C)"
          value={minTemp}
          onChangeText={setMinTemp}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, {flex: 1, marginRight: 8}]}
        />
        <TextInput
          label="Макс. температура (°C)"
          value={maxTemp}
          onChangeText={setMaxTemp}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, {flex: 1}]}
        />
      </View>

      <View style={styles.rowFields}>
        <TextInput
          label="Мін. pH"
          value={minPh}
          onChangeText={setMinPh}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, {flex: 1, marginRight: 8}]}
        />
        <TextInput
          label="Макс. pH"
          value={maxPh}
          onChangeText={setMaxPh}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, {flex: 1}]}
        />
      </View>

      <TextInput
        label="Походження"
        value={origin}
        onChangeText={setOrigin}
        mode="outlined"
        style={styles.input}
        placeholder="Наприклад: Амазонка, Південно-Східна Азія"
      />
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Загальна інформація */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>{getFormTitle()}</Title>

            {/* Тип мешканця */}
            <Text style={styles.selectLabel}>Тип</Text>
            <SegmentedButtons
              value={type}
              onValueChange={value => setType(value as InhabitantType)}
              buttons={[
                {
                  value: InhabitantType.FISH,
                  label: 'Риба',
                  icon: 'fish',
                },
                {
                  value: InhabitantType.INVERTEBRATE,
                  label: 'Безхребетні',
                  icon: 'shrimp',
                },
                {
                  value: InhabitantType.PLANT,
                  label: 'Рослина',
                  icon: 'flower',
                },
              ]}
              style={styles.segmentedButtons}
            />

            {/* Назва виду */}
            <TextInput
              label="Вид"
              value={species}
              onChangeText={setSpecies}
              mode="outlined"
              style={styles.input}
              placeholder={getSpeciesPlaceholder()}
            />

            {/* Кількість */}
            <TextInput
              label="Кількість"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />

            {/* Дата додавання */}
            <Text style={styles.selectLabel}>Дата додавання</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}>
              <Text>{format(date, 'PPp', {locale: uk})}</Text>
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

        {/* Специфічні поля для типу мешканця */}
        {type !== InhabitantType.PLANT ? (
          <Card style={styles.card}>
            <Card.Content>{renderFishFields()}</Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content>{renderPlantFields()}</Card.Content>
          </Card>
        )}

        {/* Додаткові нотатки */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Нотатки"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />
          </Card.Content>
        </Card>

        {/* Фото */}
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
          <HelperText type="error" visible={!!error} style={styles.errorText}>
            {error}
          </HelperText>
        ) : null}

        {/* Кнопки */}
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
  selectLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
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
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
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
});

export default AddInhabitantScreen;

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import {
  Text,
  useTheme,
  ActivityIndicator,
  Button,
  IconButton,
  Chip,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {getMediaTimeline, getMediaByDate} from '../../api/timelineApi';
import {formatDateToLocal, getShortDate} from '../../utils/dateUtils';
import EmptyState from '../common/EmptyState';

interface GalleryTabProps {
  aquariumId: string;
}

interface MediaItem {
  id: string;
  url: string;
  caption?: string;
  timestamp?: string;
}

interface MediaGroup {
  date: string;
  media: MediaItem[];
}

const GalleryTab: React.FC<GalleryTabProps> = ({aquariumId}) => {
  const [mediaGroups, setMediaGroups] = useState<MediaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pageSize = 12;
  const numColumns = 3;
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = screenWidth / numColumns - 2;

  const theme = useTheme();
  const navigation = useNavigation();

  // Завантаження даних галереї
  const loadGallery = useCallback(
    async (refresh = false) => {
      try {
        setError('');
        if (refresh) {
          setLoading(true);
          setPage(0);
        } else if (loadingMore) {
          return;
        } else {
          setLoadingMore(true);
        }

        const currentPage = refresh ? 0 : page;

        const data = await getMediaTimeline(
          aquariumId,
          pageSize,
          currentPage * pageSize,
        );

        if (data.length < pageSize) {
          setHasMore(false);
        }

        if (refresh) {
          setMediaGroups(data);
        } else {
          setMediaGroups(prevGroups => {
            // Перевіряємо, чи є нові групи
            const newGroups = data.filter(
              newGroup =>
                !prevGroups.some(prevGroup => prevGroup.date === newGroup.date),
            );

            // Для наявних груп додаємо нові медіа
            const updatedPrevGroups = prevGroups.map(prevGroup => {
              const matchingNewGroup = data.find(
                newGroup => newGroup.date === prevGroup.date,
              );
              if (matchingNewGroup) {
                // Додаємо лише унікальні медіа
                const combinedMedia = [
                  ...prevGroup.media,
                  ...matchingNewGroup.media.filter(
                    newMedia =>
                      !prevGroup.media.some(
                        prevMedia => prevMedia.id === newMedia.id,
                      ),
                  ),
                ];
                return {
                  ...prevGroup,
                  media: combinedMedia,
                };
              }
              return prevGroup;
            });

            // Повертаємо оновлені групи плюс нові
            return [...updatedPrevGroups, ...newGroups].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
          });
        }

        if (refresh) {
          setPage(1);
        } else {
          setPage(currentPage + 1);
        }
      } catch (err: any) {
        setError('Помилка завантаження галереї. Спробуйте знову пізніше.');
        console.error('Error loading gallery:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [aquariumId, page, loadingMore],
  );

  useEffect(() => {
    loadGallery(true);
  }, [aquariumId]);

  // Оновлення галереї при свайпі вниз
  const onRefresh = () => {
    setRefreshing(true);
    loadGallery(true);
  };

  // Завантаження нових фото при досягненні кінця списку
  const loadMoreMedia = () => {
    if (hasMore && !loadingMore && !loading) {
      loadGallery();
    }
  };

  // Відкриття камери для зйомки фото
  const handleCamera = async () => {
    try {
      setUploadingImage(true);
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          // Тут буде код для завантаження фото на сервер
          console.log('Фото зроблено:', asset.uri);

          // Оновлюємо галерею після завантаження
          onRefresh();
        }
      }
    } catch (err) {
      console.error('Error taking photo:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Відкриття галереї для вибору фото
  const handleGallery = async () => {
    try {
      setUploadingImage(true);
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 10,
      });

      if (result.assets && result.assets.length > 0) {
        // Код для завантаження вибраних фото на сервер
        console.log('Вибрано фото:', result.assets.length);

        // Оновлюємо галерею після завантаження
        onRefresh();
      }
    } catch (err) {
      console.error('Error selecting photos:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Відображення зображення у повноекранному режимі
  const showImageFullscreen = (item: MediaItem) => {
    setSelectedImage(item);
    setModalVisible(true);
  };

  // Рендер групи фото за датою
  const renderDateGroup = ({item}: {item: MediaGroup}) => {
    const dateObj = new Date(item.date);

    return (
      <View style={styles.dateGroup}>
        <View style={styles.dateHeader}>
          <Chip icon="calendar">{formatDateToLocal(dateObj)}</Chip>
          <Text style={styles.imageCount}>{item.media.length} фото</Text>
        </View>

        <View style={styles.imagesGrid}>
          {item.media.map(mediaItem => (
            <TouchableOpacity
              key={mediaItem.id}
              style={styles.imageContainer}
              onPress={() => showImageFullscreen(mediaItem)}>
              <Image
                source={{uri: mediaItem.url}}
                style={[styles.image, {width: imageWidth, height: imageWidth}]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Рендер роздільника між групами
  const renderSeparator = () => <View style={styles.separator} />;

  // Компонент для відображення порожнього стану
  const renderEmptyComponent = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon="image"
        title="Немає фотографій"
        description="Додайте фотографії вашого акваріума, щоб відстежувати зміни з часом"
        buttonText="Додати фото"
        onButtonPress={handleGallery}
      />
    );
  };

  // Футер списку з кнопкою "Завантажити ще"
  const renderFooter = () => {
    if (!hasMore) return null;

    return loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    ) : null;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            mode="contained"
            onPress={() => loadGallery(true)}
            style={styles.retryButton}>
            Спробувати знову
          </Button>
        </View>
      ) : (
        <>
          <FlatList
            data={mediaGroups}
            renderItem={renderDateGroup}
            keyExtractor={item => item.date}
            contentContainerStyle={
              mediaGroups.length === 0 ? styles.emptyList : styles.list
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
            ItemSeparatorComponent={renderSeparator}
            ListEmptyComponent={renderEmptyComponent}
            ListFooterComponent={renderFooter}
            onEndReached={loadMoreMedia}
            onEndReachedThreshold={0.1}
          />

          {/* FAB кнопки для додавання фото */}
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={[
                styles.fabButton,
                {backgroundColor: theme.colors.primary},
              ]}
              onPress={handleGallery}
              disabled={uploadingImage}>
              <IconButton icon="image-multiple" iconColor="#fff" size={24} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fabButton,
                {backgroundColor: theme.colors.primary},
                styles.mainFab,
              ]}
              onPress={handleCamera}
              disabled={uploadingImage}>
              <IconButton icon="camera" iconColor="#fff" size={30} />
            </TouchableOpacity>
          </View>

          {/* Модальне вікно для перегляду фото */}
          <Modal
            visible={modalVisible}
            transparent={true}
            onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <IconButton
                  icon="close"
                  iconColor="#fff"
                  size={24}
                  onPress={() => setModalVisible(false)}
                />
              </View>

              {selectedImage && (
                <>
                  <Image
                    source={{uri: selectedImage.url}}
                    style={styles.fullscreenImage}
                    resizeMode="contain"
                  />

                  {(selectedImage.caption || selectedImage.timestamp) && (
                    <View style={styles.modalFooter}>
                      {selectedImage.caption && (
                        <Text style={styles.caption}>
                          {selectedImage.caption}
                        </Text>
                      )}
                      {selectedImage.timestamp && (
                        <Text style={styles.timestamp}>
                          {formatDateToLocal(new Date(selectedImage.timestamp))}
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          </Modal>
        </>
      )}
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
    padding: 20,
  },
  errorText: {
    color: 'tomato',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 12,
  },
  list: {
    padding: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageCount: {
    color: '#757575',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageContainer: {
    margin: 1,
  },
  image: {
    borderRadius: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    marginLeft: 8,
  },
  mainFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
  },
  modalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  caption: {
    color: 'white',
    fontSize: 16,
    marginBottom: 4,
  },
  timestamp: {
    color: '#cccccc',
    fontSize: 14,
  },
});

export default GalleryTab;

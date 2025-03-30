import React, {useEffect, useState} from 'react';
import {View, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {
  Text,
  FAB,
  ActivityIndicator,
  useTheme,
  Card,
  Title,
  Paragraph,
  Chip,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {fetchAquariums} from '../api/aquariumApi';
import EmptyState from '../components/EmptyState';

// Типи для TypeScript
interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume: number;
  imageUrl?: string;
  isActive: boolean;
}

const AquariumListScreen = () => {
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const theme = useTheme();
  const navigation = useNavigation();

  // Функція для завантаження даних
  const loadAquariums = async () => {
    try {
      setError('');
      const data = await fetchAquariums();
      setAquariums(data);
    } catch (err: any) {
      setError('Помилка завантаження акваріумів. Спробуйте знову пізніше.');
      console.error('Error fetching aquariums:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Початкове завантаження при монтуванні компонента
  useEffect(() => {
    loadAquariums();
  }, []);

  // Функція для оновлення списку при свайпі вниз
  const onRefresh = () => {
    setRefreshing(true);
    loadAquariums();
  };

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

  // Компонент для відображення одного акваріума
  const renderAquariumItem = ({item}: {item: Aquarium}) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('AquariumDetails', {id: item.id})}>
      {item.imageUrl ? (
        <Card.Cover source={{uri: item.imageUrl}} style={styles.cardImage} />
      ) : (
        <View
          style={[
            styles.cardImagePlaceholder,
            {backgroundColor: theme.colors.surfaceVariant},
          ]}>
          <Text style={{color: theme.colors.onSurfaceVariant}}>Немає фото</Text>
        </View>
      )}
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Title>{item.name}</Title>
          {!item.isActive && (
            <Chip
              mode="outlined"
              style={styles.inactiveChip}
              textStyle={{color: theme.colors.error}}>
              Неактивний
            </Chip>
          )}
        </View>
        <View style={styles.cardDetails}>
          <Paragraph>{getAquariumTypeText(item.type)}</Paragraph>
          <Paragraph>{item.volume} л</Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  // Компонент для відображення порожнього стану
  const renderEmptyComponent = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon="fish"
        title="Немає акваріумів"
        description="Почніть з додавання вашого першого акваріума"
        buttonText="Додати акваріум"
        onButtonPress={() => navigation.navigate('AddAquarium')}
      />
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <FAB
            style={[styles.fab, {backgroundColor: theme.colors.primary}]}
            icon="refresh"
            onPress={loadAquariums}
            label="Спробувати знову"
            small
          />
        </View>
      ) : (
        <FlatList
          data={aquariums}
          renderItem={renderAquariumItem}
          keyExtractor={item => item.id}
          contentContainerStyle={
            aquariums.length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      )}

      <FAB
        style={[styles.fab, {backgroundColor: theme.colors.primary}]}
        icon="plus"
        onPress={() => navigation.navigate('AddAquarium')}
        label="Новий акваріум"
      />
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
    padding: 20,
  },
  errorText: {
    color: 'tomato',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    padding: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardImage: {
    height: 140,
  },
  cardImagePlaceholder: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    paddingTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  inactiveChip: {
    height: 24,
    borderColor: 'tomato',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default AquariumListScreen;

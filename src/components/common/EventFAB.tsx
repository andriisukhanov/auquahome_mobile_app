import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {
  Text,
  FAB,
  Portal,
  useTheme,
  Surface,
  IconButton,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {EventType} from '../../api/eventApi';

interface EventFABProps {
  aquariumId: string;
}

const EventFAB: React.FC<EventFABProps> = ({aquariumId}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandAnimation] = useState(new Animated.Value(0));

  const theme = useTheme();
  const navigation = useNavigation();

  // Відкриття/закриття меню
  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.spring(expandAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();

    setIsOpen(!isOpen);
  };

  // Анімація для підменю
  const rotateAnimation = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // Створення події певного типу
  const createEvent = (eventType: EventType, isComplex = false) => {
    toggleMenu();
    navigation.navigate('EventForm', {
      aquariumId,
      eventType,
      isComplex,
    });
  };

  // Подія комплексного обслуговування
  const handleComplexMaintenance = () => {
    createEvent(EventType.COMPLEX_MAINTENANCE, true);
  };

  return (
    <Portal>
      {/* Затемнення фону при відкритому меню */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      {/* Меню швидких дій */}
      <Animated.View
        style={[
          styles.menuContainer,
          {
            opacity: expandAnimation,
            transform: [
              {
                scale: expandAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}>
        {isOpen && (
          <Surface style={styles.menu} elevation={4}>
            {/* Підміна води */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => createEvent(EventType.WATER_CHANGE)}>
              <IconButton icon="water" color={theme.colors.primary} size={24} />
              <Text>Підміна води</Text>
            </TouchableOpacity>

            {/* Годування */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => createEvent(EventType.FEEDING)}>
              <IconButton icon="food" color={theme.colors.primary} size={24} />
              <Text>Годування</Text>
            </TouchableOpacity>

            {/* Вимірювання параметрів */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => createEvent(EventType.WATER_PARAMETERS)}>
              <IconButton
                icon="test-tube"
                color={theme.colors.primary}
                size={24}
              />
              <Text>Параметри води</Text>
            </TouchableOpacity>

            {/* Комплексне обслуговування */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleComplexMaintenance}>
              <IconButton
                icon="wrench"
                color={theme.colors.primary}
                size={24}
              />
              <Text>Комплексне обслуговування</Text>
            </TouchableOpacity>

            {/* Інші типи подій */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                navigation.navigate('EventForm', {aquariumId});
              }}>
              <IconButton
                icon="plus-circle"
                color={theme.colors.primary}
                size={24}
              />
              <Text>Інші типи подій</Text>
            </TouchableOpacity>
          </Surface>
        )}
      </Animated.View>

      {/* Основна кнопка FAB */}
      <FAB
        style={[styles.fab, {backgroundColor: theme.colors.primary}]}
        icon={props => (
          <Animated.View
            style={{
              transform: [{rotate: rotateAnimation}],
            }}>
            <IconButton {...props} icon="plus" />
          </Animated.View>
        )}
        onPress={toggleMenu}
        label={isOpen ? undefined : 'Додати подію'}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    bottom: 72,
    alignItems: 'flex-end',
  },
  menu: {
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});

export default EventFAB;

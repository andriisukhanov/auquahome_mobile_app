import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSelector, useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ActivityIndicator, View} from 'react-native';
import {useTheme, MD3Colors} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Redux
import {RootState} from '../store';
import {restoreToken} from '../store/slices/authSlice';

// Auth екрани
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Головні екрани
import AquariumListScreen from '../screens/aquarium/AquariumListScreen';
import AquariumDetailsScreen from '../screens/aquarium/AquariumDetailsScreen';
import AddAquariumScreen from '../screens/aquarium/AddAquariumScreen';
import EditAquariumScreen from '../screens/aquarium/EditAquariumScreen';

// Екрани мешканців
import InhabitantListScreen from '../screens/inhabitant/InhabitantListScreen';
import AddInhabitantScreen from '../screens/inhabitant/AddInhabitantScreen';
import InhabitantDetailsScreen from '../screens/inhabitant/InhabitantDetailsScreen';

// Екрани обладнання
import EquipmentListScreen from '../screens/equipment/EquipmentListScreen';
import AddEquipmentScreen from '../screens/equipment/AddEquipmentScreen';
import EquipmentDetailsScreen from '../screens/equipment/EquipmentDetailsScreen';

// Екрани подій
import EventFormScreen from '../screens/event/EventFormScreen';
import EventDetailsScreen from '../screens/event/EventDetailsScreen';
import EventListScreen from '../screens/event/EventListScreen';

// Екрани профілю
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

// Типи для навігації
type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

type MainStackParamList = {
  MainTabs: undefined;
  AquariumDetails: {id: string};
  AddAquarium: undefined;
  EditAquarium: {aquarium: any};
  AddInhabitant: {aquariumId: string};
  InhabitantDetails: {id: string; aquariumId: string};
  AddEquipment: {aquariumId: string};
  EquipmentDetails: {id: string; aquariumId: string};
  EventForm: {aquariumId: string; eventType?: string; isComplex?: boolean};
  EventDetails: {id: string; aquariumId: string};
  EventList: {aquariumId: string};
  EditProfile: undefined;
  Settings: undefined;
};

type MainTabsParamList = {
  AquariumList: undefined;
  Profile: undefined;
};

// Створення навігаторів
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabsParamList>();

// Компонент вкладок головного екрану
const MainTabsNavigator = () => {
  const theme = useTheme();

  return (
    <MainTabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: MD3Colors.neutral60,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 8,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: true,
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}>
      <MainTabs.Screen
        name="AquariumList"
        component={AquariumListScreen}
        options={{
          title: 'Мої акваріуми',
          tabBarLabel: 'Акваріуми',
          tabBarIcon: ({color, size}) => (
            <Icon name="fishbowl-outline" color={color} size={size} />
          ),
        }}
      />
      <MainTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Профіль',
          tabBarLabel: 'Профіль',
          tabBarIcon: ({color, size}) => (
            <Icon name="account-outline" color={color} size={size} />
          ),
        }}
      />
    </MainTabs.Navigator>
  );
};

// Навігатор авторизованої частини додатку
const MainNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}>
      <MainStack.Screen
        name="MainTabs"
        component={MainTabsNavigator}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="AquariumDetails"
        component={AquariumDetailsScreen}
        options={({route}) => ({
          title: 'Деталі акваріума',
          headerShown: false,
        })}
      />
      <MainStack.Screen
        name="AddAquarium"
        component={AddAquariumScreen}
        options={{title: 'Новий акваріум'}}
      />
      <MainStack.Screen
        name="EditAquarium"
        component={EditAquariumScreen}
        options={{title: 'Редагувати акваріум'}}
      />
      <MainStack.Screen
        name="AddInhabitant"
        component={AddInhabitantScreen}
        options={{title: 'Додати мешканця'}}
      />
      <MainStack.Screen
        name="InhabitantDetails"
        component={InhabitantDetailsScreen}
        options={{title: 'Деталі мешканця'}}
      />
      <MainStack.Screen
        name="AddEquipment"
        component={AddEquipmentScreen}
        options={{title: 'Додати обладнання'}}
      />
      <MainStack.Screen
        name="EquipmentDetails"
        component={EquipmentDetailsScreen}
        options={{title: 'Деталі обладнання'}}
      />
      <MainStack.Screen
        name="EventForm"
        component={EventFormScreen}
        options={{title: 'Додати подію'}}
      />
      <MainStack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{title: 'Деталі події'}}
      />
      <MainStack.Screen
        name="EventList"
        component={EventListScreen}
        options={{title: 'Хронологія подій'}}
      />
      <MainStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{title: 'Редагувати профіль'}}
      />
      <MainStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: 'Налаштування'}}
      />
    </MainStack.Navigator>
  );
};

// Компонент для авторизації
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </AuthStack.Navigator>
  );
};

// Головний навігатор додатку
const AppNavigator = () => {
  const dispatch = useDispatch();
  const {token, isLoading} = useSelector((state: RootState) => state.auth);
  const [isAppReady, setIsAppReady] = useState(false);

  // Завантаження збережених даних при старті
  useEffect(() => {
    const bootstrapApp = async () => {
      try {
        // Отримання токену та даних користувача з AsyncStorage
        const savedToken = await AsyncStorage.getItem('token');
        const savedRefreshToken = await AsyncStorage.getItem('refreshToken');
        const savedUserData = await AsyncStorage.getItem('user');

        let user = null;
        if (savedUserData) {
          user = JSON.parse(savedUserData);
        }

        // Відновлення стану авторизації
        dispatch(
          restoreToken({
            token: savedToken,
            refreshToken: savedRefreshToken,
            user,
          }),
        );
      } catch (error) {
        console.error('Помилка відновлення стану авторизації:', error);
      } finally {
        setIsAppReady(true);
      }
    };

    bootstrapApp();
  }, [dispatch]);

  // Показуємо екран завантаження, доки дані не відновлено
  if (!isAppReady || isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;

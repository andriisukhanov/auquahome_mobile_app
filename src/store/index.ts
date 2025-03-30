import {configureStore, combineReducers} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {persistStore, persistReducer} from 'redux-persist';
import thunk from 'redux-thunk';

// Імпорт редʼюсерів
import authReducer from './slices/authSlice';
import aquariumReducer from './slices/aquariumSlice';
import eventReducer from './slices/eventSlice';
import uiReducer from './slices/uiSlice';

// Конфігурація для Redux Persist
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Не зберігаємо стан UI
  blacklist: ['ui'],
};

// Конфігурація для окремих слайсів
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  blacklist: ['isLoading', 'error'],
};

const aquariumPersistConfig = {
  key: 'aquarium',
  storage: AsyncStorage,
  blacklist: ['isLoading', 'error'],
};

const eventPersistConfig = {
  key: 'event',
  storage: AsyncStorage,
  blacklist: ['isLoading', 'error'],
};

// Комбінування всіх редʼюсерів
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  aquarium: persistReducer(aquariumPersistConfig, aquariumReducer),
  event: persistReducer(eventPersistConfig, eventReducer),
  ui: uiReducer,
});

// Створюємо перзистований редʼюсер
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Створення стору
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(thunk),
});

// Створення перзистора
export const persistor = persistStore(store);

// Типи для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

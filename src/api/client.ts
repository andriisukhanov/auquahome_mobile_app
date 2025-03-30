import axios, {AxiosRequestConfig, AxiosResponse, AxiosError} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {store} from '../store';
import {updateToken, logoutUser} from '../store/slices/authSlice';
import NetInfo from '@react-native-community/netinfo';

// Базова URL для API
const BASE_URL = 'http://your-api-url.com/api';

// Інстанс axios з базовими налаштуваннями
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Перехоплювач запитів - додавання токену авторизації
apiClient.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    // Перевірка наявності мережі
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error(
        'Немає підключення до мережі. Перевірте підключення та спробуйте знову.',
      );
    }

    // Отримання токену з AsyncStorage
    const token = await AsyncStorage.getItem('token');

    // Якщо токен є, додаємо його до заголовків
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Перехоплювач відповідей - обробка помилок та оновлення токена
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Якщо помилка 401 (неавторизований) і це не повторний запит
    if (
      error.response?.status === 401 &&
      !originalRequest?.headers?.['X-Retry']
    ) {
      // Отримуємо refresh token
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Спроба оновити токен
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          // Якщо успішно, зберігаємо новий токен
          const newToken = response.data.accessToken;
          store.dispatch(updateToken(newToken));

          // Повторюємо оригінальний запит з новим токеном
          if (originalRequest && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            originalRequest.headers['X-Retry'] = 'true';
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // Якщо не вдалося оновити токен, розлогінюємо користувача
          store.dispatch(logoutUser());
          return Promise.reject(
            new Error('Сесія закінчилася. Будь ласка, увійдіть знову.'),
          );
        }
      } else {
        // Якщо немає refresh token, розлогінюємо користувача
        store.dispatch(logoutUser());
        return Promise.reject(new Error('Авторизація необхідна.'));
      }
    }

    // Обробка інших помилок
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Сталася помилка. Спробуйте знову пізніше.';

    return Promise.reject(new Error(errorMessage));
  },
);

// Функція для роботи з офлайн-режимом
const offlineQueue: {
  request: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}[] = [];

// Додавання запиту в чергу офлайн-режиму
export const addToOfflineQueue = (
  request: AxiosRequestConfig,
  resolve: (value: any) => void,
  reject: (error: any) => void,
) => {
  offlineQueue.push({request, resolve, reject});

  // Зберігаємо чергу в AsyncStorage для відновлення після перезапуску додатку
  AsyncStorage.setItem(
    'offlineQueue',
    JSON.stringify(
      offlineQueue.map(item => ({
        request: item.request,
      })),
    ),
  );
};

// Обробка черги запитів
export const processOfflineQueue = async () => {
  const netInfo = await NetInfo.fetch();

  if (netInfo.isConnected && offlineQueue.length > 0) {
    // Копіюємо чергу і очищаємо поточну
    const queue = [...offlineQueue];
    offlineQueue.length = 0;

    // Очищаємо збережену чергу
    AsyncStorage.removeItem('offlineQueue');

    // Виконуємо запити з черги
    queue.forEach(async ({request, resolve, reject}) => {
      try {
        const response = await apiClient(request);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  }
};

// Слухач зміни стану мережі для обробки офлайн-черги
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    processOfflineQueue();
  }
});

// Відновлення черги після запуску додатку
export const restoreOfflineQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem('offlineQueue');

    if (queue) {
      const parsedQueue = JSON.parse(queue);

      // Додаємо запити в чергу, але без resolve/reject (буде виконано при наступному запуску)
      parsedQueue.forEach((item: {request: AxiosRequestConfig}) => {
        offlineQueue.push({
          request: item.request,
          resolve: () => {},
          reject: () => {},
        });
      });

      // Спробуємо обробити чергу, якщо є з'єднання
      processOfflineQueue();
    }
  } catch (error) {
    console.error('Помилка відновлення офлайн-черги:', error);
  }
};

// Обгортка для запитів з підтримкою офлайн-режиму
export const offlineSafeRequest = async (
  config: AxiosRequestConfig,
  offlineSafe = false,
) => {
  try {
    return await apiClient(config);
  } catch (error: any) {
    // Якщо немає мережі і запит безпечний для офлайн-режиму
    if (error.message.includes('Немає підключення до мережі') && offlineSafe) {
      // Створюємо Promise, який буде виконано пізніше
      return new Promise((resolve, reject) => {
        addToOfflineQueue(config, resolve, reject);
      });
    }

    throw error;
  }
};

export default apiClient;

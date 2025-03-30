// api/authApi.ts
import apiClient, {offlineSafeRequest} from './client';

// Інтерфейси
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface UserProfileResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  settings?: Record<string, any>;
}

// Функція для входу користувача
export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Функція для реєстрації
export const register = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<RegisterResponse> => {
  try {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Функція для оновлення токену
export const refreshToken = async (
  refreshToken: string,
): Promise<{accessToken: string}> => {
  try {
    const response = await apiClient.post('/auth/refresh', {
      refreshToken,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Функція для отримання профілю користувача
export const getUserProfile = async (): Promise<UserProfileResponse> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: '/users/profile',
      },
      true, // Офлайн-безпечний запит
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Функція для оновлення профілю користувача
export const updateUserProfile = async (userData: {
  firstName?: string;
  lastName?: string;
  settings?: Record<string, any>;
}): Promise<UserProfileResponse> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'PUT',
        url: '/users/profile',
        data: userData,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

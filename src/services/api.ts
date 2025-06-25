// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/config'; // Asegúrate que la ruta sea correcta

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token de acceso a cada solicitud
api.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar la expiración del token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (Unauthorized) y no es la solicitud de token o refresh token,
    // y no hemos reintentado ya esta solicitud
    if (error.response?.status === 401 && !originalRequest._retry &&
        originalRequest.url !== 'token/' && originalRequest.url !== 'token/refresh/') {
      originalRequest._retry = true; // Marca que hemos intentado refrescar el token

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No hay refresh token, redirigir al login
          // NOTA: En una app real, esto requeriría un mecanismo para acceder a la navegación global
          // (ej. un contexto de autenticación o un manejador de eventos global).
          // Por ahora, solo lanzamos el error para que la pantalla de login se muestre.
          return Promise.reject(error);
        }

        // Solicitar un nuevo token de acceso usando el refresh token
        const response = await axios.post(`${API_BASE_URL}token/refresh/`, {
          refresh: refreshToken,
        });

        const { access: newAccessToken, refresh: newRefreshToken } = response.data;

        await AsyncStorage.setItem('accessToken', newAccessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken || refreshToken); // Guarda el nuevo refresh token si se envía

        // Reintentar la solicitud original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest); // Usa 'api' para reintentar con el interceptor de request
      } catch (refreshError) {
        // Falló el refresh token o no es válido, eliminar tokens y redirigir al login
        await AsyncStorage.clear();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
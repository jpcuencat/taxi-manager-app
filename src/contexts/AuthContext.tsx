// src/contexts/AuthContext.tsx
// Context para manejo global de autenticación

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../utils/config';

export interface User {
  id: number;
  username: string;
  rol: 'administrador' | 'validador' | 'encargado';
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  clearAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!(user && accessToken);

  // Cargar datos de autenticación al iniciar la app
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      setIsLoading(true);
      
      const [storedAccessToken, storedRefreshToken, storedUserId, storedUserRole] = await Promise.all([
        AsyncStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_ID),
        AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE),
      ]);

      if (storedAccessToken && storedRefreshToken && storedUserId && storedUserRole) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        
        // Crear objeto usuario básico con los datos almacenados
        const userData: User = {
          id: parseInt(storedUserId),
          username: '', // Se actualizará con datos completos si es necesario
          rol: storedUserRole as User['rol'],
        };
        
        setUser(userData);
        
        if (CONFIG.DEBUG_MODE) {
          console.log('Auth data loaded successfully');
        }
      } else {
        if (CONFIG.DEBUG_MODE) {
          console.log('No auth data found');
        }
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newAccessToken: string, newRefreshToken: string, userData: User) => {
    try {
      // Guardar en AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, newAccessToken),
        AsyncStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken),
        AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_ID, userData.id.toString()),
        AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_ROLE, userData.rol),
      ]);

      // Actualizar estado
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);

      if (CONFIG.DEBUG_MODE) {
        console.log('User logged in successfully:', userData.username);
      }
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await clearAuth();
      
      if (CONFIG.DEBUG_MODE) {
        console.log('User logged out successfully');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      // Actualizar AsyncStorage si es necesario
      await Promise.all([
        AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_ID, updatedUser.id.toString()),
        AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_ROLE, updatedUser.rol),
      ]);

      // Actualizar estado
      setUser(updatedUser);

      if (CONFIG.DEBUG_MODE) {
        console.log('User data updated:', updatedUser.username);
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const clearAuth = async () => {
    try {
      // Limpiar AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID),
        AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ROLE),
      ]);

      // Limpiar estado
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);

      if (CONFIG.DEBUG_MODE) {
        console.log('Auth data cleared');
      }
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

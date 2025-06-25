// src/screens/Auth/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';

// Asegúrate de que esta ruta a 'config.ts' sea correcta.
// Por ejemplo, si config.ts está en src/utils, sería '../utils/config'.
import { API_BASE_URL } from '../../utils/config'; // Ajustar ruta si se mueve config.ts

// Define los tipos para tus rutas (igual que en App.tsx)
// Asegúrate de que RootStackParamList en App.tsx sea exportado para poder importarlo aquí.
import { RootStackParamList } from '../../../App'; // Ajusta la ruta si App.tsx no está en la raíz

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); // Para mostrar un indicador de carga

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, ingresa tu nombre de usuario y contraseña.');
      return;
    }

    setLoading(true); // Iniciar la carga
    try {
      // 1. Obtener tokens
      const response = await axios.post(`${API_BASE_URL}token/`, {
        username,
        password,
      });

      const { access, refresh } = response.data;
      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('refreshToken', refresh);

      // 2. Obtener la información del usuario (incluyendo el rol)
      const userResponse = await axios.get(`${API_BASE_URL}usuarios/me/`, {
        headers: {
          Authorization: `Bearer ${access}`, // Usar el token recién obtenido
        },
      });
      const userRole = userResponse.data.rol;
      await AsyncStorage.setItem('userRole', userRole);
      await AsyncStorage.setItem('userId', userResponse.data.id.toString()); // Guarda el ID del usuario también

      Alert.alert('Éxito', `¡Bienvenido, ${username}!`);

      // 3. Navegar según el rol
      if (userRole === 'administrador') {
        navigation.replace('AdminDashboard');
      } else if (userRole === 'validador') {
        navigation.replace('ValidatorDashboard');
      } else if (userRole === 'encargado') {
        navigation.replace('EncargadoDashboard');
      } else {
        // En caso de un rol desconocido, redirige al login y muestra un error
        Alert.alert('Error', 'Rol de usuario no reconocido. Contacta al administrador.');
        await AsyncStorage.clear();
        navigation.replace('Login');
      }

    } catch (error: any) {
      console.error('Error de inicio de sesión:', error.response ? error.response.data : error.message);
      let errorMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false); // Finalizar la carga
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre de Usuario"
        placeholderTextColor="#999"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        keyboardType="email-address" // Sugiere teclado de email para usuario
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? "Iniciando..." : "Iniciar Sesión"}
        onPress={handleLogin}
        disabled={loading} // Deshabilita el botón mientras carga
      />
      {loading && <ActivityIndicator size="small" color="#0000ff" style={styles.spinner} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8', // Un fondo suave
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  input: {
    width: '90%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  spinner: {
    marginTop: 10,
  },
});

export default LoginScreen;
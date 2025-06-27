// src/screens/Auth/LoginScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions, 
  TouchableOpacity,
  ImageBackground 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { API_BASE_URL } from '../../utils/config';
import { RootStackParamList } from '../../../App';
import { CustomButton, useToast } from '../../components';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const { showToast, ToastContainer } = useToast();

  const handleLogin = async () => {
    if (!username || !password) {
      showToast('Por favor, ingresa tu nombre de usuario y contraseña.', 'error');
      return;
    }

    setLoading(true);
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
          Authorization: `Bearer ${access}`,
        },
      });
      const userRole = userResponse.data.rol;
      await AsyncStorage.setItem('userRole', userRole);
      await AsyncStorage.setItem('userId', userResponse.data.id.toString());

      showToast(`¡Bienvenido, ${username}!`, 'success');

      // 3. Navegar según el rol
      if (userRole === 'administrador') {
        navigation.replace('AdminDashboard');
      } else if (userRole === 'validador') {
        navigation.replace('ValidatorDashboard');
      } else if (userRole === 'encargado') {
        navigation.replace('EncargadoDashboard');
      } else {
        showToast('Rol de usuario no reconocido. Contacta al administrador.', 'error');
        await AsyncStorage.clear();
        navigation.replace('Login');
      }

    } catch (error: any) {
      console.error('Error de inicio de sesión:', error.response ? error.response.data : error.message);
      let errorMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#f3e7e9', '#e3eeff']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.container}
    >
      <ToastContainer />
      
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Taxi Icon */}
          <View style={styles.userIconContainer}>
            <Ionicons name="car" size={120} color="rgba(63, 58, 58, 0.9)" />
          </View>

          {/* Login Title */}
          <Text style={styles.loginTitle}>LOGIN</Text>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Username Input */}
            <View style={styles.inputRow}>
              <Ionicons name="mail" size={24} color="rgba(63, 58, 58, 0.9)" style={styles.inputIcon} />
              <Text style={styles.inputLabel}>Nombre de usuario</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder=""
              placeholderTextColor="rgba(63, 58, 58, 0.9)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="default"
            />

            {/* Password Input */}
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed" size={24} color="rgba(63, 58, 58, 0.9)" style={styles.inputIcon} />
              <Text style={styles.inputLabel}>Contraseña</Text>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder=""
                placeholderTextColor="rgba(63, 58, 58, 0.9)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="rgba(63, 58, 58, 0.9)"
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "INICIANDO..." : "INICIAR SESION"}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  userIconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 2,
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputLabel: {
    color: 'rgba(63, 58, 58, 0.9)',
    fontSize: 16,
    fontWeight: '400',
  },
  input: {
    width: '100%',
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(63, 58, 58, 0.9)',
    color: 'black',
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 0,
    marginBottom: 25,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 10,
    padding: 5,
  },
  loginButton: {
    backgroundColor: '#FF0000',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#CC0000',
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default LoginScreen;

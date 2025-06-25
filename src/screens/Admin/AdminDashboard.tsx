// src/screens/Admin/AdminDashboard.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';

// Define los tipos para tus rutas (igual que en LoginScreen.tsx y App.tsx)
type RootStackParamList = {
  Login: undefined;
  AdminDashboard: undefined;
  ValidatorDashboard: undefined;
  EncargadoDashboard: undefined;
  // ... otras rutas que puedas añadir
};
type AdminDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'AdminDashboard'>;

interface AdminDashboardProps {
  navigation: AdminDashboardNavigationProp;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigation }) => {
  const handleLogout = async () => {
    await AsyncStorage.clear(); // Limpia todos los datos de Async Storage
    navigation.replace('Login'); // Redirige a la pantalla de login
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido, Administrador</Text>
      <Button title="Cerrar Sesión" onPress={handleLogout} />
      {/* Aquí irán las opciones y navegación para el administrador */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default AdminDashboard;
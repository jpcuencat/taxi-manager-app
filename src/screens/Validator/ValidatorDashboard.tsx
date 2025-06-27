// src/screens/Validator/ValidatorDashboard.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  AdminDashboard: undefined;
  ValidatorDashboard: undefined;
  EncargadoDashboard: undefined;
};
type ValidatorDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'ValidatorDashboard'>;

interface ValidatorDashboardProps {
  navigation: ValidatorDashboardNavigationProp;
}

const ValidatorDashboard: React.FC<ValidatorDashboardProps> = ({ navigation }) => {
  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <LinearGradient
      colors={['#f3e7e9', '#e3eeff']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.container}
    >
      <Text style={styles.title}>Bienvenido, Validador</Text>
      <Button title="Cerrar Sesión" onPress={handleLogout} />
      {/* Aquí irán las opciones y navegación para el validador */}
    </LinearGradient>
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

export default ValidatorDashboard;
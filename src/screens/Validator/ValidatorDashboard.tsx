// src/screens/Validator/ValidatorDashboard.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido, Validador</Text>
      <Button title="Cerrar Sesión" onPress={handleLogout} />
      {/* Aquí irán las opciones y navegación para el validador */}
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

export default ValidatorDashboard;
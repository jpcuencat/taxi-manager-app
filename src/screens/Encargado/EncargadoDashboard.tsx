// src/screens/Encargado/EncargadoDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../../services/api';
import { RootStackParamList } from '../../../App'; // Importa desde App.tsx

type EncargadoDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'EncargadoDashboard'>;

interface EncargadoDashboardProps {
  navigation: EncargadoDashboardNavigationProp;
}

interface Taxi {
  id_taxi: number;
  placa: string;
  modelo: string;
  ano: number;
  kilometraje_actual: string;
  id_encargado_asociado: number | null;
  id_encargado_asociado_nombre: string | null;
}

const EncargadoDashboard: React.FC<EncargadoDashboardProps> = ({ navigation }) => {
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchTaxis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('taxis/');
      setTaxis(response.data);
    } catch (err: any) {
      console.error('Error al cargar taxis:', err.response?.data || err.message);
      setError('No se pudieron cargar los taxis. Por favor, inténtalo de nuevo.');
      if (err.response?.status === 401) {
        Alert.alert('Sesión expirada', 'Por favor, inicia sesión de nuevo.');
        await AsyncStorage.clear();
        navigation.replace('Login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTaxis();
    });
    return unsubscribe;
  }, [navigation, fetchTaxis]);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTaxis();
  }, [fetchTaxis]);

  const navigateToIngresosGuardia = () => {
    navigation.navigate('IngresosGuardia');
  };

  const navigateToGastos = () => {
    navigation.navigate('Gastos'); // Nueva navegación a Gastos
  };

  const renderTaxiItem = ({ item }: { item: Taxi }) => (
    <TouchableOpacity style={styles.taxiItem} onPress={() => 
    Alert.alert('Taxi', 
    `Placa: ${item.placa}\n` +
    `Modelo: ${item.modelo}`)}>
      <Text style={styles.taxiText}>Placa: {item.placa}</Text>
      <Text style={styles.taxiText}>Modelo: {item.modelo} ({item.ano})</Text>
      <Text style={styles.taxiText}>Kilometraje: {item.kilometraje_actual}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando taxis...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Reintentar" onPress={fetchTaxis} />
        <Button title="Cerrar Sesión" onPress={handleLogout} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido, Encargado</Text>
      <View style={styles.buttonContainer}>
        <Button title="Ver Ingresos" onPress={navigateToIngresosGuardia} />
        <Button title="Ver Gastos" onPress={navigateToGastos} /> 
        <Button title="Cerrar Sesión" onPress={handleLogout} />
      </View>

      <Text style={styles.subtitle}>Tus Taxis Asignados</Text>
      <FlatList
        data={taxis}
        keyExtractor={(item) => item.id_taxi.toString()}
        renderItem={renderTaxiItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No tienes taxis asignados.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#444',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  taxiItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  taxiText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  }
});

export default EncargadoDashboard;
// src/screens/Encargado/Ingresos/IngresosGuardiaScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button, View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../../../services/api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../App';
import { Ionicons } from '@expo/vector-icons'; // Para el ícono de "añadir"

// Definición de tipos para los datos del ingreso de guardia
interface IngresoGuardia {
  id_ingreso_guardia: number;
  id_taxi: number;
  taxi_placa: string; // Asumiendo que el serializer devuelve la placa
  fecha_pago: string; // Formato YYYY-MM-DD
  monto: string; // O number, si se convierte
  estado_verificacion: 'pendiente' | 'aprobado' | 'rechazado';
  id_encargado_registro: number;
  encargado_nombre: string; // Nombre del encargado
}

type IngresosGuardiaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'IngresosGuardia'>;

interface IngresosGuardiaScreenProps {
  navigation: IngresosGuardiaScreenNavigationProp;
}

const IngresosGuardiaScreen: React.FC<IngresosGuardiaScreenProps> = ({ navigation }) => {
  const [ingresos, setIngresos] = useState<IngresoGuardia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchIngresos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('ingresos-guardia/');
      setIngresos(response.data);
    } catch (err: any) {
      console.error('Error al cargar ingresos de guardia:', err.response?.data || err.message);
      setError('No se pudieron cargar los ingresos. Por favor, inténtalo de nuevo.');
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
    // Al cargar la pantalla o regresar a ella, recargar los ingresos
    const unsubscribe = navigation.addListener('focus', () => {
      fetchIngresos();
    });
    return unsubscribe; // Limpiar el listener al desmontar
  }, [navigation, fetchIngresos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIngresos();
  }, [fetchIngresos]);

  const renderIngresoItem = ({ item }: { item: IngresoGuardia }) => (
    <TouchableOpacity
      style={styles.ingresoItem}
      onPress={() => Alert.alert('Detalles', `Ingreso ID: ${item.id_ingreso_guardia}\nTaxi: ${item.taxi_placa}\nMonto: $${item.monto}\nFecha: ${item.fecha_pago}\nEstado: ${item.estado_verificacion}`)}
    >
      <Text style={styles.itemText}>Taxi: {item.taxi_placa}</Text>
      <Text style={styles.itemText}>Fecha: {item.fecha_pago}</Text>
      <Text style={styles.itemText}>Monto: ${item.monto}</Text>
      <Text style={[styles.itemStatus, { color: item.estado_verificacion === 'aprobado' ? 'green' : item.estado_verificacion === 'rechazado' ? 'red' : 'orange' }]}>
        Estado: {item.estado_verificacion}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando ingresos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Reintentar" onPress={fetchIngresos} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Ingresos de Guardia</Text>
      <FlatList
        data={ingresos}
        keyExtractor={(item) => item.id_ingreso_guardia.toString()}
        renderItem={renderIngresoItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No tienes ingresos de guardia registrados.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {/* Botón flotante para añadir nuevo ingreso */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('CreateIngreso')} // Navegar a la pantalla de creación
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  ingresoItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  itemStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#777',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007bff', // Color primario
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default IngresosGuardiaScreen;
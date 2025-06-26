// src/screens/Encargado/Gastos/GastosScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity, Button } from 'react-native';
import api from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../App';
import { Ionicons } from '@expo/vector-icons';


// Definición de tipos para los datos del gasto
interface Gasto {
  id_gasto: number;
  id_taxi: number; 
  id_taxi_placa: string;
  concepto: number; 
  concepto_nombre: string; 
  monto: string; 
  fecha_gasto: string; 
  descripcion: string;
  id_encargado_registro: number; 
  id_encargado_registro_username: string; 
  estado_verificacion: string;
  url_factura_adjunta: string | null;
  factura_url_completa: string | null;
  fecha_registro: string;
  fecha_ultima_actualizacion: string;
  comentarios_verificacion: string | null;
}

type GastosScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Gastos'>;

interface GastosScreenProps {
  navigation: GastosScreenNavigationProp;
}

const GastosScreen: React.FC<GastosScreenProps> = ({ navigation }) => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchGastos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('GastosScreen: Iniciando fetchGastos...');
      
      const userId = await AsyncStorage.getItem('userId');
      console.log('GastosScreen: userId obtenido:', userId);
      
      const response = await api.get('gastos/');
      console.log('GastosScreen: respuesta de API recibida:', response.data);
      
      // El backend devuelve datos paginados: {results: [array], count, next, previous}
      const gastosArray = response.data.results || response.data;
      
      // Verificar que tengamos un array para procesar
      if (!Array.isArray(gastosArray)) {
        console.error('GastosScreen: No se encontró array de gastos:', response.data);
        setError('Formato de datos incorrecto del servidor.');
        return;
      }
      
      console.log(`GastosScreen: Procesando ${gastosArray.length} gastos para el usuario ${userId}`);
      console.log('GastosScreen: Muestra de gastos SIN FILTRAR (primeros 3):', JSON.stringify(gastosArray.slice(0, 3), null, 2));
      
      // Filtrar solo los gastos del encargado logueado
      const filteredGastos = gastosArray.filter((gasto: Gasto) => {
        const isOwner = gasto.id_encargado_registro === parseInt(userId || '0');
        console.log(`GastosScreen: Gasto ${gasto.id_gasto} (${gasto.concepto_nombre}) - registrado por: ${gasto.id_encargado_registro}, userId: ${userId}, es propietario: ${isOwner}`);
        return isOwner;
      });
      
      console.log('GastosScreen: gastos filtrados:', filteredGastos.length);
      
      if (filteredGastos.length === 0) {
        console.warn('GastosScreen: ⚠️  No se encontraron gastos para este usuario.');
        console.log('GastosScreen: Verificar que el usuario tenga gastos registrados en la base de datos.');
        console.log('GastosScreen: UserId actual:', userId);
        console.log('GastosScreen: Total de gastos sin filtrar:', gastosArray.length);
      } else {
        console.log('GastosScreen: ✅ Se encontraron gastos para mostrar:', filteredGastos.length);
      }
      
      console.log('GastosScreen: datos completos de gastos filtrados:', JSON.stringify(filteredGastos.slice(0, 2), null, 2)); // Solo los primeros 2 para no saturar logs
      setGastos(filteredGastos);
    } catch (err: any) {
      console.error('Error al cargar gastos:', err.response?.data || err.message);
      setError('No se pudieron cargar los gastos. Por favor, inténtalo de nuevo.');
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
      fetchGastos();
    });
    return unsubscribe;
  }, [navigation, fetchGastos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGastos();
  }, [fetchGastos]);

  const renderGastoItem = ({ item }: { item: Gasto }) => (
    <TouchableOpacity
      style={styles.gastoItem}
      onPress={() => Alert.alert('Detalles del Gasto',
        `Gasto ID: ${item.id_gasto}\n` +
        `Taxi: ${item.id_taxi_placa}\n` + // **Usar id_taxi_placa**
        `Concepto: ${item.concepto_nombre}\n` + // **Usar concepto_nombre**
        `Monto: $${item.monto}\n` +
        `Fecha: ${item.fecha_gasto}\n` + // **Usar fecha_gasto**
        `Registrado por: ${item.id_encargado_registro_username}\n` + // **Usar id_encargado_registro_username**
        `Descripción: ${item.descripcion || 'N/A'}`
      )}
    >
      <Text style={styles.itemTitle}>{item.concepto_nombre}</Text>
      <Text style={styles.itemText}>Taxi: {item.id_taxi_placa}</Text>
      <Text style={styles.itemText}>Monto: ${item.monto}</Text>
      <Text style={styles.itemText}>Fecha: {item.fecha_gasto}</Text>
      <Text style={[styles.itemStatus, { color: item.estado_verificacion === 'aprobado' ? 'green' : item.estado_verificacion === 'rechazado' ? 'red' : 'orange' }]}>
              Estado: {item.estado_verificacion}
            </Text>
      {/* Puedes añadir más detalles aquí si quieres: */}
      {/* <Text style={styles.itemText}>Registrado por: {item.id_encargado_registro_username}</Text> */}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando gastos...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Reintentar" onPress={fetchGastos} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Gastos Registrados</Text>
      <FlatList
        data={gastos}
        keyExtractor={(item) => item.id_gasto.toString()}
        renderItem={renderGastoItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No tienes gastos registrados.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('CreateGasto')}
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
  itemStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  gastoItem: {
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
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
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
    backgroundColor: '#dc3545', // Un color diferente para gastos (rojo)
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

export default GastosScreen;
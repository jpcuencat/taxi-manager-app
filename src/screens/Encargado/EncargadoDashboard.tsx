// src/screens/Encargado/EncargadoDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../../services/api';
import { RootStackParamList } from '../../../App';
import { CustomCard, CustomButton, useToast } from '../../components';
import { Ionicons } from '@expo/vector-icons';

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
      console.log('EncargadoDashboard: Iniciando fetchTaxis...');
      
      const userId = await AsyncStorage.getItem('userId');
      console.log('EncargadoDashboard: userId obtenido:', userId);
      
      const response = await api.get('taxis/');
      console.log('EncargadoDashboard: respuesta de API recibida:', response.data);
      
      // El backend devuelve datos paginados: {results: [array], count, next, previous}
      const taxisArray = response.data.results || response.data;
      
      // Verificar que tengamos un array para procesar
      if (!Array.isArray(taxisArray)) {
        console.error('EncargadoDashboard: No se encontró array de taxis:', response.data);
        setError('Formato de datos incorrecto del servidor.');
        return;
      }
      
      console.log(`EncargadoDashboard: Procesando ${taxisArray.length} taxis para el usuario ${userId}`);
      
      // Filtrar solo los taxis asignados al encargado logueado
      const filteredTaxis = taxisArray.filter((taxi: Taxi) => {
        const isAssigned = taxi.id_encargado_asociado === parseInt(userId || '0');
        console.log(`EncargadoDashboard: Taxi ${taxi.placa} - encargado: ${taxi.id_encargado_asociado}, userId: ${userId}, asignado: ${isAssigned}`);
        return isAssigned;
      });
      
      console.log('EncargadoDashboard: taxis filtrados:', filteredTaxis);
      setTaxis(filteredTaxis);
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
    <CustomCard
      style={styles.taxiCard}
      onPress={() => 
        Alert.alert('Taxi', 
          `Placa: ${item.placa}\n` +
          `Modelo: ${item.modelo}\n` +
          `Año: ${item.ano}\n` +
          `Kilometraje: ${item.kilometraje_actual}`
        )
      }
    >
      <CustomCard.Header
        title={`Taxi ${item.placa}`}
        subtitle={`${item.modelo} (${item.ano})`}
        icon="car-sport"
        iconColor="#28a745"
      />
      <CustomCard.Content>
        <Text style={styles.taxiText}>Kilometraje: {item.kilometraje_actual}</Text>
      </CustomCard.Content>
    </CustomCard>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#f3e7e9', '#e3eeff']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.centered}
      >
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando taxis...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#f3e7e9', '#e3eeff']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.centered}
      >
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.errorButtonContainer}>
          <CustomButton 
            title="Reintentar" 
            onPress={fetchTaxis}
            variant="primary"
            icon="refresh"
            style={{ marginBottom: 10 }}
          />
          <CustomButton 
            title="Cerrar Sesión" 
            onPress={handleLogout}
            variant="danger"
            icon="log-out"
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#f3e7e9', '#e3eeff']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.container}
    >
      <Text style={styles.title}>Bienvenido, Encargado</Text>
      <View style={styles.buttonContainer}>
        <CustomButton 
          title="Ver Ingresos" 
          onPress={navigateToIngresosGuardia}
          variant="success"
          icon="cash"
          size="small"
          style={styles.dashboardButton}
        />
        <CustomButton 
          title="Ver Gastos" 
          onPress={navigateToGastos}
          variant="danger"
          icon="receipt"
          size="small"
          style={styles.dashboardButton}
        />
        <CustomButton 
          title="Cerrar Sesión" 
          onPress={handleLogout}
          variant="secondary"
          icon="log-out"
          size="small"
          style={styles.dashboardButton}
        />
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
    </LinearGradient>
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
  },
  errorButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dashboardButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  taxiCard: {
    marginHorizontal: 0,
    marginVertical: 6,
  },
});

export default EncargadoDashboard;
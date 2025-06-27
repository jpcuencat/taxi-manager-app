// src/screens/Encargado/Ingresos/IngresosGuardiaScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../App';
import { Ionicons } from '@expo/vector-icons';
import { CustomCard, CustomButton, useToast } from '../../../components';

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
  
  const { showToast, ToastContainer } = useToast();

  const fetchIngresos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('IngresosGuardiaScreen: Iniciando fetchIngresos...');
      
      const userId = await AsyncStorage.getItem('userId');
      console.log('IngresosGuardiaScreen: userId obtenido:', userId);
      
      const response = await api.get('ingresos-guardia/');
      console.log('IngresosGuardiaScreen: respuesta de API recibida:', response.data);
      
      // El backend devuelve datos paginados: {results: [array], count, next, previous}
      const ingresosArray = response.data.results || response.data;
      
      // Verificar que tengamos un array para procesar
      if (!Array.isArray(ingresosArray)) {
        console.error('IngresosGuardiaScreen: No se encontró array de ingresos:', response.data);
        setError('Formato de datos incorrecto del servidor.');
        return;
      }
      
      console.log(`IngresosGuardiaScreen: Procesando ${ingresosArray.length} ingresos para el usuario ${userId}`);
      console.log('IngresosGuardiaScreen: Muestra de ingresos SIN FILTRAR (primeros 3):', JSON.stringify(ingresosArray.slice(0, 3), null, 2));
      
      // Filtrar solo los ingresos del encargado logueado
      const filteredIngresos = ingresosArray.filter((ingreso: IngresoGuardia) => {
        const isOwner = ingreso.id_encargado_registro === parseInt(userId || '0');
        console.log(`IngresosGuardiaScreen: Ingreso ${ingreso.id_ingreso_guardia} (${ingreso.taxi_placa}) - registrado por: ${ingreso.id_encargado_registro}, userId: ${userId}, es propietario: ${isOwner}`);
        return isOwner;
      });
      
      console.log('IngresosGuardiaScreen: ingresos filtrados:', filteredIngresos.length);
      
      if (filteredIngresos.length === 0) {
        console.warn('IngresosGuardiaScreen: ⚠️  No se encontraron ingresos para este usuario.');
        console.log('IngresosGuardiaScreen: Verificar que el usuario tenga ingresos registrados en la base de datos.');
        console.log('IngresosGuardiaScreen: UserId actual:', userId);
        console.log('IngresosGuardiaScreen: Total de ingresos sin filtrar:', ingresosArray.length);
      } else {
        console.log('IngresosGuardiaScreen: ✅ Se encontraron ingresos para mostrar:', filteredIngresos.length);
      }
      
      console.log('IngresosGuardiaScreen: datos completos de ingresos filtrados:', JSON.stringify(filteredIngresos.slice(0, 2), null, 2)); // Solo los primeros 2 para no saturar logs
      setIngresos(filteredIngresos);
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
    <CustomCard
      style={styles.ingresoCard}
      onPress={() => Alert.alert('Detalles', 
        `Ingreso ID: ${item.id_ingreso_guardia}\n` +
        `Taxi: ${item.taxi_placa}\n` +
        `Monto: $${item.monto}\n` +
        `Fecha: ${item.fecha_pago}\n` +
        `Estado: ${item.estado_verificacion}`
      )}
    >
      <CustomCard.Header
        title={`Ingreso de Guardia`}
        subtitle={`Taxi: ${item.taxi_placa}`}
        icon="cash"
        iconColor="#28a745"
      />
      <CustomCard.Content>
        <Text style={styles.itemText}>Fecha: {item.fecha_pago}</Text>
        <Text style={styles.itemText}>Monto: ${item.monto}</Text>
        <Text style={[
          styles.itemStatus, 
          { color: 
            item.estado_verificacion === 'aprobado' ? '#28a745' : 
            item.estado_verificacion === 'rechazado' ? '#dc3545' : 
            '#ffc107' 
          }
        ]}>
          Estado: {item.estado_verificacion}
        </Text>
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
        <Text>Cargando ingresos...</Text>
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
        <CustomButton 
          title="Reintentar" 
          onPress={fetchIngresos}
          variant="primary"
          icon="refresh"
        />
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
    </LinearGradient>
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
  ingresoCard: {
    marginHorizontal: 0,
    marginVertical: 8,
  },
});

export default IngresosGuardiaScreen;
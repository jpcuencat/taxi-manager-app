// src/screens/Encargado/Ingresos/CreateIngresoScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity, Button, ScrollView, TextInput } from 'react-native';
// ^^^ Asegúrate de que TouchableOpacity esté aquí
import { Picker } from '@react-native-picker/picker'; // Para el selector de taxis
import DateTimePicker from '@react-native-community/datetimepicker'; // Para el selector de fecha
import api from '../../../services/api'; // Ajusta la ruta si es necesario
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../App';

type CreateIngresoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateIngreso'>;

interface CreateIngresoScreenProps {
  navigation: CreateIngresoScreenNavigationProp;
}

interface Taxi {
  id_taxi: number;
  placa: string;
  modelo: string;
}

const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  text = text.trim();

  // ESTA ES LA LÍNEA CLAVE: Más caracteres a eliminar.
  // Incluye más caracteres que podrían ser interpretados como Markdown/LaTeX o especiales.
  // **IMPORTANTE**: Si el guion (-) es el problema, descomenta la línea que lo elimina.
  // Si el guion es parte normal de la placa, SOLO descomenta para probar, luego vuelve a comentarla.
  text = text.replace(/<\/?[^>]+(>|$)/g, ""); // Elimina tags HTML/XML
  text = text.replace(/[_\*~`$\[\]\{\}\(\)\\|\^&#%]/g, ""); // Elimina caracteres Markdown/LaTeX/regex comunes
  // Si el problema persiste y CREEN que el guion es el culpable, descomenten la siguiente línea TEMPORALMENTE:
  // text = text.replace(/-/g, ""); // ¡CUIDADO! Esto eliminará los guiones de la placa, solo para depuración.

  return text;
};

const CreateIngresoScreen: React.FC<CreateIngresoScreenProps> = ({ navigation }) => {
  const [taxiId, setTaxiId] = useState<number | null>(null);
  const [fechaPago, setFechaPago] = useState<Date>(new Date());
  const [monto, setMonto] = useState<string>('');
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [loadingTaxis, setLoadingTaxis] = useState<boolean>(true);
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => {
    const fetchTaxis = async () => {
      try {
        const response = await api.get('taxis/');
        setTaxis(response.data);
        if (response.data.length > 0) {
          setTaxiId(response.data[0].id_taxi); // Seleccionar el primer taxi por defecto
        }
      } catch (error: any) {
        console.error('Error al cargar taxis para el selector:', error.response?.data || error.message);
        Alert.alert('Error', 'No se pudieron cargar los taxis. Asegúrate de tener al menos un taxi asignado.');
      } finally {
        setLoadingTaxis(false);
      }
    };
    fetchTaxis();
  }, []);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || fechaPago;
    setShowDatePicker(false);
    setFechaPago(currentDate);
  };

  const handleCreateIngreso = async () => {
    if (!taxiId || !monto || !fechaPago) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    const parsedMonto = parseFloat(monto.replace(',', '.')); // Asegurarse de que sea un número válido
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      Alert.alert('Error', 'El monto debe ser un número válido y mayor que cero.');
      return;
    }

    setLoadingSubmit(true);
    try {
      const userId = await AsyncStorage.getItem('userId'); // Obtener el ID del usuario logueado
      if (!userId) {
        Alert.alert('Error', 'No se pudo obtener el ID del usuario. Por favor, reinicia la sesión.');
        setLoadingSubmit(false);
        return;
      }

      const formattedDate = fechaPago.toISOString().split('T')[0]; // Formato YYYY-MM-DD

      const data = {
        id_taxi: taxiId,
        fecha_pago: formattedDate,
        monto: parsedMonto,
        estado_verificacion: 'pendiente', // Siempre inicia como pendiente
        id_encargado_registro: parseInt(userId),
      };

      await api.post('ingresos-guardia/', data);
      Alert.alert('Éxito', 'Ingreso de guardia registrado exitosamente.');
      navigation.goBack(); // Volver a la pantalla anterior (lista de ingresos)
    } catch (error: any) {
      console.error('Error al registrar ingreso:', error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo registrar el ingreso. ' + (error.response?.data?.detail || 'Inténtalo de nuevo.'));
      if (error.response?.status === 401) {
         // Si hay 401 aquí, es porque el refresh token falló o la sesión expiró totalmente.
         // Redirigir a login.
        await AsyncStorage.clear();
        navigation.replace('Login');
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingTaxis) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando taxis disponibles...</Text>
      </View>
    );
  }

  if (taxis.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No tienes taxis asignados para registrar ingresos.</Text>
        <Button title="Volver" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registrar Nuevo Ingreso de Guardia</Text>

      <Text style={styles.label}>Seleccionar Taxi:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={taxiId}
          onValueChange={(itemValue) => setTaxiId(itemValue)}
          style={styles.picker}
        >
          {taxis.map((taxi) => (
            <Picker.Item
                key={taxi.id_taxi}
                label={`${sanitizeText(taxi.placa)} (${sanitizeText(taxi.modelo)})`}
                value={taxi.id_taxi}
            />
            
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Fecha de Pago:</Text>      
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
        <Text style={styles.datePickerText}>
          {fechaPago.toLocaleDateString()}
          {' '} 
          <Ionicons name="calendar" size={20} color="#555" />
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={fechaPago}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}  

      <Text style={styles.label}>Monto:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 150.00"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={monto}
        onChangeText={setMonto}
      />

      <Button
        title={loadingSubmit ? "Registrando..." : "Registrar Ingreso"}
        onPress={handleCreateIngreso}
        disabled={loadingSubmit}
        color="#28a745" // Color para botón de guardar
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  pickerContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  datePickerButton: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default CreateIngresoScreen;
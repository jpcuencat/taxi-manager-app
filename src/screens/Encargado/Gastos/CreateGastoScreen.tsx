// src/screens/Encargado/Gastos/CreateGastoScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../App';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { CustomButton, useToast } from '../../../components';

type CreateGastoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateGasto'>;

interface CreateGastoScreenProps {
    navigation: CreateGastoScreenNavigationProp;
}

interface Taxi {
    id_taxi: number;
    placa: string;
    modelo: string;
    id_encargado_asociado: number | null;
}

interface ConceptoGasto {
    id_concepto_gasto: number;
    nombre: string;
}

// Interfaz corregida para el estado facturaData
interface FacturaDataType {
    base64: string;
    name: string; // <-- **CORREGIDO:** Asegúrate de que sea 'name'
    type: string;
}

// ==========================================================
// UTILIDADES
// ==========================================================
const sanitizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    text = text.trim();
    text = text.replace(/<\/?[^>]+(>|$)/g, "");
    text = text.replace(/[_\*~`$\[\]\{\}\(\)\\|\^&#%]/g, "");
    return text;
};

// ==========================================================
// COMPONENTE PRINCIPAL
// ==========================================================
const CreateGastoScreen: React.FC<CreateGastoScreenProps> = ({ navigation }) => {
    // ==========================================================
    // HOOKS
    // ==========================================================
    const { showToast, ToastContainer } = useToast();
    
    // ==========================================================
    // ESTADOS
    // ==========================================================
    const [taxiId, setTaxiId] = useState<number | null>(null);
    const [conceptoId, setConceptoId] = useState<number | null>(null);
    const [fecha, setFecha] = useState<Date>(new Date());
    const [monto, setMonto] = useState<string>('');
    const [descripcion, setDescripcion] = useState<string>('');

    const [taxis, setTaxis] = useState<Taxi[]>([]);
    const [conceptos, setConceptos] = useState<ConceptoGasto[]>([]);
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

    // Estado para la factura con el tipo corregido
    const [facturaData, setFacturaData] = useState<FacturaDataType | null>(null);

    // ==========================================================
    // EFECTOS (Hooks)
    // ==========================================================
    useEffect(() => {
        // Solicitar permisos de la galería al montar el componente
        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a la galería para subir facturas.');
                }
            }
        })();
    }, []);

    useEffect(() => {
        // Cargar datos iniciales (taxis, conceptos)
        const fetchData = async () => {
            try {
                console.log('CreateGastoScreen: Iniciando fetchData...');
                
                const userId = await AsyncStorage.getItem('userId');
                console.log('CreateGastoScreen: userId obtenido:', userId);
                
                const [taxisResponse, conceptosResponse] = await Promise.all([
                    api.get('taxis/'),
                    api.get('conceptos-gasto/'),
                ]);
                console.log('CreateGastoScreen: respuestas de API recibidas');
                console.log('CreateGastoScreen: taxis response:', taxisResponse.data);
                console.log('CreateGastoScreen: conceptos response:', conceptosResponse.data);

                // El backend devuelve datos paginados: {results: [array], count, next, previous}
                const taxisArray = taxisResponse.data.results || taxisResponse.data;
                const conceptosArray = conceptosResponse.data.results || conceptosResponse.data;
                
                // Verificar que tengamos arrays para procesar
                if (!Array.isArray(taxisArray)) {
                    console.error('CreateGastoScreen: No se encontró array de taxis:', taxisResponse.data);
                    Alert.alert('Error', 'Formato de datos de taxis incorrecto del servidor.');
                    return;
                }
                
                if (!Array.isArray(conceptosArray)) {
                    console.error('CreateGastoScreen: No se encontró array de conceptos:', conceptosResponse.data);
                    Alert.alert('Error', 'Formato de datos de conceptos incorrecto del servidor.');
                    return;
                }

                console.log(`CreateGastoScreen: Procesando ${taxisArray.length} taxis y ${conceptosArray.length} conceptos para el usuario ${userId}`);
                console.log('CreateGastoScreen: Muestra de taxis SIN FILTRAR (primeros 3):', JSON.stringify(taxisArray.slice(0, 3), null, 2));
                console.log('CreateGastoScreen: Muestra de conceptos SIN FILTRAR (primeros 3):', JSON.stringify(conceptosArray.slice(0, 3), null, 2));
                
                // Filtrar solo los taxis asignados al encargado logueado
                const filteredTaxis = taxisArray.filter((taxi: Taxi) => {
                    const isAssigned = taxi.id_encargado_asociado === parseInt(userId || '0');
                    console.log(`CreateGastoScreen: Taxi ${taxi.placa} - encargado: ${taxi.id_encargado_asociado}, userId: ${userId}, asignado: ${isAssigned}`);
                    return isAssigned;
                });
                
                console.log('CreateGastoScreen: taxis filtrados:', filteredTaxis.length);
                setTaxis(filteredTaxis);
                if (filteredTaxis.length > 0) {
                    setTaxiId(filteredTaxis[0].id_taxi); // Seleccionar el primer taxi por defecto
                    console.log('CreateGastoScreen: primer taxi seleccionado:', filteredTaxis[0].id_taxi);
                }

                // Los conceptos no necesitan filtrado por usuario, son globales
                console.log('CreateGastoScreen: configurando conceptos:', conceptosArray.length);
                setConceptos(conceptosArray);
                if (conceptosArray.length > 0) {
                    setConceptoId(conceptosArray[0].id_concepto_gasto); // Seleccionar el primer concepto por defecto
                    console.log('CreateGastoScreen: primer concepto seleccionado:', conceptosArray[0].id_concepto_gasto);
                } else {
                    console.warn('CreateGastoScreen: ⚠️  No se encontraron conceptos de gasto.');
                }

            } catch (error: any) {
                console.error('Error al cargar datos para el formulario de gastos:', error.response?.data || error.message);
                Alert.alert('Error', 'No se pudieron cargar los datos necesarios. Asegúrate de tener taxis asignados y conceptos de gasto definidos.');
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    // ==========================================================
    // MANEJADORES DE EVENTOS / FUNCIONES
    // ==========================================================
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, // Solo imágenes
            allowsEditing: true, // Permite recortar/editar la imagen
            aspect: [4, 3], // Relación de aspecto del recorte
            quality: 0.7,   // **NUEVO ENFOQUE:** Comprime la calidad de la imagen (0 a 1)
            base64: true,   // Solicita la imagen en formato Base64
            // maxWidth: 1024, // **Opcional:** Redimensiona a un ancho máximo para reducir el tamaño aún más
            // maxHeight: 768, // **Opcional:** Redimensiona a un alto máximo
            allowsMultipleSelection: false, // Asegura que solo se seleccione una imagen
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            // Genera un nombre de archivo, si no hay uno, usa uno basado en la fecha
            const filename = asset.uri.split('/').pop() || `factura_${Date.now()}.jpg`;
            const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';

            // Mapea la extensión a un tipo MIME adecuado
            const mimeTypes: { [key: string]: string } = {
                'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
                'gif': 'image/gif', 'bmp': 'image/bmp', 'tiff': 'image/tiff',
                'heic': 'image/heic', 'heif': 'image/heif',
                // Si quieres soportar PDFs, tendrías que cambiar MediaTypeOptions.All y manejar el base64 de PDFs de forma diferente
                // porque ImagePicker no comprime/redimensiona PDFs.
                // 'pdf': 'application/pdf',
            };
            const mimeType = mimeTypes[fileExtension] || asset.type || 'application/octet-stream';

            if (asset.base64) {
                setFacturaData({
                    base64: asset.base64,
                    name: filename, // <-- Propiedad 'name' para coincidir con la interfaz
                    type: mimeType,
                });
                console.log("Factura seleccionada y convertida a Base64.");
                console.log("DEBUG APP: Longitud de la cadena Base64 FINAL (después de compresión):", asset.base64.length);
            } else {
                Alert.alert('Error', 'No se pudo obtener la imagen en formato Base64. Asegúrate de que es una imagen válida.');
                setFacturaData(null);
            }
        } else {
            setFacturaData(null); // Limpiar si la selección fue cancelada
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || fecha;
        setShowDatePicker(false);
        setFecha(currentDate);
    };

    const handleCreateGasto = async () => {
        // Validaciones del formulario
        if (!taxiId || !conceptoId || !monto || !fecha) {
            Alert.alert('Error', 'Todos los campos son obligatorios (excepto descripción y factura).');
            return;
        }

        const parsedMonto = parseFloat(monto.replace(',', '.'));
        if (isNaN(parsedMonto) || parsedMonto <= 0) {
            Alert.alert('Error', 'El monto debe ser un número válido y mayor que cero.');
            return;
        }

        setLoadingSubmit(true);
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                Alert.alert('Error', 'No se pudo obtener el ID del usuario. Por favor, reinicia la sesión.');
                setLoadingSubmit(false);
                return;
            }

            const formattedDate = fecha.toISOString().split('T')[0];

            // Construcción del payload para enviar al backend
            let gastoPayload: any = {
                id_taxi: taxiId,
                concepto: conceptoId,
                monto: parsedMonto,
                fecha_gasto: formattedDate,
                descripcion: descripcion,
                id_encargado_registro: parseInt(userId),
                // Inicializa los campos de factura como null por defecto
                url_factura_adjunta: null,
                url_factura_adjunta_name: null,
            };

            // Si hay datos de factura, adjúntalos al payload
            if (facturaData) {
                gastoPayload.url_factura_adjunta = `data:${facturaData.type};base64,${facturaData.base64}`;
                gastoPayload.url_factura_adjunta_name = facturaData.name;
            }
            
            // Log de depuración del payload final (truncando base64 para evitar desbordamiento de consola)
            console.log("DEBUG APP: Payload final a enviar:", JSON.stringify(gastoPayload, (key, value) => {
                if (key === 'url_factura_adjunta' && typeof value === 'string' && value.length > 100) {
                    return value.substring(0, 100) + '...[TRUNCATED_BASE64]';
                }
                return value;
            }, 2));

            // Envío de la solicitud al API
            await api.post('gastos/', gastoPayload);

            Alert.alert('Éxito', 'Gasto registrado exitosamente.');
            // Restablecer los campos del formulario después de un registro exitoso
            setMonto('');
            setDescripcion('');
            setFacturaData(null); // Limpiar datos de factura
            setTaxiId(taxis.length > 0 ? taxis[0].id_taxi : null);
            setConceptoId(conceptos.length > 0 ? conceptos[0].id_concepto_gasto : null);
            setFecha(new Date()); // Restablecer la fecha a la actual
            navigation.goBack(); // Volver a la pantalla anterior
        } catch (error: any) {
            console.error('Error al registrar gasto:', error.response?.data || error.message);
            Alert.alert('Error', 'No se pudo registrar el gasto. ' + (error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Inténtalo de nuevo.'));
            if (error.response?.status === 401) {
                await AsyncStorage.clear();
                navigation.replace('Login');
            }
        } finally {
            setLoadingSubmit(false);
        }
    };

    // ==========================================================
    // RENDERIZADO DEL COMPONENTE
    // ==========================================================
    if (loadingData) {
        return (
            <LinearGradient
              colors={['#f3e7e9', '#e3eeff']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.centered}
            >
                <ActivityIndicator size="large" color="#dc3545" />
                <Text>Cargando datos para el formulario...</Text>
            </LinearGradient>
        );
    }

    if (taxis.length === 0) {
        return (
            <LinearGradient
              colors={['#f3e7e9', '#e3eeff']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.centered}
            >
                <Text style={styles.errorText}>No tienes taxis asignados para registrar gastos.</Text>
                <CustomButton 
                    title="Volver" 
                    onPress={() => navigation.goBack()}
                    variant="danger"
                    icon="arrow-back"
                />
            </LinearGradient>
        );
    }

    if (conceptos.length === 0) {
        return (
            <LinearGradient
              colors={['#f3e7e9', '#e3eeff']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.centered}
            >
                <Text style={styles.errorText}>No hay conceptos de gasto definidos. Pide a un administrador que los cree.</Text>
                <CustomButton 
                    title="Volver" 
                    onPress={() => navigation.goBack()}
                    variant="danger"
                    icon="arrow-back"
                />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
          colors={['#f3e7e9', '#e3eeff']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        >
            <ToastContainer />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Registrar Nuevo Gasto</Text>

            <Text style={styles.label}>Seleccionar Taxi:</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={taxiId}
                    onValueChange={(itemValue) => setTaxiId(itemValue)}
                    style={styles.picker}
                >
                    {taxis.map((taxi) => (
                        <Picker.Item key={taxi.id_taxi} label={`${sanitizeText(taxi.placa)} (${sanitizeText(taxi.modelo)})`} value={taxi.id_taxi} />
                    ))}
                </Picker>
            </View>

            <Text style={styles.label}>Concepto del Gasto:</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={conceptoId}
                    onValueChange={(itemValue) => setConceptoId(itemValue)}
                    style={styles.picker}
                >
                    {conceptos.map((concepto) => (
                        <Picker.Item key={concepto.id_concepto_gasto} label={sanitizeText(concepto.nombre)} value={concepto.id_concepto_gasto} />
                    ))}
                </Picker>
            </View>

            <Text style={styles.label}>Fecha:</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.datePickerText}>
                    {fecha.toLocaleDateString()}
                    {' '}
                    <Ionicons name="calendar" size={20} color="#555" />
                </Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={fecha}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                />
            )}

            <Text style={styles.label}>Monto:</Text>
            <TextInput
                style={styles.input}
                placeholder="Ej: 50.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={monto}
                onChangeText={setMonto}
            />

            <Text style={styles.label}>Descripción (Opcional):</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detalles adicionales del gasto..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={descripcion}
                onChangeText={setDescripcion}
            />

            <Text style={styles.label}>Factura Adjunta (Opcional):</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="image" size={24} color="#fff" />
                <Text style={styles.uploadButtonText}>Seleccionar Imagen de Factura</Text>
            </TouchableOpacity>
            {facturaData && (
                <Text style={styles.facturaUriText}>Factura seleccionada: {facturaData.name}</Text>
            )}

            <CustomButton
                title={loadingSubmit ? "Registrando..." : "Registrar Gasto"}
                onPress={handleCreateGasto}
                disabled={loadingSubmit}
                loading={loadingSubmit}
                variant="danger"
                icon="receipt"
                fullWidth
            />
            <View style={{ height: 30 }} />
            </ScrollView>
        </LinearGradient>
    );
};

// ==========================================================
// ESTILOS
// ==========================================================
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 20,
        backgroundColor: '#fff',
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
    uploadButton: {
        flexDirection: 'row',
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    uploadButtonText: {
        color: '#fff',
        marginLeft: 10,
        fontSize: 16,
        fontWeight: 'bold',
    },
    facturaUriText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        textAlign: 'center',
    },
});

export default CreateGastoScreen;
// src/screens/Encargado/Gastos/CreateGastoScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../App';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system'; // ¡NUEVA IMPORTACIÓN NECESARIA!

// NOTA: La función uriToBlob ya NO ES NECESARIA para este enfoque Base64.
// Puedes eliminarla o comentarla si no se usa en otro lugar.
// const uriToBlob = (uri: string): Promise<Blob> => { ... };

type CreateGastoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateGasto'>;

interface CreateGastoScreenProps {
    navigation: CreateGastoScreenNavigationProp;
}

interface Taxi {
    id_taxi: number;
    placa: string;
    modelo: string;
}

interface ConceptoGasto {
    id_concepto_gasto: number;
    nombre: string;
}

const sanitizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    text = text.trim();
    text = text.replace(/<\/?[^>]+(>|$)/g, "");
    text = text.replace(/[_\*~`$\[\]\{\}\(\)\\|\^&#%]/g, "");
    return text;
};


const CreateGastoScreen: React.FC<CreateGastoScreenProps> = ({ navigation }) => {
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
    const [facturaData, setFacturaData] = useState<{ uri: string; base64: string; name: string; type: string; } | null>(null); // ¡NUEVO ESTADO PARA DATOS DE FACTURA!


    // Petición de permisos para la galería (solo en iOS/Android)
    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a la galería para subir facturas.');
                }
            }
        })();
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, // Esto te da el URI del archivo recortado/editado
            aspect: [4, 3],
            quality: 1,
            base64: true, // ¡IMPORTANTE! Solicitar el base64 directamente
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const filename = asset.uri.split('/').pop() || `factura_${Date.now()}.jpg`;
            const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';

            const mimeTypes: { [key: string]: string } = {
                'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
                'gif': 'image/gif', 'bmp': 'image/bmp', 'tiff': 'image/tiff',
                'heic': 'image/heic', 'heif': 'image/heif', 'pdf': 'application/pdf',
            };
            const mimeType = mimeTypes[fileExtension] || asset.type || 'application/octet-stream';

            if (asset.base64) {
                setFacturaData({
                    uri: asset.uri,
                    base64: asset.base64,
                    name: filename,
                    type: mimeType,
                });
                console.log("Factura seleccionada y convertida a Base64.");
            } else {
                Alert.alert('Error', 'No se pudo obtener la imagen en formato Base64.');
                setFacturaData(null);
            }
        } else {
            setFacturaData(null); // Limpiar si la selección fue cancelada
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [taxisResponse, conceptosResponse] = await Promise.all([
                    api.get('taxis/'),
                    api.get('conceptos-gasto/'),
                ]);

                setTaxis(taxisResponse.data);
                if (taxisResponse.data.length > 0) {
                    setTaxiId(taxisResponse.data[0].id_taxi);
                }

                setConceptos(conceptosResponse.data);
                if (conceptosResponse.data.length > 0) {
                    setConceptoId(conceptosResponse.data[0].id_concepto_gasto);
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

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || fecha;
        setShowDatePicker(false);
        setFecha(currentDate);
    };

    const handleCreateGasto = async () => {
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

            // =================================================================
            // ***** CAMBIO CLAVE: ENVÍO DE DATOS COMO JSON NORMAL *****
            // La factura se envía como Base64 dentro del JSON.
            const gastoPayload: any = {
                id_taxi: taxiId,
                concepto: conceptoId,
                monto: parsedMonto,
                fecha_gasto: formattedDate,
                descripcion: descripcion,
                id_encargado_registro: parseInt(userId), // Asegúrate de que sea un número
            };

            if (facturaData) {
                gastoPayload.url_factura_adjunta_base64 = `data:${facturaData.type};base64,${facturaData.base64}`; // Prefijo para MIME type
                gastoPayload.url_factura_adjunta_name = facturaData.name;
            }

            console.log("Payload JSON a enviar para crear gasto:", gastoPayload);
            // =================================================================

            // Ahora usamos api.post con el payload JSON directamente.
            // Axios automáticamente establecerá Content-Type: application/json
            await api.post('gastos/', gastoPayload);

            Alert.alert('Éxito', 'Gasto registrado exitosamente.');
            // Resetear los campos
            setMonto('');
            setDescripcion('');
            setFacturaData(null); // Limpiar facturaData
            setTaxiId(taxis.length > 0 ? taxis[0].id_taxi : null);
            setConceptoId(conceptos.length > 0 ? conceptos[0].id_concepto_gasto : null);
            setFecha(new Date());
            navigation.goBack();
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

    if (loadingData) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Cargando datos para el formulario...</Text>
            </View>
        );
    }

    if (taxis.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>No tienes taxis asignados para registrar gastos.</Text>
                <Button title="Volver" onPress={() => navigation.goBack()} />
            </View>
        );
    }

    if (conceptos.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>No hay conceptos de gasto definidos. Pide a un administrador que los cree.</Text>
                <Button title="Volver" onPress={() => navigation.goBack()} />
            </View>
        );
    }

    return (
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
            {facturaData && ( // Usar facturaData para la visualización
                <Text style={styles.facturaUriText}>Factura seleccionada: {facturaData.name}</Text>
            )}

            <Button
                title={loadingSubmit ? "Registrando..." : "Registrar Gasto"}
                onPress={handleCreateGasto}
                disabled={loadingSubmit}
                color="#dc3545"
            />
            <View style={{ height: 30 }} />
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
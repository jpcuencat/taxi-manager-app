// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar pantallas
import LoginScreen from './src/screens/Auth/LoginScreen';
import AdminDashboard from './src/screens/Admin/AdminDashboard';
import ValidatorDashboard from './src/screens/Validator/ValidatorDashboard';
import EncargadoDashboard from './src/screens/Encargado/EncargadoDashboard';
import IngresosGuardiaScreen from './src/screens/Encargado/Ingresos/IngresosGuardiaScreen';
import CreateIngresoScreen from './src/screens/Encargado/Ingresos/CreateIngresoScreen';
// Importa las nuevas pantallas de gastos
import GastosScreen from './src/screens/Encargado/Gastos/GastosScreen';
import CreateGastoScreen from './src/screens/Encargado/Gastos/CreateGastoScreen'; // La crearemos en el siguiente paso


// Define los tipos para tus rutas (actualizado con las nuevas pantallas)
export type RootStackParamList = {
  Login: undefined;
  AdminDashboard: undefined;
  ValidatorDashboard: undefined;
  EncargadoDashboard: undefined;
  IngresosGuardia: undefined;
  CreateIngreso: undefined;
  Gastos: undefined; // Nueva ruta para gastos
  CreateGasto: undefined; // Nueva ruta para crear gastos
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const userRole = await AsyncStorage.getItem('userRole');

        if (accessToken && userRole) {
          if (userRole === 'administrador') {
            setInitialRoute('AdminDashboard');
          } else if (userRole === 'validador') {
            setInitialRoute('ValidatorDashboard');
          } else if (userRole === 'encargado') {
            setInitialRoute('EncargadoDashboard');
          } else {
            setInitialRoute('Login');
          }
        } else {
          setInitialRoute('Login');
        }
      } catch (error) {
        console.error("Error al verificar el estado de login:", error);
        setInitialRoute('Login');
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center' }}>Cargando...</Text>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Admin' }} />
        <Stack.Screen name="ValidatorDashboard" component={ValidatorDashboard} options={{ title: 'Validador' }} />
        <Stack.Screen name="EncargadoDashboard" component={EncargadoDashboard} options={{ title: 'Encargado' }} />
        <Stack.Screen name="IngresosGuardia" component={IngresosGuardiaScreen} options={{ title: 'Mis Ingresos' }} />
        <Stack.Screen name="CreateIngreso" component={CreateIngresoScreen} options={{ title: 'Registrar Ingreso' }} />
        {/* Nuevas pantallas para gastos */}
        <Stack.Screen name="Gastos" component={GastosScreen} options={{ title: 'Mis Gastos' }} />
        <Stack.Screen name="CreateGasto" component={CreateGastoScreen} options={{ title: 'Registrar Gasto' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
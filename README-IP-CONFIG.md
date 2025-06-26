# 🌐 Configuración de IP Dinámica - Taxi Manager

Este documento explica cómo configurar y cambiar fácilmente la IP del backend cuando te muevas entre diferentes oficinas o redes.

## 📋 Configuración Inicial

### 1. Archivo de Variables de Entorno

El proyecto usa un archivo `.env` para gestionar la configuración:

```bash
# .env
EXPO_PUBLIC_API_HOST=172.16.35.124
EXPO_PUBLIC_API_PORT=8000
EXPO_PUBLIC_API_URL=http://${EXPO_PUBLIC_API_HOST}:${EXPO_PUBLIC_API_PORT}/api/
EXPO_PUBLIC_DEBUG_MODE=true
```

## 🔧 Métodos para Cambiar la IP

### Método 1: Script Automático (Recomendado)

Usa el script `change-ip.js` para cambiar la IP rápidamente:

```bash
# Cambiar IP directamente
npm run change-ip 192.168.1.100

# O ejecutar el script interactivo
npm run change-ip
```

### Método 2: Edición Manual

Edita el archivo `.env` y cambia la línea:
```
EXPO_PUBLIC_API_HOST=TU_NUEVA_IP
```

### Método 3: Línea de Comandos

```bash
# Cambiar IP con el script de Node.js
node change-ip.js 172.16.35.124
```

## 🚀 Aplicar los Cambios

Después de cambiar la IP, debes:

1. **Reiniciar Metro Bundler:**
   - Presiona `Ctrl+C` en la terminal donde está corriendo Metro
   - Ejecuta `npm start` nuevamente

2. **Recargar la App:**
   - Presiona `R` en Metro Bundler, o
   - Presiona `Ctrl+R` (Windows) / `Cmd+R` (Mac) en el simulador

## 📍 IPs Comunes por Ubicación

Guarda aquí las IPs de tus diferentes oficinas:

```bash
# Oficina Principal
npm run change-ip 172.16.35.124

# Oficina Sucursal
npm run change-ip 192.168.1.100

# Casa/Trabajo Remoto
npm run change-ip 192.168.0.15
```

## 🔍 Verificar Configuración Actual

Para ver qué IP está configurada actualmente:

```bash
# Ver la IP actual
npm run show-ip

# O verificar manualmente
cat .env | grep EXPO_PUBLIC_API_HOST
```

## 🛠️ Solución de Problemas

### La app no se conecta al backend:

1. **Verificar que el backend esté ejecutándose:**
   ```bash
   # En la carpeta del backend Django
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Verificar la IP actual de tu computadora:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

3. **Verificar conectividad:**
   ```bash
   # Probar conexión desde el dispositivo/emulador
   curl http://TU_IP:8000/admin/
   ```

### El emulador de Android no puede conectarse:

- Android Studio usa `10.0.2.2` para referirse al `localhost` del host
- Para conectarte desde un emulador, usa la IP real de tu máquina, no `localhost`

### El dispositivo físico no puede conectarse:

- Asegúrate de que tu dispositivo y la computadora estén en la misma red WiFi
- Verifica que el firewall de Windows no esté bloqueando el puerto 8000

## 📱 Ejecutar la App en Android

1. **Abrir Android Studio y iniciar el emulador**

2. **En la terminal del proyecto React Native:**
   ```bash
   # Instalar dependencias (primera vez)
   npm install
   
   # Cambiar IP si es necesario
   npm run change-ip 172.16.35.124
   
   # Iniciar Metro Bundler
   npm start
   
   # En otra terminal, ejecutar en Android
   npx expo run:android
   ```

3. **La app se abrirá automáticamente en el emulador**

## 🔄 Flujo de Trabajo Diario

1. Llegar a una nueva oficina
2. Ejecutar `npm run change-ip NUEVA_IP`
3. Reiniciar Metro (`Ctrl+C` → `npm start`)
4. Recargar la app (`R` en Metro)
5. ¡Listo para trabajar!

---

## 📝 Notas Adicionales

- El archivo `.env.example` contiene una plantilla para nuevos desarrolladores
- Las variables deben empezar con `EXPO_PUBLIC_` para ser accesibles en React Native
- Los cambios en `.env` requieren reiniciar Metro Bundler para tomar efecto

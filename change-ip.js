#!/usr/bin/env node
/**
 * Script para cambiar fácilmente la IP del backend
 * Uso: node change-ip.js [nueva-ip]
 * Ejemplo: node change-ip.js 192.168.1.100
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '.env');

async function getCurrentIP() {
  try {
    if (fs.existsSync(ENV_FILE)) {
      const content = fs.readFileSync(ENV_FILE, 'utf8');
      const match = content.match(/EXPO_PUBLIC_API_HOST=(.+)/);
      return match ? match[1].trim() : null;
    }
  } catch (error) {
    console.error('Error leyendo archivo .env:', error.message);
  }
  return null;
}

async function updateIP(newIP) {
  try {
    let content = '';
    
    if (fs.existsSync(ENV_FILE)) {
      content = fs.readFileSync(ENV_FILE, 'utf8');
      // Reemplazar la IP existente
      content = content.replace(/EXPO_PUBLIC_API_HOST=.+/, `EXPO_PUBLIC_API_HOST=${newIP}`);
    } else {
      // Crear archivo .env si no existe
      content = `# Configuración de desarrollo - Taxi Manager App
# Esta IP debe cambiarse según la red en la que te encuentres

# IP actual de desarrollo (cambiar según tu ubicación)
EXPO_PUBLIC_API_HOST=${newIP}

# Puerto del backend (normalmente no cambia)
EXPO_PUBLIC_API_PORT=8000

# URL completa construida automáticamente
# No modificar esta línea
EXPO_PUBLIC_API_URL=http://\${EXPO_PUBLIC_API_HOST}:\${EXPO_PUBLIC_API_PORT}/api/

# Configuración adicional
EXPO_PUBLIC_DEBUG_MODE=true
`;
    }
    
    fs.writeFileSync(ENV_FILE, content);
    console.log(`✅ IP actualizada exitosamente a: ${newIP}`);
    console.log(`📱 URL del backend: http://${newIP}:8000/api/`);
    console.log('');
    console.log('🔄 Para aplicar los cambios:');
    console.log('1. Reinicia Metro Bundler (Ctrl+C y luego npm start)');
    console.log('2. Recarga la aplicación (R en Metro o Cmd/Ctrl+R en el simulador)');
    
  } catch (error) {
    console.error('❌ Error actualizando IP:', error.message);
    process.exit(1);
  }
}

async function promptForIP() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('🌐 Ingresa la nueva IP del backend: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function isValidIP(ip) {
  const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!pattern.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

async function main() {
  console.log('🚗 Taxi Manager - Configurador de IP del Backend');
  console.log('================================================');
  
  const currentIP = await getCurrentIP();
  if (currentIP) {
    console.log(`📍 IP actual: ${currentIP}`);
  }
  
  let newIP = process.argv[2];
  
  if (!newIP) {
    newIP = await promptForIP();
  }
  
  if (!newIP) {
    console.log('❌ No se proporcionó una IP');
    process.exit(1);
  }
  
  if (!isValidIP(newIP)) {
    console.log(`❌ IP inválida: ${newIP}`);
    console.log('📝 Formato correcto: xxx.xxx.xxx.xxx (ejemplo: 192.168.1.100)');
    process.exit(1);
  }
  
  if (newIP === currentIP) {
    console.log(`ℹ️  La IP ${newIP} ya está configurada`);
    return;
  }
  
  await updateIP(newIP);
}

if (require.main === module) {
  main().catch(console.error);
}

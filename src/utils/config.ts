// config.ts
// Utiliza las variables de entorno definidas en .env
// La IP se configura automáticamente desde el archivo .env
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.35.124:8000/api/';

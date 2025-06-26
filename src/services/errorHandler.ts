// src/services/errorHandler.ts
// Manejo centralizado de errores

/**
 * Maneja errores de la API y retorna una respuesta amigable
 */
export const handleApiError = (error: any) => {
  if (error.response) {
    // La solicitud fue realizada y el servidor respondió con un código de estado
    // que esta fuera de los rangos de 2xx
    const { status, data } = error.response;
    console.error(`Error ${status}:`, data);
    if (status >= 400 && status < 500) {
      return data.detail || data.error || 'Ocurrió un error en la solicitud. Por favor, intenta de nuevo.';
    } else if (status >= 500) {
      return 'Error del servidor. Por favor, intenta más tarde.';
    }
  } else if (error.request) {
    // La solicitud fue realizada pero no se recibió respuesta
    console.error('No se recibió respuesta:', error.request);
    return 'No se pudo conectar al servidor. Revisa tu conexión de red.';
  } else {
    // Algo causó un error al configurar la solicitud
    console.error('Error de configuración de la solicitud:', error.message);
    return 'Error en la configuración de la solicitud. Contacta al soporte técnico.';
  }
};


// src/services/__tests__/errorHandler.test.ts

import { handleApiError } from '../errorHandler';

describe('handleApiError', () => {
  it('deberia manejar errores de respuesta del servidor (4xx)', () => {
    const error = {
      response: {
        status: 400,
        data: {
          detail: 'Error de validacion'
        }
      }
    };

    const result = handleApiError(error);
    expect(result).toBe('Error de validacion');
  });

  it('deberia manejar errores del servidor (5xx)', () => {
    const error = {
      response: {
        status: 500,
        data: {}
      }
    };

    const result = handleApiError(error);
    expect(result).toBe('Error del servidor. Por favor, intenta más tarde.');
  });

  it('deberia manejar errores de red (sin respuesta)', () => {
    const error = {
      request: {}
    };

    const result = handleApiError(error);
    expect(result).toBe('No se pudo conectar al servidor. Revisa tu conexión de red.');
  });

  it('deberia manejar errores de configuracion', () => {
    const error = {
      message: 'Error de configuracion'
    };

    const result = handleApiError(error);
    expect(result).toBe('Error en la configuración de la solicitud. Contacta al soporte técnico.');
  });

  it('deberia usar mensaje por defecto si no hay detail en data', () => {
    const error = {
      response: {
        status: 400,
        data: {}
      }
    };

    const result = handleApiError(error);
    expect(result).toBe('Ocurrió un error en la solicitud. Por favor, intenta de nuevo.');
  });
});

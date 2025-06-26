// src/utils/validation.ts
// Utilidades de validación para formularios

export interface LoginValidation {
  isValid: boolean;
  errors: {
    username?: string;
    password?: string;
    general?: string;
  };
}

export interface IngresoValidation {
  isValid: boolean;
  errors: {
    cantidad?: string;
    descripcion?: string;
    fecha?: string;
    general?: string;
  };
}

export interface GastoValidation {
  isValid: boolean;
  errors: {
    cantidad?: string;
    descripcion?: string;
    fecha?: string;
    tipo?: string;
    general?: string;
  };
}

/**
 * Valida los datos de login
 */
export const validateLogin = (username: string, password: string): LoginValidation => {
  const errors: LoginValidation['errors'] = {};
  
  // Validar username
  if (!username || username.trim().length === 0) {
    errors.username = 'El nombre de usuario es requerido';
  } else if (username.trim().length < 3) {
    errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
  } else if (username.trim().length > 50) {
    errors.username = 'El nombre de usuario no puede tener más de 50 caracteres';
  }
  
  // Validar password
  if (!password || password.length === 0) {
    errors.password = 'La contraseña es requerida';
  } else if (password.length < 4) {
    errors.password = 'La contraseña debe tener al menos 4 caracteres';
  } else if (password.length > 100) {
    errors.password = 'La contraseña no puede tener más de 100 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Valida los datos de un ingreso
 */
export const validateIngreso = (cantidad: string, descripcion: string, fecha: Date): IngresoValidation => {
  const errors: IngresoValidation['errors'] = {};
  
  // Validar cantidad
  const cantidadNum = parseFloat(cantidad);
  if (!cantidad || cantidad.trim().length === 0) {
    errors.cantidad = 'La cantidad es requerida';
  } else if (isNaN(cantidadNum)) {
    errors.cantidad = 'La cantidad debe ser un número válido';
  } else if (cantidadNum <= 0) {
    errors.cantidad = 'La cantidad debe ser mayor a 0';
  } else if (cantidadNum > 999999.99) {
    errors.cantidad = 'La cantidad no puede ser mayor a 999,999.99';
  }
  
  // Validar descripción
  if (!descripcion || descripcion.trim().length === 0) {
    errors.descripcion = 'La descripción es requerida';
  } else if (descripcion.trim().length < 5) {
    errors.descripcion = 'La descripción debe tener al menos 5 caracteres';
  } else if (descripcion.trim().length > 500) {
    errors.descripcion = 'La descripción no puede tener más de 500 caracteres';
  }
  
  // Validar fecha
  if (!fecha) {
    errors.fecha = 'La fecha es requerida';
  } else {
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(now.getDate() + 1); // Máximo mañana
    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 1); // Mínimo hace un año
    
    if (fecha > maxDate) {
      errors.fecha = 'La fecha no puede ser futura';
    } else if (fecha < minDate) {
      errors.fecha = 'La fecha no puede ser de hace más de un año';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Valida los datos de un gasto
 */
export const validateGasto = (cantidad: string, descripcion: string, fecha: Date, tipo: string): GastoValidation => {
  const errors: GastoValidation['errors'] = {};
  
  // Validar cantidad
  const cantidadNum = parseFloat(cantidad);
  if (!cantidad || cantidad.trim().length === 0) {
    errors.cantidad = 'La cantidad es requerida';
  } else if (isNaN(cantidadNum)) {
    errors.cantidad = 'La cantidad debe ser un número válido';
  } else if (cantidadNum <= 0) {
    errors.cantidad = 'La cantidad debe ser mayor a 0';
  } else if (cantidadNum > 999999.99) {
    errors.cantidad = 'La cantidad no puede ser mayor a 999,999.99';
  }
  
  // Validar descripción
  if (!descripcion || descripcion.trim().length === 0) {
    errors.descripcion = 'La descripción es requerida';
  } else if (descripcion.trim().length < 5) {
    errors.descripcion = 'La descripción debe tener al menos 5 caracteres';
  } else if (descripcion.trim().length > 500) {
    errors.descripcion = 'La descripción no puede tener más de 500 caracteres';
  }
  
  // Validar tipo
  if (!tipo || tipo.trim().length === 0) {
    errors.tipo = 'El tipo de gasto es requerido';
  }
  
  // Validar fecha
  if (!fecha) {
    errors.fecha = 'La fecha es requerida';
  } else {
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(now.getDate() + 1); // Máximo mañana
    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 1); // Mínimo hace un año
    
    if (fecha > maxDate) {
      errors.fecha = 'La fecha no puede ser futura';
    } else if (fecha < minDate) {
      errors.fecha = 'La fecha no puede ser de hace más de un año';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida que una cadena no contenga caracteres especiales peligrosos
 */
export const isSafeString = (str: string): boolean => {
  const dangerousChars = /<script|javascript:|data:|vbscript:|onload|onerror/i;
  return !dangerousChars.test(str);
};

/**
 * Sanitiza una cadena eliminando caracteres peligrosos
 */
export const sanitizeString = (str: string): string => {
  return str.replace(/<script.*?>.*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/data:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/onload=/gi, '')
            .replace(/onerror=/gi, '');
};

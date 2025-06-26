// src/utils/__tests__/validation.test.ts

import {
  validateLogin,
  validateIngreso,
  validateGasto,
  isValidEmail,
  isSafeString,
  sanitizeString,
} from '../validation';

// Pruebas para validacion de login
describe('validateLogin', () => {
  it('deberia validar correctamente un nombre de usuario y contrasena validos', () => {
    const result = validateLogin('usuario', 'contrasena');
    expect(result.isValid).toBe(true);
    expect(result.errors.username).toBeUndefined();
    expect(result.errors.password).toBeUndefined();
  });

  it('deberia rechazar un nombre de usuario vacio', () => {
    const result = validateLogin('', 'contrasena');
    expect(result.isValid).toBe(false);
    expect(result.errors.username).toBe('El nombre de usuario es requerido');
  });

  it('deberia rechazar una contrasena vacia', () => {
    const result = validateLogin('usuario', '');
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBe('La contraseña es requerida');
  });

  it('deberia rechazar un usuario muy corto', () => {
    const result = validateLogin('us', 'contrasena');
    expect(result.isValid).toBe(false);
    expect(result.errors.username).toBe('El nombre de usuario debe tener al menos 3 caracteres');
  });

  it('deberia rechazar una contrasena muy corta', () => {
    const result = validateLogin('usuario', '123');
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBe('La contraseña debe tener al menos 4 caracteres');
  });
});

// Pruebas para validacion de email
describe('isValidEmail', () => {
  it('deberia validar un email valido', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('deberia rechazar un email invalido', () => {
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('test')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
  });
});

// Pruebas para validacion de cadenas seguras
describe('isSafeString', () => {
  it('deberia validar cadenas seguras', () => {
    expect(isSafeString('Hola mundo')).toBe(true);
    expect(isSafeString('Usuario 123')).toBe(true);
  });

  it('deberia rechazar cadenas peligrosas', () => {
    expect(isSafeString('<script>alert("hack")</script>')).toBe(false);
    expect(isSafeString('javascript:alert(1)')).toBe(false);
    expect(isSafeString('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeString('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeString('<img onload="alert(1)">')).toBe(false);
    expect(isSafeString('<img onerror="alert(1)">')).toBe(false);
  });
});

// Pruebas para sanitizacion de cadenas
describe('sanitizeString', () => {
  it('deberia eliminar tags script', () => {
    const input = '<script>alert("hack")</script>Texto normal';
    const result = sanitizeString(input);
    expect(result).toBe('Texto normal');
  });

  it('deberia eliminar javascript:', () => {
    const input = 'javascript:alert(1) y texto normal';
    const result = sanitizeString(input);
    expect(result).toBe('alert(1) y texto normal');
  });

  it('deberia eliminar data:', () => {
    const input = 'data:text/html,<script>alert(1)</script> texto';
    const result = sanitizeString(input);
    expect(result).toBe('text/html, texto');
  });

  it('deberia eliminar vbscript:', () => {
    const input = 'vbscript:msgbox(1) contenido';
    const result = sanitizeString(input);
    expect(result).toBe('msgbox(1) contenido');
  });

  it('deberia eliminar onload=', () => {
    const input = '<img onload="alert(1)"> imagen';
    const result = sanitizeString(input);
    expect(result).toBe('<img "alert(1)"> imagen');
  });

  it('deberia eliminar onerror=', () => {
    const input = '<img onerror="alert(1)"> imagen';
    const result = sanitizeString(input);
    expect(result).toBe('<img "alert(1)"> imagen');
  });

  it('deberia manejar cadenas sin contenido peligroso', () => {
    const input = 'Texto completamente seguro';
    const result = sanitizeString(input);
    expect(result).toBe(input);
  });

  it('deberia manejar multiples tipos de contenido peligroso', () => {
    const input = '<script>alert(1)</script>javascript:void(0)data:text<img onload="alert(1)">';
    const result = sanitizeString(input);
    expect(result).toBe('void(0)text<img "alert(1)">');
  });

  it('deberia manejar cadenas vacias', () => {
    const result = sanitizeString('');
    expect(result).toBe('');
  });
});

// Pruebas para validacion de ingresos
describe('validateIngreso', () => {
  const fechaValida = new Date();

  it('deberia validar un ingreso valido', () => {
    const result = validateIngreso('100.50', 'Descripcion valida del ingreso', fechaValida);
    expect(result.isValid).toBe(true);
  });

  it('deberia rechazar cantidad invalida', () => {
    const result = validateIngreso('abc', 'Descripcion valida', fechaValida);
    expect(result.isValid).toBe(false);
    expect(result.errors.cantidad).toBe('La cantidad debe ser un número válido');
  });

  it('deberia rechazar descripcion muy corta', () => {
    const result = validateIngreso('100', 'abc', fechaValida);
    expect(result.isValid).toBe(false);
    expect(result.errors.descripcion).toBe('La descripción debe tener al menos 5 caracteres');
  });

  it('deberia rechazar cantidad negativa', () => {
    const result = validateIngreso('-50', 'Descripcion valida del ingreso', fechaValida);
    expect(result.isValid).toBe(false);
    expect(result.errors.cantidad).toBe('La cantidad debe ser mayor a 0');
  });

  it('deberia rechazar cantidad cero', () => {
    const result = validateIngreso('0', 'Descripcion valida del ingreso', fechaValida);
    expect(result.isValid).toBe(false);
    expect(result.errors.cantidad).toBe('La cantidad debe ser mayor a 0');
  });

  it('deberia rechazar descripcion vacia', () => {
    const result = validateIngreso('100', '', fechaValida);
    expect(result.isValid).toBe(false);
    expect(result.errors.descripcion).toBe('La descripción es requerida');
  });

  it('deberia rechazar descripcion muy larga', () => {
    const descripcionLarga = 'A'.repeat(501);
    const result = validateIngreso('100', descripcionLarga, fechaValida);
    expect(result.isValid).toBe(false);
    expect(result.errors.descripcion).toBe('La descripción no puede tener más de 500 caracteres');
  });

  it('deberia rechazar fecha futura', () => {
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 2); // +2 para asegurar que sea futuro
    const result = validateIngreso('100', 'Descripcion valida', fechaFutura);
    expect(result.isValid).toBe(false);
    expect(result.errors.fecha).toBe('La fecha no puede ser futura');
  });

  it('deberia rechazar fecha muy antigua', () => {
    const fechaAntigua = new Date();
    fechaAntigua.setFullYear(fechaAntigua.getFullYear() - 2);
    const result = validateIngreso('100', 'Descripcion valida', fechaAntigua);
    expect(result.isValid).toBe(false);
    expect(result.errors.fecha).toBe('La fecha no puede ser de hace más de un año');
  });

  it('deberia manejar multiples errores', () => {
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 2);
    const result = validateIngreso('abc', 'abc', fechaFutura);
    expect(result.isValid).toBe(false);
    expect(result.errors.cantidad).toBeDefined();
    expect(result.errors.descripcion).toBeDefined();
    expect(result.errors.fecha).toBeDefined();
  });
});

// Pruebas para validacion de gastos
describe('validateGasto', () => {
  const fechaValida = new Date();
  const tipoValido = 'combustible';

  it('deberia validar un gasto valido', () => {
    const result = validateGasto('50.75', 'Combustible para el taxi', fechaValida, tipoValido);
    expect(result.isValid).toBe(true);
  });

  it('deberia rechazar cantidad invalida', () => {
    const result = validateGasto('xyz', 'Descripcion valida', fechaValida, tipoValido);
    expect(result.isValid).toBe(false);
    expect(result.errors.cantidad).toBe('La cantidad debe ser un número válido');
  });

  it('deberia rechazar cantidad negativa', () => {
    const result = validateGasto('-25', 'Descripcion valida', fechaValida, tipoValido);
    expect(result.isValid).toBe(false);
    expect(result.errors.cantidad).toBe('La cantidad debe ser mayor a 0');
  });

  it('deberia rechazar cantidad cero', () => {
    const result = validateGasto('0', 'Descripcion valida', fechaValida, tipoValido);
    expect(result.isValid).toBe(false);
    expect(result.errors.cantidad).toBe('La cantidad debe ser mayor a 0');
  });

  it('deberia rechazar descripcion vacia', () => {
    const result = validateGasto('50', '', fechaValida, tipoValido);
    expect(result.isValid).toBe(false);
    expect(result.errors.descripcion).toBe('La descripción es requerida');
  });

  it('deberia rechazar descripcion muy corta', () => {
    const result = validateGasto('50', 'abc', fechaValida, tipoValido);
    expect(result.isValid).toBe(false);
    expect(result.errors.descripcion).toBe('La descripción debe tener al menos 5 caracteres');
  });

  it('deberia rechazar descripcion muy larga', () => {
    const descripcionLarga = 'B'.repeat(501);
    const result = validateGasto('50', descripcionLarga, fechaValida, tipoValido);
    expect(result.isValid).toBe(false);
    expect(result.errors.descripcion).toBe('La descripción no puede tener más de 500 caracteres');
  });

  it('deberia rechazar tipo vacio', () => {
    const result = validateGasto('50', 'Descripcion valida', fechaValida, '');
    expect(result.isValid).toBe(false);
    expect(result.errors.tipo).toBe('El tipo de gasto es requerido');
  });

  it('deberia rechazar fecha futura', () => {
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 2);
    const result = validateGasto('50', 'Combustible para el taxi', fechaFutura, tipoValido);
    expect(result.isValid).toBe(false);
    expect(result.errors.fecha).toBe('La fecha no puede ser futura');
  });

  it('deberia rechazar fecha muy antigua', () => {
    const fechaAntigua = new Date();
    fechaAntigua.setFullYear(fechaAntigua.getFullYear() - 2);
    const result = validateGasto('50', 'Combustible para el taxi', fechaAntigua, tipoValido);
    expect(result.isValid).toBe(false);
    expect(result.errors.fecha).toBe('La fecha no puede ser de hace más de un año');
  });

  it('deberia manejar multiples errores en gastos', () => {
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 2);
    const result = validateGasto('-50', 'abc', fechaFutura, '');
    expect(result.isValid).toBe(false);
    expect(result.errors.cantidad).toBeDefined();
    expect(result.errors.descripcion).toBeDefined();
    expect(result.errors.fecha).toBeDefined();
    expect(result.errors.tipo).toBeDefined();
  });
});

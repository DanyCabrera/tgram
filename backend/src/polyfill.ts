// Polyfill para crypto global (necesario para Node 18 y @nestjs/typeorm)
// Este archivo DEBE ser importado ANTES de cualquier otro módulo de NestJS
import { randomUUID } from 'crypto';

// Asegurar que crypto esté disponible globalmente antes de que se carguen los módulos
if (typeof global !== 'undefined') {
  if (!(global as any).crypto) {
    (global as any).crypto = {};
  }
  
  // Asegurar que randomUUID esté disponible
  if (typeof (global as any).crypto.randomUUID !== 'function') {
    (global as any).crypto.randomUUID = randomUUID;
  }
}

// Exportar para evitar problemas de módulo vacío
export {};


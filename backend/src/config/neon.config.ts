import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getNeonConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: parseInt(configService.get('DB_PORT', '5432')),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // Deshabilitar sincronización automática
    logging: configService.get('NODE_ENV') === 'development',
    ssl: {
      rejectUnauthorized: false, // Necesario para Neon
    },
    extra: {
      // Configuraciones de seguridad y rendimiento para Neon
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 20, // Máximo de conexiones en el pool
      min: 2,  // Mínimo de conexiones en el pool
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
    // Configuraciones adicionales de seguridad
    cache: {
      duration: 30000, // Cache de 30 segundos
    },
    // Configuración de migraciones
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: false, // No ejecutar migraciones automáticamente
    migrationsTableName: 'migrations',
  };
};

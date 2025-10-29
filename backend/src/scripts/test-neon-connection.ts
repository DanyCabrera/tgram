import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';

// Cargar variables de entorno
config();

async function testNeonConnection() {
  console.log('🔍 Probando conexión a Neon.tech...\n');

  console.log(`📡 Conectando a: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
  console.log(`👤 Usuario: ${process.env.DB_USERNAME}\n`);

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Post, Comment, Like, ChatRoom, Message, Notification],
    synchronize: false, // No sincronizar en el test
    logging: false, // Desactivar logging para el test
    ssl: {
      rejectUnauthorized: false,
    },
    extra: {
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 5, // Reducir conexiones para el test
    },
  });

  try {
    console.log('📡 Conectando a la base de datos...');
    await dataSource.initialize();
    console.log('✅ ¡Conexión exitosa a Neon.tech!\n');
    
    // Probar una consulta simple
    console.log('🔍 Probando consulta...');
    const result = await dataSource.query('SELECT version()');
    console.log('✅ Consulta exitosa:');
    console.log(`   PostgreSQL: ${result[0].version}\n`);
    
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('✅ Tu configuración de Neon.tech está funcionando correctamente.');

  } catch (error) {
    console.error('❌ Error de conexión: ', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que las credenciales en .env sean correctas');
    console.log('2. Asegúrate de que tu proyecto de Neon esté activo');
    console.log('3. Verifica que el host, puerto y nombre de la base de datos sean correctos');
    console.log('4. Revisa que la contraseña sea la correcta');
    console.log('5. Verifica que la cadena de conexión de Neon sea correcta');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Conexión cerrada.');
    }
    console.log('\n✨ Test completado');
  }
}

testNeonConnection();

# 🚀 Red Social - Proyecto Completo

Una red social moderna construida con **NestJS** (backend) y **Next.js** (frontend) que incluye chat en tiempo real, publicaciones, notificaciones y más.

## 🚀 Características Implementadas

### Backend (NestJS + TypeScript)
- ✅ **Autenticación JWT** con bcrypt para contraseñas
- ✅ **Base de datos Supabase** con TypeORM
- ✅ **Modelos de datos** completos (User, Post, Comment, Like, Chat, Notification)
- ✅ **API REST** con validación y documentación Swagger
- ✅ **WebSockets** para chat en tiempo real
- ✅ **Sistema de notificaciones** en tiempo real
- ✅ **Seguimiento de usuarios** (follow/unfollow)
- ✅ **Sistema de likes y comentarios**
- ✅ **Chat directo y grupal**

### Frontend (Next.js + TypeScript)
- ✅ **Autenticación** (login/register) con validación
- ✅ **Context API** para manejo de estado
- ✅ **Componentes UI** reutilizables
- ✅ **Integración con WebSockets**
- ✅ **Diseño responsivo** con Tailwind CSS

## 🛠️ Tecnologías Utilizadas

### Backend
- **NestJS** - Framework de Node.js
- **TypeScript** - Tipado estático
- **Supabase** - Base de datos PostgreSQL
- **TypeORM** - ORM para TypeScript
- **JWT** - Autenticación
- **bcrypt** - Encriptación de contraseñas
- **Socket.io** - WebSockets
- **Swagger** - Documentación API
- **class-validator** - Validación de datos

### Frontend
- **Next.js 15** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Socket.io Client** - WebSockets
- **Axios** - Cliente HTTP
- **Radix UI** - Componentes accesibles

## 📋 Prerrequisitos

- **Node.js** (v18 o superior)
- **Supabase** (cuenta gratuita)
- **npm** o **yarn**

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd RedSocial
```

### 2. Configurar Supabase

1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear un nuevo proyecto
3. Obtener las credenciales de conexión
4. Configurar las variables de entorno

### 3. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env basado en env.example
cp env.example .env

# Editar .env con tus credenciales de Supabase
# DB_HOST=db.xxxxx.supabase.co
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=tu_password_de_supabase
# DB_NAME=postgres
# SUPABASE_API_KEY=tu_api_key_de_supabase
# SUPABASE_URL=https://xxxxx.supabase.co
# JWT_SECRET=tu_jwt_secret_super_seguro

# Probar conexión
npm run test:supabase

# Ejecutar en desarrollo
npm run start:dev
```

### 4. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env.local basado en env.local.example
cp env.local.example .env.local

# Editar .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000

# Ejecutar en desarrollo
npm run dev
```

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Documentación API**: http://localhost:3000/api

## 📚 Estructura del Proyecto

```
RedSocial/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/           # Módulo de autenticación
│   │   ├── users/          # Módulo de usuarios
│   │   ├── posts/          # Módulo de publicaciones
│   │   ├── chat/           # Módulo de chat
│   │   ├── notifications/  # Módulo de notificaciones
│   │   ├── entities/       # Modelos de base de datos
│   │   └── config/         # Configuraciones
│   └── package.json
├── frontend/               # App Next.js
│   ├── src/
│   │   ├── app/           # Páginas de Next.js
│   │   ├── components/    # Componentes React
│   │   ├── contexts/      # Contextos de React
│   │   ├── services/      # Servicios de API
│   │   └── types/         # Tipos TypeScript
│   └── package.json
└── README.md
```

## 🔐 Endpoints de la API

### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Inicio de sesión
- `GET /auth/profile` - Perfil del usuario

### Usuarios
- `GET /users/search` - Buscar usuarios
- `PUT /users/profile` - Actualizar perfil
- `POST /users/:id/follow` - Seguir usuario
- `DELETE /users/:id/follow` - Dejar de seguir

### Publicaciones
- `POST /posts` - Crear publicación
- `GET /posts/feed` - Obtener feed
- `POST /posts/:id/like` - Dar like
- `POST /posts/:id/comments` - Comentar

### Chat
- `GET /chat/rooms` - Obtener chats
- `POST /chat/rooms` - Crear chat
- `POST /chat/rooms/:id/messages` - Enviar mensaje

### Notificaciones
- `GET /notifications` - Obtener notificaciones
- `PUT /notifications/:id/read` - Marcar como leída

## 🚀 Comandos Útiles

### Backend
```bash
npm run start:dev    # Desarrollo
npm run build       # Construir
npm run start       # Producción
npm run test        # Tests
npm run test:supabase # Probar conexión a Supabase
```

### Frontend
```bash
npm run dev         # Desarrollo
npm run build       # Construir
npm run start       # Producción
```

## 🔧 Configuración de Variables de Entorno

### Backend (.env)
```env
# Supabase Database
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password_de_supabase
DB_NAME=postgres

# Supabase API
SUPABASE_API_KEY=tu_api_key_de_supabase
SUPABASE_URL=https://xxxxx.supabase.co

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d

# Servidor
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🎯 Próximos Pasos

1. **Implementar subida de archivos** (imágenes/videos)
2. **Crear componentes del feed** de publicaciones
3. **Implementar chat en tiempo real** en el frontend
4. **Agregar notificaciones push**
5. **Implementar búsqueda avanzada**
6. **Agregar tests unitarios y e2e**

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de la API en http://localhost:3000/api
2. Verifica que Supabase esté ejecutándose
3. Asegúrate de que las variables de entorno estén configuradas correctamente
4. Revisa los logs del backend y frontend

---

¡Disfruta construyendo tu red social! 🎉
# 🚀 Guía de Despliegue - TGram

## Despliegue del Backend en Render

### 1. Preparar el repositorio
```bash
# Asegúrate de que todos los cambios estén en GitHub
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### 2. Crear cuenta en Render
1. Ve a [render.com](https://render.com)
2. Regístrate con tu cuenta de GitHub
3. Conecta tu repositorio

### 3. Desplegar el Backend
1. En Render, haz clic en "New +" → "Web Service"
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Name**: `tgram-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm run start:prod`
   - **Plan**: Free

### 4. Variables de Entorno en Render
Configura estas variables en el panel de Render:
```
NODE_ENV=production
PORT=10000
DB_HOST=tu-host-de-neon
DB_PORT=5432
DB_USERNAME=tu-usuario-neon
DB_PASSWORD=tu-password-neon
DB_NAME=tu-database-neon
JWT_SECRET=tu-jwt-secret-super-seguro
```

### 5. Obtener URL del Backend
Una vez desplegado, Render te dará una URL como:
`https://tgram-backend.onrender.com`

---

## Despliegue del Frontend en Vercel

### 1. Crear cuenta en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Regístrate con tu cuenta de GitHub
3. Conecta tu repositorio

### 2. Desplegar el Frontend
1. En Vercel, haz clic en "New Project"
2. Importa tu repositorio de GitHub
3. Configuración:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Variables de Entorno en Vercel
Configura esta variable en Vercel:
```
NEXT_PUBLIC_API_URL=https://tu-backend-url.onrender.com
```

### 4. Obtener URL del Frontend
Una vez desplegado, Vercel te dará una URL como:
`https://tgram-frontend.vercel.app`

---

## Configuración Final

### 1. Actualizar CORS en el Backend
En `backend/src/main.ts`, actualiza la configuración CORS:
```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://tu-frontend-url.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

### 2. Actualizar Variables de Entorno
- **Backend**: Usa la URL de Vercel en CORS
- **Frontend**: Usa la URL de Render en `NEXT_PUBLIC_API_URL`

### 3. Hacer Commit y Push
```bash
git add .
git commit -m "Update CORS for production deployment"
git push origin main
```

---

## Verificación

### Backend
- ✅ API disponible en `https://tu-backend.onrender.com`
- ✅ Swagger docs en `https://tu-backend.onrender.com/api`
- ✅ Base de datos conectada

### Frontend
- ✅ App disponible en `https://tu-frontend.vercel.app`
- ✅ Conectado al backend
- ✅ Todas las funcionalidades funcionando

---

## Notas Importantes

1. **Render Free Plan**: El backend puede "dormir" después de 15 minutos de inactividad
2. **Vercel Free Plan**: Incluye 100GB de bandwidth por mes
3. **Base de Datos**: Asegúrate de que Neon.tech esté configurado correctamente
4. **Dominio Personalizado**: Puedes configurar dominios personalizados en ambos servicios

¡Tu aplicación TGram estará disponible en producción! 🎉

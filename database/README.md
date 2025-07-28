# 🗄️ Database Integration

Este módulo proporciona integración completa con base de datos MySQL para persistir todas las conversaciones del chat, mensajes, y analytics.

## 📋 Características

### ✅ **Funcionalidades Implementadas:**

- **Persistencia de Conversaciones**: Todas las conversaciones se guardan en la base de datos
- **Historial de Mensajes**: Cada mensaje se almacena con metadatos completos
- **Tracking de Tokens**: Seguimiento detallado del uso de tokens por conversación
- **Analytics**: Estadísticas de uso y rendimiento
- **Configuración Dinámica**: Ajustes de la aplicación desde la base de datos
- **Compatibilidad WordPress**: Tablas compatibles con instalaciones WordPress existentes

### 🗂️ **Estructura de Tablas:**

| Tabla | Propósito |
|-------|-----------|
| `mt_conversations` | Metadatos de conversaciones |
| `mt_messages` | Mensajes individuales |
| `mt_knowledge_usage` | Uso de archivos de conocimiento |
| `mt_analytics` | Estadísticas y analytics |
| `mt_settings` | Configuración de la aplicación |

## 🚀 Configuración

### 1. **Variables de Entorno**

Añade estas variables a tu archivo `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=wordpress
DB_PORT=3306
```

### 2. **Instalar Dependencias**

```bash
npm install mysql2 uuid
```

### 3. **Inicializar Base de Datos**

```bash
# Crear tablas y configuración inicial
npm run db:init

# Probar conexión
npm run db:test

# Crear datos de ejemplo
npm run db:sample
```

## 📊 Esquema de Base de Datos

### **Tabla: mt_conversations**
```sql
CREATE TABLE mt_conversations (
    id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    conversation_id varchar(255) NOT NULL,
    user_ip varchar(45) DEFAULT NULL,
    user_agent text,
    model_name varchar(100) NOT NULL DEFAULT 'gpt-3.5-turbo',
    total_tokens int(11) DEFAULT 0,
    total_messages int(11) DEFAULT 0,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status enum('active','archived','deleted') NOT NULL DEFAULT 'active',
    metadata longtext,
    PRIMARY KEY (id),
    UNIQUE KEY conversation_id (conversation_id)
);
```

### **Tabla: mt_messages**
```sql
CREATE TABLE mt_messages (
    id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    conversation_id varchar(255) NOT NULL,
    message_id varchar(255) NOT NULL,
    role enum('user','assistant','system') NOT NULL,
    content longtext NOT NULL,
    tokens_used int(11) DEFAULT 0,
    response_time_ms int(11) DEFAULT 0,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata longtext,
    PRIMARY KEY (id),
    UNIQUE KEY message_id (message_id)
);
```

## 🔧 Uso

### **Inicialización Automática**

El servidor se conecta automáticamente a la base de datos al iniciar:

```javascript
// El servidor intenta conectar automáticamente
const db = new Database();
await db.connect();
```

### **Guardar Conversación**

```javascript
// Crear nueva conversación
await db.createConversation(conversationId, modelName, userIp, userAgent);

// Guardar mensaje
await db.saveMessage(
    conversationId,
    messageId,
    'user',
    message,
    tokensUsed,
    responseTime
);
```

### **Recuperar Datos**

```javascript
// Obtener historial de conversación
const messages = await db.getConversationHistory(conversationId);

// Obtener conversaciones recientes
const conversations = await db.getRecentConversations(10);

// Obtener analytics
const analytics = await db.getAnalytics('2024-01-15');
```

## 📈 Analytics y Reportes

### **Métricas Disponibles:**

- **Conversaciones por día**
- **Mensajes por conversación**
- **Uso de tokens**
- **Tiempo de respuesta promedio**
- **Modelos más utilizados**
- **Archivos de conocimiento más relevantes**

### **Vistas SQL Predefinidas:**

```sql
-- Resumen de conversaciones
SELECT * FROM mt_conversation_summary;

-- Analytics diarios
SELECT * FROM mt_daily_analytics;
```

## 🔍 Endpoints de API

### **Nuevos Endpoints:**

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/conversations` | GET | Lista todas las conversaciones |
| `/api/conversations/:id/history` | GET | Historial de mensajes |
| `/api/analytics` | GET | Estadísticas de uso |
| `/api/health` | GET | Estado del sistema (incluye DB) |

### **Ejemplo de Respuesta Analytics:**

```json
{
  "date": "2024-01-15",
  "conversations": 25,
  "messages": 150,
  "total_tokens": 45000,
  "avg_response_time": 2500,
  "model_name": "gpt-3.5-turbo"
}
```

## 🛠️ Mantenimiento

### **Limpieza Automática**

```javascript
// Archivar conversaciones antiguas (30 días)
await db.cleanOldConversations(30);
```

### **Backup de Datos**

```sql
-- Exportar conversaciones activas
SELECT * FROM mt_conversations WHERE status = 'active';

-- Exportar mensajes de una fecha específica
SELECT * FROM mt_messages 
WHERE DATE(created_at) = '2024-01-15';
```

## 🔒 Seguridad

### **Consideraciones de Privacidad:**

- **Datos Sensibles**: Los mensajes se almacenan en texto plano
- **Retención**: Configurable por días (por defecto 30 días)
- **Archivado**: Las conversaciones antiguas se marcan como 'archived'
- **Eliminación**: Opción de eliminar permanentemente datos antiguos

### **Configuración de Retención:**

```javascript
// Cambiar días de retención
await db.updateSetting('retention_days', '60', 'number');
```

## 🐛 Troubleshooting

### **Problemas Comunes:**

1. **Conexión Fallida**
   ```bash
   # Verificar configuración
   npm run db:test
   ```

2. **Tablas No Existentes**
   ```bash
   # Recrear esquema
   npm run db:init
   ```

3. **Permisos de Base de Datos**
   ```sql
   -- Verificar permisos del usuario
   SHOW GRANTS FOR 'username'@'localhost';
   ```

### **Logs de Debug:**

```javascript
// Habilitar logs detallados
console.log('🔌 Connecting to database...');
console.log('✅ Database connected successfully');
console.log('💬 Saved message: msg_123 (user)');
```

## 📚 Recursos Adicionales

- [Documentación MySQL2](https://github.com/sidorares/node-mysql2)
- [UUID Generation](https://github.com/uuidjs/uuid)
- [WordPress Database Schema](https://codex.wordpress.org/Database_Description)

---

**Nota**: Esta integración es compatible con WordPress pero funciona independientemente. Las tablas usan el prefijo `mt_` para evitar conflictos con tablas WordPress existentes. 
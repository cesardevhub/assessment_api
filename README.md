# Inmuebles El Éxito — API

Backend REST + WebSocket del sistema. Gestiona autenticación, usuarios, clientes, citas, conversaciones en tiempo real y respuestas del agente LLM.

## Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Lenguaje:** TypeScript
- **BD relacional:** MariaDB/MySQL vía Prisma
- **BD documental:** MongoDB (mensajes y conversaciones)
- **WebSocket:** Socket.io
- **LLM:** Groq SDK (`llama-3.1-8b-instant`)

## Requisitos previos

- Node.js 18+
- MariaDB o MySQL corriendo
- MongoDB corriendo

## Instalación

```bash
npm install
```

---

## Configuración de bases de datos

### 1. Crear las bases de datos

Antes de cualquier otra cosa, crea las bases de datos vacías manualmente:

**MySQL / MariaDB:**
```sql
CREATE DATABASE inmuebles_el_exito;
```

**MongoDB:** la base de datos se crea automáticamente al conectarse por primera vez.

---

### 2. Generar el cliente de Prisma

```bash
npm run prisma:generate
```

Este comando lee el schema (`prisma/schema.prisma`) y genera el cliente tipado en `src/prisma/inmuebles_el_exito/`.

---

### 3. Aplicar las migraciones

**Desarrollo** — crea y aplica nuevas migraciones si hay cambios en el schema:

```bash
npm run prisma:migrate
```

---

### 4. Datos iniciales (seed manual)

Las migraciones crean las tablas vacías. Los roles y el primer usuario admin deben insertarse manualmente:

```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS inmuebles_el_exito;

-- Usar DB
USE inmuebles_el_exito;

-- Roles del sistema
insert into user_role (uuid, name, createdAt, updatedAt) values("11111111-1111-1111-1111-111111111111", "admin", now(), now());
insert into user_role(uuid, name, createdAt, updatedAt) values("22222222-2222-2222-2222-222222222222", "operator", now(), now());

-- Usuario admin inicial (contraseña: 12345)

INSERT INTO user (uuid, name, email, password, roleUuid, createdAt, updatedAt) VALUES
("33333333-3333-3333-3333-333333333333", "Administrador", "admin123", "$2b$10$WeNmdFArZwnqJ1gyuXzrpeDP.C3c/Ex/MwNv8wa9Be.X50leLrPiK", "11111111-1111-1111-1111-111111111111", now(), now());

```

> Los UUIDs del ejemplo son ilustrativos. Pueden reemplazarse por cualquier UUID v4 válido.  
> El hash corresponde a la contraseña `12345`. Cambiarla antes de cualquier despliegue real.

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Servidor
SERVER_PORT=3401

# JWT
SECRET_KEY_JWT=tu_secreto_jwt

# Base de datos relacional (MariaDB / MySQL)
DATABASE_URL=mysql://usuario:contraseña@host:3306/nombre_db
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=contraseña
DATABASE_NAME=inmuebles_el_exito

# MongoDB
URI_MONGO=mongodb://localhost:27017/inmuebles_el_exito

# Catálogo externo (opcional — usa datos de muestra si no se configura)
URL_CATALOG=https://api.externa.com/propiedades
APIKEY_CATALOG=api_key_del_catalogo

# Datos de conexión para el LLM
LLM_API_KEY=api_key_del_model
LLM_MODEL=modelo_a_utilizar

#Ruta que utiliza cors para saber si lo deja pasar o lo bloquea (ip:puerto. i.e: http://localhost:5473)
CORS_ORIGIN=ruta_donde_corre_el_front
```

> `DATABASE_URL` es usada por Prisma para migraciones.  
> `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD` y `DATABASE_NAME` son usadas por el adaptador en tiempo de ejecución.

## Ejecución

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
node dist/app.js
```

---

## Autenticación

La API usa cookies `httpOnly` para manejar sesiones. No se requieren headers de autorización.

| Tipo de token | Cookie | TTL | Quién la usa |
|---|---|---|---|
| Admin / Operador | `token` | 2 horas | Panel admin |
| Cliente | `token` | ilimitado | App pública |

Las rutas protegidas devuelven `401` si la cookie no existe o expiró.

## Formato de respuesta

Todas las respuestas siguen la misma estructura:

```json
{
  "code": 200,
  "message": "Descripción del resultado",
  "error": false,
  "data": {}
}
```

---

## Endpoints

### Usuarios — `/api/users`

> Requieren rol **admin** salvo que se indique lo contrario.

---

#### `POST /api/users/login`

Inicia sesión de un admin u operador. Establece la cookie `token`.  
Sin autenticación requerida. Limitado a 10 intentos por IP cada 15 minutos.

**Body:**
```json
{
  "email": "admin@empresa.com",
  "password": "contraseña"
}
```

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Successful login",
  "error": false,
  "data": []
}
```

**Errores:** `400` campos faltantes · `401` credenciales incorrectas · `429` demasiados intentos

---

#### `GET /api/users/information`

Devuelve los datos del usuario autenticado.  
Auth: admin u operador.

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "User information found",
  "error": false,
  "data": {
    "uuid": "abc-123",
    "name": "Juan García",
    "email": "juan@empresa.com",
    "roleName": "admin"
  }
}
```

---

#### `POST /api/users/logout`

Cierra la sesión y borra la cookie `token`. Si el usuario es operador, lo marca como offline en el sistema de conexiones.  
Auth: admin u operador.

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Successful session closure",
  "error": false,
  "data": []
}
```

---

#### `GET /api/users`

Lista todos los usuarios del sistema.  
Auth: **solo admin**.

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "...",
  "error": false,
  "data": [
    {
      "uuid": "abc-123",
      "name": "Juan García",
      "email": "juan@empresa.com",
      "role": "admin",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### `POST /api/users`

Crea un nuevo usuario.  
Auth: **solo admin**.

**Body:**
```json
{
  "name": "María López",
  "email": "maria@empresa.com",
  "password": "contraseña_segura",
  "roleUuid": "uuid-del-rol"
}
```

**Respuesta exitosa `201`:**
```json
{
  "code": 201,
  "message": "User created successfully",
  "error": false,
  "data": []
}
```

**Errores:** `400` campos faltantes · `409` email ya registrado

---

#### `PATCH /api/users/:uuid`

Actualiza los datos de un usuario existente.  
Auth: **solo admin**.

**Params:** `uuid` — UUID del usuario a actualizar.

**Body:**
```json
{
  "name": "María López",
  "email": "maria@empresa.com",
  "roleUuid": "uuid-del-rol"
}
```

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "User updated successfully",
  "error": false,
  "data": []
}
```

**Errores:** `404` usuario no encontrado

---

#### `DELETE /api/users/:uuid`

Elimina un usuario.  
Auth: **solo admin**.

**Params:** `uuid` — UUID del usuario a eliminar.

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "User deleted successfully",
  "error": false,
  "data": []
}
```

---

### Roles — `/api/roles`

---

#### `GET /api/roles`

Lista todos los roles disponibles.  
Auth: **solo admin**.

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "...",
  "error": false,
  "data": [
    { "uuid": "uuid-rol-1", "name": "admin" },
    { "uuid": "uuid-rol-2", "name": "operator" }
  ]
}
```

---

### Clientes — `/api/clients`

---

#### `POST /api/clients/login`

Inicia sesión de un cliente de la app pública usando solo su email. Si el cliente no existe, lo crea automáticamente. Establece la cookie `token` con una vigencia de 10 años.  
Sin autenticación requerida.

**Body:**
```json
{
  "email": "cliente@gmail.com"
}
```

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Successful login",
  "error": false,
  "data": []
}
```

---

#### `GET /api/clients/information`

Devuelve los datos del cliente autenticado.  
Auth: cliente (cookie de cliente).

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Client information found",
  "error": false,
  "data": {
    "uuid": "abc-123",
    "name": "Pedro Ramírez",
    "email": "pedro@gmail.com"
  }
}
```

---

#### `POST /api/clients/obtain`

Lista clientes con filtros opcionales vía query string.  
Auth: admin u operador.

**Query params (todos opcionales):**

| Param | Tipo | Descripción |
|---|---|---|
| `uuid` | string | Filtrar por UUID exacto |
| `name` | string | Filtrar por nombre (búsqueda parcial) |
| `email` | string | Filtrar por email (búsqueda parcial) |
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página (default: 20) |

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "...",
  "error": false,
  "data": [
    {
      "uuid": "abc-123",
      "name": "Pedro Ramírez",
      "email": "pedro@gmail.com",
      "phone": "50212345678",
      "createdAt": "2024-03-01T08:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/clients/:uuid`

Obtiene un cliente por su UUID.  
Auth: admin u operador.

**Params:** `uuid` — UUID del cliente.

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Client found",
  "error": false,
  "data": {
    "uuid": "abc-123",
    "name": "Pedro Ramírez",
    "email": "pedro@gmail.com",
    "phone": "50212345678"
  }
}
```

**Errores:** `404` cliente no encontrado

---

#### `POST /api/clients`

Crea un nuevo cliente desde el panel admin.  
Auth: admin u operador.

**Body:**
```json
{
  "name": "Ana Torres",
  "email": "ana@gmail.com",
  "phone": "50287654321"
}
```

> `phone` es opcional.

**Respuesta exitosa `201`:**
```json
{
  "code": 201,
  "message": "Client created successfully",
  "error": false,
  "data": []
}
```

**Errores:** `400` campos faltantes o email inválido · `409` email ya registrado

---

#### `PATCH /api/clients/:uuid`

Actualiza los datos de un cliente.  
Auth: admin u operador.

**Params:** `uuid` — UUID del cliente.

**Body (todos los campos son opcionales):**
```json
{
  "name": "Ana Torres",
  "email": "ana@gmail.com",
  "phone": "50287654321"
}
```

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Client updated successfully",
  "error": false,
  "data": []
}
```

---

### Citas — `/api/appointments`

---

#### `POST /api/appointments/obtain`

Lista citas con filtros. Para uso del panel admin.  
Auth: admin u operador.

**Body:**
```json
{
  "page": 1,
  "limit": 20,
  "startDate": "2024-01-01 00:00:00",
  "endDate": "2024-12-31 23:59:59",
  "status": "pending",
  "clientUuid": "abc-123",
  "propertyEstateId": "942"
}
```

> `status`, `clientUuid` y `propertyEstateId` son opcionales.

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "...",
  "error": false,
  "data": {
    "appointments": [
      {
        "uuid": "cita-uuid",
        "clientUuid": "abc-123",
        "propertyEstateId": "942",
        "date": "2024-06-15T10:00:00.000Z",
        "status": "pending",
        "createdAt": "2024-06-01T08:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

---

#### `POST /api/appointments/client`

Lista las citas del cliente autenticado.  
Auth: cliente.

**Body:**
```json
{
  "page": 1,
  "limit": 10
}
```

**Respuesta exitosa `200`:** misma estructura que `/obtain`.

---

#### `GET /api/appointments/:uuid`

Obtiene una cita por su UUID.  
Auth: admin u operador.

**Params:** `uuid` — UUID de la cita.

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Appointment found",
  "error": false,
  "data": { "uuid": "...", "propertyEstateId": "942", "date": "...", "status": "pending" }
}
```

**Errores:** `404` cita no encontrada

---

#### `POST /api/appointments/create`

Crea una cita de visita desde la app pública.  
Auth: cliente. El `clientUuid` se toma del token automáticamente.

**Body:**
```json
{
  "propertyEstateId": "942",
  "date": "2024-06-15T10:00:00.000Z"
}
```

**Respuesta exitosa `201`:**
```json
{
  "code": 201,
  "message": "Appointment created successfully",
  "error": false,
  "data": []
}
```

**Errores:** `400` fecha en el pasado · `400` campos faltantes

---

#### `POST /api/appointments/add`

Crea una cita desde el panel admin asignándola a un cliente específico.  
Auth: admin u operador.

**Body:**
```json
{
  "clientUuid": "abc-123",
  "propertyEstateId": "942",
  "date": "2024-06-15T10:00:00.000Z"
}
```

**Respuesta exitosa `201`:**
```json
{
  "code": 201,
  "message": "Appointment created successfully",
  "error": false,
  "data": []
}
```

---

#### `PATCH /api/appointments/:uuid`

Actualiza la propiedad o fecha de una cita existente.  
Auth: admin u operador.

**Params:** `uuid` — UUID de la cita.

**Body (al menos uno requerido):**
```json
{
  "propertyEstateId": "943",
  "date": "2024-07-01T14:00:00.000Z"
}
```

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Appointment updated successfully",
  "error": false,
  "data": []
}
```

**Errores:** `400` no se puede modificar una cita cancelada o completada · `404` cita no encontrada

---

#### `PATCH /api/appointments/:uuid/status`

Cambia el estado de una cita.  
Auth: admin u operador.

**Params:** `uuid` — UUID de la cita.

**Body:**
```json
{
  "status": "completed"
}
```

> Valores válidos: `pending` · `completed` · `cancelled`

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Appointment status updated successfully",
  "error": false,
  "data": []
}
```

**Errores:** `400` estado inválido · `400` la cita ya tiene ese estado

---

### Conversaciones — `/api/conversations`

---

#### `POST /api/conversations/receive`

Envía un mensaje del cliente al chat. Si no existe una conversación activa, la crea. El agente LLM responde automáticamente si la conversación no está asignada a un operador.  
Auth: cliente.

**Body:**
```json
{
  "type": "text",
  "content": "Hola, me interesa ver propiedades en Zona 15"
}
```

> Tipos válidos para `type`: `text` · `image` · `document` · `product`

**Respuesta exitosa `201`:**
```json
{
  "code": 201,
  "message": "Message received",
  "error": false,
  "data": { "conversationUuid": "conv-uuid-123" }
}
```

---

#### `POST /api/conversations/client`

Devuelve el historial de mensajes del cliente autenticado.  
Auth: cliente.

**Body:**
```json
{
  "page": 1,
  "limit": 20
}
```

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Messages found",
  "error": false,
  "data": [
    {
      "uuid": "msg-uuid",
      "from": "client",
      "message": { "type": "text", "content": { "text": "Hola" } },
      "createdAt": "2024-06-01T10:00:00.000Z"
    }
  ]
}
```

---

#### `POST /api/conversations`

Lista conversaciones con filtros. Los operadores solo ven las conversaciones que tienen asignadas.  
Auth: admin u operador.

**Body:**
```json
{
  "page": 1,
  "limit": 20,
  "active": true,
  "startDate": "2024-06-01 00:00:00",
  "endDate": "2024-06-30 23:59:59",
  "userUuid": "uuid-operador",
  "search": "pedro"
}
```

> `userUuid` y `search` son opcionales.

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Conversations obtained successfully",
  "error": false,
  "data": [
    {
      "uuid": "conv-uuid",
      "clientUuid": "abc-123",
      "userUuid": null,
      "createdAt": "2024-06-01T09:00:00.000Z",
      "finishedAt": null,
      "updatedAt": "2024-06-01T09:05:00.000Z"
    }
  ]
}
```

---

#### `POST /api/conversations/:uuid`

Devuelve el detalle de una conversación junto con sus mensajes paginados.  
Auth: admin u operador. Los operadores solo pueden ver sus conversaciones asignadas.

**Params:** `uuid` — UUID de la conversación.

**Body:**
```json
{
  "page": 1,
  "limit": 20
}
```

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Conversation found",
  "error": false,
  "data": {
    "conversation": { "uuid": "conv-uuid", "clientUuid": "abc-123", "userUuid": "op-uuid" },
    "messages": [
      {
        "uuid": "msg-uuid",
        "from": "client",
        "message": { "type": "text", "content": { "text": "Hola" } },
        "createdAt": "2024-06-01T10:00:00.000Z"
      }
    ]
  }
}
```

**Errores:** `403` operador sin acceso · `404` conversación no encontrada

---

#### `POST /api/conversations/:uuid/messages`

Envía un mensaje del admin u operador dentro de una conversación.  
Auth: admin u operador.

**Params:** `uuid` — UUID de la conversación.

**Body:**
```json
{
  "type": "text",
  "content": { "text": "Hola, te puedo ayudar con esa propiedad." },
  "clientUuid": "abc-123"
}
```

> Tipos válidos para `type`: `text` · `image` · `document` · `product`

**Respuesta exitosa `201`:**
```json
{
  "code": 201,
  "message": "Message sent successfully",
  "error": false,
  "data": []
}
```

**Errores:** `400` conversación inactiva · `403` sin acceso · `404` conversación no encontrada

---

#### `PATCH /api/conversations/:uuid/finish`

Cierra una conversación activa.  
Auth: admin u operador.

**Params:** `uuid` — UUID de la conversación.

**Body:**
```json
{
  "reason": "Consulta resuelta"
}
```

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Conversation finished successfully",
  "error": false,
  "data": []
}
```

**Errores:** `400` ya está cerrada · `403` sin acceso · `404` no encontrada

---

#### `PATCH /api/conversations/:uuid/transfer`

Transfiere una conversación a otro operador. Actualiza los contadores de conversaciones activas de ambos operadores.  
Auth: **solo admin**.

**Params:** `uuid` — UUID de la conversación.

**Body:**
```json
{
  "userUuid": "uuid-del-operador-destino"
}
```

**Respuesta exitosa `200`:**
```json
{
  "code": 200,
  "message": "Conversation transferred successfully",
  "error": false,
  "data": []
}
```

**Errores:** `400` conversación inactiva · `400` operador no conectado · `404` conversación no encontrada

---

## WebSocket

El servidor expone un namespace Socket.io en la misma URL y puerto. Eventos emitidos por el servidor:

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `conversation:new` | `{ conversationUuid, clientUuid }` | Nueva conversación iniciada por un cliente |
| `message:new` | `IMessage` | Nuevo mensaje en una conversación |
| `conversation:finished` | `{ uuid, reason }` | Conversación cerrada |
| `conversation:transferred` | `{ conversationUuid, userUuid }` | Conversación reasignada a un operador |

---

## Notas

- El origen CORS está configurado directamente en `src/config/appServer.ts`. Ajustarlo si el panel admin se sirve desde una IP o dominio diferente.
- La sincronización del catálogo externo (`syncCatalog`) está comentada en `appServer.ts`. Descomentar para activarla; sin ella el agente LLM usa los datos de muestra incluidos en el código.
- Una conversación se considera **inactiva** si fue cerrada (`finishedAt != null`) o si no recibió mensajes en las últimas 24 horas.

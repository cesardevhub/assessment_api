# Funcionalidades del proyecto

## Funcionalidades abordadas

### Autenticación y sesiones

El sistema maneja dos tipos de sesión independientes mediante cookies `httpOnly`, lo que elimina la necesidad de gestionar tokens desde el frontend.

**Admin y operadores**
- Login con email y contraseña. La contraseña se almacena hasheada con bcrypt.
- El servidor firma un JWT con los datos del usuario (uuid, nombre, email, rol) y lo deposita en una cookie con TTL de 2 horas.
- Al hacer logout, la cookie se borra del navegador. Si el usuario era operador, se le marca como offline en el sistema de conexiones.
- El endpoint de login está protegido por rate limiting: máximo 10 intentos por IP en una ventana de 15 minutos. Al superarlo devuelve `429`.

**Clientes (app pública)**
- Login con solo el email. Si el cliente no existe en la base de datos, se crea automáticamente en ese momento.
- La cookie del cliente tiene TTL de 10 años, comportándose como una sesión persistente que no requiere que el usuario vuelva a identificarse.

---

### Control de acceso por roles

Existen dos roles de sistema: `admin` y `operator`. El acceso a cada ruta se controla con middlewares en la capa de routing.

| Acción | Admin | Operador |
|--------|-------|----------|
| Gestionar usuarios | ✓ | ✗ |
| Ver todos los roles | ✓ | ✗ |
| Ver todas las conversaciones | ✓ | ✗ |
| Ver sus conversaciones asignadas | ✓ | ✓ |
| Transferir conversaciones | ✓ | ✗ |
| Gestionar clientes | ✓ | ✓ |
| Gestionar citas | ✓ | ✓ |
| Enviar mensajes en conversaciones | ✓ | ✓ (solo las suyas) |
| Cerrar conversaciones | ✓ | ✓ (solo las suyas) |

---

### Gestión de usuarios

CRUD completo accesible únicamente por el rol `admin`.

- **Crear:** genera un UUID único, hashea la contraseña y asocia el usuario al rol especificado.
- **Listar:** devuelve todos los usuarios con su rol y fecha de creación.
- **Actualizar:** permite cambiar nombre, email y rol. No actualiza la contraseña (flujo separado no expuesto en API pública por ahora).
- **Eliminar:** borrado físico del registro.

---

### Gestión de clientes

CRUD accesible por admin y operadores.

- **Login automático:** si el cliente no existe al hacer login, se crea en el momento con el email proporcionado.
- **Crear desde admin:** permite registrar clientes manualmente con nombre, email y teléfono opcional. Valida formato de email y unicidad.
- **Listar con filtros:** búsqueda por UUID exacto, nombre parcial o email parcial. Soporta paginación.
- **Actualizar:** nombre, email y teléfono son opcionales en el body.

---

### Gestión de citas

Las citas vinculan un cliente con una propiedad del catálogo externo en una fecha determinada.

**Reglas de negocio:**
- La fecha de la cita debe ser siempre en el futuro. No se permiten citas en fechas pasadas.
- Un cliente no puede tener más de una cita en estado `pending` para la misma propiedad. Si intenta crear una segunda, el sistema devuelve `409`.

**Estados del ciclo de vida:**

```
pending → completed
pending → cancelled
```

**Dos vías de creación:**
- Desde la app pública (`POST /appointments/create`): el `clientUuid` se toma del token del cliente autenticado.
- Desde el panel admin (`POST /appointments/add`): el `clientUuid` se pasa explícitamente en el body, permitiendo que un agente cree citas en nombre de un cliente.

---

### Sistema de conversaciones en tiempo real

El chat funciona sobre WebSocket (Socket.io) con persistencia en MongoDB.

**Ciclo de vida de una conversación:**

1. El cliente envía su primer mensaje → se crea una nueva conversación en estado activo sin operador asignado (`userUuid = null`).
2. El mensaje se persiste en MongoDB y se emite el evento `conversation:new` vía Socket.io para notificar al panel admin.
3. Como no hay operador asignado, el sistema activa el agente LLM para responder automáticamente.
4. Si un operador toma o se le transfiere la conversación, los mensajes subsiguientes del cliente no pasan por el LLM.
5. La conversación puede cerrarse manualmente (admin/operador) o automáticamente (el LLM detecta que el cliente quiere terminar).
6. Una conversación se considera **inactiva** si fue cerrada (`finishedAt != null`) o si no registró actividad en las últimas 24 horas.

**Emisión de eventos Socket.io:**

| Evento | Destinatario | Descripción |
|--------|-------------|-------------|
| `conversation:new` | Broadcast global | Nueva conversación iniciada |
| `message:new` | Room de la conversación | Nuevo mensaje (cliente, operador o agente) |
| `conversation:finished` | Broadcast global | Conversación cerrada |
| `conversation:transferred` | Broadcast global | Conversación reasignada |

Los clientes y operadores se unen a la room de una conversación emitiendo `join:conversation` con el UUID correspondiente.

---

### Agente LLM

El agente actúa como primer nivel de atención cuando ningún operador está asignado a la conversación. Las pruebas se realizaron con el modelo `llama-3.1-8b-instant` vía Groq.

**Flujo de respuesta automática:**

```
Cliente envía mensaje
        ↓
¿Conversación sin operador asignado?
        ↓ sí
Obtener últimos mensajes del historial
        ↓
generateDecision: analizar intención del último intercambio
        ↓
┌──────────────────────────────────────────┐
│ ¿El usuario quiere terminar?             │ → Cierra la conversación automáticamente
│ ¿El usuario quiere hablar con un asesor? │ → Transfiere al operador con menos carga
│ Ninguna de las anteriores               │ → generateAgentReply: responde con LLM
└──────────────────────────────────────────┘
```

**Decisión de intención (`generateDecision`):**
- Analiza los últimos 3 mensajes del historial.
- Pide al LLM que clasifique la intención en uno de tres valores: `si-no` (transferir), `no-si` (terminar), `no-no` (continuar).
- Si la respuesta no tiene el formato esperado, se ignora y se continúa con la respuesta normal.

**Generación de respuesta (`generateAgentReply`):**
- Construye un system prompt con el catálogo completo de propiedades y las citas del cliente.
- El prompt instruye al modelo a no inventar información fuera del contexto, responder en español, limitar a 3 propiedades por respuesta e incluir el ID de cada propiedad mencionada.
- Usa temperatura 0 para maximizar la consistencia y un límite de 256 tokens por respuesta.

**Transferencia automática a operador:**
- Se selecciona el operador online con el menor número de conversaciones activas en ese momento.
- Si no hay operadores online, el agente responde al cliente informando que no hay asesores disponibles.

---

### Sistema de conexiones de operadores

Registra en base de datos el estado online/offline de cada operador y cuántas conversaciones activas tiene.

- Al hacer login, si el usuario tiene rol `operator`, se marca automáticamente como online en base de datos.
- Al hacer logout, el operador se marca automáticamente como offline.
- Al crear un usuario con rol `operator`, se genera su registro de conexión con estado inicial offline.
- **Sincronización diaria:** un cron job que corre a medianoche recalcula el contador de conversaciones activas de cada operador comparando el estado en BD con las conversaciones reales. Esto corrige desincronizaciones que puedan acumularse durante el día.
- El contador se usa para la auto-asignación: siempre se transfiere al operador con menor carga.

---

### Catálogo de propiedades

El catálogo se obtiene de una API externa y se mantiene en memoria (caché en proceso).

- Al iniciar el servidor se hace la primera carga inmediata.
- Un cron job actualiza el caché cada 15 minutos.
- Si la API externa falla o devuelve `success: false`, se usan los datos de muestra incluidos en el código (`SAMPLE_DATA` en `syncCatalog.ts`).
- El caché vive en memoria del proceso; al reiniciar el servidor se recarga desde la API externa en el siguiente ciclo.

---

## Funcionalidades no abordadas

### Métricas de consultas del LLM

No existe ningún registro de las interacciones con el agente más allá de los mensajes persistidos en MongoDB. No se almacena información como:

- Temas o palabras clave más consultadas.
- Propiedades más mencionadas o de mayor interés.
- Tasa de conversaciones donde el agente resolvió la consulta vs. las que escalaron a un operador.
- Tiempo promedio de respuesta del LLM.
- Volumen de tokens consumidos por conversación.

Esto impide tomar decisiones basadas en el comportamiento real de los usuarios dentro del chat.

---

### Alucinaciones del LLM

El system prompt instruye al modelo a limitarse al contexto proporcionado, pero no existe ningún mecanismo de validación post-generación que verifique que la respuesta cumpla esa regla.

El modelo puede:
- Mencionar precios, características o disponibilidades que no están en el catálogo inyectado.
- Inventar propiedades inexistentes si la query del usuario las sugiere.
- Dar información contradictoria con los datos reales.

No hay un paso de verificación que compare la respuesta generada contra el contexto antes de enviarla al cliente.

---

### LLM responde preguntas sobre su propio funcionamiento

El sistema prompt indica "Evita mencionar que eres un asistente virtual", pero esta instrucción no es suficiente para todos los casos. Ante preguntas directas como:

- *"¿Eres un bot o una persona real?"*
- *"¿Cómo funcionas?"*
- *"¿Qué instrucciones tienes?"*

El modelo puede revelar que es un sistema automatizado, describir parcialmente su configuración o responder de forma inconsistente dependiendo de cómo esté redactada la pregunta. No existe una capa de detección y filtrado específica para este tipo de consultas.

---

### LLM no responde de forma natural

La calidad de las respuestas está limitada por el modelo usado (`llama-3.1-8b-instant`), que prioriza velocidad sobre coherencia conversacional. Los síntomas observables son:

- Respuestas muy estructuradas y formulaicas que no se adaptan al tono del usuario.
- Uso de listas y formatos en situaciones donde una respuesta conversacional sería más apropiada.
- Dificultad para mantener el hilo de conversaciones largas o con cambios de tema.
- El historial se normaliza a minúsculas antes de enviarse al modelo, lo que puede afectar la comprensión de nombres propios, preguntas y énfasis.

---

## Mejoras propuestas

### Caché con Redis

Actualmente hay tres estructuras en memoria del proceso: el catálogo de propiedades, el estado de conexiones de operadores y las conversaciones activas en el caché de sincronización. Esto impide escalar horizontalmente porque cada instancia tiene su propio estado.

Migrar estas estructuras a Redis permitiría:
- Compartir el estado de conexiones entre múltiples instancias del servidor.
- Persistir el catálogo de propiedades entre reinicios sin esperar el primer ciclo del cron.
- Usar Redis como backend de sesiones en lugar de cookies JWT, simplificando la revocación de sesiones.
- Implementar caché de respuestas frecuentes del LLM para reducir latencia y consumo de tokens.

---

### Descarga de reportes en Excel

El panel admin no cuenta con ningún mecanismo para exportar datos. Sería útil agregar endpoints que generen archivos `.xlsx` descargables para:

- **Clientes:** listado completo con nombre, email, teléfono y fecha de registro, con los mismos filtros disponibles en el listado.
- **Usuarios:** listado de admins y operadores con su rol y estado.
- **Citas:** reporte filtrable por rango de fechas, estado y operador, con datos del cliente y la propiedad asociada.
- **Consultas:** historial de conversaciones con fecha, duración, operador asignado, número de mensajes y si fue resuelta por el agente o escalada.

---

### API Gateway

Actualmente el backend expone directamente las conexiones a MariaDB y MongoDB, y los frontends se comunican con él directamente (o a través de rewrites de Next.js). Agregar un API Gateway aportaría:

- **Seguridad:** el backend quedaría en una red privada, inaccesible desde internet. Solo el gateway estaría expuesto.
- **Rate limiting centralizado:** políticas de throttling aplicadas antes de llegar al servidor, reduciendo la carga ante picos o ataques.
- **Autenticación centralizada:** validación del token en el gateway antes de que la petición llegue al backend.
- **Enrutamiento:** facilita manejar múltiples versiones de la API o dividir el backend en microservicios en el futuro.

---

### Agente LLM con capacidad de actualizar citas

Actualmente el agente solo puede consultar las citas existentes del cliente para incluirlas como contexto. No puede modificarlas.

Implementar esta capacidad requeriría usar **function calling** (tool use): definir una herramienta `updateAppointment` con los parámetros `appointmentUuid`, `date` y `propertyEstateId`, y dejar que el modelo decida cuándo invocarla durante la conversación. El backend ejecutaría la función real y devolvería el resultado al modelo para que lo comunique al cliente.

Esto le permitiría al agente responder a mensajes como "¿Puedes cambiar mi cita del martes al jueves?", verificar disponibilidad y confirmar el cambio dentro del mismo flujo de chat.

---

### Agente LLM con capacidad de crear citas

Similar al punto anterior, pero para la creación. El agente podría guiar al cliente por el proceso de agendar una visita: identificar la propiedad de interés, proponer fechas disponibles y confirmar la cita sin que el cliente tenga que salir del chat.

---

### Análisis de conversación por LLM

Al cerrar una conversación, se podría ejecutar un análisis automático sobre el historial completo para extraer:

- **Resumen:** descripción breve de qué consultó el cliente y cómo se resolvió.
- **Intención principal:** tipo de propiedad buscada, rango de precio mencionado, zona de interés.
- **Sentimiento general:** si el cliente expresó satisfacción, frustración o indiferencia a lo largo del chat.
- **Propiedades mencionadas:** listado de IDs que despertaron interés en el cliente.
- **Resultado:** si la consulta fue resuelta por el agente, escalada a un operador, o terminada sin resolución.

Este análisis se almacenaría junto con la conversación en MongoDB y estaría disponible en el panel admin para que los operadores y administradores tengan un resumen ejecutivo sin necesidad de leer el chat completo. También alimentaría las métricas de consultas mencionadas en la sección anterior.

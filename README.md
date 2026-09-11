# Acredita

## Sistema de control de acceso y acreditación digital

Acredita es una plataforma para crear eventos, emitir entradas digitales, organizar equipos de puerta y controlar el ingreso en tiempo real. Está pensada para el ecosistema de Villa Mercedes, San Luis: Complejo Molino Fénix, La Pedrera, ferias empresariales, congresos y fiestas privadas.

La experiencia conecta tres momentos de un evento:

```text
Crear y compartir  ->  Validar en puerta  ->  Entender lo que pasó
Organizador            Staff                 Dashboard
```

## Estado actual

Este repositorio contiene un prototipo navegable de alta fidelidad y un backend MVP ejecutable con Node.js sin dependencias externas.

### Incluido en la demo

- Landing pública con propuesta de valor, roles y recorrido del producto.
- Acceso por rol: organizador, staff de puerta y asistente.
- Asistente de creación de eventos con nombre, fecha, horario, ubicación, ciudad, capacidad y tipos de entrada.
- Dashboard del organizador con aforo, flujo horario, capacidad, puertas y actividad reciente.
- Escáner de acreditación con tres estados: válido, QR usado e inválido.
- Activación de cámara trasera del dispositivo y detección QR mediante `BarcodeDetector` cuando el navegador lo soporta.
- Ticket digital con identidad, tipo de acceso, fecha, puertas y QR visual.
- Gestión de listas con categorías General, VIP y Prensa.
- Diseño responsive para desktop, tablet y móvil.
- Simulación de actualización de aforo, sincronización y notificaciones de operación.
- Sesiones con cookie HttpOnly, login por rol y autorización de endpoints.
- Persistencia local de usuarios y eventos en `data/store.json`.

### Límites explícitos de la demo

El backend actual es un MVP local: persiste en un archivo JSON y contiene usuarios semilla configurables por entorno. El QR visual, la rotación de token, el escaneo de cámara, el modo offline, los sonidos y las billeteras todavía están representados visualmente o simulados. No debe usarse esta versión para validar accesos reales.

## Inicio rápido

### Requisitos

- Node.js 18 o superior.
- Navegador moderno con soporte para CSS Grid, ES Modules básicos y Web APIs.

### Servidor local

Desde la raíz del proyecto:

```bash
node local-server.js
```

Abrir [http://localhost:4173](http://localhost:4173).

No hay `npm install` ni build requerido en esta etapa. Para servir solamente el prototipo visual se puede usar `python3 -m http.server 4173`, pero el login y la creación persistente de eventos requieren `node local-server.js`.

### Usuarios locales de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@acredita.local` | `admin-demo-2026` |
| Usuario de puerta | `puerta@acredita.local` | `puerta-demo-2026` |

Las credenciales semilla se pueden cambiar antes de iniciar el servidor:

```bash
ADMIN_EMAIL=admin@miempresa.com ADMIN_PASSWORD='cambiar-ahora' node local-server.js
```

En producción deben sustituirse por un proveedor de identidad, secretos fuera del código, base de datos y recuperación segura de cuenta.

### API local disponible

- `POST /api/auth/login`: crea una sesión HttpOnly.
- `GET /api/auth/me`: devuelve el usuario de la sesión actual.
- `POST /api/auth/logout`: revoca la sesión actual.
- `GET /api/events`: lista los eventos autorizados para el usuario.
- `POST /api/events`: crea un evento; requiere rol `admin`.

## Recorrido de usuario

### 1. Organizador

1. Ingresa a la portada y selecciona **Crear mi evento**.
2. Completa los datos básicos del evento.
3. Define capacidad y tipos de entrada, por ejemplo General y VIP.
4. Continúa al panel operativo.
5. Desde el dashboard comparte accesos, observa el aforo y administra listas.

En una versión productiva, el siguiente paso del asistente debe configurar puertas, zonas, permisos de staff, reglas de venta y plantillas de comunicación.

### 2. Staff de puerta

1. Selecciona **Staff de puerta** desde la portada.
2. Accede directamente al escáner asignado.
3. Lee el QR desde la cámara del dispositivo.
4. Recibe una respuesta de alto contraste y acción clara.

| Estado | Respuesta | Datos mínimos |
| --- | --- | --- |
| Acceso válido | Verde, check y tono corto | Nombre, tipo y zona |
| QR ya usado | Rojo, alerta, vibración y tono grave | Hora, puerta y dispositivo originales |
| Entrada inválida | Naranja, advertencia y doble tono | Motivo de rechazo |

### 3. Asistente

1. Abre su enlace desde WhatsApp o correo.
2. Visualiza su entrada digital sin descargar una aplicación pesada.
3. Muestra el QR en la puerta.
4. En producción podrá añadirlo a Apple Wallet o Google Wallet.

## Roles y permisos propuestos

| Rol | Puede hacer | No debería poder hacer |
| --- | --- | --- |
| Owner / Organizador | Crear eventos, configurar entradas, ver métricas, invitar equipo | Acceder a eventos de otra organización |
| Manager de evento | Editar listas, puertas, zonas y asignaciones | Cambiar facturación o eliminar la organización |
| Staff de puerta | Escanear, consultar el resultado y operar offline | Exportar datos o editar tickets |
| Asistente | Ver su entrada y datos del evento | Consultar listas o métricas |
| Soporte | Diagnosticar dispositivos y sincronización | Validar accesos sin auditoría |

La autorización debe aplicarse en el servidor, no solamente ocultando botones en la interfaz.

## Módulos del producto

### A. Landing y onboarding

La portada presenta la propuesta de valor, muestra el ticket y la operación como señales visuales principales y ofrece tres entradas según el rol. El organizador inicia un wizard de creación; staff y asistentes acceden directamente al módulo que necesitan.

### B. Gestión de eventos

Cada evento debe contener:

- Nombre, fecha, horario, zona horaria y estado.
- Recinto, dirección, capacidad total y zonas.
- Puertas, dispositivos autorizados y responsables.
- Tipos de entrada, cupos, precio, beneficios y reglas.
- Invitados, prensa, VIP, staff y acreditaciones especiales.
- Plantilla visual y canales de distribución.

### C. Emisión de tickets

El organizador podrá emitir entradas individuales o por lotes. Cada ticket debe tener un identificador público, titular, tipo, zona, estado, evento y token firmado vigente.

Estados recomendados:

```text
draft -> issued -> active -> used
                                        |          |
                                 revoked    rejected
```

### D. Scanner de puerta

Debe ser una PWA optimizada para tablets y teléfonos. La acción primaria es escanear; el resultado ocupa la mayor parte de la pantalla, permanece visible el tiempo suficiente y no depende de leer texto pequeño.

Requisitos productivos:

- Cámara con lectura en menos de un segundo.
- Selección de evento y puerta antes de comenzar.
- Feedback visual, sonoro y háptico configurable.
- Bloqueo de doble lectura accidental.
- Historial local de lecturas.
- Indicador de conexión y cola pendiente de sincronización.
- Reintento idempotente al recuperar señal.

### E. Dashboard

El panel debe mostrar el aforo actual, capacidad, porcentaje utilizado, ingresos por hora, estado de cada puerta, tickets rechazados, velocidad de atención y actividad reciente. Los datos deben poder filtrarse por fecha, puerta, tipo de entrada y zona.

### F. Listas y acreditaciones especiales

Debe permitir importar CSV, crear invitados, asignar categorías, agregar notas, emitir invitaciones y revocar accesos. Las acciones sensibles necesitan confirmación y registro de auditoría.

## Arquitectura propuesta

```text
                                                    +----------------------+
Asistente PWA ------------>|                      |
Staff Scanner ------------>| API / Auth / Events  |---- PostgreSQL
Dashboard Organizador ---->|                      |---- Object Storage
                                                    +----------+-----------+
                                                                         |
                                            +--------------+--------------+
                                            |                             |
                                 Redis / tokens               WebSocket / SSE
                                            |                             |
                            Worker de sincronización       Dashboard en vivo
```

### Capas sugeridas

- **Frontend:** React, Vue o la SPA actual evolucionada a componentes; PWA con service worker.
- **API:** REST versionada o tRPC, validación de esquemas y autorización por organización.
- **Persistencia:** PostgreSQL para entidades y auditoría.
- **Cache y tokens:** Redis para tokens vigentes, rate limiting y eventos efímeros.
- **Tiempo real:** WebSocket o Server-Sent Events para métricas de evento.
- **Offline:** IndexedDB para cola local cifrada y metadatos mínimos del evento.
- **Observabilidad:** logs estructurados, métricas de latencia, errores de cámara y tasa de sincronización.

## Modelo de datos inicial

### `Organization`

`id`, `name`, `ownerId`, `createdAt`, `settings`.

### `User`

`id`, `name`, `email`, `phone`, `status`, `lastLoginAt`.

### `Membership`

`organizationId`, `userId`, `role`, `permissions`, `createdAt`.

### `Event`

`id`, `organizationId`, `name`, `venue`, `city`, `startsAt`, `endsAt`, `capacity`, `status`, `timezone`.

### `TicketType`

`id`, `eventId`, `name`, `capacity`, `price`, `zone`, `active`.

### `Ticket`

`id`, `eventId`, `ticketTypeId`, `holderName`, `holderEmail`, `status`, `issuedAt`, `revokedAt`.

### `AccessLog`

`id`, `eventId`, `ticketId`, `gateId`, `deviceId`, `result`, `reason`, `scannedAt`, `syncedAt`.

### `Gate` y `Device`

Puerta, zona, dispositivo autorizado, responsable, versión de app, última conexión y estado de sincronización.

## API propuesta

### Crear evento

`POST /v1/events`

```json
{
    "name": "Festival Río 2026",
    "venue": "Complejo Molino Fénix",
    "city": "Villa Mercedes",
    "startsAt": "2026-10-18T18:00:00-03:00",
    "capacity": 1800,
    "ticketTypes": [
        { "name": "General", "capacity": 1500 },
        { "name": "VIP", "capacity": 300 }
    ]
}
```

### Emitir ticket

`POST /v1/events/{eventId}/tickets`

Debe soportar emisión individual y lotes, con respuesta que no exponga secretos del token.

### Validar acceso

`POST /v1/events/{eventId}/access/validate`

```json
{
    "token": "signed-rotating-token",
    "deviceId": "device-01",
    "gateId": "gate-01",
    "scannedAt": "2026-10-18T21:42:10-03:00"
}
```

Respuesta válida:

```json
{
    "result": "valid",
    "accessId": "access-123",
    "holder": "Martina López",
    "ticketType": "General",
    "zone": "Principal"
}
```

Respuestas de negocio recomendadas: `valid`, `already_used`, `invalid_event`, `expired`, `revoked`, `replay_detected` y `offline_queued`.

### Métricas en vivo

`GET /v1/events/{eventId}/metrics` y canal `WS /v1/events/{eventId}/stream` para aforo, puertas y actividad reciente.

## Seguridad y antifraude

- Tokens QR firmados, de vida corta y con `jti` único.
- Rotación cada 15 a 30 segundos con tolerancia de reloj configurable.
- Validación de evento, fecha, estado y tipo de entrada en servidor.
- Control anti-replay basado en `jti`, ticket y ventana temporal.
- No guardar datos sensibles dentro del QR; usar una referencia opaca.
- Autenticación con sesiones seguras o tokens rotativos.
- MFA opcional para Owner y Manager.
- Dispositivos de staff registrados y revocables.
- Rate limiting por usuario, dispositivo y evento.
- Auditoría inmutable de emisión, modificación, revocación y acceso.
- Cifrado en tránsito y en reposo.
- Retención de datos definida por el organizador y normativa aplicable.

El modo offline requiere especial cuidado: no debe permitir que un dispositivo comprometido autorice indefinidamente accesos ni que la sincronización duplique ingresos. La resolución de conflictos debe ser explícita y auditable.

## Offline y sincronización

1. El dispositivo recibe una configuración firmada y limitada al evento, puerta y ventana de operación.
2. La aplicación almacena una cola local en IndexedDB.
3. Cada lectura obtiene un `operationId` idempotente.
4. El servidor acepta reintentos sin duplicar `AccessLog`.
5. Al volver la conexión, sincroniza por lotes y devuelve conflictos.
6. El staff ve claramente cuántas lecturas están pendientes.

La aplicación debe diferenciar “válido offline con sincronización pendiente” de “validado por servidor” para que el organizador conozca el nivel de certeza operativo.

## UX/UI

- Alto contraste para operación nocturna o a sol directo.
- Estados de escáner inequívocos: verde, rojo y naranja.
- Una acción crítica por pantalla en el flujo de puerta.
- Tipografía grande para identidad y resultado.
- No depender únicamente del color: combinar color, icono, texto, sonido y vibración.
- Dashboard orientado a lectura rápida y decisiones de personal.
- Responsive para desktop, tablet y móvil.
- Accesibilidad: foco visible, labels, contraste WCAG AA, navegación por teclado y mensajes de estado anunciables.

## Roadmap

### Fase 1 · MVP operativo

- Backend multi-tenant y autenticación.
- CRUD de organizaciones, eventos, puertas, usuarios y tipos de entrada.
- Emisión de tickets con QR firmado.
- Scanner con cámara y validación online.
- Auditoría básica y dashboard de aforo.

### Fase 2 · Operación resiliente

- PWA instalable.
- Cola offline cifrada e idempotencia.
- Sincronización y resolución de conflictos.
- Apple Wallet y Google Wallet.
- Invitaciones por email y WhatsApp mediante proveedor autorizado.

### Fase 3 · Inteligencia operativa

- Métricas por puerta, hora, tipo y zona.
- Alertas de capacidad y anomalías.
- Predicción de picos de ingreso.
- Reportes post-evento y exportación.
- Gestión avanzada de organizaciones y facturación.

## Estructura del repositorio

```text
.
├── index.html       # Landing, wizard y vistas del prototipo
├── styles.css       # Sistema visual de la app operativa
├── landing.css      # Sistema visual de la portada y onboarding
├── auth.css         # Splash inicial y acceso por roles
├── role-overrides.css # Permisos visuales del menú por rol
├── auth-overrides.css # Formulario de login
├── camera.css        # Estados visuales del visor de cámara
├── app.js           # Navegación, simulaciones y creación de evento demo
├── local-server.js   # API local, sesiones y autorización por rol
├── .gitignore       # Excluye datos locales y secretos
└── README.md        # Documentación de producto y arquitectura
```

## Criterios de aceptación para producción

- Un organizador puede crear un evento y publicar un enlace de ticket.
- Un asistente recibe un ticket único y puede presentarlo sin instalar una app.
- Un operador puede validar tickets online y offline con resultado inequívoco.
- Un ticket usado no vuelve a habilitarse por doble lectura o reintento.
- El dashboard refleja ingresos con latencia conocida y auditable.
- Todos los roles ven solamente los eventos y acciones autorizadas.
- La operación continúa ante una caída breve de conectividad.
- Los eventos, tickets y accesos se pueden exportar según permisos.

## Contribuir

1. Crear una rama descriptiva desde `main`.
2. Mantener cambios pequeños y documentar decisiones de producto.
3. Ejecutar validaciones locales antes de abrir un pull request.
4. Verificar desktop y móvil para cualquier cambio visual.
5. No incluir credenciales, tokens reales ni datos personales de asistentes.

## Licencia y datos

Este repositorio es un prototipo de producto. Antes de operar eventos reales se deben definir licencia, política de privacidad, términos de uso, tratamiento de datos personales y responsables de la información.

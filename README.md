# Acredita · Sistema de control de acceso

Prototipo navegable y MVP visual para eventos en Villa Mercedes, San Luis. La primera versión reúne el panel del organizador, escáner de staff, ticket digital y gestión de invitados en una SPA estática sin dependencias.

## Ejecutar

Desde esta carpeta:

```bash
python3 -m http.server 4173
```

Abrir `http://localhost:4173`.

## Qué está implementado

- Dashboard de aforo, flujo horario, estado de puertas y actividad reciente.
- Vista de escáner con respuestas visuales para acceso válido, QR usado e inválido.
- Ticket digital con QR visual, token rotativo simulado y estado activo.
- Gestión de listas con filtros y tabla responsive.
- Navegación responsive para desktop, tablet y móvil.
- Feedback de sincronización, toast de acciones y estados de operación.

## Arquitectura técnica propuesta V1

```text
Asistente PWA ───────┐
                     ├── API de eventos ── PostgreSQL
Staff Scanner ───────┤        │
                     │        ├── Redis / tokens rotativos
Dashboard Admin ─────┘        ├── WebSocket / eventos en vivo
                              └── Worker de sincronización offline
```

### Módulos de dominio

- `Event`: recinto, fecha, capacidad, puertas y configuración.
- `Ticket`: titular, tipo, zona, estado y token vigente.
- `AccessLog`: ticket, puerta, dispositivo, timestamp y resultado.
- `GuestList`: invitación, categoría, notas y estado de acreditación.

### Contrato de validación sugerido

`POST /v1/events/{eventId}/access/validate`

- Entrada: token firmado, `deviceId`, `gateId`, timestamp del dispositivo.
- Salida válida: titular, tipo, zona y `accessId`.
- Salida usada: primer ingreso, puerta y dispositivo originales.
- Salida inválida: código de error y motivo legible para staff.

El MVP actual simula el contrato en el navegador. Para producción, la firma de tokens, control anti-replay, autenticación del staff y la persistencia deben ejecutarse del lado del servidor.

## Roadmap técnico

1. **Fase 1, MVP:** API de tickets, emisión de QR firmado, motor de validación, PWA del asistente y scanner con feedback háptico/sonoro.
2. **Fase 2, contingencia y Wallet:** cola local cifrada, sincronización idempotente, resolución de conflictos y pases Apple/Google Wallet.
3. **Fase 3, analytics:** WebSocket para aforo vivo, agregaciones por puerta y hora, alertas de capacidad y reportes exportables.

## Decisiones UX/UI

- Alto contraste y estados cromáticos inequívocos para operación nocturna o a sol directo.
- Acciones críticas de puerta visibles con un toque.
- Información del ticket organizada para lectura rápida: identidad, tipo, zona, fecha y puerta.
- Panel orientado a escaneo: densidad moderada, jerarquía tipográfica y datos accionables.

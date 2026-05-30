# Banco Parcial - Circuit Breaker y CQRS

Proyecto academico para el Parcial III de Patrones Arquitectonicos Avanzados, Opcion 2 basica. La solucion corre completa en localhost con Docker Compose.

## Descripcion

El sistema tiene dos partes independientes dentro del mismo backend Node.js con Express:

- Parte 1: microservicio de SMS con Circuit Breaker. Aldeamo y Twilio estan simulados.
- Parte 2: sistema CQRS para transferencias bancarias. Las escrituras van a PostgreSQL y las lecturas van a MongoDB, con sincronizacion asincronica cada 5 segundos.

Tambien incluye un frontend simple servido por el backend en `http://localhost:3000` para demostrar el flujo visualmente.

## Arquitectura Parte 1: SMS

El endpoint `POST /api/sms/send` intenta enviar primero por Aldeamo. Si Aldeamo falla, se registra la falla en el Circuit Breaker y se envia automaticamente por Twilio como fallback.

Estados implementados:

- `CLOSED`: Aldeamo esta disponible y se intenta usar normalmente.
- `OPEN`: Aldeamo fallo varias veces seguidas. El sistema no lo intenta y usa Twilio directamente.
- `HALF_OPEN`: despues del tiempo de recuperacion, se hace una prueba con Aldeamo. Si responde bien vuelve a `CLOSED`; si falla vuelve a `OPEN`.

Para la demo, Aldeamo se puede poner en falla o recuperar con endpoints de configuracion en memoria.

## Arquitectura Parte 2: CQRS

El modelo de comandos vive en PostgreSQL en la tabla `transferencias_cmd`. Crear una transferencia escribe solamente en SQL.

El modelo de lectura vive en MongoDB en la coleccion `transferencias_read`. Las consultas principales leen desde MongoDB, no desde PostgreSQL.

Un worker ejecutado cada 5 segundos busca transferencias con `sincronizada = false`, las copia a MongoDB y luego las marca como sincronizadas en PostgreSQL.

## Consistencia eventual

Al crear una transferencia, esta aparece inmediatamente en PostgreSQL. Durante unos segundos puede no aparecer en MongoDB porque la sincronizacion es asincronica. Despues de que corre el worker, MongoDB queda actualizado. Esa diferencia temporal demuestra consistencia eventual.

Logs esperados en consola:

```txt
Transferencia creada en SQL
Sincronizando transferencia a MongoDB
Transferencia sincronizada correctamente
```

## Como correr

Abrir:

```txt
http://localhost:3000
```


## Variables de entorno

El `docker-compose.yml` ya define:

```env
PORT=3000
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=banco
MONGO_URL=mongodb://mongo:27017/banco_read
```

## Endpoints SMS

### Enviar SMS

```http
POST /api/sms/send
Content-Type: application/json

{
  "phone": "3001234567",
  "message": "Tu codigo OTP es 123456"
}
```

Para una demostracion con el nombre usado en clase, tambien existe el alias:

```http
POST /api/sms/pagar
```

Respuesta con Aldeamo:

```json
{
  "status": "SENT",
  "provider": "ALDEAMO",
  "circuitState": "CLOSED",
  "fallback": false,
  "transition": null
}
```

Respuesta con Twilio:

```json
{
  "status": "SENT",
  "provider": "TWILIO",
  "circuitState": "OPEN",
  "fallback": true,
  "transition": "CLOSED_TO_OPEN"
}
```

### Estado del circuito

```http
GET /api/sms/circuit-state
```

### Forzar falla de Aldeamo

```http
POST /api/sms/aldeamo/fail
```

### Recuperar Aldeamo

```http
POST /api/sms/aldeamo/recover
```

## Endpoints Transferencias

### Crear transferencia en PostgreSQL

```http
POST /api/transferencias
Content-Type: application/json

{
  "cuentaOrigen": "12345",
  "cuentaDestino": "67890",
  "monto": 50000
}
```

### Consultar transferencias desde MongoDB

```http
GET /api/transferencias
```

### Consultar PostgreSQL para demostracion

```http
GET /api/transferencias/sql
```

### Consultar MongoDB para demostracion

```http
GET /api/transferencias/nosql
```

### Forzar sincronizacion manual

```http
POST /api/sync
```

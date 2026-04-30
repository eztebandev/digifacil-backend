# DigiFacil Backend

API de DigiFacil construida con Express.

## Requisitos

- Node.js 20 o superior

## Instalacion

```bash
npm install
```

## Variables de entorno

Para local usa `.env.dev` y `.env.prod` (no se suben al repo).  
En Railway configura variables en el dashboard del servicio.

Variables disponibles:

- `APP_ENV`: entorno de ejecucion (`development` o `production`).
- `DATABASE_URL`: cadena de conexion PostgreSQL (si la defines, tiene prioridad).
- `DATABASE_URL_DEV`: cadena de conexion PostgreSQL para desarrollo.
- `DATABASE_URL_PROD`: cadena de conexion PostgreSQL para produccion.
- `PORT`: puerto del servidor.
- `CLIENT_URL`: origen permitido para CORS.
- `JWT_SECRET`: secreto para firmar tokens.
- `ADMIN_EMAIL`: usuario administrador inicial.
- `ADMIN_PASSWORD`: password del administrador inicial.

Seleccion de base de datos:

- Si defines `DATABASE_URL`, siempre se usa esa.
- Si no defines `DATABASE_URL`:
  - con `APP_ENV=production` (o `NODE_ENV=production`) usa `DATABASE_URL_PROD`.
  - en cualquier otro caso usa `DATABASE_URL_DEV`.

## Prisma (PostgreSQL / Supabase)

1. Instalar dependencias:

```bash
npm install
```

2. Generar cliente Prisma:

```bash
npm run prisma:generate:dev
```

3. Crear/aplicar migraciones:

```bash
npm run prisma:migrate:dev
```

## Desarrollo

```bash
npm run dev
```

La API queda disponible en `http://localhost:4000`.

## Produccion

```bash
npm start
```

## Railway

Variables recomendadas en Railway:

- `APP_ENV=production`
- `DATABASE_URL` (recomendado en produccion, prioridad alta)
- `CLIENT_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Comandos utiles para produccion:

```bash
npm run prisma:generate:prod
npm run prisma:migrate:prod
npm run prisma:seed:prod
```

Seed de admin en produccion:

- Usa `ADMIN_EMAIL`, `ADMIN_PASSWORD` y opcionalmente `ADMIN_USERNAME`.
- El seed es idempotente: crea o actualiza el usuario admin por email.

Flujo recomendado en Railway:

1. Configura variables en Railway: `APP_ENV=production`, `DATABASE_URL`, `CLIENT_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
2. Deploy command: usa `npm run start:railway` (ya definido en `railway.json`).
3. Build command: usa `npm run build` (genera cliente Prisma).


### Deploy en Railway (recomendado)

1. Start command: `npm run start:railway`
2. Ejecuta migraciones como tarea separada: `npm run railway:migrate`
3. Para evitar errores con pooler (`prepared statement \"s0\" already exists`), usa `DATABASE_URL` de conexion directa para migraciones o configura `DIRECT_URL` en Railway y Prisma la usara en migraciones.

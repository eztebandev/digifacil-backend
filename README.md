# DigiFacil Backend

API de DigiFacil construida con Express.

## Requisitos

- Node.js 20 o superior

## Instalacion

```bash
npm install
```

## Variables de entorno

Crear un archivo `.env` a partir de `.env.example`.

Variables disponibles:

- `PORT`: puerto del servidor.
- `CLIENT_URL`: origen permitido para CORS.
- `JWT_SECRET`: secreto para firmar tokens.
- `ADMIN_EMAIL`: usuario administrador inicial.
- `ADMIN_PASSWORD`: password del administrador inicial.

## Desarrollo

```bash
npm run dev
```

La API queda disponible en `http://localhost:4000`.

## Produccion

```bash
npm start
```

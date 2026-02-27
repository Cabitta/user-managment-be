# user-management-be

API REST para gestión de usuarios con autenticación JWT y sistema de roles.

## Descripción

Backend desarrollado con Node.js y Express que permite:

- Registro y autenticación de usuarios con JWT
- CRUD completo de usuarios
- Sistema de roles: `admin` y `user`
- Respuestas JSON estandarizadas

## Stack Técnico

- **Runtime:** Node.js v20+
- **Framework:** Express.js
- **Base de datos:** MongoDB Atlas (Mongoose)
- **Autenticación:** JSON Web Tokens (jsonwebtoken)
- **Hashing:** bcryptjs

## Metodología

Desarrollado con **Spec-Driven Development (SDD)**. Ver [`docs/spec.md`](docs/spec.md) para la fuente de verdad del proyecto.

## Estructura del proyecto

```
src/
├── config/       # Conexión DB y Swagger
├── controllers/  # Lógica HTTP
├── services/     # Lógica de negocio
├── repositories/ # Queries a MongoDB
├── models/       # Schemas de Mongoose
├── dtos/         # Transformadores de datos
├── middlewares/  # Auth, errores
├── routes/       # Definición de URLs
└── validators/   # Validación de inputs
```

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores.

## Licencia

MIT

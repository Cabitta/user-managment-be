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

Copiá `.env.example` a `.env` y completá los valores (especialmente `MONGODB_URI` y `JWT_SECRET`).

## Cómo empezar

1.  **Instalar dependencias:**

    ```bash
    npm install
    ```

2.  **Configurar variables de entorno:**
    Asegurate de tener el archivo `.env` listo.

3.  **Iniciar el servidor:**
    - **Desarrollo (con auto-reload):** `npm run dev`
    - **Producción:** `npm start`

## Testing 🧪

Este proyecto utiliza **Jest** y **Supertest** para asegurar la calidad del código, siguiendo la metodología de desarrollo basada en especificaciones.

*   **Ejecutar todos los tests:**
    ```bash
    npm test
    ```
*   **Solo tests de integración:**
    ```bash
    npm run test:integration
    ```
*   **Reporte de cobertura (Coverage):**
    ```bash
    npm run test:coverage
    ```

> [!NOTE]
> Los tests de integración utilizan `mongodb-memory-server`, por lo que no requieren una base de datos externa configurada.

## Documentación API

Una vez levantado el backend, podés acceder a la documentación interactiva en:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

## Licencia

MIT

# Spec — API REST: Administrador de Usuarios

**Versión:** 1.2  
**Fecha:** 2026-02-26  
**Metodología:** Spec-Driven Development (SDD)

---

## 1. Descripción del Proyecto

Una API REST que permite gestionar usuarios de una aplicación. Soporta registro, autenticación y operaciones CRUD completas. Incluye un sistema de roles (admin / user) que controla qué operaciones puede ejecutar cada tipo de usuario.

**Objetivo principal:** Proveer un backend seguro, organizado y bien documentado que pueda ser consumido por cualquier cliente (web, mobile, Postman, etc.).

**Alcance de esta versión (v1.0):**

- Autenticación con JWT (registro, login, logout)
- CRUD completo de usuarios
- Sistema de roles: `admin` y `user`
- Respuestas JSON estandarizadas

---

## 2. Entidades y Modelos de Datos

### Entidad: `User`

| Campo       | Tipo     | Requerido | Descripción                                     |
| ----------- | -------- | --------- | ----------------------------------------------- |
| `_id`       | ObjectId | Auto      | ID único generado por MongoDB                   |
| `name`      | String   | Sí        | Nombre completo del usuario                     |
| `email`     | String   | Sí        | Email único, usado para login                   |
| `password`  | String   | Sí        | Hash bcrypt (nunca se devuelve en la respuesta) |
| `role`      | String   | Sí        | Enum: `"admin"` o `"user"`. Default: `"user"`   |
| `isActive`  | Boolean  | Sí        | Permite soft-delete. Default: `true`            |
| `createdAt` | Date     | Auto      | Timestamp de creación                           |
| `updatedAt` | Date     | Auto      | Timestamp de última actualización               |

**Reglas del modelo:**

- `email` debe ser único en la base de datos.
- `password` debe almacenarse siempre como hash (bcrypt, salt rounds: 10).
- `password` **nunca** se incluye en las respuestas de la API.
- `role` solo puede ser `"admin"` o `"user"`.
- Eliminar un usuario hace un **soft-delete** (`isActive: false`), no borra el documento.

---

## 3. Endpoints

### 3.1 Autenticación — `/api/auth`

| Método | Ruta                 | Descripción              | Auth requerida |
| ------ | -------------------- | ------------------------ | -------------- |
| POST   | `/api/auth/register` | Registrar nuevo usuario  | No             |
| POST   | `/api/auth/login`    | Login, devuelve JWT      | No             |
| POST   | `/api/auth/logout`   | Invalidar sesión         | Sí (JWT)       |
| GET    | `/api/auth/me`       | Obtener perfil propio    | Sí (JWT)       |
| PUT    | `/api/auth/me`       | Actualizar perfil propio | Sí (JWT)       |

---

#### `POST /api/auth/register`

**Request body:**

```json
{
  "name": "Ana García",
  "email": "ana@example.com",
  "password": "MiPassword123!"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Ana García",
    "email": "ana@example.com",
    "role": "user",
    "createdAt": "2026-02-26T10:00:00.000Z"
  }
}
```

**Nota:** El primer usuario registrado en el sistema recibirá automáticamente el rol `admin`.

---

#### `POST /api/auth/login`

**Request body:**

```json
{
  "email": "ana@example.com",
  "password": "MiPassword123!"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Ana García",
    "email": "ana@example.com",
    "role": "user"
  }
}
```

El JWT se incluye en la respuesta. El cliente lo guarda y lo envía en cada request posterior en el header `Authorization: Bearer <token>`.

---

#### `POST /api/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Sesión cerrada correctamente."
}
```

> **Nota de implementación:** JWT es stateless por naturaleza. El logout se implementa con una **blocklist en memoria** (o Redis en producción) que almacena los tokens invalidados hasta que expiran.

---

#### `GET /api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Ana García",
    "email": "ana@example.com",
    "role": "user",
    "createdAt": "2026-02-26T10:00:00.000Z"
  }
}
```

---

#### `PUT /api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Request body (opcionales):**

```json
{
  "name": "Ana G. López",
  "email": "ana.nueva@example.com",
  "password": "NuevoPassword123!"
}
```

> **Nota:** El usuario no puede cambiar su propio `role` ni `isActive` a través de este endpoint.

**Response `200 OK`:**

````json
{
  "success": true,
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Ana G. López",
    "email": "ana.nueva@example.com",
    "role": "user",
    "updatedAt": "2026-02-26T11:00:00.000Z"
  }
}

---

### 3.2 Usuarios — `/api/users`

| Método | Ruta             | Descripción               | Rol requerido |
| ------ | ---------------- | ------------------------- | ------------- |
| GET    | `/api/users`     | Listar todos los usuarios | `admin`       |
| GET    | `/api/users/:id` | Obtener usuario por ID    | `admin`       |
| PUT    | `/api/users/:id` | Actualizar usuario        | `admin`       |
| DELETE | `/api/users/:id` | Eliminar usuario (soft)   | `admin`       |

> Todos los endpoints de `/api/users` requieren JWT válido.

---

#### `GET /api/users`

**Headers:** `Authorization: Bearer <token>` (rol: admin)
**Query params opcionales:**

- `page` (default: `1`, mínimo: `1`)
- `limit` (default: `10`, mínimo: `1`, **máximo: `100`**)
- `role` — filtrar por rol: `admin` o `user`

> Si el cliente envía `limit` mayor a 100, el servidor lo recorta silenciosamente a 100.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "664f1a2b...",
      "name": "Ana García",
      "email": "ana@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2026-02-26T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 42, // Total de documentos en la DB que coinciden con el filtro
    "page": 1, // Página actual
    "limit": 10, // Documentos por página (máx. 100)
    "totalPages": 5 // Math.ceil(total / limit) — calculado por el servidor
  }
}
````

---

#### `GET /api/users/:id`

**Headers:** `Authorization: Bearer <token>` (admin o mismo usuario)

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "_id": "664f1a2b...",
    "name": "Ana García",
    "email": "ana@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2026-02-26T10:00:00.000Z",
    "updatedAt": "2026-02-26T10:00:00.000Z"
  }
}
```

---

#### `PUT /api/users/:id`

**Headers:** `Authorization: Bearer <token>` (admin o mismo usuario)

**Request body** (todos los campos son opcionales):

```json
{
  "name": "Ana García López",
  "email": "ana.nueva@example.com",
  "password": "NuevoPassword456!",
  "role": "admin"
}
```

> **Regla:** Solo un `admin` puede cambiar el campo `role`. Un `user` solo puede modificar su propio `name`, `email` y `password`.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "_id": "664f1a2b...",
    "name": "Ana García López",
    "email": "ana.nueva@example.com",
    "role": "user",
    "updatedAt": "2026-02-26T11:00:00.000Z"
  }
}
```

---

#### `DELETE /api/users/:id`

**Headers:** `Authorization: Bearer <token>` (rol: admin)

Realiza un **soft-delete**: establece `isActive: false`.

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Usuario desactivado correctamente."
}
```

---

## 4. Autenticación y Seguridad

**Mecanismo:** JSON Web Tokens (JWT) con algoritmo HS256.

| Parámetro       | Valor                            |
| --------------- | -------------------------------- |
| Librería        | `jsonwebtoken`                   |
| Expiración      | 24 horas (`expiresIn: "24h"`)    |
| Header esperado | `Authorization: Bearer <token>`  |
| Secret          | Variable de entorno `JWT_SECRET` |

**Payload del JWT:**

```json
{
  "id": "664f1a2b3c4d5e6f7a8b9c0d",
  "role": "user",
  "iat": 1709000000,
  "exp": 1709086400
}
```

**Middlewares de seguridad:**

- `authenticate` — verifica que el JWT sea válido y no esté en la blocklist.
- `authorize(...roles)` — verifica que el rol del usuario esté permitido para la ruta.

---

## 5. Reglas de Negocio

1. El **primer usuario registrado** obtiene el rol `admin` automáticamente. Los siguientes reciben `user` por defecto.
2. Un usuario **no puede eliminarse a sí mismo**, incluso si es admin.
3. El **único admin** no puede ser degradado a `user` si no existe al menos otro admin activo.
4. Solo se listan usuarios con `isActive: true` en `GET /api/users` (a menos que el admin use filtro explícito — fuera del alcance de v1.0).
5. Si se intenta login con un usuario inactivo (`isActive: false`), se devuelve error `403 Forbidden`.
6. Las **contraseñas** deben tener mínimo 8 caracteres, al menos una letra mayúscula, una minúscula y un número.

---

## 6. Formato de Errores y Códigos HTTP

Todas las respuestas de error siguen este formato estándar:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo email es requerido."
  }
}
```

### Tabla de errores principales

| Código HTTP | `error.code`            | Situación                                |
| ----------- | ----------------------- | ---------------------------------------- |
| 400         | `VALIDATION_ERROR`      | Body inválido o campos faltantes         |
| 401         | `UNAUTHORIZED`          | JWT ausente, inválido o expirado         |
| 403         | `FORBIDDEN`             | JWT válido pero sin permisos suficientes |
| 404         | `NOT_FOUND`             | Usuario no encontrado                    |
| 409         | `CONFLICT`              | Email ya registrado                      |
| 500         | `INTERNAL_SERVER_ERROR` | Error inesperado del servidor            |

---

## 7. Arquitectura y Responsabilidades por Capa

La API sigue una **Layered Architecture** con Service Layer, Repository Pattern y DTOs. Las dependencias fluyen siempre hacia abajo: cada capa solo conoce a la capa inmediatamente inferior.

```
Request HTTP
     ↓
  routes/          → Define URLs y encadena middlewares + controller
     ↓
  middlewares/     → Autenticación, autorización, validación de body
     ↓
  controllers/     → Parsea request, aplica InputDTO, llama al service, aplica ResponseDTO
     ↓
  services/        → Lógica de negocio pura y orquestación
     ↓
  repositories/    → Queries, filtros y paginación contra MongoDB
     ↓
  models/          → Schema y definición de estructura del documento
     ↓
  MongoDB
```

**DTOs** son transversales: no pertenecen a una capa específica sino que definen los contratos entre ellas.

| Capa       | Responsabilidad                                          | Conoce         | No conoce                   |
| ---------- | -------------------------------------------------------- | -------------- | --------------------------- |
| Controller | HTTP: leer request, escribir response JSON               | Express        | Mongoose, reglas de negocio |
| Service    | Reglas de negocio, validaciones de dominio, orquestación | Repository     | Express, Mongoose           |
| Repository | Queries, filtros, paginación                             | Model/Mongoose | Express, reglas de negocio  |
| Model      | Schema, tipos, validaciones de estructura                | Mongoose       | Todo lo demás               |
| DTO        | Transformar objetos entre capas (entrada y salida)       | —              | —                           |

---

## 8. Stack Técnico

| Categoría            | Tecnología / Librería    | Propósito                                 |
| -------------------- | ------------------------ | ----------------------------------------- |
| Runtime              | Node.js (v20+)           | Entorno de ejecución                      |
| Framework            | Express.js               | Servidor HTTP y routing                   |
| Base de datos        | MongoDB Atlas            | Almacenamiento en la nube (free tier)     |
| ODM                  | Mongoose                 | Modelado y validación de documentos       |
| Autenticación        | jsonwebtoken             | Generación y verificación de JWT          |
| Hashing              | bcryptjs                 | Hash de contraseñas                       |
| Validación           | express-validator        | Validación de request bodies              |
| Variables de env     | dotenv                   | Gestión de secretos y configuración       |
| Seguridad HTTP       | helmet                   | Headers de seguridad automáticos          |
| Rate limiting        | express-rate-limit       | Límite de requests por IP (login)         |
| CORS                 | cors                     | Control de acceso desde dominios          |
| Async errors         | express-async-errors     | Captura errores en controllers async      |
| Logging              | morgan                   | Log de requests HTTP en consola           |
| Documentación        | swagger-ui-express       | Interfaz visual Swagger en `/api/docs`    |
| Documentación        | swagger-jsdoc            | Genera spec OpenAPI desde JSDoc           |
| Dev tooling          | nodemon                  | Auto-reload en desarrollo                 |
| HTTP testing         | Postman / Thunder Client | Pruebas manuales de la API                |
| Control de versiones | Git + GitHub             | Historial de cambios y repositorio remoto |

---

## 9. Estructura de Carpetas

```
user-management-api/
├── src/
│   ├── config/
│   │   ├── db.js              # Conexión a MongoDB
│   │   └── swagger.js         # Configuración de swagger-jsdoc
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   ├── services/
│   │   ├── auth.service.js    # Lógica de negocio de autenticación
│   │   └── user.service.js    # Lógica de negocio de usuarios
│   ├── repositories/
│   │   └── user.repository.js # Queries y acceso a MongoDB
│   ├── dtos/
│   │   └── user.dto.js        # Transformaciones de entrada y salida
│   ├── middlewares/
│   │   ├── authenticate.js    # Verificar JWT
│   │   ├── authorize.js       # Verificar rol
│   │   └── errorHandler.js    # Manejo global de errores
│   ├── models/
│   │   └── user.model.js      # Schema de Mongoose
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── user.routes.js
│   ├── validators/
│   │   ├── auth.validators.js
│   │   └── user.validators.js
│   └── app.js                 # Setup de Express (sin listen)
├── .env                       # Variables de entorno (no en git)
├── .env.example               # Plantilla de variables (sí en git)
├── .gitignore
├── package.json
└── server.js                  # Entry point (listen)
```

---

## 10. Variables de Entorno

Archivo `.env.example`:

```
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/userdb
JWT_SECRET=un_secreto_muy_largo_y_aleatorio
NODE_ENV=development
```

---

## 11. Plan de Implementación (Orden de Construcción)

El proyecto se construye en fases. **No se avanza a la siguiente fase hasta que la actual funciona correctamente.**

| Fase | Tarea                                                                                                        | Entregable verificable                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1    | Crear repositorio en GitHub, `git init` local, primer commit con README                                      | Repositorio visible en GitHub                                                |
| 2    | Setup del proyecto: `npm init`, instalar dependencias, configurar `.env` y `app.js` con helmet, cors, morgan | `node server.js` responde en `localhost:3000`, commit "chore: project setup" |
| 3    | Conexión a MongoDB con Mongoose                                                                              | Log "DB conectada" al iniciar, commit                                        |
| 4    | Modelo `User` con schema de Mongoose                                                                         | Schema con todas las validaciones, commit                                    |
| 5    | DTO de usuario (`toResponseDTO`, `toInternalDTO`)                                                            | Funciones de transformación listas, commit                                   |
| 6    | Repository: `findAll`, `findById`, `findByEmail`, `create`, `update`, `softDelete`                           | Operaciones contra MongoDB funcionando, commit                               |
| 7    | Middleware `errorHandler` global + `express-async-errors`                                                    | Errores inesperados devuelven JSON estándar, commit                          |
| 8    | Service + Controller + endpoint `POST /api/auth/register`                                                    | Se crea usuario en MongoDB, password hasheado, commit                        |
| 9    | Service + Controller + endpoint `POST /api/auth/login`                                                       | Devuelve JWT válido, commit                                                  |
| 10   | Middleware `authenticate`                                                                                    | Rutas protegidas rechazan requests sin JWT, commit                           |
| 11   | Middleware `authorize`                                                                                       | Rutas admin rechazan usuarios con rol `user`, commit                         |
| 12   | Service + Controller + endpoint `POST /api/auth/logout`                                                      | Token queda invalidado en blocklist, commit                                  |
| 13   | Service + Controller + endpoint `GET /api/users` (con paginación)                                            | Lista usuarios con paginación correcta, commit                               |
| 14   | Service + Controller + endpoint `GET/PUT /api/auth/me`                                                       | Ver y editar perfil propio, commit                                           |
| 15   | Service + Controller + endpoint `GET /api/users/:id`                                                         | Devuelve cualquier usuario (solo admin), commit                              |
| 16   | Service + Controller + endpoint `PUT /api/users/:id`                                                         | Actualiza usuario (solo admin), commit                                       |
| 17   | Service + Controller + endpoint `DELETE /api/users/:id`                                                      | Soft-delete (solo admin), commit                                             |
| 18   | Validadores con `express-validator` en todos los endpoints                                                   | Requests inválidos devuelven 400 con detalle, commit                         |
| 19   | Configurar Swagger (`swagger-jsdoc` + `swagger-ui-express`)                                                  | Documentación visible en `GET /api/docs`, commit                             |
| 20   | Pruebas manuales completas en Postman                                                                        | Todos los endpoints funcionan según el spec                                  |

**Convención de commits (simplificada):**

- `feat:` — nueva funcionalidad (endpoint, middleware, modelo)
- `fix:` — corrección de bug
- `chore:` — configuración, dependencias, setup
- `docs:` — cambios en documentación o Swagger

---

## 12. Decisiones Diferidas (fuera del alcance v1.0)

Estas decisiones se tomarán cuando el proyecto evolucione a producción:

- **Plataforma de deploy** (Railway, Render, Fly.io, etc.)
- **Refresh tokens** — para sesiones de larga duración sin re-login
- **Logging estructurado** — con Winston o Pino (reemplaza morgan)
- **Tests automatizados** — Jest + Supertest
- **Filtro de usuarios inactivos** — exponer o no vía query params
- **Blocklist en Redis** — reemplaza la blocklist en memoria para producción

---

_Documento generado como parte del proceso SDD. Ninguna línea de código se escribe antes de que este spec esté acordado._

# Spec — Testing: Backend

**Versión:** 1.0
**Fecha:** 2026-03-19
**Metodología:** Spec-Driven Development (SDD)
**Repositorio:** `user-management-api`
**Referencia:** `docs/spec-backend.md`

---

## 1. Descripción

Este documento define la estrategia de testing del backend. Cubre los tests unitarios de la capa de services, los tests de integración de todos los endpoints, y la configuración de cobertura de código.

**Principio general:** cada test verifica una sola cosa. Un test que falla debe indicar exactamente qué rompió, sin ambigüedad.

---

## 2. Stack de Testing

| Herramienta           | Propósito                                                 |
| --------------------- | --------------------------------------------------------- |
| Jest                  | Framework de testing: correr tests, assertions, mocks     |
| Supertest             | Hacer requests HTTP reales contra la app Express          |
| mongodb-memory-server | Instancia de MongoDB en memoria para tests de integración |

---

## 3. Estructura de Carpetas

```
user-management-api/
├── src/
├── tests/
│   ├── unit/
│   │   ├── auth.service.test.js
│   │   └── user.service.test.js
│   ├── integration/
│   │   ├── auth.routes.test.js
│   │   └── user.routes.test.js
│   └── helpers/
│       ├── db.js          # Setup y teardown de mongodb-memory-server
│       └── factories.js   # Funciones para crear datos de prueba
├── jest.config.js
└── .env.test
```

---

## 4. Configuración

### Variables de entorno para testing

Archivo `.env.test`:

```
NODE_ENV=test
JWT_SECRET=test_secret_key
PORT=3001
# MONGODB_URI no se define aquí — mongodb-memory-server genera la URI automáticamente
```

### Umbral mínimo de cobertura

Los tests deben mantener un mínimo de **80%** en todas las métricas. Si el coverage cae por debajo, Jest falla el build.

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80
  }
}
```

### Carpetas excluidas del coverage

No se mide coverage de:

- `src/config/` — configuración, sin lógica testeable
- `src/models/` — schemas de Mongoose, testeados indirectamente
- `src/dtos/` — transformaciones simples sin lógica de negocio
- `src/validators/` — validaciones testeadas en integración
- `server.js` — entry point

---

## 5. Helpers

### `tests/helpers/db.js`

Maneja el ciclo de vida de `mongodb-memory-server`:

- `connect()` — levanta la instancia y conecta Mongoose antes de los tests
- `clearDatabase()` — limpia todas las colecciones entre tests
- `disconnect()` — destruye la instancia al terminar

### `tests/helpers/factories.js`

Funciones que crean datos de prueba consistentes:

- `createUser(overrides)` — crea un usuario en la DB con datos por defecto, acepta overrides
- `createAdmin(overrides)` — igual pero con `role: 'admin'`
- `generateToken(user)` — genera un JWT válido para un usuario dado

---

## 6. Tests Unitarios — Services

Los services se testean de forma **completamente aislada**. Todas las dependencias externas (repositories, bcrypt, jwt) se reemplazan con mocks de Jest. No hay base de datos involucrada.

### 6.1 AuthService

**Archivo:** `tests/unit/auth.service.test.js`

#### `register(userData)`

| Caso | Tipo     | Descripción                | Resultado esperado          |
| ---- | -------- | -------------------------- | --------------------------- |
| 1    | ✅ Happy | Primer usuario registrado  | Se crea con `role: 'admin'` |
| 2    | ✅ Happy | Segundo usuario registrado | Se crea con `role: 'user'`  |

#### `login({ email, password })`

| Caso | Tipo     | Descripción                          | Resultado esperado                     |
| ---- | -------- | ------------------------------------ | -------------------------------------- |
| 3    | ✅ Happy | Credenciales correctas               | Devuelve token JWT y datos del usuario |
| 4    | ❌ Sad   | Email no existe                      | Lanza error `UNAUTHORIZED`             |
| 5    | ❌ Sad   | Password incorrecta                  | Lanza error `UNAUTHORIZED`             |
| 6    | ❌ Sad   | Usuario inactivo (`isActive: false`) | Lanza error `FORBIDDEN`                |

#### `logout(token)`

| Caso | Tipo     | Descripción  | Resultado esperado                             |
| ---- | -------- | ------------ | ---------------------------------------------- |
| 7    | ✅ Happy | Token válido | Agrega el token a la blocklist y devuelve true |

#### `getMe(userId)`

| Caso | Tipo     | Descripción                | Resultado esperado                      |
| ---- | -------- | -------------------------- | --------------------------------------- |
| 8    | ✅ Happy | ID válido y usuario activo | Devuelve datos del usuario sin password |
| 9    | ❌ Sad   | ID no existe o usuario inactivo| Lanza error `NOT_FOUND`                 |

#### `updateMe(userId, updateData)`

| Caso | Tipo     | Descripción                           | Resultado esperado                    |
| ---- | -------- | ------------------------------------- | ------------------------------------- |
| 10   | ✅ Happy | Actualiza name                        | Devuelve usuario con name actualizado |
| 11   | ✅ Happy | Actualiza password                    | Password se guarda hasheada           |
| 12   | ❌ Sad   | Ningún campo válido proporcionado     | Lanza error `VALIDATION_ERROR`        |
| 13   | ❌ Sad   | Intenta cambiar `role`                | El campo `role` es ignorado           |
| 14   | ❌ Sad   | Usuario no encontrado en DB           | Lanza error `NOT_FOUND`               |

#### `deleteMe(userId)`

| Caso | Tipo     | Descripción                                            | Resultado esperado        |
| ---- | -------- | ------------------------------------------------------ | ------------------------- |
| 15   | ✅ Happy | Usuario con rol `user` se elimina a sí mismo           | `isActive` pasa a `false` |
| 16   | ✅ Happy | Admin se elimina a sí mismo habiendo otro admin activo | `isActive` pasa a `false` |
| 17   | ❌ Sad   | Último admin activo intenta eliminarse                 | Lanza error `BAD_REQUEST` |

---

### 6.2 UserService

**Archivo:** `tests/unit/user.service.test.js`

#### `getAllUsers(filters)`

| Caso | Tipo     | Descripción         | Resultado esperado                   |
| ---- | -------- | ------------------- | ------------------------------------ |
| 1    | ✅ Happy | Sin filtros         | Devuelve lista paginada con metadata |
| 2    | ✅ Happy | Con `role: 'admin'` | Devuelve solo admins                 |
| 3    | ✅ Happy | Con `search: 'ana'` | Filtra por nombre y email            |
| 4    | ✅ Happy | `limit` mayor a 100 | Se recorta silenciosamente a 100     |

#### `getUserById(id)`

| Caso | Tipo     | Descripción  | Resultado esperado            |
| ---- | -------- | ------------ | ----------------------------- |
| 5    | ✅ Happy | ID válido    | Devuelve usuario sin password |
| 6    | ❌ Sad   | ID no existe | Lanza error `NOT_FOUND`       |

#### `updateUser(id, updateData)`

| Caso | Tipo     | Descripción                         | Resultado esperado             |
| ---- | -------- | ----------------------------------- | ------------------------------ |
| 7    | ✅ Happy | Admin actualiza cualquier campo     | Actualización completa         |
| 8    | ✅ Happy | Admin cambia `role` de user a admin | Role actualizado               |
| 9    | ❌ Sad   | Ningún campo válido proporcionado   | Lanza error `VALIDATION_ERROR` |
| 10   | ❌ Sad   | Usuario no encontrado               | Lanza error `NOT_FOUND`        |

#### `deleteUser(id)`

| Caso | Tipo     | Descripción                            | Resultado esperado        |
| ---- | -------- | -------------------------------------- | ------------------------- |
| 11   | ✅ Happy | Admin elimina a otro usuario           | `isActive` pasa a `false` |
| 12   | ❌ Sad   | ID no existe                           | Lanza error `NOT_FOUND`   |
| 13   | ❌ Sad   | Último admin activo intenta eliminarse | Lanza error `BAD_REQUEST` |

---

## 7. Tests de Integración — Endpoints

Los tests de integración usan `mongodb-memory-server` y Supertest. Arrancan la app Express real, hacen requests HTTP reales, y verifican las respuestas completas incluyendo status code, headers y body JSON.

Cada suite limpia la base de datos antes de cada test con `clearDatabase()`.

### 7.1 Auth Routes

**Archivo:** `tests/integration/auth.routes.test.js`

#### `POST /api/auth/register`

| Caso | Tipo     | Input                         | Status | Response                                                  |
| ---- | -------- | ----------------------------- | ------ | --------------------------------------------------------- |
| 1    | ✅ Happy | Body válido, primer usuario   | 201    | `success: true`, user con `role: 'admin'`, sin `password` |
| 2    | ✅ Happy | Body válido, segundo usuario  | 201    | `success: true`, user con `role: 'user'`                  |
| 3    | ❌ Sad   | Email duplicado               | 409    | `success: false`, `error.code: 'CONFLICT'`                |
| 4    | ❌ Sad   | Nombre faltante o vacío       | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'`        |
| 5    | ❌ Sad   | Nombre corto (< 2) o largo    | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'`        |
| 6    | ❌ Sad   | Email faltante                | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'`        |
| 7    | ❌ Sad   | Email inválido                | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'`        |
| 8    | ❌ Sad   | Password faltante             | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'`        |
| 9    | ❌ Sad   | Password menor a 8 caracteres | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'`        |
| 10   | ❌ Sad   | Password sin minúscula        | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'`        |
| 11   | ❌ Sad   | Password sin mayúscula        | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'`        |
| 12   | ❌ Sad   | Password sin número           | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'`        |

#### `POST /api/auth/login`

| Caso | Tipo     | Input                  | Status | Response                                           |
| ---- | -------- | ---------------------- | ------ | -------------------------------------------------- |
| 13   | ✅ Happy | Credenciales correctas | 200    | `success: true`, `token` presente, sin `password`  |
| 14   | ❌ Sad   | Email no registrado    | 401    | `success: false`, `error.code: 'UNAUTHORIZED'`     |
| 15   | ❌ Sad   | Password incorrecta    | 401    | `success: false`, `error.code: 'UNAUTHORIZED'`     |
| 16   | ❌ Sad   | Usuario inactivo       | 403    | `success: false`, `error.code: 'FORBIDDEN'`        |
| 17   | ❌ Sad   | Email faltante         | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |
| 18   | ❌ Sad   | Email inválido         | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |
| 19   | ❌ Sad   | Password faltante      | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |

#### `POST /api/auth/logout`

| Caso | Tipo     | Input                           | Status | Response                                       |
| ---- | -------- | ------------------------------- | ------ | ---------------------------------------------- |
| 20   | ✅ Happy | Token válido                    | 200    | `success: true`                                |
| 21   | ❌ Sad   | Sin token                       | 401    | `success: false`, `error.code: 'UNAUTHORIZED'` |
| 22   | ❌ Sad   | Token ya invalidado (blocklist) | 401    | `success: false`, `error.code: 'UNAUTHORIZED'` |

#### `GET /api/auth/me`

| Caso | Tipo     | Input          | Status | Response                                          |
| ---- | -------- | -------------- | ------ | ------------------------------------------------- |
| 23   | ✅ Happy | Token válido   | 200    | `success: true`, datos del usuario sin `password` |
| 24   | ❌ Sad   | Sin token      | 401    | `success: false`, `error.code: 'UNAUTHORIZED'`    |
| 25   | ❌ Sad   | Token expirado | 401    | `success: false`, `error.code: 'UNAUTHORIZED'`    |

#### `PUT /api/auth/me`

| Caso | Tipo     | Input                         | Status | Response                                           |
| ---- | -------- | ----------------------------- | ------ | -------------------------------------------------- |
| 26   | ✅ Happy | Actualiza name                | 200    | `success: true`, name actualizado                  |
| 27   | ✅ Happy | Actualiza password            | 200    | `success: true`, nueva password funciona en login  |
| 28   | ❌ Sad   | Sin campos válidos            | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |
| 29   | ❌ Sad   | Nombre corto (< 2) o largo    | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |
| 30   | ❌ Sad   | Email inválido                | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |
| 31   | ❌ Sad   | Password menor a 8 caracteres | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |
| 32   | ❌ Sad   | Password sin minúscula        | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |
| 33   | ❌ Sad   | Password sin mayúscula        | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |
| 34   | ❌ Sad   | Password sin número           | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |
| 35   | ❌ Sad   | Email ya usado por otro       | 409    | `success: false`, `error.code: 'CONFLICT'`         |
| 36   | ❌ Sad   | Sin token                     | 401    | `success: false`, `error.code: 'UNAUTHORIZED'`     |
| 37   | ❌ Sad   | Intenta cambiar `role`        | 200    | `role` no cambia en la respuesta                   |
| 38   | ❌ Sad   | Usuario no encontrado DB      | 404    | `success: false`, `error.code: 'NOT_FOUND'`        |

#### `DELETE /api/auth/me`

| Caso | Tipo     | Input                                       | Status | Response                                       |
| ---- | -------- | ------------------------------------------- | ------ | ---------------------------------------------- |
| 39   | ✅ Happy | Usuario `user` se elimina a sí mismo        | 200    | `success: true`, mensaje de confirmación       |
| 40   | ✅ Happy | Admin se elimina habiendo otro admin activo | 200    | `success: true`, mensaje de confirmación       |
| 41   | ❌ Sad   | Último admin activo intenta eliminarse      | 400    | `success: false`, `error.code: 'BAD_REQUEST'`  |
| 42   | ❌ Sad   | Sin token                                   | 401    | `success: false`, `error.code: 'UNAUTHORIZED'` |

---

### 7.2 User Routes

**Archivo:** `tests/integration/user.routes.test.js`

#### `GET /api/users`

| Caso | Tipo     | Input                      | Status | Response                                       |
| ---- | -------- | -------------------------- | ------ | ---------------------------------------------- |
| 1    | ✅ Happy | Token admin, sin filtros   | 200    | Lista paginada con `pagination` metadata       |
| 2    | ✅ Happy | Token admin, `?role=admin` | 200    | Solo usuarios con `role: 'admin'`              |
| 3    | ✅ Happy | Token admin, `?search=ana` | 200    | Usuarios cuyo nombre o email contiene "ana"    |
| 4    | ✅ Happy | Token admin, `?limit=200`  | 200    | `pagination.limit` es 100 (recortado)          |
| 5    | ❌ Sad   | Token user (no admin)      | 403    | `success: false`, `error.code: 'FORBIDDEN'`    |
| 6    | ❌ Sad   | Sin token                  | 401    | `success: false`, `error.code: 'UNAUTHORIZED'` |

#### `GET /api/users/:id`

| Caso | Tipo     | Input                       | Status | Response                                       |
| ---- | -------- | --------------------------- | ------ | ---------------------------------------------- |
| 7    | ✅ Happy | Token admin, ID válido      | 200    | Datos del usuario sin `password`               |
| 8    | ❌ Sad   | Token admin, ID inexistente | 404    | `success: false`, `error.code: 'NOT_FOUND'`    |
| 9    | ❌ Sad   | Token user (no admin)       | 403    | `success: false`, `error.code: 'FORBIDDEN'`    |
| 10   | ❌ Sad   | Sin token                   | 401    | `success: false`, `error.code: 'UNAUTHORIZED'` |

#### `PUT /api/users/:id`

| Caso | Tipo     | Input                                | Status | Response                                           |
| ---- | -------- | ------------------------------------ | ------ | -------------------------------------------------- |
| 11   | ✅ Happy | Admin actualiza name de otro usuario | 200    | `success: true`, name actualizado                  |
| 12   | ✅ Happy | Admin cambia role de user a admin    | 200    | `role: 'admin'` en la respuesta                    |
| 13   | ❌ Sad   | Sin campos válidos                   | 400    | `success: false`, `error.code: 'VALIDATION_ERROR'` |
| 14   | ❌ Sad   | Email ya usado por otro usuario      | 409    | `success: false`, `error.code: 'CONFLICT'`         |
| 15   | ❌ Sad   | Token user (no admin)                | 403    | `success: false`, `error.code: 'FORBIDDEN'`        |
| 16   | ❌ Sad   | ID inexistente (DB)                  | 404    | `success: false`, `error.code: 'NOT_FOUND'`        |

#### `DELETE /api/users/:id`

| Caso | Tipo     | Input                                  | Status | Response                                       |
| ---- | -------- | -------------------------------------- | ------ | ---------------------------------------------- |
| 16   | ✅ Happy | Admin elimina a otro usuario           | 200    | `success: true`, mensaje de confirmación       |
| 17   | ❌ Sad   | ID inexistente                         | 404    | `success: false`, `error.code: 'NOT_FOUND'`    |
| 18   | ❌ Sad   | Último admin activo intenta eliminarse | 400    | `success: false`, `error.code: 'BAD_REQUEST'`  |
| 19   | ❌ Sad   | Token user (no admin)                  | 403    | `success: false`, `error.code: 'FORBIDDEN'`    |
| 20   | ❌ Sad   | Sin token                              | 401    | `success: false`, `error.code: 'UNAUTHORIZED'` |

---

## 8. Resumen de casos de test

| Suite       | Tests unitarios | Tests de integración | Total  |
| ----------- | --------------- | -------------------- | ------ |
| AuthService | 17              | —                    | 17     |
| UserService | 13              | —                    | 13     |
| Auth Routes | —               | 42                   | 42     |
| User Routes | —               | 20                   | 20     |
| **Total**   | **30**          | **62**               | **92** |

---

## 9. Scripts

```json
"scripts": {
  "test": "jest",
  "test:unit": "jest tests/unit",
  "test:integration": "jest tests/integration",
  "test:coverage": "jest --coverage",
  "test:watch": "jest --watch"
}
```

---

## 10. Plan de Implementación

| Fase | Tarea                                                                                       | Entregable verificable                           |
| ---- | ------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1    | Instalar Jest, Supertest y mongodb-memory-server. Configurar `jest.config.js` y `.env.test` | `npm test` corre sin errores (0 tests)           |
| 2    | Crear helpers `db.js` y `factories.js`                                                      | Helpers importables sin errores                  |
| 3    | Tests unitarios de `AuthService` (17 tests)                                                 | 17 tests pasan, commit                           |
| 4    | Tests unitarios de `UserService` (13 tests)                                                 | 13 tests pasan, commit                           |
| 5    | Tests de integración de `auth.routes` (42 tests)                                            | 42 tests pasan, commit                           |
| 6    | Tests de integración de `user.routes` (20 tests)                                            | 20 tests pasan, commit                           |
| 7    | Configurar coverage y verificar umbral del 80%                                              | `npm run test:coverage` pasa sin errores, commit |

---

## 11. Convención de Commits

Esta convención extiende la definida en `docs/spec-backend.md` agregando el prefijo `test:`.

| Prefijo  | Cuándo usarlo                                                        |
| -------- | -------------------------------------------------------------------- |
| `chore:` | Configuración de Jest, instalación de dependencias, setup de helpers |
| `test:`  | Agregar o modificar tests (unitarios o de integración)               |
| `fix:`   | Corregir un test que estaba mal planteado                            |

**Ejemplos concretos para este proyecto:**

```bash
git commit -m "chore: setup Jest, Supertest y mongodb-memory-server"
git commit -m "chore: add helpers db.js y factories.js"
git commit -m "test: unit tests AuthService"
git commit -m "test: unit tests UserService"
git commit -m "test: integration tests auth.routes"
git commit -m "test: integration tests user.routes"
git commit -m "chore: configure coverage threshold 80%"
```

---

_Este spec referencia `docs/spec-backend.md` como fuente de verdad de endpoints, reglas de negocio y formato de errores._

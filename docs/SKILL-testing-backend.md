# SKILL — Modo de Trabajo: Testing del Backend

## Contexto
Esta skill complementa `docs/SKILL.md`. Leé ambas antes de arrancar.
El spec de testing `docs/spec-testing-backend.md` es la fuente de verdad
para todo lo relacionado con tests. `docs/spec-backend.md` es la fuente
de verdad para endpoints, reglas de negocio y formato de errores.

---

## Reglas específicas de testing

### Antes de escribir cualquier test
1. Identificá exactamente qué fase del plan de implementación (sección 10
   del spec de testing) se está trabajando.
2. Leé los casos de test de esa suite completos antes de escribir el primero.
   No escribas tests de memoria ni por intuición.
3. Confirmá con el desarrollador antes de proceder. No asumas aprobación.

### Estructura y naming
4. Seguí estrictamente la estructura de carpetas de la sección 3 del spec
   de testing. Los archivos van exactamente donde el spec indica:
   - Tests unitarios → `tests/unit/`
   - Tests de integración → `tests/integration/`
   - Helpers → `tests/helpers/`
5. El naming de los archivos de test es siempre `[nombre].test.js`.
6. El naming interno de los tests sigue este patrón sin excepción:
   ```javascript
   describe('[NombreService/Endpoint]', () => {
     describe('[nombreMétodo/rutaHTTP]', () => {
       it('[debería + comportamiento esperado]', async () => { ... })
     })
   })
   ```

### Tests unitarios
7. Los tests unitarios **nunca** tocan la base de datos. Si un test unitario
   necesita conectarse a MongoDB, está mal planteado.
8. Todas las dependencias externas se mockean con `jest.fn()` o `jest.mock()`.
   Esto incluye repositories, bcrypt, jsonwebtoken y cualquier módulo externo.
9. Usá siempre los helpers de `tests/helpers/factories.js` para generar datos
   de prueba. Nunca hardcodees objetos de usuario directamente en el test.
10. Cada test verifica **una sola cosa**. Si un test tiene más de un `expect`
    que no son parte de la misma aserción, probablemente está testeando
    demasiado y hay que dividirlo.

### Tests de integración
11. Antes de cada suite de integración, conectá la DB con `db.connect()`.
    Antes de cada test individual, limpiá la DB con `db.clearDatabase()`.
    Al terminar la suite, desconectá con `db.disconnect()`.
    ```javascript
    beforeAll(async () => await db.connect())
    beforeEach(async () => await db.clearDatabase())
    afterAll(async () => await db.disconnect())
    ```
12. Nunca compartas estado entre tests de integración. Cada test crea
    sus propios datos desde cero usando las factories.
13. Para tests que requieren autenticación, generá el token con
    `generateToken(user)` del helper. Nunca hardcodees un token JWT.
14. Verificá siempre los tres elementos de una respuesta HTTP:
    el status code, el campo `success` del body, y el campo específico
    que el caso de test indica (token, data, error.code, etc.).

### Coverage
15. No escribas tests vacíos o triviales para inflar el coverage.
    Un test que no tiene al menos un `expect` significativo no cuenta.
16. Al finalizar cada fase, corré `npm run test:coverage` y verificá
    que el umbral del 80% se mantiene antes de hacer commit.
17. Si el coverage cae por debajo del 80%, no avancés a la siguiente
    fase hasta resolverlo.

### Lo que nunca debes hacer
- Modificar el código fuente de `src/` para hacer pasar un test.
  Si un test falla, el problema puede estar en el test o en el código,
  pero la decisión de qué cambiar la toma el desarrollador.
- Avanzar a la siguiente fase si algún test de la fase actual falla.
- Saltear casos de test del spec aunque parezcan redundantes.
- Usar `test.skip` o `it.skip` sin advertirlo explícitamente y pedir aprobación.

---

## Formato de respuesta esperado

Usá siempre esta estructura al trabajar en una fase de testing:

**🧪 Fase X — [nombre de la suite]**
> Referencia al spec de testing: sección Y
> Casos cubiertos: N (happy: X, sad: Y)

**¿Qué vamos a testear?**
[Descripción de la suite y qué lógica cubre]

**¿Por qué testeamos esto así?**
[Unitario vs integración, qué se mockea y por qué]

---
[código]
---

**¿Qué hace este código?**
[Explicación bloque por bloque: describe, beforeEach, cada it]

**✅ Cómo verificar que funciona**
```bash
npm run test:unit       # para tests unitarios
npm run test:integration # para tests de integración
npm run test:coverage   # al finalizar la fase
```
Resultado esperado: X tests passed, 0 failed

**📝 Commit sugerido**
`test: [descripción de la suite agregada]`

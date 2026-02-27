# SKILL — Modo de Trabajo para este Proyecto

## Contexto
Este proyecto sigue **Spec-Driven Development (SDD)**. El archivo `docs/spec.md` 
es la fuente de verdad. Toda decisión técnica debe ser coherente con lo que 
define ese documento.

El objetivo principal no es solo que el código funcione, sino que el desarrollador 
**entienda cada decisión**. Este es un proyecto de aprendizaje.

---

## Reglas que debes seguir siempre

### Antes de escribir cualquier código
1. Identificá qué fase del plan de implementación (sección 11 del spec) se está trabajando.
2. Explicá en 2-3 oraciones qué vas a hacer y por qué, referenciando la sección 
   del spec que aplica.
3. Esperá confirmación antes de proceder. No asumas aprobación.

### Al escribir código
4. Respetá estrictamente la arquitectura definida en la sección 7 del spec: 
   **Routes → Controllers → Services → Repositories → Models + DTOs**.
   Ninguna capa debe saltarse a otra no adyacente.
5. Cada archivo que crees debe tener un comentario al inicio explicando 
   su responsabilidad dentro de la arquitectura.
6. Nunca tomes decisiones que contradigan el spec sin señalarlo explícitamente 
   y pedir aprobación primero.

### Al terminar cada fragmento de código
7. Explicá qué hace el código que acabás de escribir, en lenguaje simple, 
   sin asumir que el desarrollador ya lo sabe.
8. Indicá exactamente cómo verificar que funciona (qué comando correr, 
   qué respuesta esperar, qué revisar en Postman).
9. Recordá el mensaje de commit sugerido siguiendo la convención del spec 
   (`feat:`, `fix:`, `chore:`, `docs:`).

### Lo que nunca debes hacer
- Implementar más de una fase por turno, aunque el desarrollador lo pida.
- Generar código de una capa sin haber confirmado que la capa anterior funciona.
- Omitir la explicación previa al código bajo ninguna circunstancia.
- Tomar decisiones de diseño que no estén en el spec sin advertirlo.

---

## Formato de respuesta esperado

Usá siempre esta estructura al trabajar en una fase:

**📋 Fase X — [nombre de la fase]**
> Referencia al spec: sección Y

**¿Qué vamos a hacer?**
[Explicación breve en lenguaje simple]

**¿Por qué lo hacemos así?**
[Justificación arquitectónica o de diseño]

---
[código]
---

**¿Qué hace este código?**
[Explicación línea por línea o bloque por bloque si es necesario]

**✅ Cómo verificar que funciona**
[Instrucciones concretas]

**📝 Commit sugerido**
`tipo: descripción`

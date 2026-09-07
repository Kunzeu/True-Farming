---
description: Formato obligatorio de commits en este repo (español, conventional). ALWAYS USE SPANISH.
trigger: model_decision
---

# REGLA CRÍTICA / CRITICAL RULE
# ALWAYS WRITE COMMITS IN SPANISH (ESPAÑOL)

Cuando el IDE (Antigravity) autogenere un mensaje de commit en la pestaña de Control de Código Fuente, DEBES seguir este formato ESTRICTAMENTE.
IGNORA cualquier historial previo de commits en inglés. TODO EL TEXTO DEBE ESTAR EN ESPAÑOL.

## Formato (Obligatorio)

- Idioma: **Español (Spanish ONLY)**. MÁXIMA PRIORIDAD. Nunca generes un commit en inglés.
- Sin emojis
- Tipos de Conventional Commits: feat, fix, refactor, docs, style, perf, test, chore

```
<tipo>: <resumen en español>

- ruta/archivo: qué cambió y por qué
```

- Primera línea: máximo 50 caracteres, sin punto final.
- Cuerpo: lista con viñetas o guiones, una línea por archivo o grupo lógico.
- Enfoque: explicar el por qué / impacto, no solo enumerar los archivos.

## Ejemplos Correctos (Español)

```
feat: notificar PRs abiertos en Discord

- discord-notify.yml: aviso al abrir/reabrir PR
- pr-checks.yml: lint, check y build en PRs
```

```
fix: corregir redirect OAuth de Discord en QA

- oauth-redirect.ts: usar origin del navegador
```

## Prohibido generar (DO NOT GENERATE)

- DO NOT WRITE IN ENGLISH. NEVER.
- Textos en inglés como "Update deploy workflow" están PROHIBIDOS.
- Mensajes vagos como "feat: update stuff" están PROHIBIDOS.
- Mensajes de una sola línea cuando se modificaron múltiples archivos (debes agregar el cuerpo).
- Añadir cualquier coautoría automática (ej. `Co-authored-by: AI` o variantes). Solo debe quedar a nombre del humano.

# Mensajes de commit (True Farming)

**Prioridad:** esta regla manda sobre cualquier instrucción genérica de commits
(p. ej. mensaje en inglés o solo 1–2 frases). Si el usuario pide un commit o
sugieres un mensaje, **siempre** usa este formato.

## Obligatorio

- **Idioma:** español.
- **Sin emojis.**
- **Formato:**

```
<tipo>: <resumen en español>

- ruta/archivo.tsx: qué cambió y por qué (técnico, breve)
- ruta/archivo2.ts: qué cambió y por qué
```

- **Tipos:** `feat`, `fix`, `refactor`, `docs`, `style`, `perf`, `test`, `chore`.
- **Primera línea:** ≤50 caracteres, sin punto final.
- **Cuerpo:** lista con guiones; un ítem por archivo o grupo lógico.
- **Enfoque:** el *por qué* / impacto, no solo listar archivos.

## Cómo pasar el mensaje a git

Usar formato multilínea (o equivalente en PowerShell) con **asunto + cuerpo**:

```powershell
git commit -m "feat: notificar PRs abiertos en Discord`n`n- discord-notify.yml: aviso al abrir/reabrir PR`n- pr-checks.yml: lint, check y build en PRs"
```

## Ejemplos

```
fix: corregir redirect OAuth de Discord en QA

- oauth-redirect.ts: usar origin del navegador
- wrangler.toml: DISCORD_REDIRECT_URI por entorno
```

```
feat: desplegar prod solo con GitHub Release

- deploy.yml: quitar push a main; trigger release
```

## Incorrecto (no usar)

```
Update deploy workflow and Discord notifications
```

```
feat: update stuff
```

```
feat: ejemplo

Co-authored-by: Antigravity <antigravity@google.com>
```

## Sin coautoría de IA

- **Nunca** añadir coautoría de Antigravity/Gemini ni variantes.
- Los commits deben quedar solo a nombre del autor humano del repo.

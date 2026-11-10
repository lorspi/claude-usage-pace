# Claude Quota Pace — Web

Versión web de **Claude Quota Pace**: mide el uso de una o varias cuentas de Claude comparando el
`% de cuota` consumido contra el `% de tiempo` transcurrido desde su corte.

**Sin backend.** No hay servidor ni base de datos: las cuentas y su configuración se guardan en el
`localStorage` del navegador.

---

## Ejecutar en local

```bash
cd web
npm install
npm run dev      # http://localhost:8080
```

El servidor de desarrollo escucha en el puerto **8080** y acepta el host **`test.lorspi.com`**.
Para acceder por ese dominio, apunta el host a tu máquina (por ejemplo en `C:\Windows\System32\drivers\etc\hosts`):

```
127.0.0.1 test.lorspi.com
```

Otros comandos:

```bash
npm test         # pruebas de la lógica de cortes y ritmo
npm run build    # genera la carpeta dist/
npm run preview  # sirve dist/ en http://localhost:8080
```

## Agregar cuentas

Cada cuenta define:

- **Nombre** y **cuota a medir** (semanal, Opus, Sonnet o créditos extra).
- **Fecha y hora de corte** (pasada o futura, en hora local) y el **período** en que se repite
  (semanal, mensual o cada N días). Los demás cortes se calculan solos.
- **Origen del % de uso**:
  - **Manual**: escribes el `%` a mano en la tarjeta. Funciona siempre, sin token.
  - **Token OAuth**: la web lee el uso directo de `api.anthropic.com`.

Además cada cuenta tiene umbrales de **advertencia** y **alerta** (puntos por encima del ritmo que
colorean la tarjeta).

## Cómo conseguir el token OAuth de Claude Code

Hay dos caminos.

### Opción A — `claude setup-token` (recomendada)

Genera un token OAuth de larga duración (≈1 año) sin depender del archivo de credenciales:

```bash
claude setup-token
```

Abre el mismo flujo que `/login` en el navegador; al aprobar, el token se imprime en la terminal.
Cópialo y pégalo en el diálogo de la cuenta (origen = "Token OAuth").

> Está pensado para `CLAUDE_CODE_OAUTH_TOKEN`, así que no caduca cada pocas horas como el token del
> archivo. Esto importa porque **la web no puede refrescar tokens sola**.

### Opción B — leer `.credentials.json`

Es lo que hace la extensión de VS Code (`src/usage.js`): busca `claudeAiOauth.accessToken`.

- **Windows / Linux** — `~/.claude/.credentials.json`. En PowerShell:

  ```powershell
  (Get-Content "$env:USERPROFILE\.claude\.credentials.json" -Raw | ConvertFrom-Json).claudeAiOauth.accessToken
  ```

- **macOS** — está en el Llavero, no en un archivo:

  ```bash
  security find-generic-password -s "Claude Code-credentials" -w
  ```

Requisito previo: haber iniciado sesión al menos una vez con `claude` en esa máquina.

### Consideraciones

- **Caducidad**: el `accessToken` del archivo dura pocas horas y lo renueva Claude Code. En la web no
  hay refresco automático, así que tendrías que volver a copiarlo; por eso la Opción A es mejor.
- **Seguridad**: es una credencial de tu cuenta. La web la guarda en `localStorage` (texto plano) y
  solo la envía a `api.anthropic.com`. No la compartas ni la pegues en equipos de terceros.
- **CORS**: aunque el token sea válido, la petición sale del navegador. Si Anthropic no devuelve
  cabeceras CORS, fallará y verás el error en la tarjeta. En ese caso, usa el **% manual**: la web
  calcula el ritmo igual y no necesitas ningún token.

## Despliegue en Cloudflare Pages

El proyecto es un SPA estático, así que se despliega la carpeta `dist/`.

### Con Wrangler (CLI)

```bash
cd web
npm run build
npx wrangler pages deploy dist --project-name claude-quota-pace --branch main
```

La primera vez te pedirá iniciar sesión (`wrangler login`) y creará el proyecto. En despliegues
posteriores conviene definir `CLOUDFLARE_API_TOKEN` como variable de entorno para no depender del
login interactivo:

```bash
export CLOUDFLARE_API_TOKEN=xxxxx   # PowerShell: $env:CLOUDFLARE_API_TOKEN="xxxxx"
npx wrangler pages deploy dist --project-name claude-quota-pace --branch main
```

### Desde el panel de Cloudflare (CI)

1. **Workers & Pages → Create → Pages → Connect to Git** y autoriza GitHub.
2. Elige el repo `lorspi/claude-usage-pace` y la rama del proyecto.
3. Configura el build:
   - **Framework preset**: `None`
   - **Root directory**: `web`
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `dist`
4. **Save and Deploy**. Cada push a esa rama redepliega.

> El endpoint de la API de Anthropic sigue sujeto a CORS desde el navegador, también en producción.
> El modo manual funciona en cualquier caso.

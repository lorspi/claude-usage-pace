# Claude Usage Pace

Extensión para VS Code y sus derivados (Cursor, Windsurf, VSCodium…) que muestra en la barra de estado si estás usando tu cuota de Claude Code más rápido o más lento de lo que te conviene.

Compara el **% de la cuota que llevas usada** con el **% de tiempo que ha pasado desde tu último corte**:

`✓ Claude 34% / 40% (−6)` → usaste 34 % de la cuota, pasó 40 % del período y vas 6 puntos **por debajo** del ritmo óptimo.

- Amarillo cuando vas 5 puntos o más por encima del ritmo (`warnAbove`), rojo desde 15 (`errorAbove`).
- Al pasar el mouse: último y próximo corte, tiempo restante, proyección al corte, % por hora disponible, cuánto tiempo sin usar Claude necesitas para volver al ritmo y uso de la sesión de 5 h.
- Clic para actualizar; se actualiza sola cada 2 minutos.

## Instalación

1. Descarga el `.vsix` de la [última release](https://github.com/lorspi/claude-usage-pace/releases/latest).
2. En VS Code: `Extensiones → … → Install from VSIX…`, o en la terminal:
   ```bash
   code --install-extension claude-usage-pace-0.1.0.vsix
   ```

## Uso

1. Ejecuta **Claude Usage: Configurar fecha y hora de corte** (o haz clic en la barra de estado). Escribe cualquier corte, pasado o futuro, en formato `YYYY-MM-DD HH:mm` y elige si se repite cada semana, cada mes o cada N días.
   También puedes usar **Claude Usage: Tomar el corte desde Claude** para copiar la fecha de reinicio semanal que informa tu cuenta.
2. El % de uso se lee automáticamente de tu sesión de Claude Code (`~/.claude/.credentials.json`; en macOS, el Llavero). Si prefieres no hacerlo, usa **Claude Usage: Ingresar % de uso manualmente**.

### Configuración

| Opción | Por defecto | Descripción |
|---|---|---|
| `claudeUsagePace.cutoff` | — | Un corte cualquiera, `YYYY-MM-DD HH:mm` en hora local |
| `claudeUsagePace.period` | `weekly` | `weekly`, `monthly` o `custom` |
| `claudeUsagePace.periodDays` | `7` | Días entre cortes si el período es `custom` |
| `claudeUsagePace.quota` | `seven_day` | Cuota a comparar: semanal, semanal Opus, semanal Sonnet o créditos extra |
| `claudeUsagePace.source` | `auto` | `auto` (sesión de Claude Code) o `manual` |
| `claudeUsagePace.refreshSeconds` | `120` | Frecuencia de consulta (mínimo 30) |
| `claudeUsagePace.warnAbove` / `errorAbove` | `5` / `15` | Umbrales en puntos porcentuales |
| `claudeUsagePace.credentialsPath` | — | Ruta alternativa a `.credentials.json` |

## Privacidad

El token de Claude Code se lee del disco en cada consulta y se envía **solo** a `api.anthropic.com`. La extensión no guarda ni manda datos a ningún otro lugar.

Si usas WSL o un entorno remoto, la extensión busca las credenciales en la máquina donde se ejecuta.

## Aviso

Proyecto independiente, sin relación con Anthropic. El endpoint de uso (`/api/oauth/usage`) es el que usa `/usage` en Claude Code, pero no es una API pública documentada y podría cambiar sin aviso; en ese caso queda el modo manual.

## Desarrollo

```bash
npm test               # pruebas de la lógica de cortes y ritmo
npx @vscode/vsce@3 package
```

## Licencia

[MIT](LICENSE)

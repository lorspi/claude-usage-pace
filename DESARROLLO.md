# Registro de desarrollo

## Prompt original

> Quisiera crear una extension para vs code y sus derivados para poder monitorear el uso de mi saldo de claude code mientas lo uso. de tal fora que yo pueda configurar la fecha y la hora de mi corte y que con base a eso esta extensión me compare el % de tiempo transcurrido desde el corte pasado y el % del uso de mi cuota y me muestre qué porcentaje llevo por encima o por debajo del uso óptimo en el momento actual.

## Tiempo de desarrollo

| | Hora (UTC, 2026-10-26) |
|---|---|
| Prompt recibido | 20:24:35 |
| `.vsix` empaquetado | 20:29:20 |
| Respuesta final | 20:29:30 |
| **Total** | **≈ 5 minutos** |

## Consumo de Claude

Modelo: `claude-opus-5-5`, con suscripción de Claude (OAuth). No se cobraron créditos en dólares: el uso se descuenta de los límites del plan.

**Tokens** (8 respuestas del modelo; la mayor parte de la entrada salió de la caché de prompts):

| Tipo | Tokens |
|---|---:|
| Entrada sin caché | 16 |
| Escritura en caché | 27 557 |
| Lectura de caché | 354 123 |
| Salida | 14 086 |

**Costo equivalente si se hubiera pagado por API** (precios de `claude-opus-5-5` al 2026-10-26; no es un cobro real):

| Tipo | Tokens | Precio por millón | Costo |
|---|---:|---:|---:|
| Entrada sin caché | 16 | $4.00 | $0.0001 |
| Escritura en caché (TTL de 1 h)* | 27 557 | $8.00 | $0.2205 |
| Lectura de caché | 354 123 | $0.20 | $0.0708 |
| Salida | 14 086 | $20.00 | $0.2817 |
| **Total** | | | **≈ $0.57 USD** |

\* Claude Code guarda la caché por 1 hora, y escribir en ella cuesta el doble del precio de entrada. Con la caché estándar de 5 minutos ($5.00 por millón), el total sería de unos $0.49 USD.

**Efecto en la cuota** (según el endpoint de uso que consulta la propia extensión):

| Límite | Al empezar* | Al terminar |
|---|---:|---:|
| Sesión de 5 h | 10 % | 12 % |
| Semanal | 2 % | 2 % |

\* La primera lectura se hizo con el desarrollo ya en marcha, así que ya incluía una parte de este trabajo. El aumento real en la sesión de 5 h es de unos 2 puntos o un poco más. En el límite semanal el aumento no llega a 1 punto, por eso no se ve: el endpoint redondea a enteros.

Los totales salen del registro de la sesión (`~/.claude/projects/-config-claude-usage/c500b326-….jsonl`). No cuentan este registro posterior.

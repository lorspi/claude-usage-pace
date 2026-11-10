// Lógica pura (sin dependencias) para poder probarla con vitest.
// Portada tal cual desde la extensión de VS Code (src/pace.js).

export type Period = "weekly" | "monthly" | "custom";

const HOUR = 3600 * 1000;

/** Parsea "YYYY-MM-DD HH:mm" (o con "T") como hora local. */
export function parseLocal(str?: string | null): Date | null {
  const m = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?\s*$/.exec(str || "");
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Formatea como "YYYY-MM-DD HH:mm" en hora local. */
export function formatLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Formatea como "YYYY-MM-DDTHH:mm" para un <input type="datetime-local">. */
export function toDatetimeLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Desplaza el ancla k períodos usando aritmética de calendario local (respeta cambios de horario). */
function shift(anchor: Date, k: number, period: Period, periodDays: number): Date {
  const d = new Date(anchor.getTime());
  if (period === "monthly") {
    const day = anchor.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + k);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
  } else {
    d.setDate(d.getDate() + k * (period === "custom" ? periodDays : 7));
  }
  return d;
}

/** Devuelve { last, next } tal que last <= now < next. */
export function cycleBounds(
  anchor: Date,
  now: Date,
  period: Period,
  periodDays = 7,
): { last: Date; next: Date } {
  const approxMs = (period === "monthly" ? 30.44 : period === "custom" ? periodDays : 7) * 24 * HOUR;
  let k = Math.floor((now.getTime() - anchor.getTime()) / approxMs);
  while (shift(anchor, k, period, periodDays).getTime() > now.getTime()) k--;
  while (shift(anchor, k + 1, period, periodDays).getTime() <= now.getTime()) k++;
  return { last: shift(anchor, k, period, periodDays), next: shift(anchor, k + 1, period, periodDays) };
}

export interface Pace {
  usagePct: number;
  timePct: number;
  delta: number;
  remainingMs: number;
  projected: number;
  budgetPerHour: number;
  catchUpMs: number;
}

/**
 * usagePct: % de la cuota consumida (0-100).
 * delta > 0 => vas por encima del ritmo óptimo.
 */
export function computePace(usagePct: number, last: Date, next: Date, now: Date): Pace {
  const total = next.getTime() - last.getTime();
  const elapsed = now.getTime() - last.getTime();
  const timePct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const delta = usagePct - timePct;
  const remainingMs = next.getTime() - now.getTime();
  const remainingHours = remainingMs / HOUR;
  // Proyección lineal del % al llegar al corte si mantienes el ritmo actual.
  const projected = elapsed > 0 ? (usagePct / elapsed) * total : 0;
  // % de cuota por hora que puedes usar de aquí al corte.
  const budgetPerHour = remainingHours > 0 ? Math.max(0, 100 - usagePct) / remainingHours : 0;
  // Si vas por encima: en cuánto tiempo el reloj alcanza tu uso actual.
  const catchUpMs = delta > 0 ? (delta / 100) * total : 0;
  return { usagePct, timePct, delta, remainingMs, projected, budgetPerHour, catchUpMs };
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

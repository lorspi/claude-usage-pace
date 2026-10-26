// Lógica pura (sin vscode) para poder probarla con node.

const HOUR = 3600 * 1000;

/** Parsea "YYYY-MM-DD HH:mm" (o con "T") como hora local. */
function parseLocal(str) {
  const m = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?\s*$/.exec(str || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

function formatLocal(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Desplaza el ancla k períodos usando aritmética de calendario local (respeta cambios de horario). */
function shift(anchor, k, period, periodDays) {
  const d = new Date(anchor.getTime());
  if (period === 'monthly') {
    const day = anchor.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + k);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
  } else {
    d.setDate(d.getDate() + k * (period === 'custom' ? periodDays : 7));
  }
  return d;
}

/** Devuelve { last, next } tal que last <= now < next. */
function cycleBounds(anchor, now, period, periodDays = 7) {
  const approxMs = (period === 'monthly' ? 30.44 : period === 'custom' ? periodDays : 7) * 24 * HOUR;
  let k = Math.floor((now - anchor) / approxMs);
  while (shift(anchor, k, period, periodDays) > now) k--;
  while (shift(anchor, k + 1, period, periodDays) <= now) k++;
  return { last: shift(anchor, k, period, periodDays), next: shift(anchor, k + 1, period, periodDays) };
}

/**
 * usagePct: % de la cuota consumida (0-100).
 * delta > 0 => vas por encima del ritmo óptimo.
 */
function computePace(usagePct, last, next, now) {
  const total = next - last;
  const elapsed = now - last;
  const timePct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const delta = usagePct - timePct;
  const remainingMs = next - now;
  const remainingHours = remainingMs / HOUR;
  // Proyección lineal del % al llegar al corte si mantienes el ritmo actual.
  const projected = elapsed > 0 ? (usagePct / elapsed) * total : 0;
  // % de cuota por hora que puedes usar de aquí al corte.
  const budgetPerHour = remainingHours > 0 ? Math.max(0, 100 - usagePct) / remainingHours : 0;
  // Si vas por encima: en cuánto tiempo el reloj alcanza tu uso actual.
  const catchUpMs = delta > 0 ? (delta / 100) * total : 0;
  return { usagePct, timePct, delta, remainingMs, projected, budgetPerHour, catchUpMs };
}

function formatDuration(ms) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

module.exports = { parseLocal, formatLocal, cycleBounds, computePace, formatDuration };

const assert = require('assert');
const { parseLocal, cycleBounds, computePace, formatLocal } = require('../src/pace');

const anchor = parseLocal('2026-11-02 01:00');
// Ancla futura: el ciclo actual termina en el ancla.
let { last, next } = cycleBounds(anchor, parseLocal('2026-10-29 13:00'), 'weekly');
assert.strictEqual(formatLocal(last), '2026-10-26 01:00');
assert.strictEqual(formatLocal(next), '2026-11-02 01:00');
// Justo en el corte, empieza el ciclo nuevo.
({ last, next } = cycleBounds(anchor, anchor, 'weekly'));
assert.strictEqual(formatLocal(last), '2026-11-02 01:00');
// Ancla muy pasada.
({ last } = cycleBounds(parseLocal('2025-01-06 01:00'), parseLocal('2026-10-29 13:00'), 'weekly'));
assert.strictEqual(formatLocal(last), '2026-10-26 01:00');
// Mensual con día 31.
({ last, next } = cycleBounds(parseLocal('2026-01-31 09:00'), parseLocal('2026-03-01 00:00'), 'monthly'));
assert.strictEqual(formatLocal(last), '2026-02-28 09:00');
assert.strictEqual(formatLocal(next), '2026-03-31 09:00');
// Personalizado de 3 días.
({ last } = cycleBounds(parseLocal('2026-10-01 00:00'), parseLocal('2026-10-08 12:00'), 'custom', 3));
assert.strictEqual(formatLocal(last), '2026-10-07 00:00');

// Mitad de la semana con 60% usado => +10 pts.
const p = computePace(60, parseLocal('2026-10-26 00:00'), parseLocal('2026-11-02 00:00'), parseLocal('2026-10-29 12:00'));
assert.ok(Math.abs(p.timePct - 50) < 1e-9);
assert.ok(Math.abs(p.delta - 10) < 1e-9);
assert.ok(Math.abs(p.projected - 120) < 1e-9);
console.log('OK');

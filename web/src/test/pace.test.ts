import { describe, expect, it } from "vitest";
import { computePace, cycleBounds, formatLocal, parseLocal } from "../lib/pace";

const anchor = parseLocal("2026-11-02 01:00")!;

describe("cycleBounds", () => {
  it("ubica el ciclo actual con un ancla futura", () => {
    const { last, next } = cycleBounds(anchor, parseLocal("2026-10-29 13:00")!, "weekly");
    expect(formatLocal(last)).toBe("2026-10-26 01:00");
    expect(formatLocal(next)).toBe("2026-11-02 01:00");
  });

  it("empieza el ciclo nuevo justo en el corte", () => {
    const { last } = cycleBounds(anchor, anchor, "weekly");
    expect(formatLocal(last)).toBe("2026-11-02 01:00");
  });

  it("soporta un ancla muy pasada", () => {
    const { last } = cycleBounds(parseLocal("2025-01-06 01:00")!, parseLocal("2026-10-29 13:00")!, "weekly");
    expect(formatLocal(last)).toBe("2026-10-26 01:00");
  });

  it("maneja meses con menos días", () => {
    const { last, next } = cycleBounds(
      parseLocal("2026-01-31 09:00")!,
      parseLocal("2026-03-01 00:00")!,
      "monthly",
    );
    expect(formatLocal(last)).toBe("2026-02-28 09:00");
    expect(formatLocal(next)).toBe("2026-03-31 09:00");
  });

  it("soporta períodos personalizados", () => {
    const { last } = cycleBounds(parseLocal("2026-10-01 00:00")!, parseLocal("2026-10-08 12:00")!, "custom", 3);
    expect(formatLocal(last)).toBe("2026-10-07 00:00");
  });
});

describe("computePace", () => {
  it("calcula delta y proyección a mitad de la semana", () => {
    const p = computePace(
      60,
      parseLocal("2026-10-26 00:00")!,
      parseLocal("2026-11-02 00:00")!,
      parseLocal("2026-10-29 12:00")!,
    );
    expect(p.timePct).toBeCloseTo(50, 9);
    expect(p.delta).toBeCloseTo(10, 9);
    expect(p.projected).toBeCloseTo(120, 9);
  });
});

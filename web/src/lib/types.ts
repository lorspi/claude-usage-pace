export type { Period } from "./pace";
import type { Period } from "./pace";

export type Quota = "seven_day" | "seven_day_opus" | "seven_day_sonnet" | "extra_usage";
export type Source = "manual" | "auto";

export interface UsageQuota {
  utilization: number;
  resets_at?: string | null;
}

export interface UsageData {
  five_hour?: UsageQuota;
  seven_day?: UsageQuota;
  seven_day_opus?: UsageQuota;
  seven_day_sonnet?: UsageQuota;
  extra_usage?: UsageQuota;
}

export interface Account {
  id: string;
  name: string;
  /** Cualquier corte, pasado o futuro, en formato "YYYY-MM-DD HH:mm" (hora local). */
  cutoff: string;
  period: Period;
  periodDays: number;
  quota: Quota;
  source: Source;
  /** % de uso ingresado a mano (source = manual). */
  manualPercent: number;
  /** Token OAuth de Claude Code (opcional, para leer el uso automáticamente). */
  token: string;
  /** Puntos por encima del ritmo que marcan advertencia. */
  warnAbove: number;
  /** Puntos por encima del ritmo que marcan alerta. */
  errorAbove: number;
  /** Última respuesta del endpoint de uso (se guarda en el navegador). */
  usage?: UsageData | null;
  lastFetch?: string | null;
  lastError?: string | null;
}

export const QUOTA_LABELS: Record<Quota, string> = {
  seven_day: "Semanal (todos los modelos)",
  seven_day_opus: "Semanal Opus",
  seven_day_sonnet: "Semanal Sonnet",
  extra_usage: "Créditos extra",
};

export const PERIOD_LABELS: Record<Period, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  custom: "Cada N días",
};

export const QUOTA_OPTIONS: Quota[] = ["seven_day", "seven_day_opus", "seven_day_sonnet", "extra_usage"];
export const PERIOD_OPTIONS: Period[] = ["weekly", "monthly", "custom"];

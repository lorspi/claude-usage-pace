import { useEffect, useState } from "react";
import { ArrowClockwise, ArrowUp, CheckCircle, Flame, PencilSimple, Trash, Warning } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { computePace, cycleBounds, formatDuration, formatLocal, parseLocal } from "@/lib/pace";
import { PERIOD_LABELS, QUOTA_LABELS, type Account } from "@/lib/types";

interface AccountCardProps {
  account: Account;
  now: Date;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onRefresh: (account: Account) => void;
  onSetPercent: (account: Account, percent: number) => void;
  onUseApiCutoff: (account: Account) => void;
}

function fmt(n: number, digits = 1): string {
  return n.toFixed(digits).replace(/\.0$/, "");
}

function signed(n: number): string {
  return (n > 0 ? "+" : n < 0 ? "−" : "±") + fmt(Math.abs(n));
}

function usagePercent(account: Account): number | null {
  if (account.source === "manual") return account.manualPercent;
  const q = account.usage?.[account.quota];
  return q && typeof q.utilization === "number" ? q.utilization : null;
}

const TONES = {
  good: { text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", chip: "bg-emerald-500/10" },
  neutral: { text: "text-foreground", bar: "bg-primary", chip: "bg-muted" },
  warn: { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", chip: "bg-amber-500/10" },
  danger: { text: "text-red-600 dark:text-red-400", bar: "bg-red-500", chip: "bg-red-500/10" },
};

function Bar({ label, value, barClass }: { label: string; value: number; barClass: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{fmt(value)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground tabular-nums leading-tight">{value}</p>
    </div>
  );
}

export function AccountCard({
  account,
  now,
  onEdit,
  onDelete,
  onRefresh,
  onSetPercent,
  onUseApiCutoff,
}: AccountCardProps) {
  const [percent, setPercent] = useState(String(account.manualPercent));

  useEffect(() => {
    setPercent(String(account.manualPercent));
  }, [account.manualPercent]);

  const commitPercent = () => {
    const value = Number(percent.replace(",", "."));
    if (Number.isFinite(value) && value >= 0 && value <= 100) {
      onSetPercent(account, value);
    } else {
      setPercent(String(account.manualPercent));
    }
  };

  const anchor = parseLocal(account.cutoff);
  const usage = usagePercent(account);
  const session = account.usage?.five_hour;
  const apiReset = account.usage?.[account.quota]?.resets_at ?? null;

  const header = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-heading font-semibold text-lg truncate">{account.name}</h2>
        <p className="text-sm text-muted-foreground">{QUOTA_LABELS[account.quota]}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Badge variant="outline" className="mr-1 hidden sm:inline-flex">
          {PERIOD_LABELS[account.period]}
        </Badge>
        {account.source === "auto" && (
          <Button variant="ghost" size="icon" title="Actualizar uso" onClick={() => onRefresh(account)}>
            <ArrowClockwise weight="bold" />
          </Button>
        )}
        <Button variant="ghost" size="icon" title="Editar" onClick={() => onEdit(account)}>
          <PencilSimple weight="bold" />
        </Button>
        <Button variant="ghost" size="icon" title="Eliminar" onClick={() => onDelete(account)}>
          <Trash weight="bold" />
        </Button>
      </div>
    </div>
  );

  if (!anchor || usage === null) {
    const message = !anchor
      ? "Falta la fecha y hora de corte de esta cuenta."
      : account.lastError || "Sin datos de uso todavía.";
    return (
      <Card className="card-shadow animate-fade-in">
        <CardContent className="p-6">
          {header}
          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Warning weight="duotone" className="w-5 h-5 text-amber-500" />
            {message}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(account)}>
              <PencilSimple weight="bold" />
              Editar cuenta
            </Button>
            {account.source === "auto" && (
              <Button variant="outline" size="sm" onClick={() => onRefresh(account)}>
                <ArrowClockwise weight="bold" />
                Actualizar uso
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { last, next } = cycleBounds(anchor, now, account.period, account.periodDays);
  const p = computePace(usage, last, next, now);

  const toneKey =
    p.delta >= account.errorAbove
      ? "danger"
      : p.delta >= account.warnAbove
        ? "warn"
        : p.delta > 0
          ? "neutral"
          : "good";
  const tone = TONES[toneKey];
  const StatusIcon =
    toneKey === "danger" ? Flame : toneKey === "warn" ? Warning : toneKey === "neutral" ? ArrowUp : CheckCircle;

  const deltaText =
    Math.abs(p.delta) < 0.05
      ? "Justo en el ritmo"
      : p.delta > 0
        ? `${fmt(p.delta)} pts por encima`
        : `${fmt(-p.delta)} pts por debajo`;

  return (
    <Card className="card-shadow card-hover animate-fade-in">
      <CardContent className="p-6">
        {header}

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className={cn("text-4xl font-bold font-heading tabular-nums", tone.text)}>
              {fmt(p.usagePct, 0)}%
            </span>
            <span className="text-2xl font-semibold font-heading text-muted-foreground tabular-nums">
              / {fmt(p.timePct, 0)}%
            </span>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold",
              tone.chip,
              tone.text,
            )}
          >
            <StatusIcon weight="fill" className="w-4 h-4" />
            {signed(p.delta)}
          </span>
        </div>
        <p className={cn("mt-1 text-sm font-medium", tone.text)}>{deltaText}</p>

        <div className="mt-5 space-y-3">
          <Bar label="Cuota usada" value={p.usagePct} barClass={tone.bar} />
          <Bar label="Tiempo transcurrido" value={p.timePct} barClass="bg-muted-foreground/40" />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <Stat label="Último corte" value={formatLocal(last)} />
          <Stat label="Próximo corte" value={`${formatLocal(next)} · en ${formatDuration(p.remainingMs)}`} />
          <Stat label="Proyección al corte" value={`${fmt(p.projected)}%`} />
          <Stat label="Ritmo disponible" value={`${fmt(p.budgetPerHour, 2)}% por hora`} />
          {p.catchUpMs > 0 && (
            <Stat label="Vuelves al ritmo sin usar Claude en" value={formatDuration(p.catchUpMs)} />
          )}
          {session && typeof session.utilization === "number" && (
            <Stat
              label="Sesión de 5 h"
              value={`${fmt(session.utilization)}%${
                session.resets_at ? ` · reinicia ${formatLocal(new Date(session.resets_at))}` : ""
              }`}
            />
          )}
        </div>

        <div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-3">
          {account.source === "manual" ? (
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor={`pct-${account.id}`}>
                % de uso
              </label>
              <Input
                id={`pct-${account.id}`}
                value={percent}
                inputMode="decimal"
                className="w-24 h-9"
                onChange={(e) => setPercent(e.target.value)}
                onBlur={commitPercent}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {account.lastFetch
                ? `Actualizado ${new Date(account.lastFetch).toLocaleTimeString()}`
                : "Sin actualizar"}
              {account.lastError && <span className="text-red-500"> · {account.lastError}</span>}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {account.source === "auto" && (
              <>
                <Button variant="outline" size="sm" onClick={() => onRefresh(account)}>
                  <ArrowClockwise weight="bold" />
                  Actualizar
                </Button>
                {apiReset && (
                  <Button variant="outline" size="sm" onClick={() => onUseApiCutoff(account)} title="Usar la fecha de reinicio que informa Claude">
                    Tomar corte
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

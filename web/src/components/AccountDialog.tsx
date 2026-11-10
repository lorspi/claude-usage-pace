import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatLocal, parseLocal, toDatetimeLocal } from "@/lib/pace";
import { uid } from "@/lib/storage";
import {
  PERIOD_LABELS,
  PERIOD_OPTIONS,
  QUOTA_LABELS,
  QUOTA_OPTIONS,
  type Account,
  type Period,
  type Quota,
  type Source,
} from "@/lib/types";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Account | null;
  onSave: (account: Account) => void;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function AccountDialog({ open, onOpenChange, initial, onSave }: AccountDialogProps) {
  const [name, setName] = useState("");
  const [cutoff, setCutoff] = useState("");
  const [period, setPeriod] = useState<Period>("weekly");
  const [periodDays, setPeriodDays] = useState("7");
  const [quota, setQuota] = useState<Quota>("seven_day");
  const [source, setSource] = useState<Source>("manual");
  const [manualPercent, setManualPercent] = useState("0");
  const [token, setToken] = useState("");
  const [warnAbove, setWarnAbove] = useState("5");
  const [errorAbove, setErrorAbove] = useState("15");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const parsed = initial ? parseLocal(initial.cutoff) : null;
    setName(initial?.name ?? "");
    setCutoff(toDatetimeLocal(parsed ?? new Date()));
    setPeriod(initial?.period ?? "weekly");
    setPeriodDays(String(initial?.periodDays ?? 7));
    setQuota(initial?.quota ?? "seven_day");
    setSource(initial?.source ?? "manual");
    setManualPercent(String(initial?.manualPercent ?? 0));
    setToken(initial?.token ?? "");
    setWarnAbove(String(initial?.warnAbove ?? 5));
    setErrorAbove(String(initial?.errorAbove ?? 15));
    setError(null);
  }, [open, initial]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Ponle un nombre a la cuenta.");
      return;
    }
    const parsed = parseLocal(cutoff);
    if (!parsed) {
      setError("La fecha y hora de corte no es válida.");
      return;
    }
    const warn = Number(warnAbove);
    const over = Number(errorAbove);

    onSave({
      id: initial?.id ?? uid(),
      name: trimmedName,
      cutoff: formatLocal(parsed),
      period,
      periodDays: clamp(Math.floor(Number(periodDays) || 7), 1, 3650),
      quota,
      source,
      manualPercent: clamp(Number(manualPercent.replace(",", ".")) || 0, 0, 100),
      token: token.trim(),
      warnAbove: Number.isFinite(warn) ? warn : 5,
      errorAbove: Number.isFinite(over) ? over : 15,
      usage: initial?.usage ?? null,
      lastFetch: initial?.lastFetch ?? null,
      lastError: initial?.lastError ?? null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar cuenta" : "Agregar cuenta de Claude"}</DialogTitle>
          <DialogDescription>
            Define un corte (pasado o futuro) y el período en que se repite; los demás cortes se calculan solos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="acc-name">Nombre</Label>
            <Input
              id="acc-name"
              value={name}
              placeholder="Mi cuenta de Claude"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="acc-cutoff">Fecha y hora de corte</Label>
            <Input
              id="acc-cutoff"
              type="datetime-local"
              value={cutoff}
              onChange={(e) => setCutoff(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cualquier corte, pasado o futuro, en tu hora local.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Se repite</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERIOD_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <div className="grid gap-2">
                <Label htmlFor="acc-days">Días entre cortes</Label>
                <Input
                  id="acc-days"
                  type="number"
                  min={1}
                  value={periodDays}
                  onChange={(e) => setPeriodDays(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Cuota a medir</Label>
            <Select value={quota} onValueChange={(v) => setQuota(v as Quota)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUOTA_OPTIONS.map((q) => (
                  <SelectItem key={q} value={q}>
                    {QUOTA_LABELS[q]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>¿De dónde sale el % de uso?</Label>
            <Select value={source} onValueChange={(v) => setSource(v as Source)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Lo ingreso a mano</SelectItem>
                <SelectItem value="auto">Token OAuth (API de Anthropic)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {source === "manual" ? (
            <div className="grid gap-2">
              <Label htmlFor="acc-pct">% de uso actual</Label>
              <Input
                id="acc-pct"
                inputMode="decimal"
                value={manualPercent}
                onChange={(e) => setManualPercent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Entre 0 y 100.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="acc-token">Token OAuth de Claude Code</Label>
              <Input
                id="acc-token"
                type="password"
                value={token}
                placeholder="sk-ant-oat..."
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se guarda solo en este navegador y se envía únicamente a api.anthropic.com. Si la API bloquea la
                petición desde el navegador, usa el modo manual.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="acc-warn">Advertencia (pts)</Label>
              <Input
                id="acc-warn"
                type="number"
                value={warnAbove}
                onChange={(e) => setWarnAbove(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc-error">Alerta (pts)</Label>
              <Input
                id="acc-error"
                type="number"
                value={errorAbove}
                onChange={(e) => setErrorAbove(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>{initial ? "Guardar cambios" : "Agregar cuenta"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

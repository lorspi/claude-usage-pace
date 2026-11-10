import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EmptyState } from "@/components/EmptyState";
import { AccountCard } from "@/components/AccountCard";
import { AccountDialog } from "@/components/AccountDialog";
import { Toaster } from "@/components/ui/sonner";
import { useAccounts } from "@/hooks/useAccounts";
import { useNow } from "@/hooks/useNow";
import { formatLocal } from "@/lib/pace";
import type { Account } from "@/lib/types";

const AUTO_REFRESH_MS = 120000;

const Dashboard = () => {
  const { accounts, addAccount, updateAccount, removeAccount, refreshAccount } = useAccounts();
  const now = useNow(30000);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;

  // Refresco automático de las cuentas conectadas a la API.
  useEffect(() => {
    const id = setInterval(() => {
      accountsRef.current
        .filter((a) => a.source === "auto" && a.token)
        .forEach((a) => refreshAccount(a, true));
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [refreshAccount]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditing(account);
    setDialogOpen(true);
  };

  const handleSave = (account: Account) => {
    if (accounts.some((a) => a.id === account.id)) {
      updateAccount(account);
      toast.success("Cuenta actualizada");
    } else {
      addAccount(account);
      toast.success("Cuenta agregada");
    }
  };

  const handleDelete = (account: Account) => {
    if (window.confirm(`¿Eliminar la cuenta "${account.name}"?`)) {
      removeAccount(account.id);
      toast.success("Cuenta eliminada");
    }
  };

  const handleSetPercent = (account: Account, percent: number) => {
    updateAccount({ ...account, manualPercent: percent, source: "manual" });
  };

  const handleUseApiCutoff = (account: Account) => {
    const reset = account.usage?.[account.quota]?.resets_at;
    if (!reset) return;
    // Redondea al minuto más cercano (Claude informa p. ej. 05:59:59.8).
    const resets = new Date(Math.round(new Date(reset).getTime() / 60000) * 60000);
    updateAccount({ ...account, cutoff: formatLocal(resets), period: "weekly" });
    toast.success(`Corte ajustado a ${formatLocal(resets)}`);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <ThemeToggle />
      <div className="max-w-3xl mx-auto px-4 pt-8 sm:pt-12 pb-12">
        <Header onAdd={openNew} />

        {accounts.length === 0 ? (
          <EmptyState onAdd={openNew} />
        ) : (
          <div className="grid gap-6">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                now={now}
                onEdit={openEdit}
                onDelete={handleDelete}
                onRefresh={(a) => refreshAccount(a)}
                onSetPercent={handleSetPercent}
                onUseApiCutoff={handleUseApiCutoff}
              />
            ))}
          </div>
        )}

        <Footer />
      </div>

      <AccountDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} onSave={handleSave} />
    </div>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <Toaster />
    <Dashboard />
  </ThemeProvider>
);

export default App;

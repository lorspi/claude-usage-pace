import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { loadAccounts, saveAccounts } from "@/lib/storage";
import { fetchUsage } from "@/lib/usage";
import type { Account } from "@/lib/types";

/** Mantiene las cuentas y las persiste en localStorage (sin backend). */
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());

  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

  const addAccount = useCallback((account: Account) => {
    setAccounts((prev) => [...prev, account]);
  }, []);

  const updateAccount = useCallback((account: Account) => {
    setAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)));
  }, []);

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /** Lee el uso desde la API de Anthropic usando el token de la cuenta. */
  const refreshAccount = useCallback(
    async (account: Account, silent = false) => {
      if (!account.token) {
        if (!silent) {
          updateAccount({
            ...account,
            lastError: "Agrega un token para leer el uso automáticamente.",
            lastFetch: new Date().toISOString(),
          });
          toast.error("Esta cuenta no tiene token configurado.");
        }
        return;
      }
      try {
        const usage = await fetchUsage(account.token);
        updateAccount({ ...account, usage, lastError: null, lastFetch: new Date().toISOString() });
        if (!silent) toast.success(`Uso actualizado: ${account.name}`);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        updateAccount({ ...account, lastError: message, lastFetch: new Date().toISOString() });
        if (!silent) toast.error(`${account.name}: ${message}`);
      }
    },
    [updateAccount],
  );

  return { accounts, addAccount, updateAccount, removeAccount, refreshAccount };
}

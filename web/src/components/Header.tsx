import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function Header({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">
          Claude Quota Pace
        </h1>
        <Button onClick={onAdd} className="shrink-0">
          <Plus weight="bold" />
          Agregar cuenta
        </Button>
      </div>
      <p className="text-muted-foreground">
        Compara el <span className="text-foreground font-medium">% de cuota</span> usado contra el{" "}
        <span className="text-foreground font-medium">% de tiempo</span> transcurrido desde cada corte. Agrega una o
        varias cuentas de Claude; todo se guarda en tu navegador.
      </p>
    </header>
  );
}

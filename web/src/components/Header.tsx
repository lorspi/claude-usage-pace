import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function Header({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">
          Claude Quota Pace
        </h1>
        <Button onClick={onAdd} className="shrink-0 hidden sm:flex">
          <Plus weight="bold" />
          Agregar cuenta
        </Button>
      </div>
    </header>
  );
}

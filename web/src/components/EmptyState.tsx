import { CalendarX, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted p-4 rounded-full mb-4">
        <CalendarX weight="duotone" className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-foreground font-medium mb-2">Aún no tienes cuentas</p>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        Agrega una cuenta de Claude con su fecha y hora de corte y el período en que se repite. Todos los datos se
        guardan localmente en tu navegador.
      </p>
      <Button onClick={onAdd}>
        <Plus weight="bold" />
        Agregar cuenta
      </Button>
    </div>
  );
}

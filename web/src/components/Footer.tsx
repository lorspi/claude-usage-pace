import { Heart, Coffee, ArrowSquareOut } from "@phosphor-icons/react";

export function Footer() {
  return (
    <footer className="mt-12 pt-8 pb-4 text-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-1.5 gap-y-1 text-muted-foreground">
          <span className="whitespace-nowrap">Creado por</span>
          <a
            href="https://lorspi.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 whitespace-nowrap"
          >
            un tal Juan Pérez
            <ArrowSquareOut weight="duotone" className="w-3 h-3 opacity-50 shrink-0" />
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-1.5 gap-y-1 group">
          <div className="flex items-center gap-1.5">
            <Heart weight="fill" className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
            <span className="text-muted-foreground whitespace-nowrap">¿Te gusta mi aplicación?</span>
          </div>
          <a
            href="https://ko-fi.com/lorspi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 whitespace-nowrap"
          >
            Invítame a un café
            <Coffee weight="duotone" className="w-4 h-4 group-hover:rotate-12 transition-transform shrink-0" />
            <ArrowSquareOut weight="duotone" className="w-3 h-3 opacity-50 shrink-0" />
          </a>
        </div>
      </div>
    </footer>
  );
}

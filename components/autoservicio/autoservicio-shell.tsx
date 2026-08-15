export function AutoservicioShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 px-6 py-8 text-primary-foreground shadow-sm sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="size-16 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary-foreground/30 sm:size-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpeg" alt="La Reina Helados" className="size-full object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold leading-tight sm:text-3xl">La Reina Helados</h1>
            <p className="truncate text-sm text-primary-foreground/90 sm:text-base">
              Armá tu pedido y te avisamos cuando esté listo
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 lg:flex-row lg:gap-5">{children}</main>
    </div>
  );
}

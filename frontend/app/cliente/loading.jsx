export default function LoadingCliente() {
  return (
    <main className="min-h-screen bg-white px-5 py-8 text-app-cafe-profundo">
      <section className="mx-auto w-full max-w-7xl">
        <div className="h-14 rounded-[12px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/50" />
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-[14px] bg-white ring-1 ring-app-baunilha-dourada/50" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-36 animate-pulse rounded-[14px] bg-white ring-1 ring-app-baunilha-dourada/50" />
              <div className="h-36 animate-pulse rounded-[14px] bg-white ring-1 ring-app-baunilha-dourada/50" />
            </div>
          </div>
          <div className="h-56 animate-pulse rounded-[14px] bg-white ring-1 ring-app-baunilha-dourada/50" />
        </div>
      </section>
    </main>
  );
}

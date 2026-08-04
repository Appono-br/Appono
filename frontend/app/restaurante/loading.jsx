export default function LoadingRestaurante() {
  return (
    <main className="min-h-screen bg-app-chantilly px-5 py-8 text-app-cafe-profundo">
      <section className="mx-auto w-full max-w-7xl">
        <div className="h-14 rounded-[12px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/50" />
        <div className="mt-10 border-t border-app-baunilha-dourada/60 pt-8">
          <div className="h-3 w-28 animate-pulse rounded-full bg-app-caramelo-torrado/35" />
          <div className="mt-4 h-10 w-full max-w-lg animate-pulse rounded-full bg-app-creme-leve" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-[12px] bg-app-creme-leve ring-1 ring-app-baunilha-dourada/50" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.55fr]">
          <div className="h-64 animate-pulse rounded-[14px] bg-app-creme-leve ring-1 ring-app-baunilha-dourada/50" />
          <div className="h-64 animate-pulse rounded-[14px] bg-app-creme-leve ring-1 ring-app-baunilha-dourada/50" />
        </div>
      </section>
    </main>
  );
}

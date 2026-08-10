export default function LoadingAdmin() {
  return (
    <main className="min-h-screen bg-app-chantilly px-5 py-8 text-app-cafe-profundo">
      <section className="mx-auto w-full max-w-7xl">
        <div className="h-14 rounded-[12px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/50" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-[12px] bg-app-creme-leve ring-1 ring-app-baunilha-dourada/50" />
          ))}
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-[14px] bg-app-creme-leve ring-1 ring-app-baunilha-dourada/50" />
      </section>
    </main>
  );
}

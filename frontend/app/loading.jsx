export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
      <section className="w-full max-w-sm rounded-[12px] bg-app-creme-leve p-6 text-center shadow-sm ring-1 ring-app-baunilha-dourada/60">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-app-baunilha-dourada" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
          Carregando
        </p>
        <p className="mt-2 text-sm text-app-cinza">
          Preparando a tela da Appono.
        </p>
      </section>
    </main>
  );
}

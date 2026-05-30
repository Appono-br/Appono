import { getApiHealth } from "@/lib/api";

export default async function Home() {
  const apiHealth = await getApiHealth();

  return (
    <div className="flex flex-1 bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-20 sm:px-10">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          Appono
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
          Base tecnica pronta para receber a definicao do produto.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          O frontend esta rodando em Next.js e o backend em Express com
          TypeScript. Esta tela consulta a API para validar a integracao entre
          as duas partes.
        </p>
        <section className="mt-10 w-full max-w-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Status da API
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {apiHealth.apiUrl}/api/health
              </p>
            </div>
            <div
              className={`w-fit px-3 py-1 text-sm font-medium ${
                apiHealth.online
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
              }`}
            >
              {apiHealth.online ? "Online" : "Offline"}
            </div>
          </div>
          <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
            Resposta: {apiHealth.data?.status ?? apiHealth.error}
          </p>
        </section>
      </main>
    </div>
  );
}

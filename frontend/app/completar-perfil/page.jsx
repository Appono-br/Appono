import Image from "next/image";
import Link from "next/link";

export default function CompleteProfilePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 py-10 text-app-cafe-profundo">
      <section className="w-full max-w-3xl rounded-2xl bg-app-creme-leve p-6 text-center shadow-2xl ring-1 ring-app-baunilha-dourada sm:p-8">
        <Image
          src="/brand/appono-mark.svg"
          alt="Appono"
          width={96}
          height={96}
          className="mx-auto h-16 w-16"
          priority
        />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-app-caramelo-torrado">
          Login com Google
        </p>
        <h1 className="mt-3 text-3xl font-bold text-app-cafe-profundo">
          Complete seu perfil Appono
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-app-mocha">
          Sua conta Google já foi autenticada. Agora precisamos saber como você
          usara a plataforma para criar o perfil correto.
        </p>

        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          <Link
            href="/cadastro/cliente?google=1"
            className="group rounded-2xl border border-app-baunilha-dourada bg-app-chantilly p-5 transition hover:-translate-y-1 hover:border-app-dourado-mel hover:bg-app-creme-suave hover:shadow-lg"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo transition group-hover:bg-app-dourado-mel group-hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <strong className="mt-4 block text-lg text-app-cafe-profundo">
              Sou cliente
            </strong>
            <span className="mt-2 block text-sm leading-6 text-app-mocha">
              Quero reservar mesas, montar pedidos antecipados e acompanhar
              minhas reservas.
            </span>
          </Link>

          <Link
            href="/cadastro/restaurante?google=1"
            className="group rounded-2xl border border-app-baunilha-dourada bg-app-chantilly p-5 transition hover:-translate-y-1 hover:border-app-dourado-mel hover:bg-app-creme-suave hover:shadow-lg"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo transition group-hover:bg-app-dourado-mel group-hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 9h1" />
                <path d="M9 13h1" />
                <path d="M14 9h1" />
                <path d="M14 13h1" />
              </svg>
            </span>
            <strong className="mt-4 block text-lg text-app-cafe-profundo">
              Sou restaurante
            </strong>
            <span className="mt-2 block text-sm leading-6 text-app-mocha">
              Quero gerenciar reservas, cozinha, cardápio e recebimentos.
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}

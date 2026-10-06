import Image from "next/image";
import Link from "next/link";
import { Building2, User } from "lucide-react";

export default function CompleteProfilePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 py-10 text-app-cafe-profundo">
      <section className="auth-publica w-full max-w-3xl rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8">
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
              <User className="h-5 w-5" aria-hidden="true" />
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
              <Building2 className="h-5 w-5" aria-hidden="true" />
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Session = {
  type: "client" | "restaurant";
  name: string;
};

export default function DashboardPage() {
  const [session] = useState<Session | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const stored = window.localStorage.getItem("appono:session");
    return stored ? (JSON.parse(stored) as Session) : null;
  });

  return (
    <main className="flex min-h-screen flex-col bg-app-creme-leve text-app-cafe-profundo">
      <section className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-2xl rounded-[12px] bg-app-chantilly px-6 py-8 text-center shadow-[0_18px_50px_rgba(74,44,10,0.08)] ring-1 ring-app-baunilha-dourada">
          <Image
            src="/brand/appono-mark.svg"
            alt="Appono"
            width={96}
            height={96}
            className="mx-auto h-16 w-16"
            priority
          />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-app-caramelo-torrado">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-bold text-app-cafe-profundo">
            {session?.name ? `Bem-vindo, ${session.name}` : "Acesso verificado"}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-app-mocha">
            Esta e uma tela temporaria de destino. O dashboard real pode ser
            construido depois com as regras do cliente e do restaurante.
          </p>
          <Link
            href="/"
            className="mx-auto mt-6 flex h-10 w-full max-w-xs items-center justify-center bg-app-dourado-mel text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado"
          >
            Voltar para a home
          </Link>
        </div>
      </section>
      <p className="px-4 py-3 text-center text-xs font-semibold text-app-cinza">
        &copy; 2026 APPONO. Todos os direitos reservados.
      </p>
    </main>
  );
}

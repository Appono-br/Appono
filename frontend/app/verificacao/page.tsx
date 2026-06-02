"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type PendingVerification = {
  type: "client" | "restaurant";
  name: string;
  email?: string;
};

const CODE_LENGTH = 6;

export default function VerificationPage() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [message, setMessage] = useState("");
  const [pending] = useState<PendingVerification | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const stored = window.localStorage.getItem("appono:pendingVerification");
    return stored ? (JSON.parse(stored) as PendingVerification) : null;
  });
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setMessage("");

    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");

    if (!digits.length) {
      return;
    }

    setCode(
      Array.from({ length: CODE_LENGTH }, (_, index) => digits[index] ?? ""),
    );
    inputs.current[Math.min(digits.length, CODE_LENGTH) - 1]?.focus();
  }

  function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (code.some((digit) => !digit)) {
      setMessage("Informe os 6 dígitos do código.");
      return;
    }

    localStorage.setItem(
      "appono:verification",
      JSON.stringify({
        verified: true,
        verifiedAt: new Date().toISOString(),
        email: pending?.email ?? "",
      }),
    );
    localStorage.removeItem("appono:pendingVerification");
    window.location.href =
      pending?.type === "restaurant" ? "/restaurante/home" : "/dashboard";
  }

  return (
    <main className="flex h-screen overflow-hidden flex-col bg-app-chantilly text-app-cafe-profundo">
      <section className="flex min-h-0 flex-1 items-center justify-center px-4 py-3">
        <form
          onSubmit={submitVerification}
          className="w-full max-w-2xl rounded-[12px] bg-app-creme-leve px-5 py-5 shadow-[0_22px_70px_rgba(74,44,10,0.12)] ring-1 ring-app-baunilha-dourada sm:px-8"
        >
          <div className="mx-auto max-w-lg">
            <div className="flex justify-center">
              <Image
                src="/brand/appono-mark.svg"
                alt="Appono"
                width={92}
                height={92}
                className="h-11 w-11"
                priority
              />
            </div>
            <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-app-caramelo-torrado">
              APPONO
            </p>
            <h1 className="mt-2 text-center text-2xl font-medium text-app-cafe-profundo sm:text-3xl">
              Verifica&ccedil;&atilde;o de E-mail
            </h1>
            <p className="mt-2 text-center text-sm leading-5 text-app-mocha">
              Insira o c&oacute;digo enviado para seu e-mail para confirmar sua
              identidade antes de acessar o painel.
            </p>
            {pending?.email ? (
              <p className="mt-1 text-center text-[11px] font-semibold text-app-caramelo-torrado">
                Enviado para {pending.email}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-6 gap-1.5 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputs.current[index] = element;
                  }}
                  value={digit}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Digito ${index + 1}`}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={(event) => {
                    event.preventDefault();
                    handlePaste(event.clipboardData.getData("text"));
                  }}
                  className="h-11 w-full border border-app-baunilha-dourada bg-app-chantilly text-center text-xl font-semibold text-app-cafe-profundo outline-none transition hover:border-app-caramelo-torrado focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20 sm:h-12"
                />
              ))}
            </div>

            <button
              type="submit"
              className="mt-5 flex h-10 w-full items-center justify-center bg-app-dourado-mel text-xs font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25"
            >
              Verificar e continuar
            </button>

            {message ? (
              <p className="mt-2 text-center text-xs font-semibold text-app-caramelo-torrado">
                {message}
              </p>
            ) : null}

            <div className="mt-4 text-center">
              <p className="text-xs text-app-cinza">N&atilde;o recebeu o c&oacute;digo?</p>
              <button
                type="button"
                onClick={() =>
                  setMessage("Código reenviado de forma simulada no frontend.")
                }
                className="mt-1.5 text-xs font-semibold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
              >
                Reenviar c&oacute;digo
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-app-baunilha-dourada pt-4 text-xs text-app-cinza">
              <Link
                href="/"
                className="font-semibold transition hover:text-app-cafe-profundo"
              >
                &lt; Voltar para o in&iacute;cio
              </Link>
              <button
                type="button"
                onClick={() =>
                  setMessage("Verifique o código informado e tente novamente.")
                }
                className="flex h-7 w-7 items-center justify-center rounded-full border border-app-cinza font-bold transition hover:border-app-cafe-profundo hover:text-app-cafe-profundo"
                aria-label="Ajuda"
              >
                ?
              </button>
            </div>
          </div>
        </form>
      </section>
      <p className="px-4 py-2 text-center text-[11px] font-semibold text-app-cinza">
        &copy; 2026 APPONO. Todos os direitos reservados.
      </p>
    </main>
  );
}

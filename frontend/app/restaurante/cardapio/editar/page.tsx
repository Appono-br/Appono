"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

type RestaurantSession = {
  type?: "client" | "restaurant";
  name?: string;
};

type Availability = "immediate" | "dinner" | "seasonal";

type MenuItemForm = {
  name: string;
  category: string;
  price: string;
  description: string;
  availability: Availability;
  vegan: boolean;
  glutenFree: boolean;
  organic: boolean;
};

const initialForm: MenuItemForm = {
  name: "",
  category: "",
  price: "",
  description: "",
  availability: "immediate",
  vegan: false,
  glutenFree: false,
  organic: false,
};

const categories = ["Entradas", "Pratos principais", "Sobremesas", "Bebidas"];

const availabilityOptions: Array<{ id: Availability; label: string }> = [
  { id: "immediate", label: "Imediata" },
  { id: "dinner", label: "Apenas jantar" },
  { id: "seasonal", label: "Sazonal" },
];

function getStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

function Icon({
  type,
  className = "h-5 w-5",
}: {
  type: "arrow-left" | "camera" | "check" | "chevron-down" | "image" | "menu";
  className?: string;
}) {
  const paths = {
    "arrow-left": "M19 12H5M12 19l-7-7 7-7",
    camera:
      "M4 8h4l2-3h4l2 3h4v12H4V8z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    check: "m5 12 4 4L19 6",
    "chevron-down": "m6 9 6 6 6-6",
    image: "M4 5h16v14H4V5z M8 13l2.5-2.5L14 14l2-2 4 4M8 9h.01",
    menu: "M4 7h16M4 12h16M4 17h16",
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path
        d={paths[type]}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 border-b border-app-cinza/45 bg-app-creme-suave px-3 text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"
      />
    </label>
  );
}

export default function RestaurantMenuItemEditorPage() {
  const [session] = useState<RestaurantSession | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedSession = getStorage()?.getItem("appono:session");
    return storedSession ? (JSON.parse(storedSession) as RestaurantSession) : null;
  });
  const [form, setForm] = useState<MenuItemForm>(() => {
    if (typeof window === "undefined") {
      return initialForm;
    }

    const stored = getStorage()?.getItem("appono:menuItemDraft");
    return stored ? (JSON.parse(stored) as MenuItemForm) : initialForm;
  });
  const [message, setMessage] = useState("");

  const isRestaurant = session?.type === "restaurant";

  function updateField<Key extends keyof MenuItemForm>(
    field: Key,
    value: MenuItemForm[Key],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    getStorage()?.setItem("appono:menuItemDraft", JSON.stringify(form));
    setMessage("Item salvo como rascunho neste navegador.");
  }

  if (!isRestaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image
            src="/brand/appono-mark.svg"
            alt="Appono"
            width={88}
            height={88}
            className="mx-auto h-20 w-20"
            priority
          />
          <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">
            Esta area e destinada a contas de restaurante.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado"
          >
            Entrar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5">
          <div aria-label="Appono">
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={88}
              height={88}
              className="h-16 w-16"
              priority
            />
          </div>
          <div className="flex items-center justify-center gap-8">
            <Link
              href="/restaurante/cardapio"
              className="transition hover:text-app-caramelo-torrado"
              aria-label="Voltar para gestao de cardapio"
            >
              <Icon type="arrow-left" className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl font-bold uppercase tracking-[0.16em] sm:text-5xl">
              Menu
            </h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-5xl font-medium italic leading-tight text-app-cafe-profundo sm:text-6xl">
            Criar Novo Item
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-app-cinza sm:text-lg">
            Defina os detalhes da criacao culinaria e mantenha o item como
            rascunho ate a publicacao via backend.
          </p>
        </div>

        <form
          onSubmit={submitForm}
          className="mt-14 grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-start"
        >
          <section className="grid gap-8">
            <div className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
              <div className="grid gap-6">
                <Field
                  label="Nome do prato"
                  value={form.name}
                  onChange={(value) => updateField("name", value)}
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                      Categoria
                    </span>
                    <span className="relative">
                      <select
                        value={form.category}
                        onChange={(event) =>
                          updateField("category", event.target.value)
                        }
                        className="h-12 w-full appearance-none border-b border-app-cinza/45 bg-app-creme-suave px-3 pr-10 text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"
                      >
                        <option value="">Selecione</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <Icon
                        type="chevron-down"
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-cinza"
                      />
                    </span>
                  </label>

                  <Field
                    label="Preco (R$)"
                    value={form.price}
                    onChange={(value) => updateField("price", value)}
                  />
                </div>

                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                    Descricao
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    className="min-h-40 resize-y border-b border-app-cinza/45 bg-app-creme-suave px-3 py-4 text-base leading-7 text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"
                  />
                </label>
              </div>
            </div>

            <section className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">
                Disponibilidade:
              </p>
              <div className="flex flex-wrap gap-4">
                {availabilityOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateField("availability", option.id)}
                    className={`h-11 rounded-[8px] px-8 text-xs font-bold uppercase tracking-[0.16em] transition ${
                      form.availability === option.id
                        ? "bg-app-cafe-profundo text-app-creme-leve"
                        : "bg-app-creme-suave text-app-mocha hover:bg-app-baunilha-dourada"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          </section>

          <aside className="grid gap-8">
            <label className="flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-app-cinza/35 bg-app-creme-suave p-8 text-center transition hover:border-app-caramelo-torrado hover:bg-app-creme-leve">
              <input type="file" accept="image/png,image/jpeg" className="sr-only" />
              <span className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-app-baunilha-dourada text-app-caramelo-torrado">
                <Icon type="camera" className="h-7 w-7" />
              </span>
              <span className="mt-5 text-2xl font-medium italic text-app-cafe-profundo">
                Arraste a fotografia
              </span>
              <span className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                JPEG ou PNG
              </span>
              <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-app-caramelo-torrado">
                <Icon type="image" className="h-4 w-4" />
                Selecionar arquivo
              </span>
            </label>

            <section className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                Preferencias dieteticas
              </p>
              <div className="mt-5 flex flex-wrap gap-4">
                {[
                  ["vegan", "Vegano"],
                  ["glutenFree", "Sem gluten"],
                  ["organic", "Organico"],
                ].map(([field, label]) => {
                  const key = field as "vegan" | "glutenFree" | "organic";

                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => updateField(key, !form[key])}
                      className="inline-flex items-center gap-3 rounded-full bg-app-baunilha-dourada/45 px-4 py-2 text-sm font-semibold text-app-mocha transition hover:bg-app-baunilha-dourada"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-[4px] border border-app-baunilha-dourada bg-app-chantilly ${
                          form[key] ? "text-app-caramelo-torrado" : "text-transparent"
                        }`}
                      >
                        <Icon type="check" className="h-3 w-3" />
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            <button
              type="submit"
              className="h-14 rounded-[8px] bg-app-dourado-mel px-8 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado"
            >
              Publicar item
            </button>

            {message ? (
              <p className="text-sm font-semibold text-app-caramelo-torrado">
                {message}
              </p>
            ) : null}
          </aside>
        </form>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image
            src="/brand/appono-mark.svg"
            alt="Appono"
            width={80}
            height={80}
            className="h-14 w-14 brightness-0 invert"
          />
          <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">
              Politica de Privacidade
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Termos de Uso
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Contato
            </Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">
            &copy; 2026 APPONO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}

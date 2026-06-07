"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

type Restaurant = {
  id: string;
  name: string;
  specialty: string;
  neighborhood?: string;
  distanceInKm?: number;
  averagePreparationTime?: string;
  rating?: number;
  imageUrl?: string;
  isFavorite?: boolean;
};

type Specialty = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
};

const highlightedRestaurants: Restaurant[] = [];
const specialties: Specialty[] = [];

const filters = [
  "Todas Especialidades",
  "Slow Food",
  "Orgânicos",
  "Contemporânea",
  "Vegano Fine Dining",
];

const navItems = [
  { label: "Início", href: "/dashboard" },
  { label: "Detalhes do pedido", href: "/detalhes-pedido" },
  { label: "Reservas", href: "/reservas" },
  { label: "Mensagens", href: "/mensagens" },
  { label: "Configurações", href: "/configuracoes" },
];

function Icon({
  type,
  className = "h-5 w-5",
}: {
  type: "bag" | "bell" | "heart" | "menu" | "pin" | "search" | "sliders";
  className?: string;
}) {
  const paths = {
    bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
    heart:
      "M12 20s-7-4.35-9.2-8.2C1.2 9 2.9 5.8 6 5.4c1.8-.2 3.2.7 4 2 0.8-1.3 2.2-2.2 4-2 3.1.4 4.8 3.6 3.2 6.4C19 15.65 12 20 12 20z",
    menu: "M4 7h16M4 12h16M4 17h16",
    pin: "M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    search: "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
    sliders:
      "M4 7h7M15 7h5M13 5v4M4 12h4M12 12h8M10 10v4M4 17h9M17 17h3M15 15v4",
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

function EmptyState({
  title,
  description,
  compact = false,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-app-creme-leve px-6 text-center shadow-sm ${
        compact ? "py-8" : "py-12"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
        <Icon type="search" className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-app-cafe-profundo">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">
        {description}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const data = await apiRequest<
          Array<{
            id_restaurante: number;
            nome: string;
            endereco?: string | null;
            logo_url?: string | null;
          }>
        >("/restaurantes");

        setRestaurants(
          data.map((restaurant) => ({
            id: String(restaurant.id_restaurante),
            name: restaurant.nome,
            specialty: "Restaurante",
            neighborhood: restaurant.endereco ?? undefined,
            imageUrl: restaurant.logo_url ?? undefined,
          })),
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar restaurantes.",
        );
      }
    }

    loadRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const matchesFilter =
        activeFilter === "Todas Especialidades" ||
        restaurant.specialty === activeFilter;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesSearch =
        !normalizedQuery ||
        restaurant.name.toLowerCase().includes(normalizedQuery) ||
        restaurant.specialty.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, query]);

  return (
    <main className="min-h-screen bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-transparent text-app-cafe-profundo backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:h-24">
          <Link href="/" className="shrink-0" aria-label="Ir para o início">
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={88}
              height={88}
              className="h-14 w-14 lg:h-20 lg:w-20"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-10 text-sm font-semibold text-app-cinza lg:flex">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  index === 0
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 text-app-cafe-profundo">
            <button
              type="button"
              className="transition hover:text-app-caramelo-torrado"
              aria-label="Notificações"
            >
              <Icon type="bell" />
            </button>
            <button
              type="button"
              className="transition hover:text-app-caramelo-torrado"
              aria-label="Sacola"
            >
              <Icon type="bag" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve lg:hidden"
              aria-label="Abrir menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="client-mobile-menu"
            >
              <Icon type="menu" />
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <nav
            id="client-mobile-menu"
            className="border-t border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-4 lg:hidden"
          >
            <div className="mx-auto grid max-w-7xl gap-3 text-sm font-semibold text-app-cinza">
              {navItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={
                    index === 0
                      ? "text-app-cafe-profundo"
                      : "transition hover:text-app-cafe-profundo"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <section className="border-b border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-5">
        <div className="mx-auto max-w-7xl">
          <label className="mx-auto flex h-12 max-w-xl items-center gap-3 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-4 text-app-mocha shadow-sm">
            <Icon type="search" className="h-5 w-5 shrink-0" />
            <span className="sr-only">Buscar restaurantes</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo outline-none placeholder:text-app-cinza"
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`h-10 rounded-[8px] border px-5 text-xs font-semibold transition ${
                  activeFilter === filter
                    ? "border-app-caramelo-torrado bg-app-caramelo-torrado text-app-chantilly"
                    : "border-app-baunilha-dourada bg-app-chantilly text-app-mocha hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada hover:text-app-cafe-profundo"
                }`}
              >
                {filter}
              </button>
            ))}
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-[8px] px-2 text-xs font-semibold text-app-cafe-profundo transition hover:text-app-caramelo-torrado"
            >
              <Icon type="sliders" />
              Filtrar por Distância
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
              Os favoritos da comunidade
            </p>
            <h1 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">
              Mais Curtidos
            </h1>
          </div>
          <Link
            href="#"
            className="w-fit text-[10px] font-bold uppercase text-app-caramelo-torrado underline underline-offset-4"
          >
            Ver todos
          </Link>
        </div>
        {message ? (
          <p className="mt-4 rounded-[8px] bg-app-creme-leve p-3 text-sm font-semibold text-app-caramelo-torrado">
            {message}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.48fr]">
          <EmptyState
            title="Nenhum destaque disponível"
            description="Os restaurantes mais curtidos aparecerão aqui quando forem cadastrados e avaliados pela comunidade."
          />

          <div className="grid gap-6">
            {highlightedRestaurants.length ? (
              highlightedRestaurants.map((restaurant) => (
                <article
                  key={restaurant.id}
                  className="rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve p-5 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                  <p className="mt-1 text-sm text-app-cinza">
                    {restaurant.specialty}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState
                compact
                title="Lista em construção"
                description="Ainda não há restaurantes favoritos para exibir."
              />
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-[8px] bg-app-creme-leve p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
                Conveniência e frescor
              </p>
              <h2 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">
                Perto de Você
              </h2>
            </div>
            <p className="flex items-center gap-2 text-sm text-app-mocha">
              <Icon type="pin" className="h-4 w-4" />
              Localização será definida pelo perfil
            </p>
          </div>

          <div className="mt-8">
            {filteredRestaurants.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredRestaurants.map((restaurant) => (
                  <article key={restaurant.id} className="group">
                    <div className="relative aspect-[0.92] overflow-hidden rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve">
                      <button
                        type="button"
                        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-app-chantilly text-app-cafe-profundo shadow-sm transition hover:bg-app-baunilha-dourada"
                        aria-label={`Favoritar ${restaurant.name}`}
                      >
                        <Icon type="heart" className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="mt-4 text-xl font-medium">
                      {restaurant.name}
                    </h3>
                    <p className="mt-1 text-sm text-app-cinza">
                      {restaurant.specialty}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhum restaurante encontrado"
                description="Nenhum restaurante corresponde aos filtros selecionados."
              />
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
            A arte da escolha
          </p>
          <h2 className="mt-3 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">
            Especialidades em Destaque
          </h2>
        </div>

        <div className="mt-10">
          {specialties.length ? (
            <div className="grid gap-8 lg:grid-cols-3">
              {specialties.map((specialty) => (
                <article
                  key={specialty.id}
                className="rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve p-6 shadow-sm"
                >
                  <h3 className="text-xl font-semibold">{specialty.name}</h3>
                  {specialty.description ? (
                    <p className="mt-2 text-sm leading-6 text-app-cinza">
                      {specialty.description}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Especialidades ainda não disponíveis"
              description="As categorias em destaque serão exibidas assim que houver restaurantes e cardápios cadastrados."
            />
          )}
        </div>
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
              Política de Privacidade
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

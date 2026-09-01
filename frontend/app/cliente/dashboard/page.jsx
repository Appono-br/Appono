"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
const specialties = [];
const filters = [
    "Todas Especialidades",
    "Slow Food",
    "Orgânicos",
    "Contemporânea",
    "Vegano Fine Dining",
];
const navItems = [
    { label: "Início", href: "/cliente/dashboard" },
    { label: "Detalhes do pedido", href: "/cliente/detalhes-pedido" },
    { label: "Reservas", href: "/cliente/reservas" },
    { label: "Favoritos", href: "/cliente/favoritos" },
    { label: "Mensagens", href: "/cliente/mensagens" },
    { label: "Configurações", href: "/cliente/configuracoes" },
];
function Icon({ type, className = "h-5 w-5", filled = false, }) {
    const paths = {
        bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        heart: "M12 20.25 4.35 12.9A4.65 4.65 0 0 1 10.93 6.3L12 7.38l1.07-1.08a4.65 4.65 0 0 1 6.58 6.6L12 20.25z",
        menu: "M4 7h16M4 12h16M4 17h16",
        pin: "M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
        search: "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
        sliders: "M4 7h7M15 7h5M13 5v4M4 12h4M12 12h8M10 10v4M4 17h9M17 17h3M15 15v4",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 overflow-visible ${className}`}>
      <path d={paths[type]} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function EmptyState({ title, description, compact = false, }) {
    return (<div className={`flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-white px-6 text-center shadow-sm ${compact ? "py-8" : "py-12"}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
        <Icon type="search" className="h-5 w-5"/>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-app-cafe-profundo">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">
        {description}
      </p>
    </div>);
}
function formatarDataReserva(data) {
    return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        weekday: "long",
    });
}
function formatarHorario(horario) {
    return horario?.slice(0, 5) ?? "--:--";
}
function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}
export default function DashboardPage() {
    const [activeFilter, setActiveFilter] = useState(filters[0]);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [message, setMessage] = useState("");
    const [updatingFavorite, setUpdatingFavorite] = useState("");
    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [query]);
    useEffect(() => {
        async function loadRestaurants() {
            try {
                const endpoint = debouncedQuery
                    ? `/restaurantes?q=${encodeURIComponent(debouncedQuery)}`
                    : "/restaurantes";
                const data = await apiRequest(endpoint);
                setRestaurants(data.map((restaurant) => ({
                    id: String(restaurant.id_restaurante),
                    name: restaurant.nome,
                    specialty: "Restaurante",
                    neighborhood: restaurant.endereco ?? undefined,
                    imageUrl: restaurant.logo_url ?? undefined,
                    openingHours: restaurant.horario_funcionamento ?? undefined,
                    rating: restaurant.avaliacao_media,
                    reviewCount: restaurant.total_avaliacoes ?? 0,
                    favoriteCount: restaurant.total_favoritos ?? 0,
                    isFavorite: Boolean(restaurant.favorito_cliente),
                    matchedProducts: restaurant.produtos_encontrados ?? [],
                })));
            }
            catch (error) {
                setMessage(error instanceof Error
                    ? error.message
                    : "Nao foi possivel carregar restaurantes.");
            }
        }
        loadRestaurants();
    }, [debouncedQuery]);
    useEffect(() => {
        async function loadReservations() {
            try {
                const data = await apiRequest("/reservas");
                setReservas(data ?? []);
            }
            catch {
                setReservas([]);
            }
        }
        loadReservations();
    }, []);
    const proximaReserva = useMemo(() => {
        const agora = new Date();
        return reservas
            .filter((reserva) => reserva.status_reserva === "CONFIRMADA")
            .filter((reserva) => new Date(`${reserva.data_reserva}T${reserva.horario_inicio}`) >= agora)
            .sort((a, b) => new Date(`${a.data_reserva}T${a.horario_inicio}`) - new Date(`${b.data_reserva}T${b.horario_inicio}`))[0];
    }, [reservas]);
    const filteredRestaurants = useMemo(() => {
        return restaurants.filter((restaurant) => {
            const matchesFilter = activeFilter === "Todas Especialidades" ||
                restaurant.specialty === activeFilter;
            const normalizedQuery = query.trim().toLowerCase();
            const matchesSearch = !normalizedQuery ||
                restaurant.name.toLowerCase().includes(normalizedQuery) ||
                restaurant.specialty.toLowerCase().includes(normalizedQuery) ||
                (restaurant.matchedProducts ?? []).some((produto) => `${produto.nome ?? ""} ${produto.descricao ?? ""}`.toLowerCase().includes(normalizedQuery));
            return matchesFilter && matchesSearch;
        });
    }, [activeFilter, query, restaurants]);
    const highlightedRestaurants = useMemo(() => [...restaurants].sort((a, b) => b.favoriteCount - a.favoriteCount).slice(0, 3), [restaurants]);
    async function alternarFavorito(id) {
        const atual = restaurants.find((restaurant) => restaurant.id === id);
        if (!atual || updatingFavorite) return;
        const novoEstado = !atual.isFavorite;
        setUpdatingFavorite(id);
        setRestaurants((items) => items.map((restaurant) => restaurant.id === id ? { ...restaurant, isFavorite: novoEstado } : restaurant));
        try {
            const resposta = await apiRequest(`/restaurantes/${id}/favorito`, { method: "PATCH", body: JSON.stringify({ favorito: novoEstado }) });
            setRestaurants((items) => items.map((restaurant) => restaurant.id === id ? { ...restaurant, isFavorite: resposta.favorito_cliente, favoriteCount: resposta.total_favoritos } : restaurant));
        } catch (error) {
            setRestaurants((items) => items.map((restaurant) => restaurant.id === id ? atual : restaurant));
            setMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar o favorito.");
        } finally {
            setUpdatingFavorite("");
        }
    }
    return (<main className="min-h-screen bg-white text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div className="shrink-0" aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority/>
          </div>

          <nav className="hidden items-center justify-self-center gap-7 text-xs font-semibold text-app-cinza lg:flex">
            {navItems.map((item, index) => (<Link key={item.label} href={item.href} className={index === 0
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <button type="button" className="transition hover:text-app-caramelo-torrado" aria-label="Sacola">
              <Icon type="bag"/>
            </button>
            <ItemHeaderNotificacoes href="/cliente/notificacoes" />
          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-white lg:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="client-mobile-menu">
              <Icon type="menu"/>
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (<nav id="client-mobile-menu" className="border-t border-app-baunilha-dourada/50 bg-white px-5 py-3 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={index === 0
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      <section className="border-b border-app-baunilha-dourada/50 bg-white px-5 py-5">
        <div className="mx-auto max-w-7xl">
          <label className="campo-busca-app mx-auto flex h-12 max-w-xl items-center gap-3 rounded-[8px] border border-app-baunilha-dourada bg-white px-4 text-app-mocha shadow-sm">
            <Icon type="search" className="h-5 w-5 shrink-0"/>
            <span className="sr-only">Buscar restaurantes</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo outline-none placeholder:text-app-cinza"/>
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {filters.map((filter) => (<button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`h-10 rounded-[8px] border px-5 text-xs font-semibold transition ${activeFilter === filter
                ? "border-app-caramelo-torrado bg-app-caramelo-torrado text-app-chantilly"
                : "border-app-baunilha-dourada bg-white text-app-mocha hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada hover:text-app-cafe-profundo"}`}>
                {filter}
              </button>))}
            <button type="button" className="flex h-10 items-center gap-2 rounded-[8px] px-2 text-xs font-semibold text-app-cafe-profundo transition hover:text-app-caramelo-torrado">
              <Icon type="sliders"/>
              Filtrar por Distância
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 rounded-[12px] bg-app-cafe-profundo p-5 text-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/35 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">
                Proxima reserva
              </p>
              {proximaReserva ? (<>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {proximaReserva.restaurantes?.nome ?? "Restaurante"}
                  </h2>
                  <p className="mt-2 text-sm capitalize text-app-creme-suave">
                    {formatarDataReserva(proximaReserva.data_reserva)} as {formatarHorario(proximaReserva.horario_inicio)}
                  </p>
                  <p className="mt-1 text-sm text-app-baunilha-dourada">
                    {proximaReserva.quantidade_pessoas} pessoas | Consumo minimo {formatarMoeda(proximaReserva.valor_minimo_total)}
                  </p>
                </>) : (<>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Nenhuma reserva ativa
                  </h2>
                  <p className="mt-2 text-sm text-app-creme-suave">
                    Escolha um restaurante para agendar sua proxima experiencia.
                  </p>
                </>)}
            </div>
            <Link href="/cliente/reservas" className="inline-flex h-11 w-fit items-center justify-center rounded-[8px] bg-app-baunilha-dourada px-5 text-xs font-bold uppercase tracking-[0.14em] text-app-cafe-profundo transition hover:bg-app-dourado-mel hover:text-white">
              Ver reservas
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
              Os favoritos da comunidade
            </p>
            <h1 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">
              Mais Curtidos
            </h1>
          </div>
          <Link href="/cliente/favoritos" className="w-fit text-[10px] font-bold uppercase text-app-caramelo-torrado underline underline-offset-4">
            Ver todos
          </Link>
        </div>
        {message ? (<p className="mt-4 rounded-[8px] bg-white p-3 text-sm font-semibold text-app-caramelo-torrado">
            {message}
          </p>) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.48fr]">
          <EmptyState title="Nenhum destaque disponível" description="Os restaurantes mais curtidos aparecerão aqui quando forem cadastrados e avaliados pela comunidade."/>

          <div className="grid gap-6">
            {highlightedRestaurants.length ? (highlightedRestaurants.map((restaurant) => (<article key={restaurant.id} className="rounded-[8px] border border-app-baunilha-dourada bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                  <p className="mt-1 text-sm text-app-cinza">
                    {restaurant.favoriteCount} favorito(s) · {restaurant.rating?.toFixed(1) ?? "Novo"}
                  </p>
                </article>))) : (<EmptyState compact title="Lista em construção" description="Ainda não há restaurantes favoritos para exibir."/>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-[8px] bg-white p-6 sm:p-8">
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
              <Icon type="pin" className="h-4 w-4"/>
              Localização será definida pelo perfil
            </p>
          </div>

          <div className="mt-6">
            {filteredRestaurants.length ? (<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredRestaurants.map((restaurant) => (<article key={restaurant.id} className="group relative min-w-0 rounded-[8px] border border-app-baunilha-dourada bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-app-caramelo-torrado/55 hover:shadow-md">
                    <Link href={`/cliente/restaurantes/${restaurant.id}`} className="flex min-w-0 gap-3" aria-label={`Ver ${restaurant.name}`}>
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[8px] bg-white">
                        {restaurant.imageUrl ? (<Image src={restaurant.imageUrl} alt={restaurant.name} fill sizes="96px" className="object-cover transition duration-300 group-hover:scale-105"/>) : (<div className="flex h-full items-center justify-center bg-app-baunilha-dourada/45 px-2 text-center text-xs font-medium leading-4 text-app-mocha">
                            Imagem em breve
                          </div>)}
                      </div>

                      <div className="min-w-0 flex-1 py-0.5 pr-7">
                        <h3 className="truncate text-[15px] font-semibold leading-5 text-app-cafe-profundo antialiased">
                          {restaurant.name}
                        </h3>
                        <p className="mt-0.5 truncate text-xs font-medium leading-4 text-app-mocha antialiased">
                          <span className="font-semibold text-app-caramelo-torrado">
                            {restaurant.rating?.toFixed(1) ?? "Novo"}
                          </span>
                          <span className="mx-1.5 text-app-cinza">•</span>
                          {restaurant.specialty}
                        </p>
                        <p className="mt-1 truncate text-xs leading-4 text-app-mocha antialiased">
                          {restaurant.neighborhood ?? "Endereco em atualizacao"}
                        </p>
                        <p className="truncate text-xs leading-4 text-app-mocha antialiased">
                          {restaurant.openingHours && restaurant.openingHours !== "A definir"
                    ? restaurant.openingHours
                    : "Consulte os horarios"}
                        </p>
                        {restaurant.matchedProducts?.length ? (
                          <p className="mt-1 truncate text-xs font-semibold leading-4 text-app-caramelo-torrado antialiased">
                            Encontrado no cardápio: {restaurant.matchedProducts.map((produto) => produto.nome).join(", ")}
                          </p>
                        ) : null}
                        <span className="mt-1 inline-flex rounded-[5px] bg-white px-2 py-0.5 text-xs font-semibold leading-4 text-app-caramelo-torrado antialiased">
                          Reserva e pedido antecipado
                        </span>
                      </div>
                    </Link>

                    <button type="button" disabled={updatingFavorite === restaurant.id} onClick={() => alternarFavorito(restaurant.id)} className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full p-1.5 transition disabled:opacity-50 ${restaurant.isFavorite
                    ? "bg-white text-app-vermelho-erro"
                    : "text-app-mocha hover:bg-app-chantilly hover:text-app-vermelho-erro"}`} aria-label={`${restaurant.isFavorite ? "Remover" : "Adicionar"} ${restaurant.name} dos favoritos`} aria-pressed={restaurant.isFavorite}>
                      <Icon type="heart" filled={restaurant.isFavorite} className="h-full w-full"/>
                    </button>
                  </article>))}
              </div>) : (<EmptyState title="Nenhum restaurante encontrado" description="Nenhum restaurante corresponde aos filtros selecionados."/>)}
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
          {specialties.length ? (<div className="grid gap-8 lg:grid-cols-3">
              {specialties.map((specialty) => (<article key={specialty.id} className="rounded-[8px] border border-app-baunilha-dourada bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold">{specialty.name}</h3>
                  {specialty.description ? (<p className="mt-2 text-sm leading-6 text-app-cinza">
                      {specialty.description}
                    </p>) : null}
                </article>))}
            </div>) : (<EmptyState title="Especialidades ainda não disponíveis" description="As categorias em destaque serão exibidas assim que houver restaurantes e cardápios cadastrados."/>)}
        </div>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
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
    </main>);
}

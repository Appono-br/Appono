"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { apiRequest } from "@/lib/api";

const filters = ["Todos", "Favoritos", "Com horário cadastrado"];

const navItems = [
  { label: "Início", href: "/cliente/dashboard" },
  { label: "Detalhes do pedido", href: "/cliente/detalhes-pedido" },
  { label: "Reservas", href: "/cliente/reservas" },
  { label: "Favoritos", href: "/cliente/favoritos" },
  { label: "Mensagens", href: "/cliente/mensagens" },
  { label: "Configurações", href: "/cliente/configuracoes" },
];

function Icon({ type, className = "h-5 w-5", filled = false }) {
  const paths = {
    bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
    heart: "M12 20.25 4.35 12.9A4.65 4.65 0 0 1 10.93 6.3L12 7.38l1.07-1.08a4.65 4.65 0 0 1 6.58 6.6L12 20.25z",
    menu: "M4 7h16M4 12h16M4 17h16",
    pin: "M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    search: "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
    sliders: "M4 7h7M15 7h5M13 5v4M4 12h4M12 12h8M10 10v4M4 17h9M17 17h3M15 15v4",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 overflow-visible ${className}`}>
      <path d={paths[type]} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function normalizarBusca(valor) {
  return String(valor ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function mapearRestaurante(restaurante) {
  return {
    id: String(restaurante.id_restaurante),
    name: restaurante.nome,
    specialty: "Restaurante",
    neighborhood: restaurante.endereco ?? undefined,
    imageUrl: restaurante.logo_url ?? undefined,
    openingHours: restaurante.horario_funcionamento ?? undefined,
    minimumValue: restaurante.valor_minimo_reserva_por_pessoa ?? 0,
    rating: restaurante.avaliacao_media,
    reviews: restaurante.total_avaliacoes ?? 0,
    favorites: restaurante.total_favoritos ?? 0,
    isFavorite: Boolean(restaurante.favorito_cliente),
    matchedProducts: restaurante.produtos_encontrados ?? [],
  };
}

function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-app-creme-leve px-6 py-10 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
        <Icon type="search" className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-app-cafe-profundo">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">{description}</p> : null}
    </div>
  );
}

function RestaurantCard({ restaurant, onToggleFavorite }) {
  return (
    <article className="group relative min-w-0 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-app-caramelo-torrado/55 hover:shadow-md">
      <Link href={`/cliente/restaurantes/${restaurant.id}`} className="flex min-w-0 gap-3" aria-label={`Ver ${restaurant.name}`}>
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[8px] bg-app-creme-leve">
          {restaurant.imageUrl ? (
            <Image src={restaurant.imageUrl} alt={restaurant.name} fill sizes="96px" className="object-cover transition duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center bg-app-baunilha-dourada/45 px-2 text-center text-xs font-medium leading-4 text-app-mocha">Imagem em breve</div>
          )}
        </div>
        <div className="min-w-0 flex-1 py-0.5 pr-7">
          <h3 className="truncate text-[15px] font-semibold leading-5 text-app-cafe-profundo antialiased">{restaurant.name}</h3>
          <p className="mt-0.5 truncate text-xs font-medium leading-4 text-app-mocha antialiased">
            <span className="font-semibold text-app-caramelo-torrado">{restaurant.rating ? `${restaurant.rating.toFixed(1)} estrelas` : "Novo"}</span>
            <span className="mx-1.5 text-app-cinza">•</span>
            {restaurant.favorites} favorito(s)
          </p>
          <p className="mt-1 truncate text-xs leading-4 text-app-mocha antialiased">{restaurant.neighborhood ?? "Endereço em atualização"}</p>
          <p className="truncate text-xs leading-4 text-app-mocha antialiased">{restaurant.openingHours && restaurant.openingHours !== "A definir" ? restaurant.openingHours : "Consulte os horários"}</p>
          <span className="mt-1 inline-flex rounded-[5px] bg-app-creme-suave px-2 py-0.5 text-xs font-semibold leading-4 text-app-caramelo-torrado antialiased">Reserva e pedido antecipado</span>
        </div>
      </Link>
      <button type="button" onClick={() => onToggleFavorite(restaurant.id)} className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full p-1.5 transition ${restaurant.isFavorite ? "bg-app-creme-suave text-app-vermelho-erro" : "text-app-mocha hover:bg-app-creme-suave hover:text-app-vermelho-erro"}`} aria-label={`${restaurant.isFavorite ? "Remover" : "Adicionar"} ${restaurant.name} dos favoritos`} aria-pressed={restaurant.isFavorite}>
        <Icon type="heart" filled={restaurant.isFavorite} className="h-full w-full" />
      </button>
    </article>
  );
}

function SearchResult({ restaurant, onClose }) {
  return (
    <Link href={`/cliente/restaurantes/${restaurant.id}`} onClick={onClose} className="flex gap-3 rounded-[10px] bg-app-chantilly p-3 text-left transition hover:bg-app-baunilha-dourada/35">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[8px] bg-app-creme-leve">
        {restaurant.imageUrl ? <Image src={restaurant.imageUrl} alt={restaurant.name} fill sizes="56px" className="object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <strong className="block truncate text-sm text-app-cafe-profundo">{restaurant.name}</strong>
        <span className="mt-1 block truncate text-xs text-app-mocha">{restaurant.neighborhood ?? "Endereço em atualização"}</span>
        {restaurant.matchedProducts?.length ? <span className="mt-1 block truncate text-xs font-semibold text-app-caramelo-torrado">Encontrado no cardápio: {restaurant.matchedProducts.map((produto) => produto.nome).join(", ")}</span> : null}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [message, setMessage] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [favoritoEmAtualizacao, setFavoritoEmAtualizacao] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let ativo = true;
    async function loadRestaurants() {
      setCarregando(true);
      try {
        const params = new URLSearchParams();
        if (debouncedQuery) {
          params.set("q", debouncedQuery);
        }
        const data = await apiRequest(`/restaurantes${params.toString() ? `?${params.toString()}` : ""}`);
        if (ativo) {
          setRestaurants((data ?? []).map(mapearRestaurante));
          setMessage("");
        }
      }
      catch (error) {
        if (ativo) {
          setMessage(error instanceof Error ? error.message : "Não foi possível carregar restaurantes.");
        }
      }
      finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }
    loadRestaurants();
    return () => {
      ativo = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    apiRequest("/reservas").then((data) => setReservas(data ?? [])).catch(() => setReservas([]));
  }, []);

  const proximaReserva = useMemo(() => {
    const agora = new Date();
    return reservas
      .filter((reserva) => ["CONFIRMADA", "CHECK_IN"].includes(reserva.status_reserva))
      .filter((reserva) => new Date(`${reserva.data_reserva}T${reserva.horario_inicio}`) >= agora)
      .sort((a, b) => new Date(`${a.data_reserva}T${a.horario_inicio}`) - new Date(`${b.data_reserva}T${b.horario_inicio}`))[0];
  }, [reservas]);

  const filteredRestaurants = useMemo(() => {
    const termo = normalizarBusca(query);
    return restaurants.filter((restaurant) => {
      if (activeFilter === "Favoritos" && !restaurant.isFavorite) return false;
      if (activeFilter === "Com horário cadastrado" && (!restaurant.openingHours || restaurant.openingHours === "A definir")) return false;
      if (!termo) return true;
      return [restaurant.name, restaurant.specialty, restaurant.neighborhood, restaurant.openingHours, ...restaurant.matchedProducts.map((produto) => produto.nome)].map(normalizarBusca).join(" ").includes(termo);
    });
  }, [activeFilter, query, restaurants]);

  const maisCurtidos = useMemo(() => {
    return [...restaurants]
      .filter((restaurant) => Number(restaurant.favorites ?? 0) > 0 || Number(restaurant.rating ?? 0) > 0)
      .sort((a, b) => Number(b.favorites ?? 0) - Number(a.favorites ?? 0) || Number(b.rating ?? 0) - Number(a.rating ?? 0))
      .slice(0, 3);
  }, [restaurants]);

  async function alternarFavorito(id) {
    const atual = restaurants.find((restaurante) => restaurante.id === id);
    if (!atual || favoritoEmAtualizacao === id) return;
    const proximoFavorito = !atual.isFavorite;
    setFavoritoEmAtualizacao(id);
    setRestaurants((atuais) => atuais.map((restaurante) => restaurante.id === id ? { ...restaurante, isFavorite: proximoFavorito, favorites: Math.max(0, Number(restaurante.favorites ?? 0) + (proximoFavorito ? 1 : -1)) } : restaurante));
    try {
      const resposta = await apiRequest(`/restaurantes/${id}/favorito`, {
        method: "PATCH",
        body: JSON.stringify({ favorito: proximoFavorito }),
      });
      setRestaurants((atuais) => atuais.map((restaurante) => restaurante.id === id ? { ...restaurante, isFavorite: Boolean(resposta.favorito_cliente), favorites: resposta.total_favoritos ?? restaurante.favorites, rating: resposta.avaliacao_media ?? restaurante.rating, reviews: resposta.total_avaliacoes ?? restaurante.reviews } : restaurante));
    }
    catch (error) {
      setRestaurants((atuais) => atuais.map((restaurante) => restaurante.id === id ? atual : restaurante));
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar favorito.");
    }
    finally {
      setFavoritoEmAtualizacao("");
    }
  }

  const buscaAtiva = query.trim().length > 0;

  return (
    <main className="min-h-screen bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div className="shrink-0" aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority />
          </div>
          <nav className="hidden items-center justify-self-center gap-7 text-xs font-semibold text-app-cinza lg:flex">
            {navItems.map((item) => <Link key={item.label} href={item.href} className={item.href === "/cliente/dashboard" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>{item.label}</Link>)}
          </nav>
          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <button type="button" className="transition hover:text-app-caramelo-torrado" aria-label="Sacola"><Icon type="bag" /></button>
            <ItemHeaderNotificacoes href="/cliente/notificacoes" />
            <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve lg:hidden" aria-label="Abrir menu"><Icon type="menu" /></button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <nav className="border-t border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-3 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item) => <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/cliente/dashboard" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>{item.label}</Link>)}
            </div>
          </nav>
        ) : null}
      </header>

      <section className="border-b border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-5">
        <div className="relative mx-auto max-w-7xl">
          <label className="campo-busca-app mx-auto flex h-12 max-w-xl items-center gap-3 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-4 text-app-mocha shadow-sm">
            <Icon type="search" className="h-5 w-5 shrink-0" />
            <span className="sr-only">Buscar restaurantes</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar restaurante ou item do cardápio" className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo placeholder:text-app-cinza" />
            {query ? <button type="button" onClick={() => setQuery("")} className="text-xs font-bold uppercase text-app-caramelo-torrado transition hover:text-app-cafe-profundo">Limpar</button> : null}
          </label>
          {buscaAtiva ? (
            <div className="absolute left-1/2 top-14 z-20 w-full max-w-xl -translate-x-1/2 rounded-[14px] border border-app-baunilha-dourada bg-app-creme-leve p-3 shadow-xl">
              {carregando ? <p className="rounded-[10px] bg-app-chantilly p-4 text-sm font-semibold text-app-mocha">Atualizando restaurantes...</p> : filteredRestaurants.length ? filteredRestaurants.slice(0, 6).map((restaurant) => <SearchResult key={restaurant.id} restaurant={restaurant} onClose={() => setQuery("")} />) : <p className="rounded-[10px] bg-app-chantilly p-4 text-sm leading-6 text-app-mocha">Nenhum restaurante encontrado. Tente buscar por nome, endereço, horário ou item do cardápio.</p>}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {filters.map((filter) => <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`h-10 rounded-[8px] border px-5 text-xs font-semibold transition ${activeFilter === filter ? "border-app-caramelo-torrado bg-app-caramelo-torrado text-app-chantilly" : "border-app-baunilha-dourada bg-app-chantilly text-app-mocha hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada hover:text-app-cafe-profundo"}`}>{filter}</button>)}
            <button type="button" className="flex h-10 items-center gap-2 rounded-[8px] px-2 text-xs font-semibold text-app-cafe-profundo transition hover:text-app-caramelo-torrado"><Icon type="sliders" />Filtros</button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 rounded-[12px] bg-app-cafe-profundo p-5 text-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/35 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">Próxima reserva</p>
              {proximaReserva ? (
                <>
                  <h2 className="mt-2 text-2xl font-semibold">{proximaReserva.restaurantes?.nome ?? "Restaurante"}</h2>
                  <p className="mt-2 text-sm capitalize text-app-creme-suave">{formatarDataReserva(proximaReserva.data_reserva)} às {formatarHorario(proximaReserva.horario_inicio)}</p>
                  <p className="mt-1 text-sm text-app-baunilha-dourada">{proximaReserva.quantidade_pessoas} pessoas | Consumo mínimo {formatarMoeda(proximaReserva.valor_minimo_total)}</p>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-2xl font-semibold">Nenhuma reserva ativa</h2>
                  <p className="mt-2 text-sm text-app-creme-suave">Escolha um restaurante para agendar sua próxima experiência.</p>
                </>
              )}
            </div>
            <Link href="/cliente/reservas" className="inline-flex h-11 w-fit items-center justify-center rounded-[8px] bg-app-baunilha-dourada px-5 text-xs font-bold uppercase tracking-[0.14em] text-app-cafe-profundo transition hover:bg-app-dourado-mel hover:text-white">Ver reservas</Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">Os favoritos da comunidade</p>
            <h1 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">Mais curtidos</h1>
          </div>
          <Link href="/cliente/favoritos" className="w-fit text-[10px] font-bold uppercase text-app-caramelo-torrado underline underline-offset-4">Meus favoritos</Link>
        </div>
        {message ? <p className="mt-4 rounded-[8px] bg-app-creme-leve p-3 text-sm font-semibold text-app-caramelo-torrado">{message}</p> : null}
        <div className="mt-8">
          {maisCurtidos.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{maisCurtidos.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} onToggleFavorite={alternarFavorito} />)}</div> : <EmptyState title="Nenhum destaque disponível" description="Os restaurantes favoritos e bem avaliados aparecerão aqui conforme os clientes usam a plataforma." />}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-[8px] bg-app-creme-leve p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">Conveniência e frescor</p>
              <h2 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">Perto de você</h2>
            </div>
            <p className="flex items-center gap-2 text-sm text-app-mocha"><Icon type="pin" className="h-4 w-4" />Localização será definida pelo perfil</p>
          </div>
          <div className="mt-6 rounded-[8px] border border-dashed border-app-baunilha-dourada bg-app-chantilly p-8" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-[8px] bg-app-creme-leve p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">Restaurantes disponíveis</p>
              <h2 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">Escolha onde reservar</h2>
            </div>
          </div>
          <div className="mt-6">
            {filteredRestaurants.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredRestaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} onToggleFavorite={alternarFavorito} />)}</div> : <EmptyState title={activeFilter === "Favoritos" ? "Nenhum favorito ainda" : "Nenhum restaurante encontrado"} description={activeFilter === "Favoritos" ? "Toque no coração de um restaurante para salvar e consultar depois." : "Nenhum restaurante corresponde aos filtros selecionados."} />}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">A arte da escolha</p>
          <h2 className="mt-3 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">Especialidades em destaque</h2>
        </div>
        <div className="mt-10"><EmptyState title="Especialidades ainda não disponíveis" /></div>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert" />
          <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">Política de Privacidade</Link>
            <Link href="#" className="transition hover:text-app-chantilly">Termos de Uso</Link>
            <Link href="#" className="transition hover:text-app-chantilly">Contato</Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">&copy; 2026 APPONO. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}

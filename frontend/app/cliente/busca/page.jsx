"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { apiRequest } from "@/lib/api";
import { filtrarOrdenarPorBusca, textoBusca } from "@/lib/busca-avancada";

const filtrosBusca = [
  { id: "todos", label: "Todos" },
  { id: "favoritos", label: "Favoritos" },
  { id: "bem-avaliados", label: "4+ estrelas" },
  { id: "reserva", label: "Aceita reserva" },
  { id: "cardapio", label: "Com cardápio" },
];

const opcoesRaio = [
  { value: "2", label: "Até 2 km" },
  { value: "5", label: "Até 5 km" },
  { value: "10", label: "Até 10 km" },
  { value: "20", label: "Até 20 km" },
  { value: "todos", label: "Qualquer distância" },
];

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
    arrow: "M19 12H5m6-6-6 6 6 6",
    bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
    heart: "M12 20.25 4.35 12.9A4.65 4.65 0 0 1 10.93 6.3L12 7.38l1.07-1.08a4.65 4.65 0 0 1 6.58 6.6L12 20.25z",
    menu: "M4 7h16M4 12h16M4 17h16",
    pin: "M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    search: "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
    star: "m12 3 2.8 5.7 6.3.9-4.55 4.4 1.08 6.2L12 17.7 6.37 20.2 7.45 14 2.9 9.6l6.3-.9L12 3z",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 overflow-visible ${className}`}>
      <path d={paths[type]} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function formatarDistancia(valor) {
  const distancia = Number(valor);
  if (!Number.isFinite(distancia)) return "Distância indisponível";
  if (distancia < 1) return `${Math.max(100, Math.round((distancia * 1000) / 100) * 100)} m`;
  return `${distancia.toFixed(distancia < 10 ? 1 : 0).replace(".", ",")} km`;
}

function obterCamposRestaurante(restaurant) {
  return [
    restaurant.name,
    restaurant.neighborhood,
    restaurant.openingHours,
    ...(restaurant.matchedProducts ?? []).map((produto) => textoBusca(produto.nome, produto.descricao)),
    ...(restaurant.matchedCategories ?? []).map((categoria) => textoBusca(categoria.nome, categoria.descricao)),
    ...(restaurant.matchedMenus ?? []).map((cardapio) => textoBusca(cardapio.nome, cardapio.descricao)),
    ...(restaurant.publishedCategories ?? []).map((categoria) => textoBusca(categoria.nome, categoria.descricao)),
  ];
}

function obterRotulosCorrespondencia(restaurant) {
  return [
    ...(restaurant.matchedProducts ?? []).map((produto) => `Prato: ${produto.nome}`),
    ...(restaurant.matchedCategories ?? []).map((categoria) => `Categoria: ${categoria.nome}`),
    ...(restaurant.matchedMenus ?? []).map((cardapio) => `Cardápio: ${cardapio.nome}`),
  ].filter(Boolean).slice(0, 3);
}

function mapearRestaurante(restaurant) {
  return {
    id: String(restaurant.id_restaurante),
    name: restaurant.nome,
    neighborhood: restaurant.endereco ?? undefined,
    imageUrl: restaurant.logo_url ?? undefined,
    openingHours: restaurant.horario_funcionamento ?? undefined,
    rating: restaurant.avaliacao_media,
    reviewCount: restaurant.total_avaliacoes ?? 0,
    favoriteCount: restaurant.total_favoritos ?? 0,
    isFavorite: Boolean(restaurant.favorito_cliente),
    matchedProducts: restaurant.produtos_encontrados ?? [],
    matchedCategories: restaurant.categorias_encontradas ?? [],
    matchedMenus: restaurant.cardapios_encontrados ?? [],
    publishedCategories: restaurant.categorias_publicadas ?? [],
    menuItemsCount: restaurant.total_itens_cardapio ?? 0,
    hasMenu: Boolean(restaurant.tem_cardapio_publicado),
    acceptsReservation: Boolean(restaurant.aceita_reserva),
    distanceKm: restaurant.distancia_km,
    resolvedLocation: restaurant.localizacao_resolvida,
  };
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[16px] border border-dashed border-app-baunilha-dourada bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-chantilly text-app-cafe-profundo">
        <Icon type="search" className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-app-cafe-profundo">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-app-cinza">{description}</p>
    </div>
  );
}

function BuscaClienteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const termoInicial = searchParams.get("q") ?? "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [termo, setTermo] = useState(termoInicial);
  const [debouncedTermo, setDebouncedTermo] = useState(termoInicial);
  const [filtroBusca, setFiltroBusca] = useState("todos");
  const [ordenacaoBusca, setOrdenacaoBusca] = useState("relevancia");
  const [raioKm, setRaioKm] = useState("5");
  const [localizacaoCliente, setLocalizacaoCliente] = useState(null);
  const [localizacaoManual, setLocalizacaoManual] = useState("");
  const [localizacaoManualAplicada, setLocalizacaoManualAplicada] = useState("");
  const [statusLocalizacao, setStatusLocalizacao] = useState("idle");
  const [restaurantes, setRestaurantes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [updatingFavorite, setUpdatingFavorite] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedTermo(termo.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [termo]);

  useEffect(() => {
    async function carregarRestaurantes() {
      setCarregando(true);
      setMensagem("");
      try {
        const endpoint = new URLSearchParams();
        if (debouncedTermo) endpoint.set("q", debouncedTermo);
        if (localizacaoCliente) {
          endpoint.set("latitude", String(localizacaoCliente.latitude));
          endpoint.set("longitude", String(localizacaoCliente.longitude));
        } else if (localizacaoManualAplicada) {
          endpoint.set("localizacao", localizacaoManualAplicada);
        }
        if ((localizacaoCliente || localizacaoManualAplicada) && raioKm !== "todos") {
          endpoint.set("raio_km", raioKm);
        }
        const queryString = endpoint.toString();
        const data = await apiRequest(`/restaurantes${queryString ? `?${queryString}` : ""}`, { forceRefresh: true });
        setRestaurantes((data ?? []).map(mapearRestaurante));
      } catch (error) {
        setMensagem(error instanceof Error ? error.message : "Não foi possível carregar os restaurantes.");
      } finally {
        setCarregando(false);
      }
    }
    carregarRestaurantes();
  }, [debouncedTermo, localizacaoCliente, localizacaoManualAplicada, raioKm]);

  const resultados = useMemo(() => {
    const base = debouncedTermo ? filtrarOrdenarPorBusca(restaurantes, debouncedTermo, obterCamposRestaurante) : restaurantes;
    const filtrados = base.filter((restaurant) => {
      if (filtroBusca === "favoritos") return restaurant.isFavorite;
      if (filtroBusca === "bem-avaliados") return Number(restaurant.rating ?? 0) >= 4;
      if (filtroBusca === "reserva") return restaurant.acceptsReservation;
      if (filtroBusca === "cardapio") return restaurant.hasMenu;
      return true;
    });
    if (ordenacaoBusca === "distancia") {
      return [...filtrados].sort((a, b) => {
        const distanciaA = Number.isFinite(Number(a.distanceKm)) ? Number(a.distanceKm) : Number.POSITIVE_INFINITY;
        const distanciaB = Number.isFinite(Number(b.distanceKm)) ? Number(b.distanceKm) : Number.POSITIVE_INFINITY;
        return distanciaA - distanciaB;
      });
    }
    if (ordenacaoBusca === "avaliacao") {
      return [...filtrados].sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
    }
    if (ordenacaoBusca === "curtidos") {
      return [...filtrados].sort((a, b) => Number(b.favoriteCount ?? 0) - Number(a.favoriteCount ?? 0));
    }
    return filtrados;
  }, [debouncedTermo, filtroBusca, ordenacaoBusca, restaurantes]);

  function submeterBusca(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (termo.trim()) params.set("q", termo.trim());
    router.replace(`/cliente/busca${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function solicitarLocalizacao() {
    if (!("geolocation" in navigator)) {
      setStatusLocalizacao("unsupported");
      return;
    }
    setStatusLocalizacao("loading");
    navigator.geolocation.getCurrentPosition((posicao) => {
      setLocalizacaoCliente({
        latitude: Number(posicao.coords.latitude.toFixed(7)),
        longitude: Number(posicao.coords.longitude.toFixed(7)),
      });
      setLocalizacaoManualAplicada("");
      setStatusLocalizacao("ready");
    }, () => setStatusLocalizacao("denied"));
  }

  function aplicarLocalizacaoManual(event) {
    event.preventDefault();
    const localizacao = localizacaoManual.trim();
    if (!localizacao) return;
    setLocalizacaoCliente(null);
    setLocalizacaoManualAplicada(localizacao);
    setStatusLocalizacao("manual");
  }

  async function alternarFavorito(id) {
    const atual = restaurantes.find((restaurant) => restaurant.id === id);
    if (!atual) return;
    const novoEstado = !atual.isFavorite;
    setUpdatingFavorite(id);
    setRestaurantes((items) => items.map((restaurant) => restaurant.id === id
      ? { ...restaurant, isFavorite: novoEstado, favoriteCount: Math.max(0, Number(restaurant.favoriteCount ?? 0) + (novoEstado ? 1 : -1)) }
      : restaurant));
    try {
      const resposta = await apiRequest(`/restaurantes/${id}/favorito`, {
        method: "PATCH",
        body: JSON.stringify({ favorito: novoEstado }),
      });
      setRestaurantes((items) => items.map((restaurant) => restaurant.id === id
        ? { ...restaurant, isFavorite: resposta.favorito_cliente, favoriteCount: resposta.total_favoritos }
        : restaurant));
    } catch (error) {
      setRestaurantes((items) => items.map((restaurant) => restaurant.id === id ? atual : restaurant));
      setMensagem(error instanceof Error ? error.message : "Não foi possível atualizar o favorito.");
    } finally {
      setUpdatingFavorite("");
    }
  }

  return (
    <main className="min-h-screen bg-white text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <Link href="/cliente/dashboard" className="shrink-0" aria-label="Voltar ao início">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority />
          </Link>
          <nav className="hidden items-center justify-self-center gap-7 text-xs font-semibold text-app-cinza lg:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-app-cafe-profundo">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <button type="button" className="transition hover:text-app-caramelo-torrado" aria-label="Sacola">
              <Icon type="bag" />
            </button>
            <ItemHeaderNotificacoes href="/cliente/notificacoes" />
            <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-white lg:hidden" aria-label="Abrir menu">
              <Icon type="menu" />
            </button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <nav className="border-t border-app-baunilha-dourada/50 bg-white px-5 py-3 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="transition hover:text-app-cafe-profundo">
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <section className="border-b border-app-baunilha-dourada/50 bg-app-cafe-profundo px-5 py-10 text-app-creme-leve">
        <div className="mx-auto max-w-7xl">
          <Link href="/cliente/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-app-baunilha-dourada transition hover:text-white">
            <Icon type="arrow" className="h-4 w-4" />
            Voltar ao início
          </Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-app-baunilha-dourada">
                Busca avançada
              </p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                Encontre o restaurante certo para sua próxima reserva.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-app-creme-suave">
                Pesquise por restaurante, endereço, categoria ou prato do cardápio.
              </p>
            </div>

            <form onSubmit={submeterBusca} className="rounded-[18px] bg-white p-3 text-app-cafe-profundo shadow-xl ring-1 ring-white/20">
              <label className="campo-busca-app flex h-12 items-center gap-3 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-app-mocha">
                <Icon type="search" className="h-5 w-5" />
                <span className="sr-only">Buscar restaurantes</span>
                <input value={termo} onChange={(event) => setTermo(event.target.value)} placeholder="Busque por lasanha, bairro, restaurante..." className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo outline-none placeholder:text-app-cinza" />
                <button type="submit" className="hidden h-9 rounded-[8px] bg-app-cafe-profundo px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-app-creme-leve transition hover:bg-app-caramelo-torrado sm:inline-flex sm:items-center">
                  Buscar
                </button>
              </label>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-[18px] border border-app-baunilha-dourada/65 bg-white p-4 shadow-sm lg:sticky lg:top-28">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Filtros</p>
          <div className="mt-4 grid gap-2">
            {filtrosBusca.map((filtro) => (
              <button key={filtro.id} type="button" onClick={() => setFiltroBusca(filtro.id)} className={`flex h-10 items-center justify-between rounded-[10px] px-3 text-left text-xs font-bold uppercase tracking-[0.1em] transition ${filtroBusca === filtro.id
                ? "bg-app-cafe-profundo text-app-creme-leve shadow-sm"
                : "bg-white text-app-mocha ring-1 ring-app-baunilha-dourada/70 hover:bg-app-chantilly hover:text-app-cafe-profundo"}`}>
                {filtro.label}
                {filtroBusca === filtro.id ? <span className="h-1.5 w-1.5 rounded-full bg-app-baunilha-dourada" /> : null}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-2 border-t border-app-baunilha-dourada/45 pt-5">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
              Ordenar por
              <select value={ordenacaoBusca} onChange={(event) => setOrdenacaoBusca(event.target.value)} className="h-11 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-caramelo-torrado/15">
                <option value="relevancia">Relevância</option>
                <option value="distancia">Distância</option>
                <option value="avaliacao">Avaliação</option>
                <option value="curtidos">Mais curtidos</option>
              </select>
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
              Raio
              <select value={raioKm} onChange={(event) => setRaioKm(event.target.value)} className="h-11 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-caramelo-torrado/15">
                {opcoesRaio.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-5 border-t border-app-baunilha-dourada/45 pt-5">
            <button type="button" onClick={solicitarLocalizacao} className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-app-caramelo-torrado px-4 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-app-cafe-profundo disabled:opacity-60" disabled={statusLocalizacao === "loading"}>
              <Icon type="pin" className="h-4 w-4" />
              {statusLocalizacao === "loading" ? "Localizando" : "Usar localização"}
            </button>
            <form onSubmit={aplicarLocalizacaoManual} className="mt-3 grid gap-2">
              <input value={localizacaoManual} onChange={(event) => setLocalizacaoManual(event.target.value)} placeholder="Bairro, cidade ou CEP" className="h-11 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-sm text-app-cafe-profundo outline-none transition placeholder:text-app-cinza focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-caramelo-torrado/15" />
              <button type="submit" className="h-10 rounded-[10px] border border-app-baunilha-dourada bg-white text-[10px] font-bold uppercase tracking-[0.14em] text-app-mocha transition hover:bg-app-chantilly hover:text-app-cafe-profundo">
                Aplicar local
              </button>
            </form>
            {statusLocalizacao === "denied" ? <p className="mt-3 text-xs leading-5 text-app-caramelo-torrado">Permissão negada no navegador. Informe um local manualmente.</p> : null}
            {statusLocalizacao === "manual" && localizacaoManualAplicada ? <p className="mt-3 text-xs leading-5 text-app-cinza">Usando: {localizacaoManualAplicada}</p> : null}
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-col gap-3 rounded-[16px] border border-app-baunilha-dourada/60 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Resultados</p>
              <h2 className="mt-1 text-2xl font-semibold text-app-cafe-profundo">
                {carregando ? "Buscando restaurantes" : `${resultados.length} restaurante(s) encontrado(s)`}
              </h2>
            </div>
            <button type="button" onClick={() => {
              setTermo("");
              setFiltroBusca("todos");
              setOrdenacaoBusca("relevancia");
              setLocalizacaoCliente(null);
              setLocalizacaoManual("");
              setLocalizacaoManualAplicada("");
              setStatusLocalizacao("idle");
              router.replace("/cliente/busca");
            }} className="h-10 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-app-mocha transition hover:bg-app-chantilly hover:text-app-cafe-profundo">
              Limpar filtros
            </button>
          </div>

          {mensagem ? <p role="status" className="mb-4 rounded-[10px] border border-app-baunilha-dourada bg-white p-3 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}

          {carregando ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-36 animate-pulse rounded-[16px] bg-app-chantilly ring-1 ring-app-baunilha-dourada/55" />
              ))}
            </div>
          ) : resultados.length ? (
            <div className="grid gap-4">
              {resultados.map((restaurant) => {
                const correspondencias = obterRotulosCorrespondencia(restaurant);
                return (
                  <article key={restaurant.id} className="group relative overflow-hidden rounded-[16px] border border-app-baunilha-dourada/65 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-app-caramelo-torrado/55 hover:shadow-md">
                    <div className="grid gap-4 md:grid-cols-[128px_1fr_auto] md:items-center">
                      <Link href={`/cliente/restaurantes/${restaurant.id}`} className="relative h-32 overflow-hidden rounded-[12px] bg-white ring-1 ring-app-baunilha-dourada/50 md:h-28">
                        {restaurant.imageUrl ? (
                          <Image src={restaurant.imageUrl} alt={restaurant.name} fill sizes="128px" className="object-contain p-3 transition duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-app-chantilly text-xs font-bold uppercase tracking-[0.16em] text-app-mocha">Appono</div>
                        )}
                      </Link>

                      <Link href={`/cliente/restaurantes/${restaurant.id}`} className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {restaurant.acceptsReservation ? <span className="rounded-full bg-app-cafe-profundo px-2.5 py-1 text-[10px] font-bold uppercase text-app-creme-leve">Reservas</span> : null}
                          {restaurant.hasMenu ? <span className="rounded-full border border-app-baunilha-dourada bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-app-caramelo-torrado">{restaurant.menuItemsCount} itens</span> : null}
                          {Number.isFinite(Number(restaurant.distanceKm)) ? <span className="rounded-full border border-app-baunilha-dourada bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-app-mocha">{formatarDistancia(restaurant.distanceKm)}</span> : null}
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold text-app-cafe-profundo">{restaurant.name}</h3>
                        <p className="mt-2 line-clamp-1 text-sm text-app-cinza">{restaurant.neighborhood ?? "Endereço em atualização"}</p>
                        {correspondencias.length ? <p className="mt-2 line-clamp-1 text-sm font-semibold text-app-caramelo-torrado">{correspondencias.join(" | ")}</p> : null}
                        {!correspondencias.length && restaurant.publishedCategories?.length ? <p className="mt-2 line-clamp-1 text-sm font-semibold text-app-caramelo-torrado">{restaurant.publishedCategories.map((categoria) => categoria.nome).slice(0, 3).join(" | ")}</p> : null}
                      </Link>

                      <div className="flex items-center justify-between gap-3 md:grid md:justify-items-end">
                        <div className="flex items-center gap-3 text-sm font-semibold text-app-mocha">
                          <span className="inline-flex items-center gap-1">
                            <Icon type="star" filled className="h-4 w-4 text-app-dourado-mel" />
                            {restaurant.rating?.toFixed(1) ?? "Novo"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Icon type="heart" filled={restaurant.isFavorite} className={`h-4 w-4 ${restaurant.isFavorite ? "text-app-vermelho-erro" : "text-app-cinza"}`} />
                            {restaurant.favoriteCount}
                          </span>
                        </div>
                        <div className="mt-0 flex gap-2 md:mt-4">
                          <button type="button" disabled={updatingFavorite === restaurant.id} onClick={() => alternarFavorito(restaurant.id)} className="h-10 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly hover:text-app-vermelho-erro disabled:opacity-50">
                            {restaurant.isFavorite ? "Remover" : "Favoritar"}
                          </button>
                          <Link href={`/cliente/restaurantes/${restaurant.id}`} className="flex h-10 items-center justify-center rounded-[10px] bg-app-caramelo-torrado px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo">
                            Ver
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Nenhum restaurante encontrado" description="Ajuste os filtros ou busque por outro prato, endereço, bairro ou restaurante." />
          )}
        </section>
      </section>
    </main>
  );
}

export default function BuscaClientePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo">Carregando busca...</main>}>
      <BuscaClienteContent />
    </Suspense>
  );
}

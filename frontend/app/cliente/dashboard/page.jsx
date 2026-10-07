"use client";
import { useInterface } from "@/lib/use-interface";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { filtrarOrdenarPorBusca, textoBusca } from "@/lib/busca-avancada";
import { VitrinePratos } from "@/components/cliente/vitrine-pratos";
import { VitrineOfertas } from "@/components/cliente/vitrine-ofertas";
import { CategoriasRestaurantes } from "@/components/cliente/categorias-restaurantes";
const filters = [
    "Todas Especialidades",
    "Slow Food",
    "Orgânicos",
    "Contemporânea",
    "Vegano Fine Dining",
];
const filtrosBusca = [
    { id: "todos", label: "Todos" },
    { id: "favoritos", label: "Favoritos" },
    { id: "bem-avaliados", label: "4+ estrelas" },
];
const opcoesRaio = [
    { value: "2", label: "Até 2 km" },
    { value: "5", label: "Até 5 km" },
    { value: "10", label: "Até 10 km" },
    { value: "20", label: "Até 20 km" },
    { value: "todos", label: "Qualquer distância" },
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
        close: "M6 6l12 12M18 6 6 18",
        chevron: "m6 9 6 6 6-6",
        cutlery: "M4 3v6a2 2 0 0 0 4 0V3M6 3v18M18 3v18M18 3c-4 2-4 9 0 9",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 overflow-visible ${className}`}>
      <path d={paths[type]} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function LocationEmptyState({ title, description, }) {
    const { ui } = useInterface();
    return (<div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center sm:flex-row sm:gap-6 sm:text-left">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-app-baunilha-dourada/45 text-app-caramelo-torrado">
        <Icon type="pin" className="h-6 w-6"/>
      </div>
      <div className="mt-5 max-w-md sm:mt-0">
        <h3 className="text-lg font-semibold text-app-cafe-profundo">
          {ui(title)}
        </h3>
        <p className="mt-2 text-sm leading-6 text-app-cinza">
          {ui(description)}
        </p>
      </div>
    </div>);
}
function formatarDataReserva(data, localeUI = "pt-BR") {
    return new Date(`${data}T12:00:00`).toLocaleDateString(localeUI, {
        day: "2-digit",
        month: "long",
        weekday: "long",
    });
}
function formatarHorario(horario) {
    return horario?.slice(0, 5) ?? "--:--";
}
function formatarMoeda(valor, localeUI = "pt-BR") {
    return new Intl.NumberFormat(localeUI, {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}
function formatarDistancia(valor) {
    if (valor === null || valor === undefined || valor === "") return "Distância indisponível";
    const distancia = Number(valor);
    if (!Number.isFinite(distancia)) {
        return "Distância indisponível";
    }
    if (distancia < 1) {
        return `${Math.max(100, Math.round(distancia * 1000 / 100) * 100)} m`;
    }
    return `${distancia.toFixed(distancia < 10 ? 1 : 0).replace(".", ",")} km`;
}
function obterCamposRestaurante(restaurant) {
    return [
        restaurant.name,
        restaurant.specialty,
        restaurant.neighborhood,
        restaurant.openingHours,
        ...(restaurant.matchedProducts ?? []).map((produto) => textoBusca(produto.nome, produto.descricao)),
        ...(restaurant.matchedCategories ?? []).map((categoria) => textoBusca(categoria.nome, categoria.descricao)),
        ...(restaurant.matchedMenus ?? []).map((cardapio) => textoBusca(cardapio.nome, cardapio.descricao)),
    ];
}
function obterRotulosCorrespondencia(restaurant) {
    return [
        ...(restaurant.matchedProducts ?? []).map((produto) => `Prato: ${produto.nome}`),
        ...(restaurant.matchedCategories ?? []).map((categoria) => `Seção: ${categoria.nome}`),
        ...(restaurant.matchedMenus ?? []).map((cardapio) => `Cardápio: ${cardapio.nome}`),
    ].filter(Boolean).slice(0, 3);
}
function mapearRestaurante(restaurant) {
    return {
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
        publishedDishes: restaurant.pratos_publicados ?? [],
        matchedCategories: restaurant.categorias_encontradas ?? [],
        matchedMenus: restaurant.cardapios_encontrados ?? [],
        publishedCategories: restaurant.categorias_publicadas ?? [],
        minimumReservationValue: restaurant.valor_minimo_reserva_por_pessoa,
        menuItemsCount: restaurant.total_itens_cardapio ?? 0,
        hasMenu: Boolean(restaurant.tem_cardapio_publicado),
        acceptsReservation: Boolean(restaurant.aceita_reserva),
        distanceKm: restaurant.distancia_km,
        distanceOrigin: restaurant.origem_distancia,
        resolvedLocation: restaurant.localizacao_resolvida,
    };
}
function ProximaReservaCard({ proximaReserva, localeUI, ui }) {
    return <section className="mx-auto max-w-7xl px-5 pt-5">
        <div className="rounded-[12px] bg-app-cafe-profundo p-5 text-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/35 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">{ui("Próxima reserva")}</p>
                    {proximaReserva ? (<>
                        <h2 className="mt-2 text-2xl font-semibold">{proximaReserva.restaurantes?.nome ?? ui("Restaurante")}</h2>
                        <p className="mt-2 text-sm capitalize text-app-creme-suave">{formatarDataReserva(proximaReserva.data_reserva, localeUI)}{ui(" às ")}{formatarHorario(proximaReserva.horario_inicio)}</p>
                        <p className="mt-1 text-sm text-app-baunilha-dourada">{proximaReserva.quantidade_pessoas}{ui(" pessoas | Preço da reserva ")}{formatarMoeda(proximaReserva.valor_minimo_total, localeUI)}</p>
                    </>) : (<>
                        <h2 className="mt-2 text-2xl font-semibold">{ui("Nenhuma reserva ativa")}</h2>
                        <p className="mt-2 text-sm text-app-creme-suave">{ui("Escolha um restaurante para agendar sua próxima experiência.")}</p>
                    </>)}
                </div>
                <Link href="/cliente/agenda" className="inline-flex h-11 w-fit items-center justify-center rounded-[8px] bg-app-baunilha-dourada px-5 text-xs font-bold uppercase tracking-[0.14em] text-app-cafe-profundo transition hover:bg-app-dourado-mel hover:text-white">{ui("Ver agenda")}</Link>
            </div>
        </div>
    </section>;
}

export default function DashboardPage() {
    const { ui , localeUI } = useInterface();
    const [activeFilter, setActiveFilter] = useState(filters[0]);
    const [filtroBusca, setFiltroBusca] = useState("todos");
    const [ordenacaoBusca, setOrdenacaoBusca] = useState("relevancia");
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [restaurants, setRestaurants] = useState([]);
    const [searchRestaurants, setSearchRestaurants] = useState([]);
    const [carregandoPratos, setCarregandoPratos] = useState(true);
    const [carregandoBusca, setCarregandoBusca] = useState(false);
    const [nearbyRestaurantItems, setNearbyRestaurantItems] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [message, setMessage] = useState("");
    const [updatingFavorite, setUpdatingFavorite] = useState("");
    const [localizacaoBusca, setLocalizacaoBusca] = useState("");
    const [raioKm, setRaioKm] = useState("20");
    const [erroBuscaProxima, setErroBuscaProxima] = useState("");
    const [carregandoRestaurantes, setCarregandoRestaurantes] = useState(false);
    const [buscaProxima, setBuscaProxima] = useState(null);
    const pesquisaProximaIniciada = Boolean(buscaProxima);
    const [menuRaioAberto, setMenuRaioAberto] = useState(false);
    const controleRaioRef = useRef(null);
    const localizacaoBuscaRef = useRef(null);
    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [query]);
    useEffect(() => {
        if (!menuRaioAberto) return;
        function fecharMenu(event) {
            if (!controleRaioRef.current?.contains(event.target)) {
                setMenuRaioAberto(false);
            }
        }
        function fecharComEscape(event) {
            if (event.key === "Escape") setMenuRaioAberto(false);
        }
        document.addEventListener("mousedown", fecharMenu);
        document.addEventListener("keydown", fecharComEscape);
        return () => {
            document.removeEventListener("mousedown", fecharMenu);
            document.removeEventListener("keydown", fecharComEscape);
        };
    }, [menuRaioAberto]);
    useEffect(() => {
        let cancelado = false;
        async function loadBaseRestaurants() {
            try {
                const data = await apiRequest("/restaurantes?incluir_pratos=1");
                if (!cancelado) setRestaurants(data.map(mapearRestaurante));
            }
            catch (error) {
                if (!cancelado) setMessage(error instanceof Error
                    ? error.message
                    : "Não foi possível carregar restaurantes.");
            }
            finally {
                if (!cancelado) setCarregandoPratos(false);
            }
        }
        loadBaseRestaurants();
        return () => { cancelado = true; };
    }, []);
    useEffect(() => {
        let cancelado = false;
        async function loadSearchRestaurants() {
            if (!debouncedQuery) {
                setSearchRestaurants([]);
                setCarregandoBusca(false);
                return;
            }
            setCarregandoBusca(true);
            try {
                const endpoint = new URLSearchParams({ q: debouncedQuery, incluir_pratos: "1" });
                const data = await apiRequest(`/restaurantes?${endpoint.toString()}`);
                if (!cancelado) setSearchRestaurants(data.map(mapearRestaurante));
            }
            catch (error) {
                if (!cancelado) {
                    setSearchRestaurants([]);
                    setMessage(error instanceof Error
                        ? error.message
                        : "Não foi possível buscar restaurantes.");
                }
            }
            finally {
                if (!cancelado) setCarregandoBusca(false);
            }
        }
        loadSearchRestaurants();
        return () => { cancelado = true; };
    }, [debouncedQuery]);
    useEffect(() => {
        const controller = new AbortController();
        async function loadNearbyRestaurants() {
            if (!buscaProxima) return;
            setCarregandoRestaurantes(true);
            try {
                const endpoint = new URLSearchParams({ localizacao: buscaProxima.localizacao, ordenacao: "distancia" });
                if (buscaProxima.raioKm !== "todos") {
                    endpoint.set("raio_km", buscaProxima.raioKm);
                }
                const data = await apiRequest(`/restaurantes?${endpoint.toString()}`, { signal: controller.signal, forceRefresh: true });
                if (!controller.signal.aborted) setNearbyRestaurantItems(data.map(mapearRestaurante));
            }
            catch (error) {
                if (!controller.signal.aborted) setErroBuscaProxima(error instanceof Error
                    ? error.message
                    : "Não foi possível carregar restaurantes próximos.");
            }
            finally {
                if (!controller.signal.aborted) setCarregandoRestaurantes(false);
            }
        }
        loadNearbyRestaurants();
        return () => controller.abort();
    }, [buscaProxima]);
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
    const searchResults = useMemo(() => {
        if (!query.trim()) {
            return [];
        }
        const resultadosPorRelevancia = filtrarOrdenarPorBusca(searchRestaurants, query, obterCamposRestaurante);
        const filtrados = resultadosPorRelevancia.filter((restaurant) => {
            if (filtroBusca === "favoritos") return restaurant.isFavorite;
            if (filtroBusca === "bem-avaliados") return Number(restaurant.rating ?? 0) >= 4;
            if (filtroBusca === "reserva") return restaurant.acceptsReservation;
            if (filtroBusca === "cardapio") return restaurant.hasMenu;
            return true;
        });
        if (ordenacaoBusca === "avaliacao") {
            return [...filtrados].sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0)).slice(0, 5);
        }
        if (ordenacaoBusca === "curtidos") {
            return [...filtrados].sort((a, b) => Number(b.favoriteCount ?? 0) - Number(a.favoriteCount ?? 0)).slice(0, 5);
        }
        return filtrados.slice(0, 5);
    }, [filtroBusca, ordenacaoBusca, query, searchRestaurants]);
    const highlightedRestaurants = useMemo(() => [...restaurants]
        .filter((restaurant) => Number(restaurant.favoriteCount) > 0)
        .sort((a, b) => Number(b.favoriteCount) - Number(a.favoriteCount))
        .slice(0, 3), [restaurants]);
    const nearbyRestaurants = useMemo(() => nearbyRestaurantItems
        .filter((restaurant) => buscaProxima?.raioKm === "todos" || (restaurant.distanceKm != null && Number.isFinite(Number(restaurant.distanceKm))))
        .sort((a, b) => {
            const distanciaA = a.distanceKm == null ? NaN : Number(a.distanceKm);
            const distanciaB = b.distanceKm == null ? NaN : Number(b.distanceKm);
            if (!Number.isFinite(distanciaA)) return Number.isFinite(distanciaB) ? 1 : 0;
            if (!Number.isFinite(distanciaB)) return -1;
            return distanciaA - distanciaB;
        })
        .slice(0, 6), [buscaProxima, nearbyRestaurantItems]);
    function limparBusca() {
        setQuery("");
        setDebouncedQuery("");
    }
    function procurarRestaurantesProximos(event) {
        event.preventDefault();
        if (carregandoRestaurantes) return;
        const localizacao = localizacaoBusca.trim();
        if (!localizacao) {
            setErroBuscaProxima("Digite um endereço, bairro, cidade ou CEP para buscar.");
            localizacaoBuscaRef.current?.focus();
            return;
        }
        setErroBuscaProxima("");
        setNearbyRestaurantItems([]);
        setCarregandoRestaurantes(true);
        setBuscaProxima({ localizacao, raioKm });
    }
    async function alternarFavorito(id) {
        const atual = [...restaurants, ...searchRestaurants, ...nearbyRestaurantItems].find((restaurant) => restaurant.id === id);
        if (!atual || updatingFavorite) return;
        const novoEstado = !atual.isFavorite;
        setUpdatingFavorite(id);
        setRestaurants((items) => items.map((restaurant) => restaurant.id === id ? { ...restaurant, isFavorite: novoEstado } : restaurant));
        setSearchRestaurants((items) => items.map((restaurant) => restaurant.id === id ? { ...restaurant, isFavorite: novoEstado } : restaurant));
        setNearbyRestaurantItems((items) => items.map((restaurant) => restaurant.id === id ? { ...restaurant, isFavorite: novoEstado } : restaurant));
        try {
            const resposta = await apiRequest(`/restaurantes/${id}/favorito`, { method: "PATCH", body: JSON.stringify({ favorito: novoEstado }) });
            setRestaurants((items) => items.map((restaurant) => restaurant.id === id ? { ...restaurant, isFavorite: resposta.favorito_cliente, favoriteCount: resposta.total_favoritos } : restaurant));
            setSearchRestaurants((items) => items.map((restaurant) => restaurant.id === id ? { ...restaurant, isFavorite: resposta.favorito_cliente, favoriteCount: resposta.total_favoritos } : restaurant));
            setNearbyRestaurantItems((items) => items.map((restaurant) => restaurant.id === id ? { ...restaurant, isFavorite: resposta.favorito_cliente, favoriteCount: resposta.total_favoritos } : restaurant));
        } catch (error) {
            setRestaurants((items) => items.map((restaurant) => restaurant.id === id ? atual : restaurant));
            setSearchRestaurants((items) => items.map((restaurant) => restaurant.id === id ? atual : restaurant));
            setNearbyRestaurantItems((items) => items.map((restaurant) => restaurant.id === id ? atual : restaurant));
            setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o favorito.");
        } finally {
            setUpdatingFavorite("");
        }
    }
    return (<main className="min-h-screen bg-white text-app-cafe-profundo">
      <section className="px-5 py-5">
        <div className="mx-auto max-w-7xl">
          <label className="campo-busca-app mx-auto flex h-12 max-w-xl items-center gap-3 rounded-[8px] border border-app-baunilha-dourada bg-white px-4 text-app-mocha shadow-sm">
            <Icon type="search" className="h-5 w-5 shrink-0"/>
            <span className="sr-only">{ui("Buscar pratos ou restaurantes")}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ui("Buscar")} className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo outline-none placeholder:text-app-cinza"/>
            {query ? <button type="button" onClick={limparBusca} aria-label={ui("Limpar busca")} className="app-icon-button flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-app-mocha transition hover:bg-app-chantilly hover:text-app-cafe-profundo">
              <Icon type="close" className="h-4 w-4"/>
            </button> : null}
          </label>

          <div className="hidden">
            {filters.map((filter) => (<button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`h-10 rounded-[8px] border px-5 text-xs font-semibold transition ${activeFilter === filter
                ? "border-app-caramelo-torrado bg-app-caramelo-torrado text-app-chantilly"
                : "border-app-baunilha-dourada bg-white text-app-mocha hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada hover:text-app-cafe-profundo"}`}>
                {ui(filter)}
              </button>))}
            <button type="button" className="flex h-10 items-center gap-2 rounded-[8px] px-2 text-xs font-semibold text-app-cafe-profundo transition hover:text-app-caramelo-torrado">
              <Icon type="sliders"/>{ui("Filtrar por Distância")}</button>
          </div>
          {query.trim() ? (<section className="mx-auto mt-5 max-w-3xl rounded-[12px] border border-app-baunilha-dourada bg-white p-3 text-left shadow-lg">
            <div className="flex items-center justify-between gap-3 border-b border-app-baunilha-dourada/45 px-2 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{ui("Resultado da busca")}</p>
                <p className="mt-1 text-sm font-semibold text-app-cafe-profundo">{searchResults.length ? ui("{0} restaurante(s) encontrado(s)", [searchResults.length]) : ui("Nenhum restaurante encontrado")}</p>
              </div>
            </div>

            <div className="mt-3 rounded-[12px] border border-app-baunilha-dourada/60 bg-app-chantilly/45 p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Filtro")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {filtrosBusca.map((filtro) => (
                      <button key={filtro.id} type="button" onClick={() => setFiltroBusca(filtro.id)} className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.11em] ring-1 transition ${filtroBusca === filtro.id
                        ? "bg-app-cafe-profundo text-app-creme-leve shadow-sm ring-app-cafe-profundo"
                        : "bg-white text-app-mocha ring-app-baunilha-dourada/70 hover:bg-app-chantilly hover:text-app-cafe-profundo hover:ring-app-caramelo-torrado/45"}`}>
                        {ui(filtro.label)}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado sm:min-w-48">{ui("Ordenar por")}<select value={ordenacaoBusca} onChange={(event) => setOrdenacaoBusca(event.target.value)} className="h-10 rounded-[10px] border border-app-baunilha-dourada/70 bg-white px-3 text-xs font-semibold normal-case tracking-normal text-app-cafe-profundo shadow-sm outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-caramelo-torrado/15">
                    <option value="relevancia">{ui("Relevância")}</option>
                    <option value="avaliacao">{ui("Avaliação")}</option>
                    <option value="curtidos">{ui("Mais curtidos")}</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6">
              <VitrinePratos key={`${debouncedQuery}-${filtroBusca}-${ordenacaoBusca}`} restaurantes={searchResults} carregando={carregandoBusca || query.trim() !== debouncedQuery} limiteInicial={8} horizontal />
            </div>
            {searchResults.length ? (<div className="mt-3 grid gap-2">
              <h2 className="mb-2 text-xl font-semibold text-app-cafe-profundo">{ui("Restaurantes")}</h2>
              {searchResults.map((restaurant) => {
                const correspondencias = obterRotulosCorrespondencia(restaurant);
                return (
                  <Link key={restaurant.id} href={`/cliente/restaurantes/${restaurant.id}`} className="resultado-busca-restaurante group flex items-center gap-3 rounded-lg p-2 transition">
                    <div className="logo-restaurante-circular relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-app-baunilha-dourada/55">
                      {restaurant.imageUrl ? (<Image src={restaurant.imageUrl} alt={restaurant.name} fill sizes="56px" className="object-cover transition group-hover:scale-105"/>) : (<div className="flex h-full items-center justify-center bg-app-creme-leve text-app-caramelo-torrado"><Icon type="cutlery" className="h-6 w-6" /></div>)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-app-cafe-profundo">{restaurant.name}</h3>
                      <p className="mt-1 truncate text-xs text-app-cinza">{restaurant.neighborhood ?? ui("Endereço em atualização")}</p>
                      {correspondencias.length ? (<p className="mt-1 truncate text-xs font-semibold text-app-caramelo-torrado">{correspondencias.join(" | ")}</p>) : null}
                    </div>
                    <span className="hidden rounded-full bg-app-cafe-profundo px-3 py-1 text-[10px] font-bold uppercase text-app-creme-leve sm:inline-flex">{ui("Ver")}</span>
                  </Link>
                );
              })}
              <Link href={`/cliente/busca?q=${encodeURIComponent(query.trim())}`} className="mt-1 flex h-11 items-center justify-center rounded-[10px] border border-app-baunilha-dourada bg-white text-[10px] font-bold uppercase tracking-[0.14em] text-app-caramelo-torrado transition hover:bg-app-chantilly hover:text-app-cafe-profundo">{ui("Ver todos os resultados")}</Link>
            </div>) : (<p className="px-2 py-5 text-center text-sm text-app-cinza">{ui("Tente buscar por restaurante, bairro, endereço, seção ou prato do cardápio.")}</p>)}
          </section>) : null}
        </div>
      </section>

      <ProximaReservaCard proximaReserva={proximaReserva} localeUI={localeUI} ui={ui} />

      <VitrineOfertas />

      <CategoriasRestaurantes />

      {highlightedRestaurants.length ? <section className="mx-auto max-w-7xl px-5 py-10">
        <div>
          <h2 className="text-3xl font-semibold text-app-cafe-profundo sm:text-4xl">{ui("Restaurantes mais curtidos")}</h2>
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {highlightedRestaurants.map((restaurant, index) => <article key={restaurant.id} className="group relative min-w-0 rounded-[8px] border border-app-baunilha-dourada bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-app-caramelo-torrado/55 hover:shadow-md">
            <Link href={`/cliente/restaurantes/${restaurant.id}`} className="flex min-w-0 gap-3" aria-label={`Ver ${restaurant.name}`}>
              <div className="restaurant-most-liked-logo logo-restaurante-circular relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-app-baunilha-dourada/70">
                {restaurant.imageUrl ? <Image src={restaurant.imageUrl} alt={restaurant.name} fill sizes="96px" className="object-cover transition duration-300 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center bg-app-creme-leve text-app-caramelo-torrado"><Icon type="cutlery" className="h-7 w-7" /></div>}
              </div>
              <div className="min-w-0 flex-1 py-0.5 pr-7">
                <div className="flex items-center gap-2"><span className="rounded-full bg-app-cafe-profundo px-2 py-0.5 text-[10px] font-bold text-app-creme-leve">#{index + 1}</span><span className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado">{ui("Mais curtido")}</span></div>
                <h3 className="mt-2 truncate text-[15px] font-semibold leading-5 text-app-cafe-profundo antialiased">{restaurant.name}</h3>
                <p className="mt-0.5 truncate text-xs font-medium leading-4 text-app-mocha antialiased">{restaurant.rating != null ? <>{ui(restaurant.rating.toFixed(1))}<span className="mx-1.5 text-app-cinza">|</span></> : null}{restaurant.favoriteCount}{ui(" favorito(s)")}</p>
                <p className="mt-1 truncate text-xs leading-4 text-app-mocha antialiased">{restaurant.neighborhood ?? ui("Endereço em atualização")}</p>
                <span className="mt-2 inline-flex rounded-[5px] bg-white px-2 py-0.5 text-xs font-semibold leading-4 text-app-caramelo-torrado antialiased">{ui("Reserva e pedido antecipado")}</span>
              </div>
            </Link>
            <button type="button" disabled={updatingFavorite === restaurant.id} onClick={() => alternarFavorito(restaurant.id)} className={`app-icon-button absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full p-1.5 transition disabled:opacity-50 ${restaurant.isFavorite ? "bg-white text-app-vermelho-erro" : "text-app-mocha hover:bg-app-chantilly hover:text-app-vermelho-erro"}`} aria-label={`${restaurant.isFavorite ? "Remover" : "Adicionar"} ${restaurant.name} dos favoritos`} aria-pressed={restaurant.isFavorite}>
              <Icon type="heart" filled={restaurant.isFavorite} className="h-full w-full"/>
            </button>
          </article>)}
        </div>
      </section> : null}

      <section className="mx-auto max-w-7xl px-5 py-10">
        {message ? (<p role="status" className="mb-4 rounded-[8px] bg-white p-3 text-sm font-semibold text-app-caramelo-torrado">
            {ui(message)}
          </p>) : null}
        <VitrinePratos restaurantes={restaurants} carregando={carregandoPratos} limiteInicial={8} mensagemVazia="Nenhum prato disponível no momento." horizontal limitePorLinha={7} maxRestaurantes={3} />

      </section>

      <section id="restaurantes-proximos" className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-[26px] bg-app-cafe-profundo px-7 py-8 text-app-creme-leve shadow-sm sm:px-10 sm:py-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="xl:max-w-72">
              <h2 className="text-4xl font-medium sm:text-5xl">{ui("Perto de Você")}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-app-creme-suave">{ui("Digite uma localização e escolha a distância para encontrar restaurantes próximos.")}</p>
            </div>
            <form onSubmit={procurarRestaurantesProximos} aria-label={ui("Buscar restaurantes por localização")} className="nearby-actions grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[auto_minmax(180px,1fr)_160px_auto] xl:flex-1">
              <Link href="/cliente/busca" className="nearby-secondary-action inline-flex h-11 items-center justify-center rounded-[8px] border border-app-baunilha-dourada/60 px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition lg:order-first">{ui("Buscar")}</Link>
              <label className="campo-busca-app order-first col-span-2 flex h-11 min-w-0 items-center gap-2 overflow-hidden rounded-xl border border-app-baunilha-dourada/60 bg-white px-3 text-app-mocha lg:order-none lg:col-span-1">
                <Icon type="pin" className="h-4 w-4" />
                <span className="sr-only">{ui("Localização para buscar restaurantes")}</span>
                <input ref={localizacaoBuscaRef} id="localizacao-proxima" name="localizacao" value={localizacaoBusca} onChange={(event) => setLocalizacaoBusca(event.target.value)} placeholder={ui("Endereço, bairro, cidade ou CEP")} required maxLength={240} autoComplete="off" className="input-busca-app h-full min-w-0 w-full bg-transparent text-sm text-app-cafe-profundo outline-none placeholder:text-app-cinza" />
              </label>
              <div ref={controleRaioRef} className="relative min-w-0 w-full">
                <button type="button" onClick={() => setMenuRaioAberto((aberto) => !aberto)} aria-haspopup="listbox" aria-expanded={menuRaioAberto} className="nearby-radius-trigger flex h-11 w-full items-center justify-between px-4 text-left text-sm font-semibold outline-none">
                  {ui(opcoesRaio.find((opcao) => opcao.value === raioKm)?.label ?? "Até 20 km")}
                  <Icon type="chevron" className={`h-4 w-4 transition-transform ${menuRaioAberto ? "rotate-180" : ""}`}/>
                </button>
                {menuRaioAberto ? <div role="listbox" aria-label={ui("Raio de busca")} className="nearby-radius-menu absolute right-0 top-[calc(100%+0.35rem)] z-20 w-full overflow-hidden p-1">
                  {opcoesRaio.map((opcao) => <button key={opcao.value} type="button" role="option" aria-selected={raioKm === opcao.value} onClick={() => { setRaioKm(opcao.value); setMenuRaioAberto(false); }} className={`nearby-radius-option flex w-full items-center px-3 py-2 text-left text-sm font-semibold transition ${raioKm === opcao.value ? "is-selected" : ""}`}>
                    {ui(opcao.label)}
                  </button>)}
                </div> : null}
              </div>
              <button type="submit" disabled={carregandoRestaurantes} className="nearby-primary-action col-span-2 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-baunilha-dourada px-5 text-xs font-bold uppercase tracking-[0.14em] text-app-cafe-profundo transition disabled:cursor-wait disabled:opacity-70 lg:col-span-1">
                {carregandoRestaurantes ? ui("Procurando...") : ui("Procurar")}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-app-baunilha-dourada bg-app-chantilly/45 p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-2 border-b border-app-baunilha-dourada/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-app-cafe-profundo">{ui("Restaurantes perto de você")}</h3>
              <p className="mt-1 break-words text-sm text-app-cinza">{pesquisaProximaIniciada ? ui("Busca próxima de {0}", [buscaProxima.localizacao]) : ui("Informe a localização desejada e clique em Procurar.")}</p>
            </div>
            {pesquisaProximaIniciada && !carregandoRestaurantes && !erroBuscaProxima ? <span className="w-fit shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-app-caramelo-torrado ring-1 ring-app-baunilha-dourada/70">{ui("{0} encontrado(s)", [nearbyRestaurants.length])}</span> : null}
          </div>
          <div className="pt-5">
            {erroBuscaProxima ? <p role="alert" className="rounded-xl border border-app-vermelho-erro/30 bg-white p-4 text-sm font-semibold text-app-vermelho-erro">{ui(erroBuscaProxima)}</p> : carregandoRestaurantes ? (
              <div className="flex min-h-48 items-center justify-center gap-3 text-sm font-semibold text-app-mocha"><span className="h-5 w-5 animate-spin rounded-full border-2 border-app-baunilha-dourada border-t-app-caramelo-torrado"/>{ui("Procurando restaurantes próximos...")}</div>
            ) : nearbyRestaurants.length ? (<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {nearbyRestaurants.map((restaurant) => (<article key={restaurant.id} className="group relative min-w-0 rounded-[8px] border border-app-baunilha-dourada bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-app-caramelo-torrado/55 hover:shadow-md">
                    <Link href={`/cliente/restaurantes/${restaurant.id}`} className="flex min-w-0 gap-3" aria-label={`Ver ${restaurant.name}`}>
                      <div className="logo-restaurante-circular relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-app-baunilha-dourada/70">
                        {restaurant.imageUrl ? (<Image src={restaurant.imageUrl} alt={restaurant.name} fill sizes="96px" className="object-cover transition duration-300 group-hover:scale-105"/>) : (<div className="flex h-full items-center justify-center bg-app-creme-leve text-app-caramelo-torrado"><Icon type="cutlery" className="h-7 w-7" /></div>)}
                      </div>

                      <div className="min-w-0 flex-1 py-0.5 pr-7">
                        <h3 className="truncate text-[15px] font-semibold leading-5 text-app-cafe-profundo antialiased">
                          {restaurant.name}
                        </h3>
                        <p className="mt-0.5 truncate text-xs font-medium leading-4 text-app-mocha antialiased">
                          <span className="font-semibold text-app-caramelo-torrado">
                            {formatarDistancia(restaurant.distanceKm)}
                          </span>
                          {restaurant.rating != null ? <><span className="mx-1.5 text-app-cinza">|</span>{ui(restaurant.rating.toFixed(1))}</> : null}
                        </p>
                        <p className="mt-1 truncate text-xs leading-4 text-app-mocha antialiased">
                          {restaurant.neighborhood ?? ui("Endereço em atualização")}
                        </p>
                        {restaurant.resolvedLocation ? (
                          <p className="mt-0.5 truncate text-xs leading-4 text-app-cinza antialiased">{ui("Base: ")}{restaurant.resolvedLocation}
                          </p>
                        ) : null}
                        <p className="truncate text-xs leading-4 text-app-mocha antialiased">
                          {ui(restaurant.openingHours && restaurant.openingHours !== "A definir"
                    ? restaurant.openingHours
                    : "Consulte os horários")}
                        </p>
                        {restaurant.matchedProducts?.length ? (
                          <p className="mt-1 truncate text-xs font-semibold leading-4 text-app-caramelo-torrado antialiased">{ui("Encontrado no cardápio: ")}{restaurant.matchedProducts.map((produto) => produto.nome).join(", ")}
                          </p>
                        ) : null}
                        <span className="mt-1 inline-flex rounded-[5px] bg-white px-2 py-0.5 text-xs font-semibold leading-4 text-app-caramelo-torrado antialiased">{ui("Reserva e pedido antecipado")}</span>
                      </div>
                    </Link>

                    <button type="button" disabled={updatingFavorite === restaurant.id} onClick={() => alternarFavorito(restaurant.id)} className={`app-icon-button absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full p-1.5 transition disabled:opacity-50 ${restaurant.isFavorite
                    ? "bg-white text-app-vermelho-erro"
                    : "text-app-mocha hover:bg-app-chantilly hover:text-app-vermelho-erro"}`} aria-label={`${restaurant.isFavorite ? "Remover" : "Adicionar"} ${restaurant.name} dos favoritos`} aria-pressed={restaurant.isFavorite}>
                      <Icon type="heart" filled={restaurant.isFavorite} className="h-full w-full"/>
                    </button>
                  </article>))}
              </div>) : pesquisaProximaIniciada ? (<LocationEmptyState title={ui("Nenhum restaurante neste raio")} description={ui("Tente aumentar o raio de busca ou usar outra cidade, bairro ou CEP.")}/>) : (<LocationEmptyState title={ui("Escolha uma localização")} description={ui("Digite um endereço, bairro, cidade ou CEP e selecione a distância para buscar restaurantes.")}/>) }
          </div>
        </div>
      </section>

    </main>);
}

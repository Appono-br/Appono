"use client";
import { useInterface } from "@/lib/use-interface";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { filtrarOrdenarPorBusca, textoBusca } from "@/lib/busca-avancada";
import { VitrinePratos } from "@/components/cliente/vitrine-pratos";
import { VitrineOfertas } from "@/components/cliente/vitrine-ofertas";
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
        cutlery: "M4 3v6a2 2 0 0 0 4 0V3M6 3v18M18 3v18M18 3c-4 2-4 9 0 9",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 overflow-visible ${className}`}>
      <path d={paths[type]} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function EmptyState({ title, description, compact = false, }) {
    const { ui } = useInterface();
    return (<div className={`flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-white px-6 text-center shadow-sm ${compact ? "py-8" : "py-12"}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
        <Icon type="search" className="h-5 w-5"/>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-app-cafe-profundo">
        {ui(title)}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">
        {ui(description)}
      </p>
    </div>);
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
    const distancia = Number(valor);
    if (!Number.isFinite(distancia)) {
        return "Distância indisponível";
    }
    if (distancia < 1) {
        return `${Math.max(100, Math.round(distancia * 1000 / 100) * 100)} m`;
    }
    return `${distancia.toFixed(distancia < 10 ? 1 : 0).replace(".", ",")} km`;
}
function obterMensagemOrigemLocalizacao(status) {
    if (status === "checking") {
        return "Verificando permissão de localização para ordenar restaurantes próximos.";
    }
    if (status === "ready") {
        return "Restaurantes ordenados pela sua localização atual.";
    }
    if (status === "loading") {
        return "Buscando sua localização para carregar os restaurantes mais próximos.";
    }
    return "Ative a localização do navegador para encontrar restaurantes próximos.";
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
                <Link href="/cliente/reservas" className="inline-flex h-11 w-fit items-center justify-center rounded-[8px] bg-app-baunilha-dourada px-5 text-xs font-bold uppercase tracking-[0.14em] text-app-cafe-profundo transition hover:bg-app-dourado-mel hover:text-white">{ui("Ver reservas")}</Link>
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
    const [localizacaoCliente, setLocalizacaoCliente] = useState(null);
    const [raioKm, setRaioKm] = useState("20");
    const [statusLocalizacao, setStatusLocalizacao] = useState("checking");
    const [carregandoRestaurantes, setCarregandoRestaurantes] = useState(true);
    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [query]);
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
        async function loadNearbyRestaurants() {
            if (["checking", "loading"].includes(statusLocalizacao) && !localizacaoCliente) {
                setCarregandoRestaurantes(false);
                return;
            }
            if (!localizacaoCliente) {
                setNearbyRestaurantItems([]);
                setCarregandoRestaurantes(false);
                return;
            }
            setCarregandoRestaurantes(true);
            try {
                const endpoint = new URLSearchParams();
                if (localizacaoCliente) {
                    endpoint.set("latitude", String(localizacaoCliente.latitude));
                    endpoint.set("longitude", String(localizacaoCliente.longitude));
                }
                if (raioKm !== "todos") {
                    endpoint.set("raio_km", raioKm);
                }
                const queryString = endpoint.toString();
                const data = await apiRequest(`/restaurantes${queryString ? `?${queryString}` : ""}`);
                setNearbyRestaurantItems(data.map(mapearRestaurante));
            }
            catch (error) {
                setMessage(error instanceof Error
                    ? error.message
                    : "Não foi possível carregar restaurantes próximos.");
            }
            finally {
                setCarregandoRestaurantes(false);
            }
        }
        loadNearbyRestaurants();
    }, [localizacaoCliente, raioKm, statusLocalizacao]);
    useEffect(() => {
        let cancelado = false;
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
                setStatusLocalizacao("ready");
            }, () => {
                setStatusLocalizacao("denied");
            }, {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0,
            });
        }
        async function solicitarLocalizacaoInicial() {
            if (!("geolocation" in navigator)) {
                if (!cancelado) setStatusLocalizacao("unsupported");
                return;
            }
            if ("permissions" in navigator && navigator.permissions?.query) {
                try {
                    const permissao = await navigator.permissions.query({ name: "geolocation" });
                    if (cancelado) return;
                    permissao.onchange = () => {
                        if (!cancelado && permissao.state === "granted") {
                            solicitarLocalizacao();
                        }
                    };
                    if (permissao.state === "granted") {
                        solicitarLocalizacao();
                        return;
                    }
                    if (permissao.state === "denied") {
                        setStatusLocalizacao("denied");
                        return;
                    }
                    setStatusLocalizacao("idle");
                    return;
                }
                catch {
                }
            }
            if (!cancelado) {
                solicitarLocalizacao();
            }
        }
        const timer = window.setTimeout(solicitarLocalizacaoInicial, 250);
        return () => {
            cancelado = true;
            window.clearTimeout(timer);
        };
    }, []);
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
        .filter((restaurant) => raioKm === "todos" || Number.isFinite(Number(restaurant.distanceKm)))
        .sort((a, b) => {
            const distanciaA = Number(a.distanceKm);
            const distanciaB = Number(b.distanceKm);
            if (!Number.isFinite(distanciaA)) return Number.isFinite(distanciaB) ? 1 : 0;
            if (!Number.isFinite(distanciaB)) return -1;
            return distanciaA - distanciaB;
        })
        .slice(0, 6), [nearbyRestaurantItems, raioKm]);
    function limparBusca() {
        setQuery("");
        setDebouncedQuery("");
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
        <VitrinePratos restaurantes={restaurants} carregando={carregandoPratos} limiteInicial={8} mensagemVazia="Nenhum prato disponível no momento." horizontal agrupada limitePorLinha={7} maxCategorias={3} maxRestaurantes={3} />

      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-[26px] bg-app-cafe-profundo px-7 py-8 text-app-creme-leve shadow-sm sm:px-10 sm:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-4xl font-medium sm:text-5xl">{ui("Perto de Você")}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-app-creme-suave">{ui(obterMensagemOrigemLocalizacao(statusLocalizacao))}</p>
            </div>
            <label className="nearby-radius-control flex h-11 w-full max-w-56 items-center rounded-[8px] border border-app-baunilha-dourada/60 px-4 text-app-creme-leve sm:w-56">
              <span className="sr-only">{ui("Raio de busca")}</span>
              <select value={raioKm} onChange={(event) => setRaioKm(event.target.value)} className="nearby-radius-select h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none">
                <option value="2">{ui("Até 2 km")}</option>
                <option value="5">{ui("Até 5 km")}</option>
                <option value="10">{ui("Até 10 km")}</option>
                <option value="20">{ui("Até 20 km")}</option>
                <option value="todos">{ui("Qualquer distância")}</option>
              </select>
            </label>
          </div>
        </div>

        {statusLocalizacao === "denied" ? (
            <p className="mt-7 border-l-2 border-app-caramelo-torrado pl-4 text-sm font-semibold text-app-mocha">{ui("Não foi possível acessar sua localização. Libere a permissão no navegador para ver restaurantes por distância.")}</p>
          ) : null}
          {statusLocalizacao === "unsupported" ? (
            <p className="mt-7 border-l-2 border-app-caramelo-torrado pl-4 text-sm font-semibold text-app-mocha">{ui("Este navegador não oferece suporte à localização automática.")}</p>
          ) : null}

        <div className="pt-8">
            {carregandoRestaurantes && (statusLocalizacao === "loading" || localizacaoCliente) ? (
              null
            ) : localizacaoCliente && nearbyRestaurants.length ? (<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
              </div>) : localizacaoCliente ? (<LocationEmptyState title={ui("Nenhum restaurante neste raio")} description={ui("Tente aumentar o raio de busca para encontrar mais opções.")}/>) : statusLocalizacao === "denied" ? (<LocationEmptyState title={ui("Permita sua localização")} description={ui("Ao autorizar o navegador, a Appono carrega automaticamente os restaurantes mais próximos e permite filtrar por raio.")}/>) : null}
          </div>
      </section>

      {false && <>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div>
          <h2 className="text-3xl font-semibold text-app-cafe-profundo sm:text-4xl">{ui("Encontre algo diferente")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-app-cinza">{ui("Conheça restaurantes pelo cardápio, avaliações e faixa de preço, sem precisar usar a busca.")}</p>
        </div>
        {colecoesDescoberta.length ? <div className="mt-7 grid gap-7 lg:grid-cols-2">
          {colecoesDescoberta.map((colecao) => <section key={colecao.titulo} className="rounded-[14px] border border-app-baunilha-dourada/60 bg-app-creme-leve p-5">
            <h3 className="text-xl font-semibold text-app-cafe-profundo">{ui(colecao.titulo)}</h3>
            <p className="mt-1 text-xs text-app-cinza">{ui(colecao.criterio)}</p>
            <div className="mt-4 grid gap-3">{colecao.itens.map((restaurant) => <Link key={restaurant.id} href={`/cliente/restaurantes/${restaurant.id}`} className="flex items-center justify-between gap-4 rounded-[10px] bg-white p-4 transition hover:shadow-sm">
              <div className="min-w-0"><p className="truncate font-semibold text-app-cafe-profundo">{restaurant.name}</p><p className="mt-1 truncate text-sm text-app-cinza">{restaurant.publishedCategories.slice(0, 2).join(" · ") || ui("Cardápio disponível")}</p></div>
              <div className="shrink-0 text-right"><p className="text-sm font-semibold text-app-caramelo-torrado">{restaurant.rating == null ? ui("Novo") : `★ ${Number(restaurant.rating).toFixed(1)}`}</p>{Number.isFinite(Number(restaurant.minimumReservationValue)) ? <p className="mt-1 text-xs text-app-cinza">{formatarMoeda(restaurant.minimumReservationValue, localeUI)}</p> : null}</div>
            </Link>)}</div>
          </section>)}
        </div> : (
          <EmptyState compact title={ui("Ainda não há coleções disponíveis")} description={ui("As opções aparecerão aqui quando os restaurantes tiverem cardápio publicado e dados suficientes.")}/>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-medium text-app-cafe-profundo sm:text-5xl">{ui("Especialidades em Destaque")}</h2>
        </div>

        <div className="mt-10">
          {specialties.length ? (<div className="grid gap-8 lg:grid-cols-3">
              {specialties.map((specialty) => (<article key={specialty.id} className="rounded-[8px] border border-app-baunilha-dourada bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold">{specialty.name}</h3>
                  {specialty.description ? (<p className="mt-2 text-sm leading-6 text-app-cinza">
                      {ui(specialty.description)}
                    </p>) : null}
                </article>))}
            </div>) : (<EmptyState title={ui("Especialidades ainda não disponíveis")} description={ui("As seções em destaque serão exibidas assim que houver restaurantes e cardápios cadastrados.")}/>)}
        </div>
      </section>
      </>}
    </main>);
}

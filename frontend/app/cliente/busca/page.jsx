"use client";

import { useInterface } from "@/lib/use-interface";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { filtrarOrdenarPorBusca, textoBusca } from "@/lib/busca-avancada";
import { VitrinePratos } from "@/components/cliente/vitrine-pratos";

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
    publishedDishes: restaurant.pratos_publicados ?? [],
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
    const { ui } = useInterface();
  return (
    <div className="rounded-[16px] border border-dashed border-app-baunilha-dourada bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-chantilly text-app-cafe-profundo">
        <Icon type="search" className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-app-cafe-profundo">{ui(title)}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-app-cinza">{ui(description)}</p>
    </div>
  );
}

function BuscaClienteContent() {
    const { ui } = useInterface();
  const router = useRouter();
  const searchParams = useSearchParams();
  const termoInicial = searchParams.get("q") ?? "";
  const [termo, setTermo] = useState(termoInicial);
  const [debouncedTermo, setDebouncedTermo] = useState(termoInicial);
  const [filtroBusca, setFiltroBusca] = useState("todos");
  const [ordenacaoBusca, setOrdenacaoBusca] = useState("relevancia");
  const [raioKm, setRaioKm] = useState("5");
  const [restaurantes, setRestaurantes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [updatingFavorite, setUpdatingFavorite] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedTermo(termo.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [termo]);

  useEffect(() => {
    let cancelado = false;
    async function carregarRestaurantes() {
      setCarregando(true);
      setMensagem("");
      try {
        const endpoint = new URLSearchParams({ incluir_pratos: "1" });
        if (debouncedTermo) endpoint.set("q", debouncedTermo);
        const queryString = endpoint.toString();
        const data = await apiRequest(`/restaurantes${queryString ? `?${queryString}` : ""}`, { forceRefresh: true });
        if (!cancelado) setRestaurantes((data ?? []).map(mapearRestaurante));
      } catch (error) {
        if (!cancelado) {
          setRestaurantes([]);
          setMensagem(error instanceof Error ? error.message : "Não foi possível carregar os restaurantes.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregarRestaurantes();
    return () => { cancelado = true; };
  }, [debouncedTermo]);

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

  const totalPratos = resultados.reduce((total, restaurante) => total + restaurante.publishedDishes.length, 0);

  function submeterBusca(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (termo.trim()) params.set("q", termo.trim());
    router.replace(`/cliente/busca${params.toString() ? `?${params.toString()}` : ""}`);
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
      <section className="border-b border-app-baunilha-dourada/50 bg-app-cafe-profundo px-5 py-6 text-app-creme-leve sm:py-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/cliente/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-app-baunilha-dourada transition hover:text-white">
            <Icon type="arrow" className="h-4 w-4" />{ui("Voltar ao início")}</Link>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">{ui("Busca avançada")}</h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pt-6">
            <form onSubmit={submeterBusca}>
              <label className="campo-busca-app flex h-11 items-center gap-3 rounded-full border border-app-baunilha-dourada bg-white px-4 text-app-mocha">
                <Icon type="search" className="h-5 w-5" />
                <span className="sr-only">{ui("Buscar pratos ou restaurantes")}</span>
                <input value={termo} onChange={(event) => setTermo(event.target.value)} placeholder={ui("Busque por lasanha, bairro, restaurante...")} className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo outline-none placeholder:text-app-cinza" />
                <button type="submit" className="hidden h-9 rounded-[8px] bg-app-cafe-profundo px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-app-creme-leve transition hover:bg-app-caramelo-torrado sm:inline-flex sm:items-center">{ui("Buscar")}</button>
              </label>
            </form>
      </div>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[280px_1fr]">
        <aside aria-label={ui("Filtros de busca")} tabIndex={0} className="h-fit rounded-[18px] border border-app-baunilha-dourada/65 bg-white p-4 shadow-sm lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Filtros")}</p>
          <div className="mt-4 grid gap-2">
            {filtrosBusca.map((filtro) => (
              <button key={filtro.id} type="button" onClick={() => setFiltroBusca(filtro.id)} aria-pressed={filtroBusca === filtro.id} className={`flex h-10 items-center justify-between rounded-[10px] px-3 text-left text-xs font-bold uppercase tracking-[0.1em] transition ${filtroBusca === filtro.id
                ? "bg-app-botao-aba-ativa text-app-botao-aba-ativa-texto shadow-none"
                : "bg-white text-app-mocha ring-1 ring-app-baunilha-dourada/70 hover:bg-app-chantilly hover:text-app-cafe-profundo"}`}>
                {ui(filtro.label)}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-2 border-t border-app-baunilha-dourada/45 pt-5">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Ordenar por")}<select value={ordenacaoBusca} onChange={(event) => setOrdenacaoBusca(event.target.value)} className="h-11 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-caramelo-torrado/15">
                <option value="relevancia">{ui("Relevância")}</option>
                <option value="distancia">{ui("Distância")}</option>
                <option value="avaliacao">{ui("Avaliação")}</option>
                <option value="curtidos">{ui("Mais curtidos")}</option>
              </select>
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Raio")}<select value={raioKm} onChange={(event) => setRaioKm(event.target.value)} className="h-11 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-caramelo-torrado/15">
                {opcoesRaio.map((opcao) => <option key={opcao.value} value={opcao.value}>{ui(opcao.label)}</option>)}
              </select>
            </label>
          </div>

        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Resultados")}</p>
              <h2 className="mt-1 text-2xl font-semibold text-app-cafe-profundo">
                {carregando ? ui("Buscando pratos e restaurantes") : ui("{0} prato(s) e {1} restaurante(s)", [totalPratos, resultados.length])}
              </h2>
            </div>
            <button type="button" onClick={() => {
              setTermo("");
              setFiltroBusca("todos");
              setOrdenacaoBusca("relevancia");
              router.replace("/cliente/busca");
            }} className="h-10 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-app-mocha transition hover:bg-app-chantilly hover:text-app-cafe-profundo">{ui("Limpar filtros")}</button>
          </div>

          {mensagem ? <p role="status" className="mb-4 rounded-[10px] border border-app-baunilha-dourada bg-white p-3 text-sm font-semibold text-app-caramelo-torrado">{ui(mensagem)}</p> : null}

          <VitrinePratos key={`${debouncedTermo}-${filtroBusca}-${ordenacaoBusca}`} restaurantes={resultados} carregando={carregando} />

          <h2 className="mb-4 text-2xl font-semibold text-app-cafe-profundo">{ui("Restaurantes")}</h2>

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
                      <Link href={`/cliente/restaurantes/${restaurant.id}`} className={`relative block h-28 w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-app-baunilha-dourada/50 md:h-32 md:w-32 ${restaurant.imageUrl ? "bg-[#ffffff]" : "bg-app-chantilly"}`}>
                        {restaurant.imageUrl ? (
                          <Image src={restaurant.imageUrl} alt={restaurant.name} fill sizes="(min-width: 768px) 128px, 112px" className="object-contain p-2" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-app-chantilly text-xs font-bold uppercase tracking-[0.16em] text-app-mocha">{ui("Appono")}</div>
                        )}
                      </Link>

                      <Link href={`/cliente/restaurantes/${restaurant.id}`} className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {restaurant.acceptsReservation ? <span className="rounded-full bg-app-cafe-profundo px-2.5 py-1 text-[10px] font-bold uppercase text-app-creme-leve">{ui("Reservas")}</span> : null}
                          {Number.isFinite(Number(restaurant.distanceKm)) ? <span className="rounded-full border border-app-baunilha-dourada bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-app-mocha">{formatarDistancia(restaurant.distanceKm)}</span> : null}
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold text-app-cafe-profundo">{restaurant.name}</h3>
                        <p className="mt-2 line-clamp-1 text-sm text-app-cinza">{restaurant.neighborhood ?? ui("Endereço em atualização")}</p>
                        {correspondencias.length ? <p className="mt-2 line-clamp-1 text-sm font-semibold text-app-caramelo-torrado">{correspondencias.join(" | ")}</p> : null}
                        {!correspondencias.length && restaurant.publishedCategories?.length ? <p className="mt-2 line-clamp-1 text-sm font-semibold text-app-caramelo-torrado">{restaurant.publishedCategories.map((categoria) => categoria.nome).slice(0, 3).join(" | ")}</p> : null}
                      </Link>

                      <div className="flex items-center justify-between gap-3 md:grid md:justify-items-end">
                        <div className="flex items-center gap-3 text-sm font-semibold text-app-mocha">
                          {restaurant.rating != null ? <span className="inline-flex items-center gap-1">
                            <Icon type="star" filled className="h-4 w-4 text-app-dourado-mel" />
                            {ui(restaurant.rating.toFixed(1))}
                          </span> : null}
                          <span className="inline-flex items-center gap-1">
                            <Icon type="heart" filled={restaurant.isFavorite} className={`h-4 w-4 ${restaurant.isFavorite ? "text-app-vermelho-erro" : "text-app-cinza"}`} />
                            {restaurant.favoriteCount}
                          </span>
                        </div>
                        <div className="mt-0 flex gap-2 md:mt-4">
                          <button type="button" disabled={updatingFavorite === restaurant.id} onClick={() => alternarFavorito(restaurant.id)} className="h-10 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly hover:text-app-vermelho-erro disabled:opacity-50">
                            {ui(restaurant.isFavorite ? "Remover" : "Favoritar")}
                          </button>
                          <Link href={`/cliente/restaurantes/${restaurant.id}`} className="flex h-10 items-center justify-center rounded-[10px] bg-app-caramelo-torrado px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo">{ui("Ver")}</Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title={ui("Nenhum restaurante encontrado")} description={ui("Ajuste os filtros ou busque por outro prato, endereço, bairro ou restaurante.")} />
          )}
        </section>
      </section>
    </main>
  );
}

export default function BuscaClientePage() {
    const { ui } = useInterface();
  return (
    <Suspense fallback={<main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo">{ui("Carregando busca...")}</main>}>
      <BuscaClienteContent />
    </Suspense>
  );
}

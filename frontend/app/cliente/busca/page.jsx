"use client";

import { useInterface } from "@/lib/use-interface";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { filtrarOrdenarPorBusca, textoBusca } from "@/lib/busca-avancada";
import { VitrinePratos } from "@/components/cliente/vitrine-pratos";
import { CartaoRestaurante } from "@/components/cliente/cartao-restaurante";
import { mapearRestaurante } from "@/lib/restaurantes-descoberta";

const filtrosBusca = [
  { id: "todos", label: "Todos" },
  { id: "favoritos", label: "Favoritos" },
  { id: "bem-avaliados", label: "4+ estrelas" },
];

function Icon({ type, className = "h-5 w-5", filled = false }) {
  const paths = {
    arrow: "M19 12H5m6-6-6 6 6 6",
    bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
    heart: "M12 20.25 4.35 12.9A4.65 4.65 0 0 1 10.93 6.3L12 7.38l1.07-1.08a4.65 4.65 0 0 1 6.58 6.6L12 20.25z",
    menu: "M4 7h16M4 12h16M4 17h16",
    search: "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
    star: "m12 3 2.8 5.7 6.3.9-4.55 4.4 1.08 6.2L12 17.7 6.37 20.2 7.45 14 2.9 9.6l6.3-.9L12 3z",
    close: "M6 6l12 12M18 6 6 18",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 overflow-visible ${className}`}>
      <path d={paths[type]} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
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
  const categoriaSelecionada = searchParams.get("categoria")?.trim() ?? "";
  const [termo, setTermo] = useState(termoInicial);
  const [debouncedTermo, setDebouncedTermo] = useState(termoInicial);
  const [filtroBusca, setFiltroBusca] = useState("todos");
  const [ordenacaoBusca, setOrdenacaoBusca] = useState("relevancia");
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
    if (!debouncedTermo && !categoriaSelecionada) {
      return undefined;
    }

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
  }, [categoriaSelecionada, debouncedTermo]);

  const resultados = useMemo(() => {
    const porCategoria = categoriaSelecionada
      ? restaurantes.map((restaurant) => ({
        ...restaurant,
        publishedDishes: restaurant.publishedDishes.filter((prato) => String(prato.categoria ?? "").trim().toLocaleLowerCase("pt-BR") === categoriaSelecionada.toLocaleLowerCase("pt-BR")),
      })).filter((restaurant) => restaurant.publishedDishes.length > 0)
      : restaurantes;
    const base = debouncedTermo ? filtrarOrdenarPorBusca(porCategoria, debouncedTermo, obterCamposRestaurante) : porCategoria;
    const filtrados = base.filter((restaurant) => {
      if (filtroBusca === "favoritos") return restaurant.isFavorite;
      if (filtroBusca === "bem-avaliados") return Number(restaurant.rating ?? 0) >= 4;
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
  }, [categoriaSelecionada, debouncedTermo, filtroBusca, ordenacaoBusca, restaurantes]);

  const totalPratos = resultados.reduce((total, restaurante) => total + restaurante.publishedDishes.length, 0);

  function submeterBusca(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (termo.trim()) params.set("q", termo.trim());
    router.replace(`/cliente/busca${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function limparBusca() {
    setTermo("");
    setDebouncedTermo("");
    setFiltroBusca("todos");
    setOrdenacaoBusca("relevancia");
    router.replace("/cliente/busca");
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
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">{categoriaSelecionada ? ui("Restaurantes de {0}", [categoriaSelecionada]) : ui("Busca avançada")}</h1>
          <form onSubmit={submeterBusca} className="mt-5">
            <label className="campo-busca-app flex h-11 items-center gap-3 rounded-full border border-app-baunilha-dourada bg-white px-4 text-app-mocha">
              <Icon type="search" className="h-5 w-5" />
              <span className="sr-only">{ui("Buscar pratos ou restaurantes")}</span>
              <input value={termo} onChange={(event) => setTermo(event.target.value)} placeholder={ui("Busque por lasanha, bairro, restaurante...")} className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo outline-none placeholder:text-app-cinza" />
              {termo ? <button type="button" onClick={limparBusca} aria-label={ui("Limpar busca")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-app-mocha transition hover:bg-app-chantilly hover:text-app-cafe-profundo">
                <Icon type="close" className="h-4 w-4" />
              </button> : null}
            </label>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[280px_1fr]">
        <aside aria-label={ui("Filtros de busca")} className="h-fit rounded-[18px] border border-app-baunilha-dourada/65 bg-white p-4 shadow-sm lg:sticky lg:top-28">
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
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-col gap-3 rounded-[16px] border border-app-baunilha-dourada/60 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Resultados")}</p>
              <h2 className="mt-1 text-2xl font-semibold text-app-cafe-profundo">
                {carregando ? ui("Buscando pratos e restaurantes") : ui("{0} prato(s) e {1} restaurante(s)", [totalPratos, resultados.length])}
              </h2>
            </div>
          </div>

          {(debouncedTermo || categoriaSelecionada) && mensagem ? <p role="status" className="mb-4 rounded-[10px] border border-app-baunilha-dourada bg-white p-3 text-sm font-semibold text-app-caramelo-torrado">{ui(mensagem)}</p> : null}

          {!debouncedTermo && !categoriaSelecionada ? (
            <EmptyState title={ui("Comece sua busca")} description={ui("Digite o nome de um prato, restaurante, categoria ou endereço para ver resultados.")} />
          ) : <>
            <VitrinePratos key={`${categoriaSelecionada}-${debouncedTermo}-${filtroBusca}-${ordenacaoBusca}`} restaurantes={resultados} carregando={carregando} mostrarCategorias maxCategorias={8} />

            <h2 className="mb-4 text-2xl font-semibold text-app-cafe-profundo">{ui("Restaurantes")}</h2>

            {carregando ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-36 animate-pulse rounded-[16px] bg-app-chantilly ring-1 ring-app-baunilha-dourada/55" />
              ))}
            </div>
          ) : resultados.length ? (
            <div className="grid gap-4">
              {resultados.map((restaurant) => <CartaoRestaurante key={restaurant.id} restaurant={restaurant} updatingFavorite={updatingFavorite} onToggleFavorite={alternarFavorito} />)}
            </div>
          ) : (
            <EmptyState title={ui("Nenhum restaurante encontrado")} description={ui("Ajuste os filtros ou busque por outro prato, endereço, bairro ou restaurante.")} />
          )}
          </>}
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

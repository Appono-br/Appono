"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CartaoRestaurante } from "@/components/cliente/cartao-restaurante";
import { apiRequest } from "@/lib/api";
import { mapearRestaurante } from "@/lib/restaurantes-descoberta";
import { useInterface } from "@/lib/use-interface";

function RestaurantesContent() {
  const { ui } = useInterface();
  const searchParams = useSearchParams();
  const categoria = searchParams.get("categoria")?.trim() ?? "";
  const [raio, setRaio] = useState("");
  const [raioSolicitado, setRaioSolicitado] = useState("");
  const [ordenacao, setOrdenacao] = useState("nome");
  const [localizacao, setLocalizacao] = useState(null);
  const [statusLocalizacao, setStatusLocalizacao] = useState("");
  const [erroLocalizacao, setErroLocalizacao] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [favoritoPendente, setFavoritoPendente] = useState("");
  const [erroFavorito, setErroFavorito] = useState("");
  const [resultado, setResultado] = useState({ chave: "", restaurantes: [], erro: "" });
  const pedidoLocalizacao = useRef(0);

  useEffect(() => () => { pedidoLocalizacao.current += 1; }, []);

  const parametros = useMemo(() => {
    const params = new URLSearchParams({ ordenacao });
    if (categoria) params.set("categoria", categoria);
    if (raio && localizacao) {
      params.set("raio_km", raio);
      params.set("latitude", String(localizacao.latitude));
      params.set("longitude", String(localizacao.longitude));
    }
    return params.toString();
  }, [categoria, raio, localizacao, ordenacao]);
  const chave = `${parametros}:${tentativa}`;
  const carregando = resultado.chave !== chave;
  const restaurantes = carregando ? [] : resultado.restaurantes;

  useEffect(() => {
    let cancelado = false;
    apiRequest(`/restaurantes?${parametros}`, { forceRefresh: true }).then((data) => {
      if (!cancelado) setResultado({ chave, restaurantes: data.map(mapearRestaurante), erro: "" });
    }).catch((error) => {
      if (!cancelado) setResultado({ chave, restaurantes: [], erro: error.message });
    });
    return () => { cancelado = true; };
  }, [parametros, chave]);

  function alterarRaio(valor) {
    setRaioSolicitado(valor);
    const pedido = ++pedidoLocalizacao.current;
    setErroLocalizacao("");
    if (!valor) {
      setRaio("");
      setStatusLocalizacao("");
      return;
    }
    if (localizacao) {
      setRaio(valor);
      setStatusLocalizacao("pronta");
      return;
    }
    if (!navigator.geolocation) {
      setErroLocalizacao("Seu navegador não oferece acesso à localização.");
      setStatusLocalizacao("erro");
      return;
    }
    setStatusLocalizacao("solicitando");
    navigator.geolocation.getCurrentPosition((posicao) => {
      if (pedido !== pedidoLocalizacao.current) return;
      setLocalizacao({ latitude: posicao.coords.latitude, longitude: posicao.coords.longitude });
      setRaio(valor);
      setStatusLocalizacao("pronta");
    }, (error) => {
      if (pedido !== pedidoLocalizacao.current) return;
      setStatusLocalizacao("erro");
      setErroLocalizacao(error.code === 1
        ? "Acesso à localização negado. Permita o acesso no navegador para filtrar por distância."
        : error.code === 3
          ? "A localização demorou para responder. Tente novamente."
          : "Não foi possível obter sua localização. Tente novamente.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }

  async function alternarFavorito(id) {
    const restaurante = restaurantes.find((item) => item.id === id);
    if (!restaurante || favoritoPendente) return;
    setFavoritoPendente(id);
    setErroFavorito("");
    try {
      const data = await apiRequest(`/restaurantes/${id}/favorito`, {
        method: "PATCH", body: JSON.stringify({ favorito: !restaurante.isFavorite }),
      });
      setResultado((atual) => ({ ...atual, restaurantes: atual.restaurantes.map((item) => item.id === id ? { ...item, isFavorite: data.favorito_cliente, favoriteCount: data.total_favoritos } : item) }));
      setTentativa((atual) => atual + 1);
    } catch (error) {
      setErroFavorito(error.message);
    } finally {
      setFavoritoPendente("");
    }
  }

  return <main className="min-h-screen bg-white text-app-cafe-profundo">
    <section className="border-b border-app-baunilha-dourada/50 bg-app-chantilly/45 px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/cliente/dashboard" className="text-sm font-semibold text-app-caramelo-torrado hover:underline">← {ui("Voltar ao início")}</Link>
        <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">{categoria ? ui("Restaurantes de {0}", [categoria]) : ui("Restaurantes")}</h1>
      </div>
    </section>
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[280px_1fr]">
      <aside aria-label={ui("Filtros de restaurantes")} className="h-fit rounded-[18px] border border-app-baunilha-dourada/65 bg-white p-4 shadow-sm lg:sticky lg:top-28">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Filtros")}</p>
        <label className="mt-4 grid gap-2 text-sm font-semibold">{ui("Distância máxima")}
          <select value={statusLocalizacao === "solicitando" ? raioSolicitado : raio} onChange={(event) => alterarRaio(event.target.value)} className="h-11 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-sm text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado">
            <option value="">{ui("Qualquer distância")}</option>
            {[2, 5, 10, 20].map((km) => <option key={km} value={String(km)}>{ui("Até {0} km", [km])}</option>)}
          </select>
        </label>
        <p className="mt-2 text-xs leading-5 text-app-cinza">{ui("Use sua localização atual para encontrar restaurantes em um raio de até 20 km.")}</p>
        {statusLocalizacao === "solicitando" ? <p role="status" className="mt-3 text-sm text-app-mocha">{ui("Obtendo sua localização...")}</p> : null}
        {raio && localizacao ? <p role="status" className="mt-3 text-xs text-app-mocha">{ui("Filtro ativo: até {0} km da sua localização. Restaurantes sem localização confirmada ficam fora deste filtro.", [raio])}</p> : null}
        {erroLocalizacao ? <div role="alert" className="mt-3 text-sm text-app-vermelho-erro"><p>{ui(erroLocalizacao)}</p><button type="button" onClick={() => alterarRaio(raioSolicitado)} className="mt-2 font-semibold underline">{ui("Tentar novamente")}</button></div> : null}
        <label className="mt-5 grid gap-2 border-t border-app-baunilha-dourada/45 pt-5 text-sm font-semibold">{ui("Ordenar por")}
          <select value={ordenacao} onChange={(event) => setOrdenacao(event.target.value)} className="h-11 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-sm text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado">
            <option value="nome">{ui("Nome")}</option>
            <option value="avaliacao">{ui("Mais bem avaliados")}</option>
            <option value="curtidos">{ui("Mais curtidos")}</option>
          </select>
        </label>
      </aside>
      <section aria-busy={carregando} aria-label={ui("Resultados")}>
        <p role="status" className="mb-4 text-sm font-semibold text-app-mocha">{carregando ? ui("Carregando restaurantes...") : ui("{0} restaurante(s) encontrado(s)", [restaurantes.length])}</p>
        {erroFavorito ? <p role="alert" className="mb-4 rounded-[10px] border border-app-baunilha-dourada p-3 text-sm text-app-vermelho-erro">{ui(erroFavorito)}</p> : null}
        {carregando ? <div className="grid gap-4">{[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-[16px] bg-app-chantilly" />)}</div>
          : resultado.erro ? <div role="alert" className="rounded-[16px] border border-app-baunilha-dourada p-6"><p>{ui(resultado.erro)}</p><button type="button" onClick={() => setTentativa((atual) => atual + 1)} className="mt-3 font-semibold text-app-caramelo-torrado underline">{ui("Tentar novamente")}</button></div>
            : restaurantes.length ? <div className="grid gap-4">{restaurantes.map((restaurant) => <CartaoRestaurante key={restaurant.id} restaurant={restaurant} updatingFavorite={favoritoPendente} onToggleFavorite={alternarFavorito} />)}</div>
              : <div className="rounded-[16px] border border-dashed border-app-baunilha-dourada p-10 text-center"><h2 className="text-xl font-semibold">{ui("Nenhum restaurante encontrado")}</h2><p className="mt-2 text-sm text-app-cinza">{ui("Nenhum restaurante corresponde à categoria e aos filtros selecionados.")}</p></div>}
      </section>
    </section>
  </main>;
}

export default function RestaurantesPage() {
  const { ui } = useInterface();
  return <Suspense fallback={<main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo">{ui("Carregando restaurantes...")}</main>}><RestaurantesContent /></Suspense>;
}

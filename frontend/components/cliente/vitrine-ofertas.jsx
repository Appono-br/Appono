"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

function beneficio(campanha) {
  if (campanha.tipo_beneficio === "DESCONTO_PERCENTUAL") return `${campanha.valor_beneficio}% de desconto`;
  if (campanha.tipo_beneficio === "DESCONTO_FIXO") return `R$ ${Number(campanha.valor_beneficio ?? 0).toFixed(2).replace(".", ",")} de desconto`;
  if (campanha.tipo_beneficio === "COMBO") return `Combo por R$ ${Number(campanha.preco_combo ?? 0).toFixed(2).replace(".", ",")}`;
  return String(campanha.tipo_beneficio ?? "Oferta").replaceAll("_", " ").toLowerCase();
}

function validade(data) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(data)).replace(".", "");
}

function imagemDestaque(campanha) {
  return campanha.imagem_url || campanha.produtos?.find((produto) => produto.imagem_url)?.imagem_url || campanha.restaurante?.logo_url || null;
}

export function VitrineOfertas() {
  const [campanhas, setCampanhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    apiRequest("/campanhas/ofertas", { forceRefresh: true }).then((resposta) => {
      if (ativo) setCampanhas(resposta.campanhas ?? []);
    }).catch((error) => {
      if (ativo) {
        setCampanhas([]);
        setErro(error instanceof Error ? error.message : "Não foi possível carregar as campanhas.");
      }
    }).finally(() => {
      if (ativo) setCarregando(false);
    });
    return () => { ativo = false; };
  }, []);

  return <section id="ofertas" className="mx-auto max-w-7xl px-5 py-10">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Ofertas</p>
      <h2 className="mt-2 text-3xl font-semibold text-app-cafe-profundo">Campanhas disponíveis</h2>
      <p className="mt-2 text-sm text-app-cinza">Benefícios criados pelos restaurantes para a sua próxima reserva.</p>
    </div>
    {carregando ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, indice) => <div key={indice} className="h-[390px] animate-pulse rounded-[20px] bg-app-creme-leve" />)}</div> : erro ? <p role="alert" className="mt-6 rounded-[12px] border border-app-baunilha-dourada/60 bg-white p-5 text-sm text-app-cinza">{erro}</p> : campanhas.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{campanhas.map((campanha) => {
      const imagem = imagemDestaque(campanha);
      const prato = campanha.produtos?.[0];
      return <article key={campanha.id_campanha} className="group flex overflow-hidden rounded-[20px] border border-app-baunilha-dourada/70 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-app-caramelo-torrado/55 hover:shadow-lg">
        <div className="flex w-full flex-col">
          <div className="relative h-44 overflow-hidden bg-app-creme-leve">
            {imagem ? <Image src={imagem} alt={prato?.nome ?? campanha.titulo} fill sizes="(min-width: 1280px) 32vw, (min-width: 768px) 48vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-app-cafe-profundo text-4xl text-app-creme-leve">✦</div>}
            <div className="absolute inset-0 bg-gradient-to-t from-app-cafe-profundo/55 via-transparent to-transparent" />
            <div className="absolute left-4 top-4 rounded-full bg-app-cafe-profundo px-3 py-1.5 text-xs font-bold text-app-creme-leve shadow-sm">{beneficio(campanha)}</div>
            {campanha.personalizada ? <span className="absolute right-4 top-4 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-app-caramelo-torrado shadow-sm">Favorito</span> : null}
            <p className="absolute bottom-3 left-4 right-4 truncate text-sm font-semibold text-white">{campanha.restaurante?.nome ?? "Restaurante Appono"}</p>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-3"><h3 className="text-xl font-semibold leading-snug text-app-cafe-profundo">{campanha.titulo}</h3><span className="shrink-0 rounded-full bg-app-creme-leve px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-app-caramelo-torrado">Oferta</span></div>
            {prato ? <p className="mt-3 text-sm font-medium text-app-mocha">Válida para {prato.nome}{campanha.produtos.length > 1 ? ` e mais ${campanha.produtos.length - 1}` : ""}</p> : null}
            <p className="mt-3 line-clamp-2 text-sm leading-5 text-app-cinza">{campanha.descricao || campanha.regras || "Confira as condições da campanha antes de reservar."}</p>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-app-baunilha-dourada/50 pt-4"><span className="text-xs font-medium text-app-cinza">Termina em {validade(campanha.fim_em)}</span><Link href={`/cliente/restaurantes/${campanha.id_restaurante}`} className="rounded-full bg-app-cafe-profundo px-4 py-2 text-sm font-semibold text-app-creme-leve transition hover:bg-app-caramelo-torrado">Ver oferta</Link></div>
          </div>
        </div>
      </article>;
    })}</div> : <div className="mt-6 rounded-[12px] border border-dashed border-app-baunilha-dourada bg-white px-5 py-7"><p className="font-semibold text-app-cafe-profundo">Nenhuma campanha ativa agora</p><p className="mt-1 text-sm text-app-cinza">Quando um restaurante publicar uma oferta válida, ela aparecerá aqui.</p></div>}
  </section>;
}

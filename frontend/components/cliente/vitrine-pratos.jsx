"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useInterface } from "@/lib/use-interface";
import "./vitrine-pratos.css";

function FotoPrato({ src, nome }) {
  const [falhou, setFalhou] = useState(false);
  const { ui } = useInterface();
  if (!src || falhou) {
    return <span className="dish-photo-placeholder">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 3v6a2 2 0 0 0 4 0V3M6 3v18M18 3v18M18 3c-4 2-4 9 0 9" />
      </svg>
      <span>{ui("Sem foto")}</span>
    </span>;
  }
  return <Image src={src} alt={nome} fill sizes="(min-width: 1280px) 220px, (min-width: 1024px) 25vw, (min-width: 600px) 30vw, 45vw" className="dish-photo" onError={() => setFalhou(true)} />;
}

function LogoRestaurante({ restaurante }) {
  const [falhou, setFalhou] = useState(false);
  const iniciais = restaurante.name?.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("") || "AP";
  return <span className="dish-restaurant-logo" title={restaurante.name}>
    {restaurante.imageUrl && !falhou
      ? <Image src={restaurante.imageUrl} alt={restaurante.name} fill sizes="36px" className="dish-logo-image" onError={() => setFalhou(true)} />
      : <span aria-label={restaurante.name}>{iniciais}</span>}
  </span>;
}

function CartaoPrato({ prato, restaurante, moeda, ui }) {
  return <Link href={`/cliente/restaurantes/${restaurante.id}`} className="dish-card" aria-label={ui("{0}, {1}. Ver cardápio de {2}", [prato.nome, moeda.format(prato.preco), restaurante.name])}>
    <span className="dish-photo-wrap">
      <FotoPrato src={prato.imagem_url} nome={prato.nome} />
      <LogoRestaurante restaurante={restaurante} />
    </span>
    <h3 className="dish-name">{prato.nome}</h3>
    <span className="dish-price">{moeda.format(prato.preco)}</span>
  </Link>;
}

function LinhaPratos({ titulo, itens, restaurante, moeda, ui, limitePorLinha }) {
  return <section className="dish-row" aria-label={titulo}>
    <div className="dish-row-heading">
      <h3>{titulo}</h3>
      {restaurante ? <Link href={`/cliente/restaurantes/${restaurante.id}`} className="dish-row-link">{ui("Ver cardápio")}</Link> : null}
    </div>
    <div className="dish-grid">
      {itens.slice(0, limitePorLinha).map(({ prato, restaurante: restauranteDoPrato }) => <CartaoPrato key={`${restauranteDoPrato.id}-${prato.id_produto}`} prato={prato} restaurante={restauranteDoPrato} moeda={moeda} ui={ui} />)}
    </div>
  </section>;
}

export function VitrinePratos({ restaurantes, carregando, limiteInicial = 12, mensagemVazia = "Nenhum prato encontrado para esta busca.", horizontal = false, agrupada = false, limitePorLinha = 8, maxCategorias = 3, maxRestaurantes = 3 }) {
  const { ui, localeUI } = useInterface();
  const [limite, setLimite] = useState(limiteInicial);
  const pratosPorRestaurante = restaurantes.map((restaurante) => (restaurante.publishedDishes ?? []).map((prato) => ({ prato, restaurante })));
  // Intercala os restaurantes para dar variedade à primeira linha.
  const pratos = [];
  for (let indice = 0; pratosPorRestaurante.some((lista) => indice < lista.length); indice += 1) {
    for (const lista of pratosPorRestaurante) {
      if (lista[indice]) pratos.push(lista[indice]);
    }
  }
  const moeda = new Intl.NumberFormat(localeUI, { style: "currency", currency: "BRL" });

  const pratosExibidos = horizontal ? pratos : pratos.slice(0, limite);
  const gruposPorCategoria = new Map();
  for (const item of pratos) {
    const categoria = item.prato.categoria?.trim() || ui("Destaques");
    const grupo = gruposPorCategoria.get(categoria) ?? [];
    grupo.push(item);
    gruposPorCategoria.set(categoria, grupo);
  }
  const categoriasDestaque = Array.from(gruposPorCategoria)
    .sort(([categoriaA, itensA], [categoriaB, itensB]) => itensB.length - itensA.length || categoriaA.localeCompare(categoriaB, localeUI))
    .slice(0, maxCategorias);
  const gruposPorRestaurante = restaurantes
    .map((restaurante) => ({ restaurante, itens: (restaurante.publishedDishes ?? []).map((prato) => ({ prato, restaurante })) }))
    .filter(({ itens }) => itens.length)
    .sort(({ restaurante: restauranteA }, { restaurante: restauranteB }) => Number(restauranteB.favoriteCount ?? 0) - Number(restauranteA.favoriteCount ?? 0) || restauranteA.name.localeCompare(restauranteB.name, localeUI))
    .slice(0, maxRestaurantes);

  return <section className={`dish-showcase${horizontal ? " dish-showcase-horizontal" : ""}`} aria-label={ui("Pratos")} aria-busy={carregando}>
    <h2 className="dish-section-title">{ui("Pratos")}</h2>
    {carregando ? <div className="dish-grid" aria-label={ui("Carregando pratos...")}>
      {Array.from({ length: 8 }, (_, indice) => <div key={indice} className="dish-skeleton" aria-hidden="true" />)}
    </div> : pratos.length && agrupada ? <div className="dish-groupings">
      <div className="dish-grouping">
        {categoriasDestaque.map(([categoria, itens]) => <LinhaPratos key={categoria} titulo={categoria} itens={itens} moeda={moeda} ui={ui} limitePorLinha={limitePorLinha} />)}
      </div>
      <section className="dish-grouping" aria-labelledby="pratos-por-restaurante">
        <h3 id="pratos-por-restaurante" className="dish-grouping-title dish-most-liked-title">{ui("Mais curtidos")}</h3>
        {gruposPorRestaurante.map(({ restaurante, itens }) => <LinhaPratos key={restaurante.id} titulo={ui("Do restaurante {0}", [restaurante.name])} itens={itens} restaurante={restaurante} moeda={moeda} ui={ui} limitePorLinha={limitePorLinha} />)}
      </section>
    </div> : pratos.length ? <>
      <div className="dish-grid">
        {pratosExibidos.map(({ prato, restaurante }) => <CartaoPrato key={`${restaurante.id}-${prato.id_produto}`} prato={prato} restaurante={restaurante} moeda={moeda} ui={ui} />)}
      </div>
      {!horizontal && pratos.length > limite ? <button type="button" className="dish-load-more" onClick={() => setLimite((atual) => atual + 12)}>{ui("Ver mais pratos")}</button> : null}
    </> : <p className="dish-empty">{ui(mensagemVazia)}</p>}
  </section>;
}

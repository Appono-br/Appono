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
  return <span className="dish-restaurant-logo" title={restaurante.name}>
    {restaurante.imageUrl && !falhou
      ? <Image src={restaurante.imageUrl} alt={restaurante.name} fill sizes="36px" className="dish-logo-image" onError={() => setFalhou(true)} />
      : <span className="dish-logo-placeholder" aria-label={restaurante.name}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 3v6a2 2 0 0 0 4 0V3M6 3v18M18 3v18M18 3c-4 2-4 9 0 9" />
        </svg>
      </span>}
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

function IconeCategoria({ nome }) {
  const categoria = nome.toLocaleLowerCase("pt-BR");
  const path = /pizza|italian|italiana/.test(categoria) ? "M12 3 20 21l-8-4-8 4 8-18Zm0 0v14m-4-8h8" : /bebida|café|cafe|doce|sobremesa|doceria/.test(categoria) ? "M8 3h8l1 4-2 2v11H9V9L7 7l1-4Zm1 4h6m-4 4h2" : /japon|sushi|oriental|chinesa|chinês/.test(categoria) ? "M4 8h16a8 8 0 0 1-16 0Zm3 9h10M8 4v2m4-3v3m4-2v2" : /salada|veg|veget|saud|org/.test(categoria) ? "M12 21V11m0 3C5 14 4 8 4 5c4 0 8 2 8 7m0 1c0-6 4-9 8-9 0 5-2 9-8 9" : "M4 11h16a8 8 0 0 1-16 0Zm2-4 2-3m5 3V3m4 4 2-3m-9 14h6";
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>;
}

function LinhaPratos({ titulo, itens, restaurante, moeda, ui, limitePorLinha }) {
  return <section className="dish-row" aria-label={titulo}>
    <div className="dish-row-heading">
      {restaurante ? <div className="dish-row-restaurant-title"><LogoRestaurante restaurante={restaurante} /><h3>{titulo}</h3></div> : <h3>{titulo}</h3>}
      {restaurante ? <Link href={`/cliente/restaurantes/${restaurante.id}`} className="dish-row-link">{ui("Ver cardápio")}</Link> : null}
    </div>
    <div className="dish-grid">
      {itens.slice(0, limitePorLinha).map(({ prato, restaurante: restauranteDoPrato }) => <CartaoPrato key={`${restauranteDoPrato.id}-${prato.id_produto}`} prato={prato} restaurante={restauranteDoPrato} moeda={moeda} ui={ui} />)}
      {restaurante && itens.length > limitePorLinha ? <Link href={`/cliente/restaurantes/${restaurante.id}`} className="dish-show-more" aria-label={ui("Ver mais pratos de {0}", [restaurante.name])}>
        <span className="dish-show-more-icon" aria-hidden="true">→</span>
        <span>{ui("Ver mais")}</span>
      </Link> : null}
    </div>
  </section>;
}

export function VitrinePratos({ restaurantes, carregando, limiteInicial = 12, mensagemVazia = "Nenhum prato encontrado para esta busca.", horizontal = false, agrupada = false, mostrarCategorias = false, limitePorLinha = 7, maxCategorias = 3, maxRestaurantes = 3 }) {
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
  const exibirAtalhosCategoria = agrupada || mostrarCategorias;

  return <section className={`dish-showcase${horizontal ? " dish-showcase-horizontal" : ""}`} aria-label={ui("Pratos")} aria-busy={carregando}>
    <h2 className="dish-section-title">{ui("Pratos")}</h2>
    {!carregando && exibirAtalhosCategoria && categoriasDestaque.length ? <nav className="dish-category-shortcuts" aria-label={ui("Categorias de pratos")}>{categoriasDestaque.map(([categoria, itens]) => <Link key={categoria} href={`/cliente/busca?categoria=${encodeURIComponent(categoria)}`} className="dish-category-shortcut" aria-label={ui("Ver restaurantes de {0}", [categoria])}><span className="dish-category-icon">{itens[0]?.prato?.imagem_url ? <Image src={itens[0].prato.imagem_url} alt="" fill sizes="64px" className="dish-category-image" /> : <IconeCategoria nome={categoria} />}</span><span className="dish-category-name">{categoria}</span><span className="dish-category-count">{ui("{0} pratos", [itens.length])}</span></Link>)}</nav> : null}
    {carregando ? <div className="dish-grid" aria-label={ui("Carregando pratos...")}>
      {Array.from({ length: 8 }, (_, indice) => <div key={indice} className="dish-skeleton" aria-hidden="true" />)}
    </div> : pratos.length && agrupada ? <div className="dish-groupings">
      <div className="dish-grouping">
        {categoriasDestaque.map(([categoria, itens]) => <LinhaPratos key={categoria} titulo={categoria} itens={itens} moeda={moeda} ui={ui} limitePorLinha={limitePorLinha} />)}
      </div>
      <section className="dish-grouping" aria-labelledby="pratos-por-restaurante">
        <h3 id="pratos-por-restaurante" className="dish-grouping-title dish-most-liked-title">{ui("Restaurantes mais curtidos")}</h3>
        {gruposPorRestaurante.map(({ restaurante, itens }) => <LinhaPratos key={restaurante.id} titulo={restaurante.name} itens={itens} restaurante={restaurante} moeda={moeda} ui={ui} limitePorLinha={limitePorLinha} />)}
      </section>
    </div> : pratos.length ? <>
      <div className="dish-grid">
        {pratosExibidos.map(({ prato, restaurante }) => <CartaoPrato key={`${restaurante.id}-${prato.id_produto}`} prato={prato} restaurante={restaurante} moeda={moeda} ui={ui} />)}
      </div>
      {!horizontal && pratos.length > limite ? <button type="button" className="dish-load-more" onClick={() => setLimite((atual) => atual + 12)}>{ui("Ver mais pratos")}</button> : null}
    </> : <p className="dish-empty">{ui(mensagemVazia)}</p>}
  </section>;
}

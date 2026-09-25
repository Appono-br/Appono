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

export function VitrinePratos({ restaurantes, carregando, limiteInicial = 12, mensagemVazia = "Nenhum prato encontrado para esta busca." }) {
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

  return <section className="dish-showcase" aria-label={ui("Pratos")} aria-busy={carregando}>
    <h2 className="dish-section-title">{ui("Pratos")}</h2>
    {carregando ? <div className="dish-grid" aria-label={ui("Carregando pratos...")}>
      {Array.from({ length: 8 }, (_, indice) => <div key={indice} className="dish-skeleton" aria-hidden="true" />)}
    </div> : pratos.length ? <>
      <div className="dish-grid">
        {pratos.slice(0, limite).map(({ prato, restaurante }) => (
          <Link key={`${restaurante.id}-${prato.id_produto}`} href={`/cliente/restaurantes/${restaurante.id}`} className="dish-card" aria-label={ui("{0}, {1}. Ver cardápio de {2}", [prato.nome, moeda.format(prato.preco), restaurante.name])}>
            <span className="dish-photo-wrap">
              <FotoPrato key={`foto-${prato.imagem_url}`} src={prato.imagem_url} nome={prato.nome} />
              <LogoRestaurante key={`logo-${restaurante.imageUrl}`} restaurante={restaurante} />
            </span>
            <h3 className="dish-name">{prato.nome}</h3>
            <span className="dish-price">{moeda.format(prato.preco)}</span>
          </Link>
        ))}
      </div>
      {pratos.length > limite ? <button type="button" className="dish-load-more" onClick={() => setLimite((atual) => atual + 12)}>{ui("Ver mais pratos")}</button> : null}
    </> : <p className="dish-empty">{ui(mensagemVazia)}</p>}
  </section>;
}

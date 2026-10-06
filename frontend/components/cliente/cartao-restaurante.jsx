"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useInterface } from "@/lib/use-interface";
import { formatarDistancia } from "@/lib/restaurantes-descoberta";

function Icon({ type, filled = false, className }) {
  const path = type === "star"
    ? "m12 3 2.8 5.7 6.3.9-4.55 4.4 1.08 6.2L12 17.7 6.37 20.2 7.45 14 2.9 9.6l6.3-.9L12 3z"
    : "M12 20.25 4.35 12.9A4.65 4.65 0 0 1 10.93 6.3L12 7.38l1.07-1.08a4.65 4.65 0 0 1 6.58 6.6L12 20.25z";
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className}><path d={path} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

// Card extraído da busca para reutilizar a apresentação nas listagens.
export function CartaoRestaurante({ restaurant, updatingFavorite, onToggleFavorite }) {
  const { ui } = useInterface();
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const correspondencias = [
    ...(restaurant.matchedProducts ?? []).map((produto) => `Prato: ${produto.nome}`),
    ...(restaurant.matchedCategories ?? []).map((categoria) => `Seção: ${categoria.nome}`),
    ...(restaurant.matchedMenus ?? []).map((cardapio) => `Cardápio: ${cardapio.nome}`),
  ].filter(Boolean).slice(0, 3);
  const categorias = restaurant.culinaryCategories?.length
    ? restaurant.culinaryCategories
    : (restaurant.publishedCategories ?? []).map((categoria) => categoria.nome);
  const temDistancia = restaurant.distanceKm !== null && restaurant.distanceKm !== undefined && Number.isFinite(Number(restaurant.distanceKm));

  return <article className="group relative overflow-hidden rounded-[16px] border border-app-baunilha-dourada/65 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-app-caramelo-torrado/55 hover:shadow-md">
    <div className="grid gap-4 md:grid-cols-[128px_1fr_auto] md:items-center">
      <Link href={`/cliente/restaurantes/${restaurant.id}`} className="relative block h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-app-baunilha-dourada/50 md:h-32 md:w-32">
        {restaurant.imageUrl && !imagemFalhou
          ? <Image src={restaurant.imageUrl} alt={restaurant.name} fill sizes="128px" className="object-contain p-3 transition duration-300 group-hover:scale-105" onError={() => setImagemFalhou(true)} />
          : <div className="flex h-full items-center justify-center bg-app-chantilly text-xs font-bold uppercase tracking-[0.16em] text-app-mocha">{ui("Appono")}</div>}
      </Link>
      <Link href={`/cliente/restaurantes/${restaurant.id}`} className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {restaurant.acceptsReservation ? <span className="rounded-full bg-app-cafe-profundo px-2.5 py-1 text-[10px] font-bold uppercase text-app-creme-leve">{ui("Reservas")}</span> : null}
          {restaurant.hasMenu ? <span className="rounded-full border border-app-baunilha-dourada bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-app-caramelo-torrado">{restaurant.menuItemsCount}{ui(" itens")}</span> : null}
          {temDistancia ? <span className="rounded-full border border-app-baunilha-dourada bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-app-mocha">{formatarDistancia(restaurant.distanceKm)}</span> : null}
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-app-cafe-profundo">{restaurant.name}</h3>
        <p className="mt-2 line-clamp-1 text-sm text-app-cinza">{restaurant.neighborhood ?? ui("Endereço em atualização")}</p>
        {correspondencias.length ? <p className="mt-2 line-clamp-1 text-sm font-semibold text-app-caramelo-torrado">{correspondencias.join(" | ")}</p> : null}
        {!correspondencias.length && categorias.length ? <p className="mt-2 line-clamp-1 text-sm font-semibold text-app-caramelo-torrado">{categorias.slice(0, 3).join(" | ")}</p> : null}
      </Link>
      <div className="flex items-center justify-between gap-3 md:grid md:justify-items-end">
        <div className="flex items-center gap-3 text-sm font-semibold text-app-mocha">
          <span className="inline-flex items-center gap-1" aria-label={ui("{0} avaliação(ões)", [restaurant.reviewCount])}>
            <Icon type="star" filled className="h-4 w-4 text-app-dourado-mel" />
            {restaurant.rating === null || restaurant.rating === undefined ? ui("Novo") : Number(restaurant.rating).toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon type="heart" filled={restaurant.isFavorite} className={`h-4 w-4 ${restaurant.isFavorite ? "text-app-vermelho-erro" : "text-app-cinza"}`} />
            {restaurant.favoriteCount}
          </span>
        </div>
        <div className="mt-0 flex gap-2 md:mt-4">
          <button type="button" disabled={updatingFavorite === restaurant.id} onClick={() => onToggleFavorite(restaurant.id)} aria-pressed={restaurant.isFavorite} aria-label={ui(restaurant.isFavorite ? "Remover {0} dos favoritos" : "Favoritar {0}", [restaurant.name])} className="h-10 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly hover:text-app-vermelho-erro disabled:opacity-50">
            {ui(restaurant.isFavorite ? "Remover" : "Favoritar")}
          </button>
          <Link href={`/cliente/restaurantes/${restaurant.id}`} className="flex h-10 items-center justify-center rounded-[10px] bg-app-caramelo-torrado px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo">{ui("Ver")}</Link>
        </div>
      </div>
    </div>
  </article>;
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useIdiomaLocal } from "@/lib/use-idioma-local";
import "./home-restaurants.css";

const maxPartners = 6;

function hasPartnerLogo(restaurant) {
  const logo = String(restaurant.logo_url ?? "").trim();
  const demo = /\[demo\]/i.test(restaurant.nome ?? "") || /^demo\.rotina\./i.test(restaurant.email ?? "");
  // Os dados povoados usam fotos ilustrativas do Unsplash no lugar de logos.
  const stockPhoto = /^https?:\/\/images\.unsplash\.com(?:[/?]|$)/i.test(logo);
  return Boolean(logo) && !demo && !stockPhoto;
}

function RestaurantImage({ url, name }) {
  const [failed, setFailed] = useState(false);
  return <div className="public-partner-logo">
    {url && !failed ? <Image src={url} alt={name} width={176} height={152} sizes="176px" className="restaurant-logo-image" onError={() => setFailed(true)} /> : <span className="public-restaurant-placeholder" role="img" aria-label={name}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 10h18l-2-6H5l-2 6Zm2 0v10h14V10M9 20v-6h6v6M3 10c0 3 4.5 3 4.5 0 0 3 4.5 3 4.5 0 0 3 4.5 3 4.5 0 0 3 4.5 3 4.5 0" /></svg></span>}
  </div>;
}

export function HomeRestaurants({ query, onClearSearch }) {
  const { idioma } = useIdiomaLocal();
  const english = idioma === "en";
  const copy = (pt, en) => english ? en : pt;
  const [result, setResult] = useState({ status: "loading", query: "", restaurants: [] });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    apiRequest("/restaurantes" + (params.size ? "?" + params : ""), { auth: false, cacheTtlMs: 0, signal: controller.signal })
      .then((restaurants) => { if (!controller.signal.aborted) setResult({ status: "ready", query, restaurants: Array.isArray(restaurants) ? restaurants : [] }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ status: "error", query, restaurants: [] }); });
    return () => controller.abort();
  }, [query, retry]);

  const loading = result.status === "loading" || result.query !== query;
  const partners = result.restaurants.filter(hasPartnerLogo).slice(0, maxPartners);

  return <section id="restaurantes" className="discover-section public-restaurants-section" aria-labelledby="public-partners-title">
    <div className="discover-container">
      <div className="public-restaurants-heading">
        <div className="discover-heading"><h2 id="public-partners-title" className="discover-section-title">{copy("Parceiros Appono", "Appono partners")}</h2></div>
        {query && <button type="button" className="app-button-secondary public-clear-search" onClick={onClearSearch}>{copy("Limpar busca", "Clear search")} <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button>}
      </div>
      {query && <p className="public-search-result" role="status">{copy("Resultados para", "Results for")} “{query}”</p>}
      {loading ? <ul className="public-partners-list" aria-busy="true" aria-label={copy("Carregando parceiros", "Loading partners")}>{Array.from({ length: maxPartners }, (_, index) => <li key={index} className="public-partner-skeleton" aria-hidden="true" />)}</ul> : result.status === "error" ? <div className="public-restaurants-empty" role="alert">
        <h3>{copy("Não conseguimos carregar os parceiros", "We could not load the partners")}</h3>
        <p>{copy("Tente novamente em alguns instantes.", "Please try again in a moment.")}</p>
        <button className="discover-cta" type="button" onClick={() => { setResult((current) => ({ ...current, status: "loading" })); setRetry((current) => current + 1); }}>{copy("Tentar novamente", "Try again")}</button>
      </div> : partners.length ? <ul className="public-partners-list">
        {partners.map((restaurant) => <li key={restaurant.id_restaurante} className="public-partner">
          <RestaurantImage key={restaurant.logo_url} url={restaurant.logo_url} name={restaurant.nome} />
        </li>)}
      </ul> : <div className="public-restaurants-empty">
        <h3>{query ? copy("Nenhum parceiro encontrado", "No partners found") : copy("Em breve, novos parceiros por aqui", "New partners coming soon")}</h3>
        <p>{query ? copy("Tente outro nome, região ou prato.", "Try another name, area or dish.") : copy("Os restaurantes parceiros aparecerão aqui assim que estiverem disponíveis.", "Partner restaurants will appear here as they become available.")}</p>
        {query && <button type="button" className="app-button-secondary public-clear-search" onClick={onClearSearch}>{copy("Limpar busca", "Clear search")}</button>}
      </div>}
    </div>
  </section>;
}

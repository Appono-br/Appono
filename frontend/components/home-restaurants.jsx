"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useIdiomaLocal } from "@/lib/use-idioma-local";
import { useSessaoLocal } from "@/lib/use-sessao-local";
import "./home-restaurants.css";

const restaurantsPerPage = 6;

function RestaurantImage({ url, name, className = "" }) {
  const [failed, setFailed] = useState(false);
  return <div className={`public-restaurant-image ${className}`}>
    {url && !failed ? <Image src={url} alt={name} fill sizes="(max-width: 700px) 100vw, 33vw" onError={() => setFailed(true)} /> : <span className="public-restaurant-placeholder" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 10h18l-2-6H5l-2 6Zm2 0v10h14V10M9 20v-6h6v6M3 10c0 3 4.5 3 4.5 0 0 3 4.5 3 4.5 0 0 3 4.5 3 4.5 0 0 3 4.5 3 4.5 0" /></svg></span>}
  </div>;
}

function Rating({ restaurant, english }) {
  if (!Number(restaurant.total_avaliacoes) || restaurant.avaliacao_media === null || restaurant.avaliacao_media === undefined) return <span className="public-restaurant-rating">{english ? "No reviews yet" : "Ainda sem avaliações"}</span>;
  return <span className="public-restaurant-rating"><span aria-hidden="true">★</span> {Number(restaurant.avaliacao_media).toLocaleString(english ? "en-US" : "pt-BR", { minimumFractionDigits: 1 })} <span>({restaurant.total_avaliacoes})</span></span>;
}

function RestaurantPreview({ restaurant, english, onClose }) {
  const dialog = useRef(null);
  const { sessao } = useSessaoLocal();
  const [details, setDetails] = useState({ status: "loading", restaurant: null, menus: [], menuFailed: false });
  const [retry, setRetry] = useState(0);
  const copy = (pt, en) => english ? en : pt;
  const id = restaurant.id_restaurante;

  useEffect(() => {
    const modal = dialog.current;
    modal.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { modal.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const options = { auth: false, cacheTtlMs: 0, signal: controller.signal };
    Promise.allSettled([
      apiRequest(`/restaurantes/${id}`, options),
      apiRequest(`/restaurantes/${id}/cardapio`, options),
    ]).then(([info, menus]) => {
      if (controller.signal.aborted) return;
      if (info.status === "rejected") {
        setDetails({ status: "error", restaurant: null, menus: [], menuFailed: false });
        return;
      }
      setDetails({ status: "ready", restaurant: info.value, menus: menus.status === "fulfilled" && Array.isArray(menus.value) ? menus.value : [], menuFailed: menus.status === "rejected" });
    });
    return () => controller.abort();
  }, [id, retry]);

  const info = details.restaurant ?? restaurant;
  const destination = `/cliente/restaurantes/${id}`;
  const customer = sessao?.type === "client";
  const minimum = Number(info.valor_minimo_reserva_por_pessoa ?? 0);
  const currency = (value) => Number(value).toLocaleString(english ? "en-US" : "pt-BR", { style: "currency", currency: "BRL" });
  const products = details.menus.flatMap((menu) => (menu.categorias ?? []).flatMap((category) => (category.produtos ?? []).map((product) => ({ ...product, category: category.nome })))).slice(0, 6);

  return <dialog ref={dialog} className="public-restaurant-dialog" aria-labelledby="public-restaurant-title" data-appono-sem-traducao onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <div className="public-preview-head"><span>{copy("Conheça o restaurante", "Discover the restaurant")}</span><button type="button" className="public-preview-close" onClick={onClose} aria-label={copy("Fechar informações", "Close information")} autoFocus>×</button></div>
    <RestaurantImage key={info.logo_url} url={info.logo_url} name={info.nome} className="public-preview-image" />
    <div className="public-preview-content">
      <Rating restaurant={info} english={english} />
      <h2 id="public-restaurant-title">{info.nome}</h2>
      <dl className="public-preview-info">
        <div><dt>{copy("Endereço", "Address")}</dt><dd>{info.endereco || copy("Endereço não informado", "Address not provided")}</dd></div>
        <div><dt>{copy("Funcionamento", "Opening hours")}</dt><dd>{info.horario_funcionamento || copy("Horário não informado", "Hours not provided")}</dd></div>
        {info.telefone && <div><dt>{copy("Telefone", "Phone")}</dt><dd>{info.telefone}</dd></div>}
        {minimum > 0 && <div><dt>{copy("Valor mínimo por pessoa", "Minimum per person")}</dt><dd>{currency(minimum)}</dd></div>}
      </dl>
      {details.status === "loading" && <p role="status" className="public-preview-notice">{copy("Carregando informações e cardápio…", "Loading information and menu…")}</p>}
      {details.status === "error" && <div role="alert" className="public-preview-notice"><p>{copy("Não foi possível carregar as informações atualizadas.", "We could not load the latest information.")}</p><button type="button" className="discover-text-link" onClick={() => { setDetails((current) => ({ ...current, status: "loading" })); setRetry((current) => current + 1); }}>{copy("Tentar novamente", "Try again")}</button></div>}
      {details.status === "ready" && <div className="public-preview-menu"><h3>{copy("Um pouco do cardápio", "A taste of the menu")}</h3>
        {details.menuFailed ? <p className="public-preview-notice">{copy("O cardápio está indisponível no momento.", "The menu is currently unavailable.")}</p> : products.length ? <ul>{products.map((product) => <li key={product.id_produto}><span><strong>{product.nome}</strong><span>{product.category}</span>{product.descricao && <p>{product.descricao}</p>}</span><span>{currency(product.preco)}</span></li>)}</ul> : <p className="public-preview-notice">{copy("Este restaurante ainda não publicou um cardápio.", "This restaurant has not published a menu yet.")}</p>}
      </div>}
      <div className="public-preview-reserve">
        {restaurant.aceita_reserva ? <>
          <p>{customer ? copy("Escolha sua data e horário na próxima etapa.", "Choose your date and time in the next step.") : copy("Para reservar uma mesa, entre na sua conta de cliente.", "Sign in to your customer account to reserve a table.")}</p>
          <Link className="discover-cta" href={customer ? destination : `/login?redirect=${encodeURIComponent(destination)}`}>{customer ? copy("Reservar uma mesa", "Reserve a table") : copy("Entrar para reservar", "Sign in to reserve")} <span aria-hidden="true">↗</span></Link>
        </> : <p>{copy("Este restaurante ainda não está aceitando reservas pela Appono.", "This restaurant is not accepting reservations through Appono yet.")}</p>}
      </div>
    </div>
  </dialog>;
}

export function HomeRestaurants({ query, onClearSearch }) {
  const { idioma } = useIdiomaLocal();
  const english = idioma === "en";
  const copy = (pt, en) => english ? en : pt;
  const [result, setResult] = useState({ status: "loading", query: "", restaurants: [] });
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(null);
  const [pagination, setPagination] = useState({ query: "", page: 0 });

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    apiRequest(`/restaurantes${params.size ? `?${params}` : ""}`, { auth: false, cacheTtlMs: 0, signal: controller.signal })
      .then((restaurants) => { if (!controller.signal.aborted) setResult({ status: "ready", query, restaurants: Array.isArray(restaurants) ? restaurants : [] }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ status: "error", query, restaurants: [] }); });
    return () => controller.abort();
  }, [query, retry]);

  const loading = result.status === "loading" || result.query !== query;
  const pageCount = Math.ceil(result.restaurants.length / restaurantsPerPage);
  const page = query && pagination.query === query ? Math.min(pagination.page, Math.max(0, pageCount - 1)) : 0;
  const visibleRestaurants = result.restaurants.slice(page * restaurantsPerPage, (page + 1) * restaurantsPerPage);
  return <section id="restaurantes" className="discover-section public-restaurants-section">
    <div className="discover-container">
      <div className="public-restaurants-heading"><div className="discover-heading"><h2>{copy("Restaurantes na Appono", "Restaurants on Appono")}</h2><p>{copy("Explore os restaurantes, conheça o cardápio e escolha onde viver sua próxima experiência.", "Explore restaurants, discover their menus and choose your next dining experience.")}</p></div>
        {query && <button type="button" className="discover-text-link" onClick={onClearSearch}>{copy("Limpar busca", "Clear search")} <span aria-hidden="true">↗</span></button>}
      </div>
      {query && <p className="public-search-result" role="status">{copy("Resultados para", "Results for")} “{query}”</p>}
      {loading ? <div className="public-restaurants-grid" aria-busy="true" aria-label={copy("Carregando restaurantes", "Loading restaurants")}>{[0, 1, 2].map((index) => <div key={index} className="public-restaurant-skeleton" />)}</div> : result.status === "error" ? <div className="public-restaurants-empty" role="alert"><h3>{copy("Não conseguimos carregar os restaurantes", "We could not load the restaurants")}</h3><p>{copy("Tente novamente em alguns instantes.", "Please try again in a moment.")}</p><button className="discover-cta" type="button" onClick={() => { setResult((current) => ({ ...current, status: "loading" })); setRetry((current) => current + 1); }}>{copy("Tentar novamente", "Try again")}</button></div> : result.restaurants.length ? <>
        <p className="public-restaurant-count">{query ? copy(`Exibindo ${page * restaurantsPerPage + 1} a ${page * restaurantsPerPage + visibleRestaurants.length} de ${result.restaurants.length} resultados`, `Showing ${page * restaurantsPerPage + 1} to ${page * restaurantsPerPage + visibleRestaurants.length} of ${result.restaurants.length} results`) : copy("Alguns restaurantes para você conhecer", "A few restaurants for you to discover")}</p>
        <div className="public-restaurants-grid">{visibleRestaurants.map((restaurant) => <button key={restaurant.id_restaurante} type="button" className="public-restaurant-card" onClick={() => setSelected(restaurant)} aria-label={`${copy("Conhecer", "Discover")} ${restaurant.nome}`}>
          <RestaurantImage url={restaurant.logo_url} name={restaurant.nome} />
          <div className="public-restaurant-card-content"><Rating restaurant={restaurant} english={english} /><h3>{restaurant.nome}</h3><p className="public-restaurant-address">{restaurant.endereco || copy("Endereço não informado", "Address not provided")}</p>
            <div className="public-restaurant-tags">{(restaurant.categorias_publicadas ?? []).slice(0, 2).map((category) => <span key={category.nome}>{category.nome}</span>)}</div>
            <span className="public-restaurant-card-link">{copy("Conhecer restaurante", "Discover restaurant")} <span aria-hidden="true">↗</span></span>
          </div>
        </button>)}</div>
        {query && pageCount > 1 && <nav className="public-restaurants-pagination" aria-label={copy("Páginas da busca", "Search result pages")}>
          <button type="button" disabled={page === 0} onClick={() => setPagination({ query, page: page - 1 })}>{copy("Anterior", "Previous")}</button>
          <span aria-live="polite">{copy(`Página ${page + 1} de ${pageCount}`, `Page ${page + 1} of ${pageCount}`)}</span>
          <button type="button" disabled={page === pageCount - 1} onClick={() => setPagination({ query, page: page + 1 })}>{copy("Próxima", "Next")}</button>
        </nav>}
      </> : <div className="public-restaurants-empty"><h3>{query ? copy("Nenhum restaurante encontrado", "No restaurants found") : copy("Em breve, novas mesas por aqui", "New places to dine coming soon")}</h3><p>{query ? copy("Tente outro nome, região ou prato.", "Try another name, area or dish.") : copy("Os restaurantes cadastrados aparecerão aqui assim que estiverem disponíveis.", "Registered restaurants will appear here as they become available.")}</p>{query && <button type="button" className="discover-cta" onClick={onClearSearch}>{copy("Limpar busca", "Clear search")}</button>}</div>}
    </div>
    {selected && <RestaurantPreview key={selected.id_restaurante} restaurant={selected} english={english} onClose={() => setSelected(null)} />}
  </section>;
}

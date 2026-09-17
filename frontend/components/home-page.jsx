"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HomeCarousel } from "@/components/home-carousel";
import { HomeSections } from "@/components/home-sections";
import { useIdiomaLocal } from "@/lib/use-idioma-local";
import { useTemaLocal } from "@/lib/use-tema-local";
import "./home-profile-dialog.css";


const headerLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Restaurantes", href: "#restaurantes" },
  { label: "Sobre", href: "#sobre" },
];
const headerLinkClass = "rounded-md px-4 py-2.5 font-bold text-app-cafe-profundo outline-none transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado motion-reduce:transform-none";

function RestaurantSearch({ value, onChange, onSubmit, mobile = false, english }) {
  return <form role="search" onSubmit={onSubmit} className={`home-restaurant-search ${mobile ? "home-search-mobile" : "home-search-desktop"}`} data-appono-sem-traducao>
    <input type="text" inputMode="search" enterKeyHint="search" name="q" spellCheck={false} value={value} onChange={(event) => onChange(event.target.value)} aria-label={english ? "Search restaurants" : "Buscar restaurantes"} placeholder={english ? "Search restaurants" : "Buscar restaurantes"} />
    <button type="submit" aria-label={english ? "Search" : "Buscar"}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg></button>
  </form>;
}

export default function HomePage() {
  const { idioma, alternarIdioma } = useIdiomaLocal();
  const { tema, atualizarTema } = useTemaLocal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDialog, setProfileDialog] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const idiomaDeDestino = idioma === "en" ? "Português" : "English";

  function closeMenu() {
    setMenuOpen(false);
  }

  function searchRestaurants(event) {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
    closeMenu();
    document.getElementById("restaurantes")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function clearSearch() {
    setSearchInput("");
    setSearchQuery("");
  }

  return (
    <main className={`home-publica min-h-screen bg-white text-app-texto-escuro ${tema === "escuro" ? "tema-escuro" : ""}`}>
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/95 backdrop-blur">
  <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
    <div className="home-header-brand-search flex min-w-0 items-center gap-6">
      <Link href="/" className="flex shrink-0 items-center" onClick={closeMenu}>
        <Image
          src="/brand/appono-mark.svg"
          alt="Appono"
          width={90}
          height={72}
          className="h-12 w-auto transition-transform duration-300 hover:scale-105 sm:h-16"
        />
      </Link>
      <RestaurantSearch value={searchInput} onChange={setSearchInput} onSubmit={searchRestaurants} english={idioma === "en"} />
    </div>

    <nav aria-label="Navegação principal" className="hidden min-w-0 items-center justify-self-center gap-2 whitespace-nowrap text-base xl:flex">
      {headerLinks.map(({ label, href }) => (
        <Link key={href} href={href} className={headerLinkClass}>
          {label}
        </Link>
      ))}
    </nav>

    <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 xl:justify-self-end">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={alternarIdioma}
          className="flex h-10 min-w-[96px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-app-baunilha-dourada px-3 text-xs font-bold text-app-cafe-profundo transition hover:bg-app-chantilly"
          aria-label={idioma === "en" ? "Switch to Portuguese" : "Mudar para inglês"}
          title={idioma === "en" ? "Switch to Portuguese" : "Mudar para inglês"}
          data-appono-sem-traducao
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1 h-4 w-4">
            <path d="M5 5h8M9 3v2M7 17l4-10M5 17h8M15 19l2.5-6 2.5 6M16 17h3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
          {idiomaDeDestino}
        </button>
        <button
          type="button"
          onClick={() => atualizarTema(tema === "escuro" ? "claro" : "escuro")}
          data-appono-sem-traducao
          className="flex h-10 w-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-app-baunilha-dourada text-app-cafe-profundo transition hover:bg-app-chantilly"
          aria-label={tema === "escuro" ? (idioma === "en" ? "Enable light mode" : "Ativar modo claro") : (idioma === "en" ? "Enable dark mode" : "Ativar modo escuro")}
          title={tema === "escuro" ? (idioma === "en" ? "Enable light mode" : "Ativar modo claro") : (idioma === "en" ? "Enable dark mode" : "Ativar modo escuro")}
        >
          {tema === "escuro" ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path d="M12 4V2m0 20v-2m7.1-15.1-1.4-1.4m1.4 16.8-1.4-1.4M20 12h2M2 12h2m.9-7.1-1.4-1.4m1.4 16.8-1.4-1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path d="M21 12.8A8 8 0 1 1 11.2 3a6 6 0 0 0 9.8 9.8Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
          )}
        </button>
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        <button
          type="button"
          onClick={() => setProfileDialog("cadastro")}
          className="whitespace-nowrap rounded-full border border-app-baunilha-dourada px-6 py-2.5 text-sm font-semibold text-app-cafe-profundo transition-all duration-300 hover:-translate-y-0.5 hover:bg-app-chantilly hover:shadow-sm"
        >
          Criar conta
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/login";
          }}
          className="whitespace-nowrap rounded-full bg-app-caramelo-torrado px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-app-cafe-profundo hover:shadow-md"
        >
          Entrar
        </button>
      </div>

      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className="shrink-0 rounded-full border border-app-baunilha-dourada px-3 py-2 text-sm font-semibold text-app-cafe-profundo xl:hidden"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
      >
        Menu
      </button>
    </div>
  </div>

  <div className="home-search-mobile-row"><RestaurantSearch value={searchInput} onChange={setSearchInput} onSubmit={searchRestaurants} english={idioma === "en"} mobile /></div>

  {menuOpen ? (
    <div id="mobile-menu" className="border-t border-app-baunilha-dourada/50 bg-white px-5 py-5 xl:hidden">
      <nav className="mx-auto flex max-w-7xl flex-col gap-1 text-sm text-app-cafe-profundo">
        {headerLinks.map(({ label, href }) => (
          <Link key={href} href={href} onClick={closeMenu} className={headerLinkClass}>
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            closeMenu();
            setProfileDialog("cadastro");
          }}
          className="mt-2 rounded-full bg-app-caramelo-torrado px-5 py-3 text-left font-semibold text-white"
        >
          Criar conta
        </button>
      </nav>
    </div>
  ) : null}
</header>

      <HomeCarousel />

      <HomeSections searchQuery={searchQuery} onClearSearch={clearSearch} />

      {profileDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[2px] animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Escolha de perfil"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                  {profileDialog === "cadastro" ? "Criar conta" : "Entrar"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-app-cafe-profundo">
                  Escolha seu perfil
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setProfileDialog(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-app-baunilha-dourada text-app-cafe-profundo transition hover:bg-app-chantilly"
                aria-label="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    profileDialog === "cadastro" ? "/cadastro/cliente" : "/login";
                }}
                className="home-profile-option group relative flex min-w-0 items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-chantilly text-app-caramelo-torrado transition group-hover:bg-app-dourado-mel group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <strong className="block text-app-cafe-profundo">Sou cliente</strong>
                  <span className="mt-1 block text-sm leading-6 text-app-mocha">
                    Quero reservar mesa e antecipar meu pedido presencial.
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-app-caramelo-torrado transition-transform group-hover:translate-x-1">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    profileDialog === "cadastro" ? "/cadastro/restaurante" : "/login";
                }}
                className="home-profile-option group relative flex min-w-0 items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-chantilly text-app-caramelo-torrado transition group-hover:bg-app-dourado-mel group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M5 21V7l7-4 7 4v14" />
                    <path d="M9 9h1" />
                    <path d="M9 13h1" />
                    <path d="M14 9h1" />
                    <path d="M14 13h1" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <strong className="block text-app-cafe-profundo">Sou restaurante</strong>
                  <span className="mt-1 block text-sm leading-6 text-app-mocha">
                    Quero organizar reservas, cardápio e pedidos antecipados.
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-app-caramelo-torrado transition-transform group-hover:translate-x-1">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

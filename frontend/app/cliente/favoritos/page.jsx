"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { apiRequest } from "@/lib/api";

const navItems = [
  { label: "Início", href: "/cliente/dashboard" },
  { label: "Detalhes do pedido", href: "/cliente/detalhes-pedido" },
  { label: "Reservas", href: "/cliente/reservas" },
  { label: "Favoritos", href: "/cliente/favoritos" },
  { label: "Mensagens", href: "/cliente/mensagens" },
  { label: "Configurações", href: "/cliente/configuracoes" },
];

function Icon({ type, className = "h-5 w-5", filled = false }) {
  const paths = {
    bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
    heart: "M12 20.25 4.35 12.9A4.65 4.65 0 0 1 10.93 6.3L12 7.38l1.07-1.08a4.65 4.65 0 0 1 6.58 6.6L12 20.25z",
    menu: "M4 7h16M4 12h16M4 17h16",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 overflow-visible ${className}`}>
      <path d={paths[type]} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function mapearRestaurante(restaurante) {
  return {
    id: String(restaurante.id_restaurante),
    nome: restaurante.nome,
    endereco: restaurante.endereco,
    imagem: restaurante.logo_url,
    horario: restaurante.horario_funcionamento,
    avaliacao: restaurante.avaliacao_media,
    avaliacoes: restaurante.total_avaliacoes ?? 0,
    favoritos: restaurante.total_favoritos ?? 0,
    favorito: Boolean(restaurante.favorito_cliente),
  };
}

export default function FavoritosPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurantes, setRestaurantes] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [atualizando, setAtualizando] = useState("");

  useEffect(() => {
    apiRequest("/restaurantes")
      .then((data) => setRestaurantes((data ?? []).map(mapearRestaurante)))
      .catch((error) => setMensagem(error instanceof Error ? error.message : "Não foi possível carregar favoritos."));
  }, []);

  const favoritos = useMemo(() => restaurantes.filter((restaurante) => restaurante.favorito), [restaurantes]);

  async function removerFavorito(id) {
    const anterior = restaurantes;
    setAtualizando(id);
    setRestaurantes((atuais) => atuais.map((restaurante) => restaurante.id === id ? { ...restaurante, favorito: false } : restaurante));
    try {
      await apiRequest(`/restaurantes/${id}/favorito`, {
        method: "PATCH",
        body: JSON.stringify({ favorito: false }),
      });
    }
    catch (error) {
      setRestaurantes(anterior);
      setMensagem(error instanceof Error ? error.message : "Não foi possível remover o favorito.");
    }
    finally {
      setAtualizando("");
    }
  }

  return (
    <main className="min-h-screen bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div className="shrink-0" aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority />
          </div>
          <nav className="hidden items-center justify-self-center gap-7 text-xs font-semibold text-app-cinza lg:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className={item.href === "/cliente/favoritos" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <button type="button" className="transition hover:text-app-caramelo-torrado" aria-label="Sacola">
              <Icon type="bag" />
            </button>
            <ItemHeaderNotificacoes href="/cliente/notificacoes" />
            <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve lg:hidden" aria-label="Abrir menu">
              <Icon type="menu" />
            </button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <nav className="border-t border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-3 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/cliente/favoritos" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Favoritos</p>
            <h1 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">Meus restaurantes salvos</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-mocha">Acesse rapidamente os restaurantes marcados com coração.</p>
          </div>
          <span className="w-fit rounded-full bg-app-creme-leve px-4 py-2 text-xs font-bold text-app-caramelo-torrado ring-1 ring-app-baunilha-dourada/70">
            {favoritos.length} favorito(s)
          </span>
        </div>

        {mensagem ? <p className="mt-6 rounded-[8px] bg-app-creme-leve p-3 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}

        <div className="mt-8">
          {favoritos.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {favoritos.map((restaurante) => (
                <article key={restaurante.id} className="group relative rounded-[12px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/70 transition hover:-translate-y-0.5 hover:shadow-md">
                  <Link href={`/cliente/restaurantes/${restaurante.id}`} className="flex min-w-0 gap-3 rounded-[12px] p-3 pr-12">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[8px] bg-app-chantilly">
                      {restaurante.imagem ? <Image src={restaurante.imagem} alt={restaurante.nome} fill sizes="96px" className="object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-app-baunilha-dourada/45 px-2 text-center text-xs font-bold uppercase leading-4 text-app-mocha">Appono</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-semibold text-app-cafe-profundo">{restaurante.nome}</h2>
                      <p className="mt-1 truncate text-sm text-app-mocha">{restaurante.endereco ?? "Endereço em atualização"}</p>
                      <p className="mt-1 truncate text-xs text-app-cinza">{restaurante.horario && restaurante.horario !== "A definir" ? restaurante.horario : "Consulte os horários"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-app-caramelo-torrado">
                        <span className="rounded-full bg-app-chantilly px-2.5 py-1 ring-1 ring-app-baunilha-dourada/60">{restaurante.avaliacao ? `${restaurante.avaliacao.toFixed(1)} estrelas` : "Novo"}</span>
                        <span className="rounded-full bg-app-chantilly px-2.5 py-1 ring-1 ring-app-baunilha-dourada/60">{restaurante.favoritos} favorito(s)</span>
                      </div>
                    </div>
                  </Link>
                  <button type="button" onClick={() => removerFavorito(restaurante.id)} disabled={atualizando === restaurante.id} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-app-creme-suave text-app-vermelho-erro transition hover:bg-app-chantilly disabled:cursor-wait disabled:opacity-60" aria-label={`Remover ${restaurante.nome} dos favoritos`}>
                    <Icon type="heart" filled className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-[16px] border border-dashed border-app-caramelo-torrado/35 bg-app-creme-leve px-6 py-12 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
                <Icon type="heart" className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-app-cafe-profundo">Nenhum favorito ainda</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">Salve restaurantes pelo coração para encontrá-los rapidamente nesta tela.</p>
              <Link href="/cliente/dashboard" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-caramelo-torrado px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo">
                Explorar restaurantes
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const heroImage = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80";
const foodImage = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80";
const restaurantImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";
const chefImage = "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1200&q=80";

const valueCards = [
  {
    title: "Reserva fácil",
    text: "Escolha restaurante, horário e quantidade de pessoas com poucos passos.",
    icon: "calendar",
  },
  {
    title: "Menos espera",
    text: "Antecipe o pedido para que a cozinha se organize antes da sua chegada.",
    icon: "clock",
  },
  {
    title: "Fluxo inteligente",
    text: "O restaurante acompanha reservas, pedidos e capacidade em um só lugar.",
    icon: "trending",
  },
];

const faqs = [
  {
    question: "A Appono faz delivery?",
    answer: "Não. A proposta da Appono é melhorar a experiência presencial em restaurantes, conectando reserva de mesa e pedido antecipado.",
  },
  {
    question: "Preciso escolher os pratos antes de chegar?",
    answer: "A escolha antecipada é opcional, mas é ela que ajuda o restaurante a reduzir espera e organizar melhor a cozinha.",
  },
  {
    question: "O restaurante também usa a plataforma?",
    answer: "Sim. O restaurante acompanha reservas, pedidos antecipados, capacidade e status operacional pelo módulo próprio.",
  },
];

function Icon({ type, className = "h-5 w-5" }) {
  const paths = {
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
    trending: "M23 6 13.5 15.5 8.5 10.5 1 18 M17 6h6v6",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDialog, setProfileDialog] = useState(null);
  const [activeFaq, setActiveFaq] = useState(0);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main className="home-publica min-h-screen bg-white text-app-texto-escuro">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-4 sm:pr-8">
          <div className="flex flex-1 items-center">
            <Link href="/" className="flex shrink-0 items-center" onClick={closeMenu}>
              <Image
                src="/brand/appono-mark.svg"
                alt="Appono"
                width={90}
                height={72}
                className="h-16 w-auto transition-transform duration-300 hover:scale-105"
              />
            </Link>
          </div>

    <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
      <Link href="#inicio" className="rounded-full px-5 py-2.5 text-base font-semibold text-app-cafe-profundo transition hover:bg-app-chantilly">
        Início
      </Link>
      <Link href="#reserva" className="rounded-full px-5 py-2.5 text-base font-semibold text-app-cafe-profundo transition hover:bg-app-chantilly">
        Como usar
      </Link>
      <Link href="#sobre" className="rounded-full px-5 py-2.5 text-base font-semibold text-app-cafe-profundo transition hover:bg-app-chantilly">
        Sobre
      </Link>
    </nav>

    <div className="flex flex-1 items-center justify-end gap-3">
      <div className="hidden items-center gap-3 sm:flex">
        <button
          type="button"
          onClick={() => setProfileDialog("cadastro")}
          className="rounded-full border border-app-baunilha-dourada px-6 py-2.5 text-sm font-semibold text-app-cafe-profundo transition-all duration-300 hover:-translate-y-0.5 hover:bg-app-chantilly hover:shadow-sm"
        >
          Criar conta
        </button>

              <button
                type="button"
                onClick={() => { window.location.href = "/login"; }}
                className="cursor-pointer rounded-full bg-app-caramelo-torrado px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-app-cafe-profundo hover:shadow-md"
              >
                Entrar
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="rounded-full border border-app-baunilha-dourada px-4 py-2 text-sm font-semibold text-app-cafe-profundo md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              Menu
            </button>
          </div>
        </div>

  {menuOpen ? (
    <div id="mobile-menu" className="border-t border-app-baunilha-dourada/50 bg-white px-5 py-5 md:hidden">
      <nav className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-semibold text-app-cafe-profundo">
        <Link href="#inicio" onClick={closeMenu} className="rounded-full px-4 py-2.5 transition hover:bg-app-chantilly">
          Início
        </Link>
        <Link href="#reserva" onClick={closeMenu} className="rounded-full px-4 py-2.5 transition hover:bg-app-chantilly">
          Como usar
        </Link>
        <Link href="#sobre" onClick={closeMenu} className="rounded-full px-4 py-2.5 transition hover:bg-app-chantilly">
          Sobre
        </Link>
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

      <section id="inicio" className="relative flex min-h-[620px] items-center justify-center overflow-hidden bg-app-cafe-profundo px-5 py-20 text-white">
        <Image src={heroImage} alt="Mesa reservada em restaurante elegante" fill priority sizes="100vw" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-app-cafe-profundo/40 to-app-cafe-profundo/85" />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">git merge main
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
            Reserve sua mesa com antecedência
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-app-creme-suave sm:text-lg">
            Planeje sua chegada, escolha seus pratos e ajude o restaurante a
            preparar uma experiência presencial mais rápida e organizada.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => setProfileDialog("cadastro")} className="rounded-full bg-white px-8 py-4 font-bold text-app-cafe-profundo tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer">
              Reservar agora
            </button>
            <Link href="#reserva" className="rounded-full border border-white/40 px-8 py-4 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 cursor-pointer">
              Saiba mais
            </Link>
          </div>
        </div>
      </section>

      <section id="reserva" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:grid-rows-2">
            <div className="relative overflow-hidden rounded-3xl shadow-lg sm:col-span-2 xl:row-span-2">
              <Image
                src={foodImage}
                alt="Pratos servidos em mesa"
                fill
                sizes="50vw"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="relative isolate flex flex-col justify-center overflow-hidden rounded-3xl border border-app-baunilha-dourada/45 bg-app-chantilly px-8 py-8 text-app-cafe-profundo shadow-lg xl:col-span-2">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/70 blur-2xl" />
              <div className="mb-5 h-1.5 w-14 rounded-full bg-app-caramelo-torrado" />
              <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
                APPONO
              </p>
              <h2 className="relative mt-4 text-2xl font-bold leading-tight text-app-cafe-profundo sm:text-3xl">
                A melhor experiência gastronômica.
              </h2>
              <p className="relative mt-4 text-sm leading-7 text-slate-700 sm:text-base">
                A reserva e o pedido caminham juntos para reduzir a espera e
                organizar o fluxo do restaurante.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl shadow-sm">
              <Image
                src={chefImage}
                alt="Chef preparando prato"
                width={560}
                height={420}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="overflow-hidden rounded-3xl shadow-sm">
              <Image
                src={restaurantImage}
                alt="Ambiente do restaurante"
                width={560}
                height={420}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-app-chantilly px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
              Por que a Appono
            </span>
            <h2 className="mt-4 text-4xl font-bold text-app-cafe-profundo">
              Por que usar o Appono?
            </h2>
            <p className="mt-4 text-lg leading-8 text-app-mocha">
              Tudo foi pensado para conectar o planejamento do cliente com a
              operação do restaurante.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {valueCards.map((card) => (
              <article
                key={card.title}
                className="rounded-3xl border border-app-baunilha-dourada/60 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-chantilly text-app-caramelo-torrado">
                  <Icon type={card.icon} className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-app-cafe-profundo">
                  {card.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-app-mocha">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sobre" className="bg-app-chantilly py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
              Nossa história
            </span>

            <h2 className="mt-4 text-4xl font-bold text-app-cafe-profundo">
              Quem somos nós?
            </h2>

            <p className="mt-6 text-lg leading-9 text-app-mocha">
              A Appono nasceu para melhorar a relação entre clientes e
              restaurantes no consumo presencial. Nossa proposta é transformar
              a reserva em uma experiência planejada, onde o cliente chega com
              menos espera e o restaurante trabalha com mais previsibilidade.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl shadow-lg">
            <Image
              src={restaurantImage}
              alt="Ambiente interno de restaurante"
              width={640}
              height={420}
              className="h-80 w-full object-cover transition-all duration-500 hover:scale-[1.03]"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-app-chantilly px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
              Duvidas
            </span>
            <h2 className="mt-4 text-4xl font-bold text-app-cafe-profundo">
              Perguntas frequentes
            </h2>
            <p className="mt-5 text-lg text-app-mocha">
              Tire suas dúvidas sobre como funciona a Appono.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="overflow-hidden rounded-3xl border border-app-baunilha-dourada/60 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(index)}
                  className="flex w-full items-center justify-between px-8 py-6 text-left"
                >
                  <span className="text-lg font-semibold text-app-cafe-profundo">
                    {faq.question}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-chantilly text-xl font-light text-app-caramelo-torrado transition-transform duration-300">
                    {activeFaq === index ? "−" : "+"}
                  </span>
                </button>

                {activeFaq === index && (
                  <div className="border-t border-app-creme-suave px-8 pb-6">
                    <p className="pt-5 text-base leading-8 text-app-mocha">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-app-baunilha-dourada/40 bg-app-chantilly py-20 text-app-cafe-profundo">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/brand/appono-logo.svg"
              alt="Appono"
              width={100}
              height={80}
              className="h-20 w-auto"
            />
            <p className="mt-5 max-w-sm text-base leading-8 text-app-mocha">
              Reserve sua mesa, antecipe seu pedido e aproveite melhor o tempo
              dentro do restaurante com uma experiência mais organizada.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-app-cafe-profundo">Appono</h3>
            <div className="mt-2 h-1 w-12 rounded-full bg-app-dourado-mel" />
            <div className="mt-6 flex flex-col gap-4 text-app-mocha">
              <Link href="#inicio" className="transition-all duration-300 hover:translate-x-1 hover:text-app-caramelo-torrado">
                Início
              </Link>
              <Link href="#reserva" className="transition-all duration-300 hover:translate-x-1 hover:text-app-caramelo-torrado">
                Como usar
              </Link>
              <Link href="#sobre" className="transition-all duration-300 hover:translate-x-1 hover:text-app-caramelo-torrado">
                Sobre
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-app-cafe-profundo">Conta</h3>
            <div className="mt-2 h-1 w-12 rounded-full bg-app-dourado-mel" />
            <div className="mt-6 flex flex-col gap-4 text-app-mocha">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="w-fit text-left transition-all duration-300 hover:translate-x-1 hover:text-app-caramelo-torrado"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setProfileDialog("cadastro")}
                className="w-fit text-left transition-all duration-300 hover:translate-x-1 hover:text-app-caramelo-torrado"
              >
                Criar conta
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-app-cafe-profundo">Contato</h3>
            <div className="mt-2 h-1 w-12 rounded-full bg-app-dourado-mel" />
            <div className="mt-6">
              <p className="text-base text-app-mocha">
                appono.br@gmail.com
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-6xl border-t border-app-baunilha-dourada/40 pt-6 text-center">
          <p className="text-sm text-app-mocha">
            © 2026 Appono. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {profileDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-app-cafe-profundo/70 px-5 backdrop-blur-sm animate-in fade-in duration-200"
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
                className="group relative flex items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-chantilly text-app-caramelo-torrado transition group-hover:bg-app-dourado-mel group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-app-cafe-profundo">Sou cliente</strong>
                  <span className="mt-1 block text-sm leading-6 text-app-mocha">
                    Quero reservar mesa e antecipar meu pedido presencial.
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-app-caramelo-torrado opacity-0 transition-all -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
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
                className="group relative flex items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
                <div>
                  <strong className="block text-app-cafe-profundo">Sou restaurante</strong>
                  <span className="mt-1 block text-sm leading-6 text-app-mocha">
                    Quero organizar reservas, cardápio e pedidos antecipados.
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-app-caramelo-torrado opacity-0 transition-all -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
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

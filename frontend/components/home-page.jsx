"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
const heroImage = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80";
const foodImage = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80";
const restaurantImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";
const valueCards = [
    {
        title: "Reserva fácil",
        text: "Escolha restaurante, horário e quantidade de pessoas com poucos passos.",
    },
    {
        title: "Menos espera",
        text: "Antecipe o pedido para que a cozinha se organize antes da sua chegada.",
    },
    {
        title: "Fluxo inteligente",
        text: "O restaurante acompanha reservas, pedidos e capacidade em um só lugar.",
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
export default function HomePage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileDialog, setProfileDialog] = useState(null);
    const [activeFaq, setActiveFaq] = useState(0);
    function closeMenu() {
        setMenuOpen(false);
    }
    return (<main className="min-h-screen bg-app-chantilly text-app-texto-escuro">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/60 bg-app-chantilly/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
            <Image src="/brand/appono-mark.svg" alt="Appono" width={40} height={40} className="h-10 w-10"/>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-app-cafe-profundo md:flex">
            <Link href="#inicio">Início</Link>
            <Link href="#reserva">Como usar</Link>
            <Link href="#sobre">Sobre</Link>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <button type="button" onClick={() => setProfileDialog("cadastro")} className="border border-app-caramelo-torrado px-4 py-2 text-sm font-semibold text-app-caramelo-torrado transition hover:bg-app-creme-suave">
              Criar conta
            </button>
            <button type="button" onClick={() => {
            window.location.href = "/login";
        }} className="bg-app-dourado-mel px-4 py-2 text-sm font-semibold text-white transition hover:bg-app-caramelo-torrado">
              Entrar
            </button>
          </div>

          <button type="button" onClick={() => setMenuOpen((current) => !current)} className="border border-app-caramelo-torrado px-3 py-2 text-sm font-semibold text-app-cafe-profundo md:hidden" aria-expanded={menuOpen} aria-controls="mobile-menu">
            Menu
          </button>
        </div>

        {menuOpen ? (<div id="mobile-menu" className="border-t border-app-baunilha-dourada bg-app-creme-leve px-5 py-4 md:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-3 text-sm font-semibold text-app-cafe-profundo">
              <Link href="#inicio" onClick={closeMenu}>
                Início
              </Link>
              <Link href="#reserva" onClick={closeMenu}>
                Como usar
              </Link>
              <Link href="#sobre" onClick={closeMenu}>
                Sobre
              </Link>
              <button type="button" onClick={() => {
                closeMenu();
                setProfileDialog("cadastro");
            }} className="mt-2 bg-app-dourado-mel px-4 py-3 text-left text-white">
                Criar conta
              </button>
            </nav>
          </div>) : null}
      </header>

      <section id="inicio" className="relative flex min-h-[620px] items-center justify-center overflow-hidden bg-app-cafe-profundo px-5 py-20 text-white">
        <Image src={heroImage} alt="Mesa reservada em restaurante elegante" fill priority sizes="100vw" className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"/>
        <div className="absolute inset-0 bg-app-cafe-profundo/60"/>

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
          <Image src="/brand/appono-logo.svg" alt="Appono" width={112} height={96} className="mb-10 h-24 w-28 brightness-0 invert"/>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">
            Reserve sua mesa com antecedência
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-app-creme-suave sm:text-lg">
            Planeje sua chegada, escolha seus pratos e ajude o restaurante a
            preparar uma experiência presencial mais rápida e organizada.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => setProfileDialog("cadastro")} className="bg-app-dourado-mel px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado">
              Reservar agora
            </button>
            <Link href="#reserva" className="bg-app-chantilly px-7 py-3 text-sm font-bold uppercase tracking-wide text-app-cafe-profundo transition hover:bg-app-creme-suave">
              Saiba mais
            </Link>
          </div>
        </div>
      </section>

      <section id="reserva" className="bg-app-creme-leve py-8">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-[1fr_1.1fr_1fr]">
          <Image src={foodImage} alt="Pratos servidos em mesa" width={560} height={420} className="h-64 w-full object-cover transition duration-300 hover:brightness-90 md:h-80"/>
          <div className="flex min-h-64 flex-col items-center justify-center bg-app-caramelo-torrado px-8 py-10 text-center text-white md:min-h-80">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-app-baunilha-dourada">
              Appono
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              A melhor experiência gastronômica.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-app-creme-suave">
              A reserva e o pedido caminham juntos para reduzir a espera e
              organizar o fluxo do restaurante.
            </p>
          </div>
          <Image src={foodImage} alt="Experiência gastronômica" width={560} height={420} className="h-64 w-full object-cover transition duration-300 hover:brightness-90 md:h-80"/>
        </div>
      </section>

      <section className="bg-app-creme-suave py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-app-cafe-profundo">
              Por que usar o Appono?
            </h2>
            <p className="mt-3 text-sm leading-6 text-app-mocha">
              Tudo foi pensado para conectar planejamento do cliente e operação
              do restaurante.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {valueCards.map((card) => (<article key={card.title} className="group bg-app-chantilly p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-app-cafe-profundo hover:text-app-creme-leve hover:shadow-md">
                <h3 className="text-base font-semibold text-app-cafe-profundo transition group-hover:text-app-baunilha-dourada">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-app-mocha transition group-hover:text-app-creme-suave">
                  {card.text}
                </p>
              </article>))}
          </div>
        </div>
      </section>

      <section id="sobre" className="bg-app-creme-leve py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold text-app-cafe-profundo">
              Quem somos nós?
            </h2>
            <p className="mt-5 text-base leading-8 text-app-mocha">
              A Appono nasceu para melhorar a relação entre clientes e
              restaurantes no consumo presencial. A proposta e transformar a
              reserva em uma experiência planejada, onde o cliente chega com
              menos espera e o restaurante trabalha com mais previsibilidade.
            </p>
          </div>
          <Image src={restaurantImage} alt="Ambiente interno de restaurante" width={640} height={420} className="h-80 w-full object-cover shadow-sm transition duration-300 hover:brightness-95"/>
        </div>
      </section>

      <section className="bg-app-chantilly py-16">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-center text-2xl font-semibold text-app-cafe-profundo">
            Perguntas frequentes
          </h2>
          <div className="mt-8 divide-y divide-app-baunilha-dourada border-y border-app-baunilha-dourada">
            {faqs.map((faq, index) => (<div key={faq.question}>
                <button type="button" onClick={() => setActiveFaq(index)} className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-app-cafe-profundo">
                  {faq.question}
                  <span className="text-app-dourado-mel">
                    {activeFaq === index ? "-" : "+"}
                  </span>
                </button>
                {activeFaq === index ? (<p className="pb-5 text-sm leading-6 text-app-mocha">
                    {faq.answer}
                  </p>) : null}
              </div>))}
          </div>
        </div>
      </section>

      <footer className="border-t border-app-baunilha-dourada/70 bg-app-creme-leve py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Image src="/brand/appono-logo.svg" alt="Appono" width={80} height={64} className="h-16 w-20"/>
            <p className="mt-4 max-w-xs text-sm leading-6 text-app-mocha">
              Reserve sua mesa, antecipe seu pedido e aproveite melhor o tempo
              dentro do restaurante.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-app-cafe-profundo">
              Appono
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-app-mocha">
              <Link href="#inicio">Início</Link>
              <Link href="#reserva">Como usar</Link>
              <Link href="#sobre">Sobre</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-app-cafe-profundo">
              Conta
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-app-mocha">
              <button type="button" onClick={() => {
            window.location.href = "/login";
        }} className="w-fit text-left">
                Entrar
              </button>
              <button type="button" onClick={() => setProfileDialog("cadastro")} className="w-fit text-left">
                Criar conta
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-app-cafe-profundo">
              Contato
            </h3>
            <p className="mt-4 text-sm leading-6 text-app-mocha">
              appono.br@gmail.com
            </p>
          </div>
        </div>
      </footer>

      {profileDialog ? (<div className="fixed inset-0 z-50 flex items-center justify-center bg-app-cafe-profundo/70 px-5" role="dialog" aria-modal="true" aria-label="Escolha de perfil">
          <div className="w-full max-w-md bg-app-chantilly p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                  {profileDialog === "cadastro" ? "Criar conta" : "Entrar"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-app-cafe-profundo">
                  Escolha seu perfil
                </h2>
              </div>
              <button type="button" onClick={() => setProfileDialog(null)} className="border border-app-baunilha-dourada px-3 py-1 text-app-cafe-profundo" aria-label="Fechar">
                X
              </button>
            </div>
            <div className="mt-6 grid gap-3">
              <button type="button" onClick={() => {
                window.location.href =
                    profileDialog === "cadastro"
                        ? "/cadastro/cliente"
                        : "/login";
            }} className="border border-app-baunilha-dourada bg-app-creme-suave p-4 text-left transition hover:border-app-dourado-mel hover:bg-app-baunilha-dourada">
                <strong className="block text-app-cafe-profundo">
                  Sou cliente
                </strong>
                <span className="mt-1 block text-sm leading-6 text-app-mocha">
                  Quero reservar mesa e antecipar meu pedido presencial.
                </span>
              </button>
              <button type="button" onClick={() => {
                window.location.href =
                    profileDialog === "cadastro"
                        ? "/cadastro/restaurante"
                        : "/login";
            }} className="border border-app-baunilha-dourada bg-app-creme-suave p-4 text-left transition hover:border-app-dourado-mel hover:bg-app-baunilha-dourada">
                <strong className="block text-app-cafe-profundo">
                  Sou restaurante
                </strong>
                <span className="mt-1 block text-sm leading-6 text-app-mocha">
                  Quero organizar reservas, cardápio e pedidos antecipados.
                </span>
              </button>
            </div>
          </div>
        </div>) : null}
    </main>);
}

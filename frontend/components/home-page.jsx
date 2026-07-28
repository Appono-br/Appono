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
  <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

    <Link
      href="/"
      className="flex items-center"
      onClick={closeMenu}
    >
      <Image
        src="/brand/appono-mark.svg"
        alt="Appono"
        width={90}
        height={72}
        className="h-16 w-auto transition-transform duration-300 hover:scale-105"
      />
    </Link>

    <nav className="hidden items-center gap-14 md:flex">
      <Link
        href="#inicio"
        className="relative text-lg font-semibold text-app-cafe-profundo transition-all duration-300 hover:text-app-dourado-mel hover:scale-105 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-app-dourado-mel after:transition-all after:duration-300 hover:after:w-full"
      >
        Início
      </Link>

      <Link
        href="#reserva"
        className="relative text-lg font-semibold text-app-cafe-profundo transition-all duration-300 hover:text-app-dourado-mel hover:scale-105 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-app-dourado-mel after:transition-all after:duration-300 hover:after:w-full"
      >
        Como usar
      </Link>

      <Link
        href="#sobre"
        className="relative text-lg font-semibold text-app-cafe-profundo transition-all duration-300 hover:text-app-dourado-mel hover:scale-105 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-app-dourado-mel after:transition-all after:duration-300 hover:after:w-full"
      >
        Sobre
      </Link>
    </nav>

    <div className="hidden items-center gap-4 sm:flex">
      <button
        type="button"
        onClick={() => setProfileDialog("cadastro")}
        className="rounded-full border border-app-caramelo-torrado px-7 py-3 font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-app-creme-suave hover:shadow-md"
      >
        Criar conta
      </button>

      <button
        type="button"
        onClick={() => {
          window.location.href = "/login";
        }}
        className="rounded-full bg-app-caramelo-torrado px-7 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      >
        Entrar
      </button>
    </div>

    <button
      type="button"
      onClick={() => setMenuOpen((current) => !current)}
      className="rounded-lg border border-app-caramelo-torrado px-4 py-2 text-sm font-semibold text-app-cafe-profundo md:hidden"
      aria-expanded={menuOpen}
      aria-controls="mobile-menu"
    >
      Menu
    </button>
  </div>

  {menuOpen ? (
    <div
      id="mobile-menu"
      className="border-t border-app-baunilha-dourada bg-app-creme-leve px-5 py-5 md:hidden"
    >
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 text-base font-semibold text-app-cafe-profundo">
        <Link href="#inicio" onClick={closeMenu}>
          Início
        </Link>

        <Link href="#reserva" onClick={closeMenu}>
          Como usar
        </Link>

        <Link href="#sobre" onClick={closeMenu}>
          Sobre
        </Link>

        <button
          type="button"
          onClick={() => {
            closeMenu();
            setProfileDialog("cadastro");
          }}
          className="mt-3 rounded-full bg-app-dourado-mel px-5 py-3 text-left font-semibold text-white"
        >
          Criar conta
        </button>
      </nav>
    </div>
  ) : null}
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
            <button type="button" onClick={() => setProfileDialog("cadastro")}className="bg-app-caramelo-torrado text-white px-8 py-4 rounded-full font-bold tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-xl">
              Reservar agora
            </button>
            <Link href="#reserva" className="bg-white text-app-cafe-profundo rounded-full px-8 py-4 font-bold transition-all duration-300 hover:bg-app-creme-suave hover:scale-105">
              Saiba mais
            </Link>
          </div>
        </div>
      </section>

<section id="reserva" className="bg-app-creme-leve py-10">
  <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-[1fr_1.1fr_1fr]">
    <Image
      src={foodImage}
      alt="Pratos servidos em mesa"
      width={560}
      height={420}
      className="h-64 w-full rounded-3xl object-cover shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl md:h-80"
    />

    <div className="flex h-64 flex-col items-center justify-center rounded-3xl bg-app-caramelo-torrado px-8 py-8 text-center text-white shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] md:h-80">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-app-baunilha-dourada">
        APPONO
      </p>

      <h2 className="mt-4 text-3xl font-bold leading-tight">
        A melhor experiência gastronômica.
      </h2>

      <p className="mt-4 max-w-xs text-base leading-7 text-app-creme-suave">
        A reserva e o pedido caminham juntos para reduzir a espera e organizar
        o fluxo do restaurante.
      </p>
    </div>

    <Image
      src={foodImage}
      alt="Experiência gastronômica"
      width={560}
      height={420}
      className="h-64 w-full rounded-3xl object-cover shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl md:h-80"
    />
  </div>
</section>

      <section className="bg-app-creme-suave py-24">
  <div className="mx-auto max-w-6xl px-6">
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-4xl font-bold text-app-cafe-profundo">
        Por que usar o Appono?
      </h2>

      <p className="mt-4 text-lg leading-8 text-app-mocha">
        Tudo foi pensado para conectar o planejamento do cliente com a operação
        do restaurante.
      </p>
    </div>

    <div className="mt-14 grid gap-8 md:grid-cols-3">
      {valueCards.map((card) => (
        <article
          key={card.title}
          className="group rounded-3xl border border-app-baunilha-dourada/30 bg-app-chantilly p-8 text-center shadow-lg transition-all duration-500 "
        >
          <h3 className="text-xl font-bold text-app-cafe-profundo transition duration-300 ">
            {card.title}
          </h3>

          <p className="mt-5 text-base leading-7 text-app-mocha transition duration-300 ">
            {card.text}
          </p>
        </article>
      ))}
    </div>
  </div>
</section>

      <section id="sobre" className="bg-app-creme-leve py-24">
  <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 md:grid-cols-2">
    <div>
      <h2 className="text-4xl font-bold text-app-cafe-profundo">
        Quem somos nós?
      </h2>

      <div className="mt-2 h-1 w-20 rounded-full bg-app-dourado-mel"></div>

      <p className="mt-6 text-lg leading-9 text-app-mocha">
        A Appono nasceu para melhorar a relação entre clientes e restaurantes
        no consumo presencial. Nossa proposta é transformar a reserva em uma
        experiência planejada, onde o cliente chega com menos espera e o
        restaurante trabalha com mais previsibilidade.
      </p>
    </div>

    <Image
      src={restaurantImage}
      alt="Ambiente interno de restaurante"
      width={640}
      height={420}
      className="h-80 w-full rounded-3xl object-cover shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
    />
  </div>
</section>

      <section className="bg-app-chantilly py-24">
  <div className="mx-auto max-w-5xl px-6">
    <div className="text-center">
      <h2 className="text-4xl font-bold text-app-cafe-profundo">
        Perguntas frequentes
      </h2>

      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-app-dourado-mel"></div>

      <p className="mt-5 text-lg text-app-mocha">
        Tire suas dúvidas sobre como funciona a Appono.
      </p>
    </div>

    <div className="mt-12 space-y-5">
      {faqs.map((faq, index) => (
        <div
          key={faq.question}
          className="overflow-hidden rounded-2xl border border-app-baunilha-dourada/30 bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
        >
          <button
            type="button"
            onClick={() => setActiveFaq(index)}
            className="flex w-full items-center justify-between px-8 py-6 text-left"
          >
            <span className="text-lg font-semibold text-app-cafe-profundo">
              {faq.question}
            </span>

            <span className="text-3xl font-light text-app-dourado-mel transition-transform duration-300">
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

      <footer className="border-t border-app-baunilha-dourada/70 bg-app-creme-leve py-20">
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
        Reserve sua mesa, antecipe seu pedido e aproveite melhor o tempo dentro
        do restaurante com uma experiência mais organizada.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-app-cafe-profundo">
        Appono
      </h3>

      <div className="mt-2 h-1 w-12 rounded-full bg-app-dourado-mel"></div>

      <div className="mt-6 flex flex-col gap-4">
        <Link
          href="#inicio"
          className="transition-all duration-300 hover:translate-x-1 hover:text-app-dourado-mel"
        >
          Início
        </Link>

        <Link
          href="#reserva"
          className="transition-all duration-300 hover:translate-x-1 hover:text-app-dourado-mel"
        >
          Como usar
        </Link>

        <Link
          href="#sobre"
          className="transition-all duration-300 hover:translate-x-1 hover:text-app-dourado-mel"
        >
          Sobre
        </Link>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-app-cafe-profundo">
        Conta
      </h3>

      <div className="mt-2 h-1 w-12 rounded-full bg-app-dourado-mel"></div>

      <div className="mt-6 flex flex-col gap-4">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/login";
          }}
          className="w-fit text-left transition-all duration-300 hover:translate-x-1 hover:text-app-dourado-mel"
        >
          Entrar
        </button>

        <button
          type="button"
          onClick={() => setProfileDialog("cadastro")}
          className="w-fit text-left transition-all duration-300 hover:translate-x-1 hover:text-app-dourado-mel"
        >
          Criar conta
        </button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-app-cafe-profundo">
        Contato
      </h3>

      <div className="mt-2 h-1 w-12 rounded-full bg-app-dourado-mel"></div>

      <div className="mt-6">
        <p className="text-base text-app-mocha">
          appono.br@gmail.com
        </p>
      </div>
    </div>
  </div>

  <div className="mx-auto mt-14 max-w-6xl border-t border-app-baunilha-dourada/50 pt-6 text-center">
    <p className="text-sm text-app-cinza">
      © 2026 Appono. Todos os direitos reservados.
    </p>
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

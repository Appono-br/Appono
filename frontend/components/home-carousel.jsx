"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useIdiomaLocal } from "@/lib/use-idioma-local";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=80",
    pt: ["Appono Rotina", "Sua semana com mais sabor e menos decisões.", "Organize seus almoços com sugestões que consideram suas preferências e transforme seu planejamento em reservas quando decidir.", "Refeição com vegetais frescos"],
    en: ["Appono Routine", "More flavor. Fewer decisions throughout your week.", "Organize your lunches with suggestions based on your preferences, and turn your meal plan into reservations whenever you choose.", "Meal with fresh vegetables"],
  },
  {
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80",
    pt: ["Reserva de mesa", "Seu encontro começa antes de chegar.", "Escolha o restaurante, o horário e a quantidade de pessoas. Planeje sua próxima experiência à mesa em um só lugar.", "Mesa preparada em um restaurante"],
    en: ["Table reservations", "Your experience starts before you arrive.", "Choose your restaurant, time and party size. Plan your next dining experience in one place.", "Table set at a restaurant"],
  },
  {
    image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1600&q=80",
    pt: ["Pedido antecipado", "Menos espera. Mais tempo para aproveitar.", "Explore o cardápio e escolha seus pratos antes da visita. O restaurante recebe seu pedido para organizar o preparo e sua chegada.", "Pratos preparados para servir"],
    en: ["Advance ordering", "Less waiting. More time to enjoy.", "Explore the menu and choose your dishes before your visit. The restaurant receives your order to organize preparation and your arrival.", "Dishes ready to serve"],
  },
  {
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1600&q=80",
    pt: ["Tudo conectado", "Da sua escolha à cozinha, tudo em sintonia.", "Reservas, pedidos e mensagens conectam você ao restaurante, com acompanhamento para uma experiência mais organizada.", "Chef preparando uma refeição"],
    en: ["Everything connected", "From your choice to the kitchen, in sync.", "Reservations, orders and messages connect you to the restaurant, with updates for a more organized experience.", "Chef preparing a meal"],
  },
];

export function HomeCarousel() {
  const { idioma } = useIdiomaLocal();
  const english = idioma === "en";
  const [active, setActive] = useState(0);
  const touchStart = useRef(null);
  const language = english ? "en" : "pt";

  function navigate(direction) {
    setActive((current) => (current + direction + slides.length) % slides.length);
  }

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, [active]);

  return (
    <section
      id="inicio"
      data-appono-sem-traducao
      aria-label={english ? "Discover Appono" : "Conheça os diferenciais da Appono"}
      aria-roledescription={english ? "carousel" : "carrossel"}
      className="home-hero home-carousel relative isolate overflow-hidden"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          navigate(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(distance) > 50) navigate(distance < 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      {slides.map((slide, index) => {
        const [label, title, description, alt] = slide[language];
        return (
          <div key={slide.image} aria-hidden={active !== index} className={`home-carousel-slide absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${active === index ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <Image src={slide.image} alt={alt} fill priority={index === 0} sizes="100vw" className="object-cover" />
            <div className="home-carousel-shade absolute inset-0" />
            <div role="group" aria-roledescription="slide" aria-label={`${index + 1} / ${slides.length}`} className="home-carousel-content relative mx-auto flex h-full max-w-7xl items-center px-6 pb-24 pt-8 sm:px-12 lg:px-16">
              <div className="max-w-3xl">
                <p className="home-carousel-eyebrow text-xs font-bold uppercase tracking-[0.24em]">{label}</p>
                {index === 0 ? <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{title}</h1> : <h2 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{title}</h2>}
                <p className="mt-6 max-w-xl text-base leading-7 sm:text-lg sm:leading-8">{description}</p>
              </div>
            </div>
          </div>
        );
      })}
      <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 sm:px-12 lg:px-16">
        <div className="flex items-center gap-2" aria-label={english ? "Choose a slide" : "Escolher destaque"}>
          {slides.map((slide, index) => (
            <button key={slide.image} type="button" onClick={() => setActive(index)} aria-label={slide[language][0]} aria-pressed={active === index} className="home-carousel-dot flex h-11 w-9 items-center justify-center rounded-full">
              <span className={`h-1 rounded-full transition-all motion-reduce:transition-none ${active === index ? "w-8" : "w-4"}`} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="home-carousel-control" onClick={() => navigate(-1)} aria-label={english ? "Previous slide" : "Destaque anterior"}>←</button>
          <button type="button" className="home-carousel-control" onClick={() => navigate(1)} aria-label={english ? "Next slide" : "Próximo destaque"}>→</button>
        </div>
      </div>
    </section>
  );
}

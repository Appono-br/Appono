"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useIdiomaLocal } from "@/lib/use-idioma-local";
import { HomeRestaurants } from "@/components/home-restaurants";
import "./home-sections.css";

const questions = [
  ["A Appono faz delivery?", "Does Appono offer delivery?", "Não. A Appono conecta você ao restaurante para experiências presenciais, com reserva de mesa e pedido antecipado.", "No. Appono connects you to restaurants for dining in, with table reservations and advance ordering."],
  ["Preciso escolher os pratos antes de chegar?", "Do I need to choose dishes before arriving?", "É opcional. Antecipar o pedido ajuda o restaurante a organizar o preparo e permite que você planeje melhor sua visita.", "It is optional. Ordering ahead helps the restaurant organize preparation and lets you plan your visit."],
  ["Como funciona a Appono Rotina?", "How does Appono Routine work?", "Você configura suas preferências, recebe sugestões para seus almoços e ajusta o planejamento. Quando decidir, pode transformar uma refeição em reserva.", "Set your preferences, get lunch suggestions and adjust your plan. When you choose, you can turn a meal into a reservation."],
  ["Também posso usar como restaurante?", "Can I use Appono as a restaurant?", "Sim. A conta de restaurante reúne gestão de cardápio, reservas, pedidos e mensagens para acompanhar a operação.", "Yes. A restaurant account brings together menus, reservations, orders and messages to manage your operation."],
];
const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1100&q=80`;

export function HomeSections({ searchQuery, onClearSearch }) {
  const { idioma } = useIdiomaLocal();
  const english = idioma === "en";
  const copy = (pt, en) => english ? en : pt;
  const root = useRef(null);

  useEffect(() => {
    const element = root.current;
    if (!element || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dataset.visible = "true";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    element.querySelectorAll("[data-reveal]").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return <div ref={root} className="home-discover" data-appono-sem-traducao>
    <HomeRestaurants key={searchQuery} query={searchQuery} onClearSearch={onClearSearch} />

    <section id="sobre" className="discover-section">
      <div className="discover-container">
        <div className="discover-about" data-reveal>
          <div className="discover-about-photo"><Image src={photo("photo-1528605248644-14dd04022da1")} alt={copy("Pessoas reunidas à mesa", "People gathered around a table")} fill sizes="(max-width: 800px) 100vw, 50vw" /></div>
          <div className="discover-about-copy"><h2>{copy("Tecnologia que aproxima.\nMomentos que ficam.", "Technology that connects.\nMoments that last.")}</h2><p className="discover-body">{copy("A Appono nasceu para aproximar quem quer aproveitar uma boa refeição de quem prepara cada detalhe. Unimos planejamento e operação para tornar o encontro à mesa mais simples.", "Appono was created to bring people who enjoy a good meal closer to those who prepare every detail. We connect planning and operations to make dining together simpler.")}</p><Link href="/cadastro/restaurante" className="discover-text-link">{copy("Tenho um restaurante", "I own a restaurant")} <span aria-hidden="true">↗</span></Link></div>
        </div>
      </div>
    </section>

    <section id="como-usar" className="discover-section discover-guide" aria-labelledby="discover-guide-title">
      <div className="discover-container">
        <div className="discover-guide-heading" data-reveal>
          <h2 id="discover-guide-title">{copy("Sua próxima mesa\nem quatro passos.", "Your next table\nin four steps.")}</h2>
        </div>
        <ol className="discover-guide-steps">
          {[
            [copy("Entre na sua conta", "Sign in to your account"), copy("Para reservar, faça login como cliente. Se ainda não tiver uma conta, cadastre-se.", "To reserve, sign in as a customer. If you do not have an account yet, sign up.")],
            [copy("Encontre um restaurante", "Find a restaurant"), copy("Use a busca para escolher um restaurante. Confira as informações e explore o cardápio.", "Use the search to choose a restaurant. Check its information and explore the menu.")],
            [copy("Reserve sua mesa", "Reserve your table"), copy("Escolha a data, um horário disponível e o número de pessoas. Depois, envie sua reserva.", "Choose a date, an available time and your party size. Then submit your reservation.")],
            [copy("Acompanhe e aproveite", "Keep track and enjoy"), copy("Veja o status em Reservas. Se quiser, antecipe seu pedido quando a opção estiver disponível.", "Check the status in Reservations. If you wish, order ahead when the option is available.")],
          ].map(([title, text], index) => <li className="discover-guide-step" key={index} data-reveal style={{ "--reveal-delay": `${index * 90}ms` }}>
            <span className="discover-guide-number" aria-hidden="true">0{index + 1}</span>
            <h3>{title}</h3><p>{text}</p>
          </li>)}
        </ol>
        <Link href="#restaurantes" className="discover-text-link">{copy("Encontrar minha próxima mesa", "Find my next table")} <span aria-hidden="true">↗</span></Link>
      </div>
    </section>

    <section className="discover-section discover-faq">
      <div className="discover-container discover-faq-grid"><div data-reveal><h2>{copy("Ficou com\nalguma dúvida?", "Any\nquestions?")}</h2><p className="discover-body">{copy("Conheça um pouco mais sobre a sua próxima experiência com a Appono.", "Learn more about your next experience with Appono.")}</p></div>
        <div className="discover-questions" data-reveal>{questions.map(([ptQuestion, enQuestion, ptAnswer, enAnswer]) => <details key={ptQuestion}><summary><span>{copy(ptQuestion, enQuestion)}</span><span className="discover-question-plus" aria-hidden="true">+</span></summary><p>{copy(ptAnswer, enAnswer)}</p></details>)}</div>
      </div>
    </section>
  </div>;
}

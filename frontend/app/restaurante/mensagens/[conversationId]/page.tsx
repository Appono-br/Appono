"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type RestaurantSession = {
  type?: "client" | "restaurant";
  name?: string;
};

type ChatMessage = {
  id: string;
  sender: "client" | "restaurant";
  text: string;
  time: string;
};

type ConversationDetail = {
  id: string;
  customer: string;
  initials: string;
  online: boolean;
  segment: string;
  reservation: {
    date: string;
    time: string;
    people: string;
  };
  preferences: string[];
  messages: ChatMessage[];
};

const conversations: ConversationDetail[] = [];

const emptyConversation: ConversationDetail = {
  id: "",
  customer: "Conversa indisponivel",
  initials: "--",
  online: false,
  segment: "Aguardando backend",
  reservation: { date: "--", time: "--", people: "--" },
  preferences: [],
  messages: [],
};

function getStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

function Icon({
  type,
  className = "h-5 w-5",
}: {
  type:
    | "arrow-left"
    | "file"
    | "image"
    | "more"
    | "paperclip"
    | "phone"
    | "send"
    | "smile"
    | "video";
  className?: string;
}) {
  const paths = {
    "arrow-left": "M19 12H5M12 19l-7-7 7-7",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
    image: "M4 5h16v14H4V5z M8 13l2.5-2.5L14 14l2-2 4 4M8 9h.01",
    more: "M12 12h.01M19 12h.01M5 12h.01",
    paperclip:
      "m21.4 11.6-8.5 8.5a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 5 5L10.6 18a2 2 0 1 1-2.8-2.8l8.5-8.5",
    phone:
      "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z",
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
    smile:
      "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01",
    video: "M15 10l5-3v10l-5-3v-4z M4 6h11v12H4V6z",
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path
        d={paths[type]}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function RestaurantConversationPage() {
  const params = useParams<{ conversationId?: string }>();
  const [session] = useState<RestaurantSession | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedSession = getStorage()?.getItem("appono:session");
    return storedSession ? (JSON.parse(storedSession) as RestaurantSession) : null;
  });
  const [draft, setDraft] = useState("");
  const [sentMessages, setSentMessages] = useState<ChatMessage[]>([]);

  const conversation = useMemo(
    () =>
      conversations.find((item) => item.id === params.conversationId) ??
      emptyConversation,
    [params.conversationId],
  );
  const isRestaurant = session?.type === "restaurant";
  const messages = [...conversation.messages, ...sentMessages];

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    setSentMessages((current) => [
      ...current,
      {
        id: `local-${current.length + 1}`,
        sender: "restaurant",
        text: draft.trim(),
        time: "Agora",
      },
    ]);
    setDraft("");
  }

  if (!isRestaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image
            src="/brand/appono-mark.svg"
            alt="Appono"
            width={88}
            height={88}
            className="mx-auto h-20 w-20"
            priority
          />
          <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">
            Esta area e destinada a contas de restaurante.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado"
          >
            Entrar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-transparent text-app-cafe-profundo backdrop-blur-sm">
        <div className="mx-auto grid h-24 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-5">
          <Link href="/restaurante/home" aria-label="Home do restaurante">
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={88}
              height={88}
              className="h-16 w-16"
              priority
            />
          </Link>
          <div className="flex items-center justify-center gap-8">
            <Link
              href="/restaurante/mensagens"
              className="transition hover:text-app-caramelo-torrado"
              aria-label="Voltar para mensagens"
            >
              <Icon type="arrow-left" className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl font-bold uppercase tracking-[0.16em] sm:text-5xl">
              Chat
            </h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <section className="bg-app-cafe-profundo px-5 py-5 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-[8px] bg-app-mocha text-sm font-bold ring-1 ring-app-baunilha-dourada/30">
              {conversation.initials}
              {conversation.online ? (
                <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500" />
              ) : null}
            </span>
            <div>
              <h2 className="text-xl font-semibold">{conversation.customer}</h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                {conversation.online ? "Online" : "Ultima interacao recente"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-app-baunilha-dourada">
            <button type="button" aria-label="Ligar" className="transition hover:text-app-chantilly">
              <Icon type="phone" />
            </button>
            <button type="button" aria-label="Videochamada" className="transition hover:text-app-chantilly">
              <Icon type="video" />
            </button>
            <button type="button" aria-label="Mais opcoes" className="transition hover:text-app-chantilly">
              <Icon type="more" />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-5 py-10 xl:grid-cols-[1fr_0.72fr]">
        <section className="flex min-h-[720px] flex-col">
          {messages.length ? (
            <div className="mb-8 flex justify-center">
              <span className="rounded-full bg-app-caramelo-torrado px-5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-app-creme-leve">
                Hoje
              </span>
            </div>
          ) : null}

          <div className="flex-1 space-y-8">
            {messages.length ? (
              messages.map((message) => (
              <article
                key={message.id}
                className={`flex gap-4 ${
                  message.sender === "restaurant" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "client" ? (
                  <span className="mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-creme-suave text-[10px] font-bold text-app-mocha ring-1 ring-app-baunilha-dourada">
                    {conversation.initials}
                  </span>
                ) : null}
                <div className={message.sender === "restaurant" ? "max-w-md" : "max-w-sm"}>
                  <div
                    className={`overflow-hidden rounded-[8px] shadow-sm ring-1 ${
                      message.sender === "restaurant"
                        ? "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo"
                        : "bg-app-chantilly text-app-cafe-profundo ring-app-baunilha-dourada/60"
                      }`}
                  >
                    <p className="p-5 text-base leading-7">{message.text}</p>
                  </div>
                  <p
                    className={`mt-2 text-right text-xs ${
                      message.sender === "restaurant"
                        ? "text-app-caramelo-torrado"
                        : "text-app-cinza"
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              </article>
              ))
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/30 bg-app-creme-leve px-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
                  <Icon type="paperclip" />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-app-cafe-profundo">
                  Historico indisponivel
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">
                  As mensagens reais desta conversa serao exibidas quando o
                  backend do chat estiver conectado.
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={submitMessage}
            className="mt-8 flex items-center gap-3 rounded-[8px] bg-app-chantilly p-4 shadow-sm ring-1 ring-app-baunilha-dourada/60"
          >
            <button type="button" className="text-app-cinza transition hover:text-app-caramelo-torrado" aria-label="Anexar arquivo">
              <Icon type="paperclip" />
            </button>
            <button type="button" className="text-app-cinza transition hover:text-app-caramelo-torrado" aria-label="Inserir emoji">
              <Icon type="smile" />
            </button>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escreva sua mensagem aqui..."
              className="h-12 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-app-cinza/60"
            />
            <button
              type="submit"
              className="flex h-12 w-14 items-center justify-center rounded-[8px] bg-app-areia-quente text-app-cafe-profundo transition hover:bg-app-dourado-mel hover:text-white"
              aria-label="Enviar mensagem"
            >
              <Icon type="send" />
            </button>
          </form>
        </section>

        <aside className="h-fit rounded-[8px] bg-app-baunilha-dourada shadow-sm">
          <section className="border-b border-app-chantilly/70 p-8 text-center">
            <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-[8px] bg-app-creme-suave text-2xl font-bold text-app-mocha ring-4 ring-app-creme-leve">
              {conversation.initials}
            </span>
            <h2 className="mt-5 text-2xl font-medium text-app-cafe-profundo">
              {conversation.customer}
            </h2>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              {conversation.segment}
            </p>
          </section>

          <section className="p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
              Informacoes de reserva
            </p>
            <div className="mt-5 rounded-[8px] bg-app-chantilly p-5">
              {[
                ["Data", conversation.reservation.date],
                ["Horario", conversation.reservation.time],
                ["Pessoas", conversation.reservation.people],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 py-2 text-sm"
                >
                  <span className="text-app-mocha">{label}:</span>
                  <strong className="text-app-cafe-profundo">{value}</strong>
                </div>
              ))}
            </div>

            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
              Preferencias
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {conversation.preferences.map((preference) => (
                <span
                  key={preference}
                  className="rounded-[8px] bg-app-chantilly px-4 py-2 text-xs font-semibold text-app-mocha"
                >
                  {preference}
                </span>
              ))}
              {conversation.preferences.length === 0 ? (
                <span className="rounded-[8px] bg-app-chantilly px-4 py-2 text-xs font-semibold text-app-cinza">
                  Sem preferencias carregadas
                </span>
              ) : null}
            </div>

            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
              Midias compartilhadas
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="flex aspect-square items-center justify-center rounded-[8px] bg-app-creme-suave text-app-cinza">
                <Icon type="image" />
              </div>
              <div className="flex aspect-square items-center justify-center rounded-[8px] bg-app-creme-suave text-app-cinza">
                <Icon type="image" />
              </div>
              <div className="flex aspect-square items-center justify-center rounded-[8px] bg-app-creme-suave text-app-cinza">
                <Icon type="file" />
              </div>
            </div>
          </section>
        </aside>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image
            src="/brand/appono-mark.svg"
            alt="Appono"
            width={80}
            height={80}
            className="h-14 w-14 brightness-0 invert"
          />
          <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">
              Politica de Privacidade
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Termos de Uso
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Contato
            </Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">
            &copy; 2026 APPONO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}

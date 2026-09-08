"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { apiRequest } from "@/lib/api";

function Icon({ type, className = "h-5 w-5" }) {
  const paths = {
    "arrow-left": "M19 12H5M12 19l-7-7 7-7",
    info: "M12 17v-6M12 7h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    message: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z",
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function AvatarRestaurante({ conversa, size = "h-12 w-12" }) {
  const logoUrl = conversa?.restaurante?.logo_url;
  return (
    <span className={`relative flex ${size} shrink-0 overflow-hidden rounded-[14px] bg-app-cafe-profundo text-xs font-bold text-app-creme-leve ring-1 ring-app-baunilha-dourada/60`}>
      {logoUrl ? (
        <Image src={logoUrl} alt={conversa?.restaurante?.nome ?? conversa?.titulo ?? "Restaurante"} fill sizes="56px" className="object-contain bg-white p-1.5" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">{conversa?.iniciais ?? "AP"}</span>
      )}
    </span>
  );
}

export default function ConversationPage() {
  const params = useParams();
  const [dados, setDados] = useState(null);
  const [draft, setDraft] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    apiRequest(`/mensagens/${params.conversationId}`, { cacheTtlMs: 0, forceRefresh: true })
      .then((resposta) => {
        if (!cancelado) setDados(resposta);
      })
      .catch((erro) => {
        if (!cancelado) setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar a conversa.");
      });
    return () => {
      cancelado = true;
    };
  }, [params.conversationId]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [dados?.mensagens?.length]);

  async function enviarConteudo() {
    const conteudo = draft.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    setMensagem("");
    try {
      const novaMensagem = await apiRequest(`/mensagens/${params.conversationId}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ conteudo }),
      });
      setDados((atual) => ({ ...atual, mensagens: [...(atual?.mensagens ?? []), novaMensagem] }));
      setDraft("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível enviar a mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  async function enviarMensagem(event) {
    event.preventDefault();
    await enviarConteudo();
  }

  function enviarComEnter(event) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void enviarConteudo();
  }

  const conversa = dados?.conversa;
  const mensagens = dados?.mensagens ?? [];

  return (
    <main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-12 w-12" priority />
          <div className="flex items-center justify-center gap-5">
            <Link href="/cliente/mensagens" className="transition hover:text-app-caramelo-torrado" aria-label="Voltar para mensagens">
              <Icon type="arrow-left" className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold uppercase tracking-[0.16em] sm:text-2xl">Chat</h1>
          </div>
          <div className="justify-self-end">
            <ItemHeaderNotificacoes href="/cliente/notificacoes" />
          </div>
        </div>
      </header>

      <section className="border-b border-app-baunilha-dourada/45 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AvatarRestaurante conversa={conversa} />
            <div>
              <h2 className="text-base font-semibold">{conversa?.titulo ?? "Carregando conversa"}</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-app-cinza">
                {conversa?.pedido ? `Pedido #${conversa.pedido.id_pedido}` : conversa?.reserva ? `Reserva #${conversa.reserva.id_reserva}` : "Atendimento Appono"}
              </p>
            </div>
          </div>
          <Icon type="info" className="h-5 w-5 text-app-cinza" />
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8">
        {mensagem ? <p role="status" className="mb-4 rounded-[12px] border border-app-baunilha-dourada bg-white p-4 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}
        <div className="flex-1 space-y-4 rounded-[18px] bg-white p-4 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-6">
          {mensagens.length ? mensagens.map((item) => {
            const propria = item.tipo_remetente === "cliente";
            return (
              <article key={item.id_mensagem} className={`flex ${propria ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-[16px] px-4 py-3 shadow-sm ${propria ? "bg-app-cafe-profundo text-app-creme-leve" : "bg-white text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/55"}`}>
                  <p className="whitespace-pre-wrap text-sm leading-6">{item.conteudo}</p>
                  <p className={`mt-2 text-[10px] font-semibold ${propria ? "text-app-baunilha-dourada" : "text-app-cinza"}`}>{item.criado_formatado}</p>
                </div>
              </article>
            );
          }) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
                <Icon type="message" />
              </div>
              <h2 className="mt-5 text-xl font-semibold">Conversa iniciada</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">Envie uma mensagem para alinhar sua reserva ou pedido com o restaurante.</p>
            </div>
          )}
          <div ref={fimRef} />
        </div>

        <form onSubmit={enviarMensagem} className="mt-5 flex items-end gap-3 rounded-[16px] bg-white p-3 shadow-sm ring-1 ring-app-baunilha-dourada/60 transition focus-within:ring-app-caramelo-torrado">
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={enviarComEnter} maxLength={1200} placeholder="Escreva sua mensagem..." className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none placeholder:text-app-cinza/60" />
          <button type="submit" disabled={enviando || !draft.trim()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-app-dourado-mel text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-50" aria-label="Enviar mensagem">
            <Icon type="send" />
          </button>
        </form>
      </section>
    </main>
  );
}

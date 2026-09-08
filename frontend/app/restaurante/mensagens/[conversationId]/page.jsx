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
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
    message: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z",
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function formatarData(data) {
  if (!data) return "--";
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function AvatarRestaurante({ conversa, size = "h-16 w-16" }) {
  const logoUrl = conversa?.restaurante?.logo_url;
  return (
    <span className={`relative flex ${size} shrink-0 overflow-hidden rounded-[16px] bg-white text-xs font-bold text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/55`}>
      {logoUrl ? (
        <Image src={logoUrl} alt={conversa?.restaurante?.nome ?? "Restaurante"} fill sizes="72px" className="object-contain p-2" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">AP</span>
      )}
    </span>
  );
}

export default function RestaurantConversationPage() {
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
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-12 w-12" priority />
          <div className="flex items-center justify-center gap-5">
            <Link href="/restaurante/mensagens" className="transition hover:text-app-caramelo-torrado" aria-label="Voltar para mensagens">
              <Icon type="arrow-left" className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold uppercase tracking-[0.16em] sm:text-2xl">Chat</h1>
          </div>
          <div className="justify-self-end">
            <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-5 py-8 xl:grid-cols-[1fr_340px]">
        <section className="flex min-h-[680px] flex-col">
          <div className="mb-5 rounded-[18px] bg-app-cafe-profundo p-5 text-app-creme-leve shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-app-mocha text-sm font-bold">{conversa?.iniciais ?? "CL"}</span>
              <div>
                <h2 className="text-xl font-semibold">{conversa?.titulo ?? "Carregando conversa"}</h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-app-baunilha-dourada">Atendimento seguro</p>
              </div>
            </div>
          </div>

          {mensagem ? <p role="status" className="mb-4 rounded-[12px] border border-app-baunilha-dourada bg-white p-4 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}

          <div className="flex-1 space-y-4 rounded-[18px] bg-white p-4 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-6">
            {mensagens.length ? mensagens.map((item) => {
              const propria = item.tipo_remetente === "restaurante";
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
                <h2 className="mt-5 text-xl font-semibold">Conversa sem mensagens</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">Responda o cliente por aqui. A conversa fica vinculada ao perfil correto.</p>
              </div>
            )}
            <div ref={fimRef} />
          </div>

          <form onSubmit={enviarMensagem} className="mt-5 flex items-end gap-3 rounded-[16px] bg-white p-3 shadow-sm ring-1 ring-app-baunilha-dourada/60 transition focus-within:ring-app-caramelo-torrado">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={enviarComEnter} maxLength={1200} placeholder="Escreva sua resposta..." className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none placeholder:text-app-cinza/60" />
            <button type="submit" disabled={enviando || !draft.trim()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-app-dourado-mel text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-50" aria-label="Enviar mensagem">
              <Icon type="send" />
            </button>
          </form>
        </section>

        <aside className="h-fit rounded-[18px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/45">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Contexto</p>
          <h2 className="mt-2 text-2xl font-semibold">Atendimento</h2>
          <div className="mt-5 flex items-center gap-4 rounded-[14px] bg-white p-3 ring-1 ring-app-baunilha-dourada/55">
            <AvatarRestaurante conversa={conversa} />
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-cinza">Restaurante</span>
              <strong className="mt-1 block truncate text-app-cafe-profundo">{conversa?.restaurante?.nome ?? "Restaurante"}</strong>
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="rounded-[12px] bg-app-chantilly p-4">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-app-cinza">Cliente</span>
              <strong className="mt-1 block">{conversa?.cliente?.nome ?? conversa?.titulo ?? "--"}</strong>
            </div>
            <div className="rounded-[12px] bg-app-chantilly p-4">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-app-cinza">Reserva</span>
              <strong className="mt-1 block">
                {conversa?.reserva ? `${formatarData(conversa.reserva.data_reserva)} às ${String(conversa.reserva.horario_inicio).slice(0, 5)}` : "Sem reserva vinculada"}
              </strong>
            </div>
            <div className="rounded-[12px] bg-app-chantilly p-4">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-app-cinza">Pedido</span>
              <strong className="mt-1 block">{conversa?.pedido ? `#${conversa.pedido.id_pedido} - ${conversa.pedido.status_pedido}` : "Sem pedido vinculado"}</strong>
            </div>
          </div>
          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-app-cinza">
            <Icon type="file" className="mt-0.5 h-4 w-4 shrink-0" />
            As mensagens são restritas ao cliente e ao restaurante envolvidos.
          </p>
        </aside>
      </section>
    </main>
  );
}

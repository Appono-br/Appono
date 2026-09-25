"use client";

import { useInterface } from "@/lib/use-interface";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

function Icon({ type, className = "h-5 w-5" }) {
  const paths = {
    bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
    "chevron-right": "m9 18 6-6-6-6",
    menu: "M4 7h16M4 12h16M4 17h16",
    message: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z",
    search: "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function AvatarConversa({ conversa, size = "h-14 w-14" }) {
    const { ui } = useInterface();
  const logoUrl = conversa?.restaurante?.logo_url;
  return (
    <span className={`relative flex ${size} shrink-0 overflow-hidden rounded-[14px] bg-app-cafe-profundo text-xs font-bold text-app-creme-leve ring-1 ring-app-baunilha-dourada/60`}>
      {logoUrl ? (
        <Image src={logoUrl} alt={conversa?.restaurante?.nome ?? conversa?.titulo ?? "Restaurante"} fill sizes="56px" className="object-contain bg-white p-1.5" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">{conversa?.iniciais ?? ui("AP")}</span>
      )}
    </span>
  );
}


export default function MessagesPage() {
    const { ui, dataHoraUI } = useInterface();
  const [conversas, setConversas] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [conversaParaArquivar, setConversaParaArquivar] = useState(null);
  const [arquivando, setArquivando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    apiRequest("/mensagens", { cacheTtlMs: 0, forceRefresh: true })
      .then((dados) => {
        if (!cancelado) setConversas(dados ?? []);
      })
      .catch((erro) => {
        if (!cancelado) setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar as conversas.");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const conversasVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return conversas;
    return conversas.filter((conversa) =>
      [conversa.titulo, conversa.assunto, conversa.ultima_mensagem, conversa.restaurante?.nome]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo)),
    );
  }, [busca, conversas]);

  const totalNaoLidas = useMemo(() => conversas.filter((conversa) => conversa.nao_lida).length, [conversas]);

  async function arquivarConversa() {
    if (!conversaParaArquivar) return;
    setArquivando(true);
    setMensagem("");
    try {
      await apiRequest(`/mensagens/${conversaParaArquivar.id_conversa}/arquivar`, { method: "PATCH" });
      setConversas((atuais) => atuais.filter((conversa) => conversa.id_conversa !== conversaParaArquivar.id_conversa));
      setConversaParaArquivar(null);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível limpar o histórico da conversa.");
    } finally {
      setArquivando(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="relative isolate overflow-hidden rounded-[30px_76px_30px_76px] bg-app-cafe-profundo text-app-creme-leve shadow-sm">
          <div className="relative px-7 py-8 sm:px-10 sm:py-10">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold leading-[0.92] tracking-[-0.05em] sm:text-6xl">{ui("Mensagens")}</h1>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-9 gap-y-4 border-t border-white/10 pt-5">
              <div className="flex items-baseline gap-3">
                <strong className="text-3xl leading-none">{conversas.length}</strong>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-baunilha-dourada">{ui("Conversas")}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <strong className="text-3xl leading-none">{totalNaoLidas}</strong>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-baunilha-dourada">{ui("Não lidas")}</span>
              </div>
            </div>
          </div>
        </div>

        <label className="campo-busca-app mt-5 flex h-12 items-center gap-2 rounded-full bg-white px-3 text-app-cafe-profundo shadow-sm ring-1 ring-app-baunilha-dourada/60 transition focus-within:ring-app-caramelo-torrado sm:gap-3 sm:px-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-chantilly text-app-caramelo-torrado">
            <Icon type="search" className="h-5 w-5" />
          </span>
          <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder={ui("Buscar restaurante ou mensagem")} className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-app-cinza/70" />
        </label>

        {mensagem ? <p role="status" className="mt-6 rounded-[12px] border border-app-baunilha-dourada bg-white p-4 text-sm font-semibold text-app-caramelo-torrado">{ui(mensagem)}</p> : null}

        <div className="mt-8">
          {carregando ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-[18px] bg-app-chantilly shadow-sm ring-1 ring-app-baunilha-dourada/40" />)}
            </div>
          ) : conversasVisiveis.length ? (
            <div className="grid gap-4">
              {conversasVisiveis.map((conversa) => (
                <article key={conversa.id_conversa} className="group grid gap-4 rounded-[18px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/45 transition hover:-translate-y-0.5 hover:ring-app-caramelo-torrado/45 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
                  <Link href={`/cliente/mensagens/${conversa.id_conversa}`} className="grid min-w-0 gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <AvatarConversa conversa={conversa} size="h-16 w-16" />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="text-lg font-semibold text-app-cafe-profundo sm:text-xl">{conversa.titulo}</strong>
                        {conversa.nao_lida ? <span className="rounded-full bg-app-caramelo-torrado px-2.5 py-1 text-[10px] font-bold uppercase text-white">{ui("Nova")}</span> : null}
                        <span className="rounded-full bg-app-chantilly px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-app-mocha">{conversa?.pedido ? ui("Pedido #{0}", [conversa.pedido.id_pedido]) : conversa?.reserva ? ui("Reserva #{0}", [conversa.reserva.id_reserva]) : ui("Conversa direta")}</span>
                      </span>
                      <span className="mt-1 line-clamp-2 text-sm leading-6 text-app-cinza">{conversa.ultima_mensagem}</span>
                    </span>
                    <span className="flex items-center justify-between gap-3 text-xs font-semibold text-app-cinza sm:justify-end">
                      <span>{dataHoraUI(conversa.atualizado_em)}</span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-app-baunilha-dourada transition group-hover:border-app-caramelo-torrado group-hover:text-app-caramelo-torrado">
                        <Icon type="chevron-right" className="h-4 w-4" />
                      </span>
                    </span>
                  </Link>
                  <button type="button" onClick={() => setConversaParaArquivar(conversa)} className="w-fit rounded-[8px] border border-red-200 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-50 sm:justify-self-end">{ui("Limpar histórico")}</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <div className="text-app-caramelo-torrado">
                <Icon type="message" />
              </div>
              <h2 className="mt-3 text-base font-semibold text-app-cafe-profundo">{ui("Nenhuma conversa disponível")}</h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-app-cinza">{ui("Abra o perfil de um restaurante para iniciar uma conversa segura.")}</p>
            </div>
          )}
        </div>
      </section>
      <ConfirmationDialog
        open={Boolean(conversaParaArquivar)}
        eyebrow={ui("Histórico da conversa")}
        title={ui("Limpar esta conversa?")}
        description={ui("A conversa será ocultada apenas para você. O outro participante continua com o próprio histórico e os registros seguem preservados.")}
        confirmLabel={ui("Limpar histórico")}
        cancelLabel={ui("Manter conversa")}
        loading={arquivando}
        onCancel={() => setConversaParaArquivar(null)}
        onConfirm={arquivarConversa}
        details={conversaParaArquivar ? <p className="font-semibold">{conversaParaArquivar.titulo}</p> : null}
      />
    </main>
  );
}

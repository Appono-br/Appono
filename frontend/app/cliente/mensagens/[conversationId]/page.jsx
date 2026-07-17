"use client";
import Image from "next/image";
import Link from "next/link";
const messages = [];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "arrow-left": "M19 12H5M12 19l-7-7 7-7",
        info: "M12 17v-6M12 7h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        message: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z",
        paperclip: "m21.4 11.6-8.5 8.5a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 5 5L10.6 18a2 2 0 1 1-2.8-2.8l8.5-8.5",
        phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z",
        send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
        smile: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
export default function ConversationPage() {
    return (<main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="border-b border-app-baunilha-dourada/50 bg-app-creme-suave">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-16 w-16" priority/>
          </div>
          <div className="flex items-center justify-center gap-8">
            <Link href="/cliente/mensagens" className="transition hover:text-app-caramelo-torrado" aria-label="Voltar para mensagens">
              <Icon type="arrow-left" className="h-6 w-6"/>
            </Link>
            <h1 className="text-3xl font-bold uppercase tracking-[0.16em] sm:text-5xl">
              Chat
            </h1>
          </div>
          <div className="w-16"/>
        </div>
      </header>

      <section className="border-b border-app-baunilha-dourada/45 bg-app-chantilly px-5 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-app-creme-leve text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/60">
              <Icon type="message"/>
            </div>
            <div>
              <h2 className="text-base font-medium text-app-cafe-profundo">
                Nenhuma conversa selecionada
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-app-cinza">
                Sem mensagens
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-app-cinza">
            <button type="button" aria-label="Ligar" disabled>
              <Icon type="phone"/>
            </button>
            <button type="button" aria-label="Informações" disabled>
              <Icon type="info"/>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-10">
        <div className="flex flex-1 items-center justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-app-creme-leve px-6 py-12 text-center">
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
              <Icon type="message"/>
            </div>
            <h2 className="mt-5 text-xl font-semibold text-app-cafe-profundo">
              Nenhuma mensagem disponível
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">
              Selecione uma conversa para visualizar o histórico de mensagens.
            </p>
          </div>
        </div>

        {messages.length ? null : (<form className="mt-8 flex items-center gap-3 rounded-[8px] bg-app-creme-leve p-4 shadow-sm ring-1 ring-app-baunilha-dourada/60">
            <button type="button" disabled className="text-app-cinza" aria-label="Anexar arquivo">
              <Icon type="paperclip"/>
            </button>
            <input disabled placeholder="Escreva a sua mensagem..." className="h-12 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-app-cinza/60"/>
            <button type="button" disabled className="text-app-cinza" aria-label="Inserir emoji">
              <Icon type="smile"/>
            </button>
            <button type="submit" disabled className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-app-dourado-mel/45 text-white" aria-label="Enviar mensagem">
              <Icon type="send"/>
            </button>
          </form>)}
      </section>
    </main>);
}

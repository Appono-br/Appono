"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
const navItems = [
    { label: "Home", href: "/restaurante/home" },
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestao de cardapio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatorio financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configuracoes", href: "/restaurante/configuracoes" },
];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        filter: "M4 7h16M7 12h10M10 17h4",
        menu: "M4 7h16M4 12h16M4 17h16",
        plus: "M12 5v14M5 12h14",
        utensils: "M7 3v8M4 3v8M10 3v8M4 11h6M7 11v10M17 3v18M14 3h3a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function EmptyPanel({ title, description, className = "", }) {
    return (<div className={`flex min-h-52 flex-col justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/30 bg-app-creme-leve px-6 py-8 text-app-cafe-profundo ${className}`}>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">
        {description}
      </p>
    </div>);
}
export default function RestaurantReservationsPage() {
    const [session] = useState(() => {
        if (typeof window === "undefined") {
            return null;
        }
        const storedSession = window.localStorage.getItem("appono:session");
        return storedSession ? JSON.parse(storedSession) : null;
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [reservas, setReservas] = useState([]);
    const [mensagem, setMensagem] = useState("");
    const isRestaurant = session?.type === "restaurant";
    useEffect(() => {
        if (!isRestaurant)
            return;
        apiRequest("/reservas")
            .then(setReservas)
            .catch((erro) => setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar as reservas."));
    }, [isRestaurant]);
    async function cancelarReserva(id) {
        try {
            const atualizada = await apiRequest(`/reservas/${id}/cancelar`, {
                method: "PATCH",
            });
            setReservas((atuais) => atuais.map((reserva) => (reserva.id_reserva === id ? { ...reserva, ...atualizada } : reserva)));
            setMensagem("Reserva desmarcada.");
        }
        catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel desmarcar a reserva.");
        }
    }
    async function excluirReservaDaLista(id) {
        try {
            await apiRequest(`/reservas/${id}/ocultar`, { method: "PATCH" });
            setReservas((atuais) => atuais.filter((reserva) => reserva.id_reserva !== id));
            setMensagem("Reserva removida da lista.");
        }
        catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel remover a reserva.");
        }
    }
    async function atualizarStatusPedido(idPedido, statusPedido) {
        try {
            const atualizado = await apiRequest(`/pedidos/${idPedido}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status_pedido: statusPedido }),
            });
            setReservas((atuais) => atuais.map((reserva) => ({
                ...reserva,
                pedidos: reserva.pedidos?.map((pedido) => pedido.id_pedido === idPedido ? { ...pedido, status_pedido: atualizado.status_pedido } : pedido),
            })));
            setMensagem("Status do pedido atualizado.");
        }
        catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel atualizar o pedido.");
        }
    }
    if (!isRestaurant) {
        return (<main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority/>
          <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">
            Esta area e destinada a contas de restaurante.
          </p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">
            Entrar
          </Link>
        </section>
      </main>);
    }
    return (<main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority/>
          </div>

          <nav className="hidden items-center justify-self-center gap-6 text-xs font-semibold text-app-cinza xl:flex">
            {navItems.map((item, index) => (<Link key={item.label} href={item.href} className={index === 5
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-reservations-menu">
            <Icon type="menu"/>
          </button>
        </div>

        {mobileMenuOpen ? (<nav id="restaurant-reservations-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={index === 5
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="grid gap-6 border-t border-app-baunilha-dourada/60 pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
              Reservas
            </p>
            <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
              Agendamentos do Dia
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
              Gerencie as experiencias gastronomicas planejadas para hoje.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-app-creme-leve px-5 text-xs font-bold uppercase tracking-[0.18em] text-app-mocha transition hover:bg-app-baunilha-dourada">
              <Icon type="filter" className="h-4 w-4"/>
              Filtrar
            </button>
            <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-app-dourado-mel px-6 text-xs font-bold uppercase text-white transition hover:bg-app-caramelo-torrado">
              <Icon type="plus" className="h-4 w-4"/>
              Nova reserva
            </button>
          </div>
        </div>

        <section className="mt-10">
          <section>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">
                Proximos clientes
              </h2>
              <p className="text-sm text-app-cinza">{reservas.length} agendamentos</p>
            </div>

            {mensagem ? <p className="mb-4 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}
            {reservas.length ? (<div className="grid gap-3">
                {reservas.map((reserva) => (<article key={reserva.id_reserva} className="rounded-[8px] bg-app-chantilly p-5 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-app-caramelo-torrado">
                          {reserva.data_reserva} · {reserva.horario_inicio} - {reserva.horario_fim}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold">{reserva.clientes?.nome ?? "Cliente"}</h3>
                        <p className="mt-1 text-sm text-app-mocha">
                          {reserva.quantidade_pessoas} pessoas · Mesa {reserva.mesas?.numero_mesa ?? "-"}
                        </p>
                        <p className="mt-1 text-sm text-app-mocha">
                          Consumo minimo: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(reserva.valor_minimo_total)}
                        </p>
                        <p className="mt-2 text-xs font-bold uppercase text-app-cinza">Status: {reserva.status_reserva}</p>
                        {reserva.pedidos?.map((pedido) => (<div key={pedido.id_pedido} className="mt-4 rounded-[8px] bg-app-creme-suave p-4 ring-1 ring-app-baunilha-dourada/60">
                            <p className="text-xs font-bold uppercase text-app-caramelo-torrado">
                              Pedido antecipado #{pedido.id_pedido}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-app-cafe-profundo">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(pedido.valor_total))}
                              {" · "}{pedido.status_pedido}
                            </p>
                            <div className="mt-3 grid gap-1 text-sm text-app-mocha">
                              {pedido.itens_pedido?.map((item, indice) => (<p key={`${item.produtos?.nome ?? "item"}-${indice}`}>
                                  {item.quantidade}x {item.produtos?.nome ?? "Item"}
                                  {item.observacoes ? ` · ${item.observacoes}` : ""}
                                </p>))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {pedido.status_pedido === "CONFIRMADO" ? (<button type="button" onClick={() => atualizarStatusPedido(pedido.id_pedido, "EM_PREPARO")} className="rounded-[8px] bg-app-dourado-mel px-3 py-2 text-xs font-bold text-white">
                                  Iniciar preparo
                                </button>) : null}
                              {pedido.status_pedido === "EM_PREPARO" ? (<button type="button" onClick={() => atualizarStatusPedido(pedido.id_pedido, "PRONTO")} className="rounded-[8px] bg-app-cafe-profundo px-3 py-2 text-xs font-bold text-white">
                                  Marcar como pronto
                                </button>) : null}
                              {pedido.status_pedido === "PRONTO" ? (<button type="button" onClick={() => atualizarStatusPedido(pedido.id_pedido, "ENTREGUE")} className="rounded-[8px] bg-app-dourado-mel px-3 py-2 text-xs font-bold text-white">
                                  Marcar como entregue
                                </button>) : null}
                            </div>
                          </div>))}
                      </div>
                      {["PENDENTE", "CONFIRMADA"].includes(reserva.status_reserva) ? (<button type="button" onClick={() => cancelarReserva(reserva.id_reserva)} className="h-9 rounded-[8px] border border-app-vermelho-erro/40 px-3 text-xs font-bold text-app-vermelho-erro transition hover:bg-app-vermelho-erro hover:text-white">
                          Desmarcar
                        </button>) : null}
                      {["CANCELADA", "RECUSADA"].includes(reserva.status_reserva) ? (<button type="button" onClick={() => excluirReservaDaLista(reserva.id_reserva)} className="h-9 rounded-[8px] border border-app-baunilha-dourada px-3 text-xs font-bold text-app-cinza transition hover:border-app-vermelho-erro/40 hover:text-app-vermelho-erro">
                          Excluir da lista
                        </button>) : null}
                    </div>
                  </article>))}
              </div>) : (<EmptyPanel title="Nenhum agendamento para exibir" description="Os agendamentos recebidos aparecerao nesta lista." className="min-h-[310px] bg-app-chantilly"/>)}
          </section>
        </section>

      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
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

    </main>);
}

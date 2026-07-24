"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}

function formatarData(data) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(`${data}T12:00:00`));
}

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        clock: "M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
        minus: "M5 12h14",
        plus: "M12 5v14M5 12h14",
        receipt: "M7 3h10v18l-2-1-2 1-2-1-2 1-2-1V3z M9 8h6M9 12h6M9 16h4",
        utensils: "M7 3v8M4 3v8M10 3v8M4 11h6M7 11v10M17 3v18M14 3h3a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3",
    };

    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
            <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function obterProdutosSelecionados(produtos, quantidades) {
    return produtos
        .map((produto) => ({
            ...produto,
            quantidade: quantidades[produto.id_produto] ?? 0,
        }))
        .filter((produto) => produto.quantidade > 0);
}

export default function PaginaPedidoAntecipado({ params }) {
    const [reservaId, setReservaId] = useState(null);
    const [dados, setDados] = useState(null);
    const [quantidades, setQuantidades] = useState({});
    const [observacoes, setObservacoes] = useState("");
    const [mensagem, setMensagem] = useState("Carregando cardapio...");
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        params.then(({ id }) => setReservaId(Number(id)));
    }, [params]);

    useEffect(() => {
        if (!reservaId) {
            return;
        }
        apiRequest(`/reservas/${reservaId}/cardapio`)
            .then((resultado) => {
                setDados(resultado);
                setMensagem("");
            })
            .catch((erro) => setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar o cardapio."));
    }, [reservaId]);

    const categorias = useMemo(() => {
        return dados?.cardapios.flatMap((cardapio) =>
            (cardapio.categorias ?? []).map((categoria) => ({
                ...categoria,
                cardapio: cardapio.nome,
            })),
        ) ?? [];
    }, [dados]);

    const produtos = useMemo(() => {
        return categorias.flatMap((categoria) =>
            (categoria.produtos ?? []).map((produto) => ({
                ...produto,
                categoria: categoria.nome,
            })),
        );
    }, [categorias]);

    const produtosSelecionados = useMemo(() => obterProdutosSelecionados(produtos, quantidades), [produtos, quantidades]);
    const totalItens = produtosSelecionados.reduce((soma, produto) => soma + produto.quantidade, 0);
    const total = produtosSelecionados.reduce((soma, produto) => soma + Number(produto.preco) * produto.quantidade, 0);
    const maiorTempoPreparo = produtosSelecionados.reduce((maior, produto) => Math.max(maior, Number(produto.tempo_preparo_minutos ?? 30)), 0);
    const pedidoAtivo = dados?.reserva.pedidos?.find((pedido) => ["PENDENTE", "CONFIRMADO", "EM_PREPARO", "PRONTO"].includes(pedido.status_pedido));
    const itensPedidoAtivo = pedidoAtivo?.itens_pedido ?? [];
    const totalItensPedidoAtivo = itensPedidoAtivo.reduce((soma, item) => soma + Number(item.quantidade ?? 0), 0);
    const maiorTempoPedidoAtivo = itensPedidoAtivo.reduce((maior, item) => Math.max(maior, Number(item.produtos?.tempo_preparo_minutos ?? 0)), 0);

    function alterarQuantidade(produtoId, diferenca) {
        setMensagem("");
        setQuantidades((atuais) => ({
            ...atuais,
            [produtoId]: Math.max(0, (atuais[produtoId] ?? 0) + diferenca),
        }));
    }

    async function criarPedido() {
        if (!reservaId) {
            return;
        }
        const itens = produtosSelecionados.map((produto) => ({
            id_produto: produto.id_produto,
            quantidade: produto.quantidade,
        }));
        if (!itens.length) {
            setMensagem("Escolha ao menos um item do cardapio.");
            return;
        }
        setEnviando(true);
        setMensagem("");
        try {
            await apiRequest("/pedidos", {
                method: "POST",
                body: JSON.stringify({ id_reserva: reservaId, itens, observacoes }),
            });
            window.location.assign("/cliente/reservas");
        }
        catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel criar o pedido.");
        }
        finally {
            setEnviando(false);
        }
    }

    if (!dados) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
                <p className="text-sm font-semibold">{mensagem}</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-app-chantilly px-5 py-8 text-app-cafe-profundo">
            <div className="mx-auto max-w-7xl">
                <Link href="/cliente/reservas" className="text-sm font-bold text-app-caramelo-torrado">
                    Voltar para reservas
                </Link>

                <header className="mt-6 overflow-hidden rounded-[14px] bg-app-cafe-profundo text-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/50">
                    <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-app-areia-quente">Pedido antecipado</p>
                            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                                {dados.reserva.restaurantes?.nome ?? "Restaurante"}
                            </h1>
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-app-creme-suave">
                                Escolha os itens antes da sua chegada. O restaurante recebe o pedido vinculado a sua reserva e consegue se preparar para o horario combinado.
                            </p>
                        </div>
                        <div className="rounded-[12px] bg-app-creme-leve/10 p-4 text-sm ring-1 ring-app-baunilha-dourada/35">
                            <p className="font-bold">{formatarData(dados.reserva.data_reserva)}</p>
                            <p className="mt-1 text-app-baunilha-dourada">
                                {dados.reserva.horario_inicio.slice(0, 5)} - reserva confirmada
                            </p>
                        </div>
                    </div>
                </header>

                {pedidoAtivo ? (
                    <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
                        <div className="rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada sm:p-8">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Pedido registrado</p>
                                    <h2 className="mt-2 text-3xl font-bold">Itens escolhidos pelo cliente</h2>
                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-app-mocha">
                                        Este pedido esta vinculado a reserva e ja aparece para o restaurante acompanhar o preparo.
                                    </p>
                                </div>
                                <span className="rounded-full bg-app-cafe-profundo px-4 py-2 text-xs font-bold uppercase text-app-creme-leve">
                                    {pedidoAtivo.status_pedido}
                                </span>
                            </div>

                            <div className="mt-6 grid gap-4">
                                {itensPedidoAtivo.map((item, indice) => {
                                    const produto = item.produtos ?? {};
                                    const subtotal = Number(item.subtotal ?? 0) || Number(item.preco_unitario ?? 0) * Number(item.quantidade ?? 0);

                                    return (
                                        <article key={`${produto.nome ?? "item"}-${indice}`} className="grid gap-4 rounded-[12px] bg-app-creme-suave p-4 ring-1 ring-app-baunilha-dourada/55 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                                            <div className="relative h-28 overflow-hidden rounded-[10px] bg-app-baunilha-dourada/45">
                                                {produto.imagem_url ? (
                                                    <Image src={produto.imagem_url} alt={produto.nome ?? "Item do pedido"} fill className="object-cover" />
                                                ) : (
                                                    <span className="flex h-full items-center justify-center text-app-caramelo-torrado">
                                                        <Icon type="utensils" />
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase text-app-caramelo-torrado">{item.quantidade} unidade(s)</p>
                                                <h3 className="mt-1 text-xl font-bold text-app-cafe-profundo">{produto.nome ?? "Item"}</h3>
                                                {produto.descricao ? <p className="mt-2 text-sm leading-6 text-app-mocha">{produto.descricao}</p> : null}
                                                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-app-cinza">
                                                    <span>Tempo: {produto.tempo_preparo_minutos ?? "--"} min</span>
                                                    {item.observacoes ? <span>Obs: {item.observacoes}</span> : null}
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-xs font-semibold text-app-cinza">Subtotal</p>
                                                <strong className="text-xl text-app-cafe-profundo">{formatarMoeda(subtotal)}</strong>
                                                {item.preco_unitario ? (
                                                    <p className="mt-1 text-xs text-app-mocha">{formatarMoeda(item.preco_unitario)} cada</p>
                                                ) : null}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>

                        <aside className="h-fit rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada lg:sticky lg:top-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-app-baunilha-dourada text-app-cafe-profundo">
                                    <Icon type="receipt" />
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold">Resumo</h2>
                                    <p className="text-xs text-app-cinza">{totalItensPedidoAtivo} itens no pedido</p>
                                </div>
                            </div>
                            <div className="mt-5 grid gap-3 border-t border-app-baunilha-dourada pt-5 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-app-mocha">Status</span>
                                    <strong>{pedidoAtivo.status_pedido}</strong>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-app-mocha">Tempo estimado</span>
                                    <strong>{maiorTempoPedidoAtivo || "--"} min</strong>
                                </div>
                                {pedidoAtivo.iniciar_preparo_em ? (
                                    <div className="flex justify-between gap-4">
                                        <span className="text-app-mocha">Iniciar preparo</span>
                                        <strong>{String(pedidoAtivo.iniciar_preparo_em).slice(11, 16)}</strong>
                                    </div>
                                ) : null}
                                {pedidoAtivo.horario_entrega_previsto ? (
                                    <div className="flex justify-between gap-4">
                                        <span className="text-app-mocha">Previsao</span>
                                        <strong>{String(pedidoAtivo.horario_entrega_previsto).slice(11, 16)}</strong>
                                    </div>
                                ) : null}
                                <div className="flex items-center justify-between border-t border-app-baunilha-dourada pt-4">
                                    <span className="font-bold">Total</span>
                                    <strong className="text-2xl">{formatarMoeda(pedidoAtivo.valor_total)}</strong>
                                </div>
                            </div>
                            {pedidoAtivo.observacoes ? (
                                <p className="mt-5 rounded-[8px] bg-app-creme-suave p-4 text-sm leading-6 text-app-mocha">
                                    <strong>Observacoes:</strong> {pedidoAtivo.observacoes}
                                </p>
                            ) : null}
                        </aside>
                    </section>
                ) : (
                    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                        <section className="grid gap-6">
                            {categorias.map((categoria) => (
                                <article key={categoria.id_categoria} className="rounded-[14px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada sm:p-6">
                                    <div className="flex flex-wrap items-end justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{categoria.cardapio}</p>
                                            <h2 className="mt-1 text-2xl font-bold">{categoria.nome}</h2>
                                        </div>
                                        <span className="rounded-full bg-app-creme-suave px-3 py-1 text-xs font-bold text-app-mocha">
                                            {(categoria.produtos ?? []).length} itens
                                        </span>
                                    </div>

                                    <div className="mt-5 grid gap-4">
                                        {(categoria.produtos ?? []).map((produto) => {
                                            const quantidade = quantidades[produto.id_produto] ?? 0;

                                            return (
                                                <div key={produto.id_produto} className="grid gap-4 rounded-[12px] bg-app-creme-suave p-3 ring-1 ring-app-baunilha-dourada/55 sm:grid-cols-[128px_1fr_auto] sm:items-center">
                                                    <div className="relative h-28 overflow-hidden rounded-[10px] bg-app-baunilha-dourada/45">
                                                        {produto.imagem_url ? (
                                                            <Image src={produto.imagem_url} alt={produto.nome} fill className="object-cover" />
                                                        ) : (
                                                            <span className="flex h-full items-center justify-center text-app-caramelo-torrado">
                                                                <Icon type="utensils" />
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {produto.destaque ? (
                                                                <span className="rounded-full bg-app-cafe-profundo px-2.5 py-1 text-[10px] font-bold uppercase text-app-creme-leve">
                                                                    Destaque
                                                                </span>
                                                            ) : null}
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-app-cinza">
                                                                <Icon type="clock" className="h-4 w-4" />
                                                                {produto.tempo_preparo_minutos ?? 30} min
                                                            </span>
                                                        </div>
                                                        <h3 className="mt-2 text-lg font-bold text-app-cafe-profundo">{produto.nome}</h3>
                                                        {produto.descricao ? <p className="mt-1 text-sm leading-6 text-app-mocha">{produto.descricao}</p> : null}
                                                        <p className="mt-2 text-base font-bold text-app-caramelo-torrado">{formatarMoeda(produto.preco)}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                                                        <button type="button" onClick={() => alterarQuantidade(produto.id_produto, -1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-app-creme-leve text-app-cafe-profundo ring-1 ring-app-baunilha-dourada transition hover:bg-app-baunilha-dourada">
                                                            <Icon type="minus" className="h-4 w-4" />
                                                        </button>
                                                        <span className="min-w-8 text-center text-lg font-bold">{quantidade}</span>
                                                        <button type="button" onClick={() => alterarQuantidade(produto.id_produto, 1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-app-dourado-mel text-white transition hover:bg-app-caramelo-torrado">
                                                            <Icon type="plus" className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </article>
                            ))}

                            {!produtos.length ? (
                                <p className="rounded-[12px] bg-app-creme-leve p-8 text-center text-sm font-semibold shadow-sm ring-1 ring-app-baunilha-dourada">
                                    Este restaurante ainda nao publicou itens no cardapio.
                                </p>
                            ) : null}
                        </section>

                        <aside className="h-fit rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada lg:sticky lg:top-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-app-baunilha-dourada text-app-cafe-profundo">
                                    <Icon type="receipt" />
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold">Resumo do pedido</h2>
                                    <p className="text-xs text-app-cinza">{totalItens} {totalItens === 1 ? "item selecionado" : "itens selecionados"}</p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-2">
                                {produtosSelecionados.length ? produtosSelecionados.map((produto) => (
                                    <div key={produto.id_produto} className="grid grid-cols-[1fr_auto] gap-3 rounded-[8px] bg-app-creme-suave p-3 text-sm">
                                        <span>
                                            <strong>{produto.quantidade}x</strong> {produto.nome}
                                        </span>
                                        <strong>{formatarMoeda(Number(produto.preco) * produto.quantidade)}</strong>
                                    </div>
                                )) : (
                                    <p className="rounded-[8px] bg-app-creme-suave p-4 text-sm text-app-mocha">
                                        Selecione os itens do cardapio para montar o pedido.
                                    </p>
                                )}
                            </div>

                            <label className="mt-5 grid gap-2 text-xs font-bold uppercase text-app-cinza">
                                Observacoes
                                <textarea value={observacoes} onChange={(evento) => setObservacoes(evento.target.value)} placeholder="Ex: retirar cebola, ponto da carne, alergias..." className="min-h-24 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly p-3 text-sm font-normal normal-case text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>

                            <div className="mt-5 grid gap-3 border-t border-app-baunilha-dourada pt-5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-app-mocha">Tempo estimado</span>
                                    <strong>{maiorTempoPreparo || 0} min</strong>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold">Total</span>
                                    <strong className="text-2xl text-app-cafe-profundo">{formatarMoeda(total)}</strong>
                                </div>
                            </div>

                            <button type="button" onClick={criarPedido} disabled={enviando || total <= 0} className="mt-5 h-12 w-full rounded-[8px] bg-app-dourado-mel text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-50">
                                {enviando ? "Confirmando..." : "Confirmar pedido antecipado"}
                            </button>
                            {mensagem ? <p className="mt-3 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}

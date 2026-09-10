"use client";

import { useInterface } from "@/lib/use-interface";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const navItems = [
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestão de cardápio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatório financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Cozinha", href: "/restaurante/pedidos" },
    { label: "Histórico", href: "/restaurante/historico-pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configurações", href: "/restaurante/configuracoes" },
];

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        category: "M5 5h6v6H5V5z M13 5h6v6h-6V5z M5 13h6v6H5v-6z M13 13h6v6h-6v-6z",
        check: "m5 12 4 4L19 6",
        menu: "M4 7h16M4 12h16M4 17h16",
        pencil: "M16.5 4.5l3 3L8 19H5v-3L16.5 4.5z",
        plus: "M12 5v14M5 12h14",
        search: "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
        star: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9L12 3z",
        trash: "M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V5h6v2",
        utensils: "M7 3v8M4 3v8M10 3v8M4 11h6M7 11v10M17 3v18M14 3h3a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3",
    };
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
            <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function formatarMoeda(valor, localeUI = "pt-BR") {
    return new Intl.NumberFormat(localeUI, {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}

function obterProdutos(cardapios) {
    return cardapios.flatMap((cardapio) =>
        (cardapio.categorias ?? []).flatMap((categoria) =>
            (categoria.produtos ?? []).map((produto) => ({
                ...produto,
                categoria: categoria.nome,
                cardapio: cardapio.nome,
            })),
        ),
    );
}

function obterCategorias(cardapios) {
    return cardapios.flatMap((cardapio) =>
        (cardapio.categorias ?? []).map((categoria) => ({
            ...categoria,
            cardapio: cardapio.nome,
        })),
    );
}

const categoriaInicial = {
    id: null,
    name: "",
    description: "",
    displayOrder: "0",
};

export default function RestaurantMenuManagementPage() {
    const { ui , localeUI } = useInterface();
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [cardapios, setCardapios] = useState([]);
    const [mensagem, setMensagem] = useState("Carregando cardápio...");
    const [produtoExcluindoId, setProdutoExcluindoId] = useState(null);
    const [produtoAtualizandoId, setProdutoAtualizandoId] = useState(null);
    const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
    const [categoriaForm, setCategoriaForm] = useState(categoriaInicial);
    const [categoriaAtualizandoId, setCategoriaAtualizandoId] = useState(null);
    const [categoriaParaArquivar, setCategoriaParaArquivar] = useState(null);
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState("todos");

    const carregarCardapio = useCallback(() => {
        return apiRequest("/cardapio")
            .then((resposta) => {
                setCardapios(resposta.cardapios ?? []);
                setMensagem("");
            })
            .catch((error) => {
                setMensagem(error instanceof Error ? error.message : "Não foi possível carregar o cardápio.");
            });
    }, []);

    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant") {
            return;
        }
        carregarCardapio();
    }, [carregarCardapio, sessao, sessaoCarregada]);

    async function alterarDisponibilidade(produto) {
        setProdutoAtualizandoId(produto.id_produto);
        setMensagem("");
        try {
            const resposta = await apiRequest(`/cardapio/produtos/${produto.id_produto}/disponibilidade`, {
                method: "PATCH",
                body: JSON.stringify({ available: !produto.disponivel }),
            });
            setMensagem(resposta.message ?? "Disponibilidade atualizada.");
            await carregarCardapio();
        }
        catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível alterar a disponibilidade.");
        }
        finally {
            setProdutoAtualizandoId(null);
        }
    }

    async function alterarDestaque(produto) {
        setProdutoAtualizandoId(produto.id_produto);
        setMensagem("");
        try {
            const resposta = await apiRequest(`/cardapio/produtos/${produto.id_produto}/destaque`, {
                method: "PATCH",
                body: JSON.stringify({ featured: !produto.destaque }),
            });
            setMensagem(resposta.message ?? "Destaque atualizado.");
            await carregarCardapio();
        }
        catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível alterar o destaque.");
        }
        finally {
            setProdutoAtualizandoId(null);
        }
    }

    async function excluirProduto() {
        if (!produtoParaExcluir) {
            return;
        }
        setProdutoExcluindoId(produtoParaExcluir.id_produto);
        setMensagem("");
        try {
            const resposta = await apiRequest(`/cardapio/produtos/${produtoParaExcluir.id_produto}`, {
                method: "DELETE",
            });
            setMensagem(resposta.message ?? "Item excluído do cardápio.");
            setProdutoParaExcluir(null);
            await carregarCardapio();
        }
        catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível excluir o item.");
        }
        finally {
            setProdutoExcluindoId(null);
        }
    }

    async function salvarCategoria(event) {
        event.preventDefault();
        setCategoriaAtualizandoId(categoriaForm.id ?? "nova");
        setMensagem("");
        try {
            const resposta = await apiRequest(categoriaForm.id ? `/cardapio/categorias/${categoriaForm.id}` : "/cardapio/categorias", {
                method: categoriaForm.id ? "PUT" : "POST",
                body: JSON.stringify({
                    name: categoriaForm.name,
                    description: categoriaForm.description,
                    displayOrder: categoriaForm.displayOrder,
                }),
            });
            setMensagem(resposta.message ?? "Categoria salva.");
            setCategoriaForm(categoriaInicial);
            await carregarCardapio();
        }
        catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível salvar a categoria.");
        }
        finally {
            setCategoriaAtualizandoId(null);
        }
    }

    async function arquivarCategoria(categoria) {
        setCategoriaAtualizandoId(categoria.id_categoria);
        setMensagem("");
        try {
            const resposta = await apiRequest(`/cardapio/categorias/${categoria.id_categoria}`, {
                method: "DELETE",
            });
            setMensagem(resposta.message ?? "Categoria arquivada.");
            setCategoriaParaArquivar(null);
            if (categoriaForm.id === categoria.id_categoria) {
                setCategoriaForm(categoriaInicial);
            }
            await carregarCardapio();
        }
        catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível arquivar a categoria.");
        }
        finally {
            setCategoriaAtualizandoId(null);
        }
    }

    const todosProdutos = useMemo(() => obterProdutos(cardapios), [cardapios]);
    const categorias = useMemo(() => obterCategorias(cardapios), [cardapios]);
    const produtos = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return todosProdutos.filter((produto) => {
            const combinaBusca = !termo ||
                produto.nome?.toLowerCase().includes(termo) ||
                produto.descricao?.toLowerCase().includes(termo) ||
                produto.categoria?.toLowerCase().includes(termo);
            const combinaFiltro = filtro === "todos" ||
                (filtro === "disponiveis" && produto.disponivel) ||
                (filtro === "indisponiveis" && !produto.disponivel) ||
                (filtro === "destaques" && produto.destaque);
            return combinaBusca && combinaFiltro;
        });
    }, [busca, filtro, todosProdutos]);
    const produtosPorCategoria = useMemo(() => {
        return Array.from(produtos.reduce((categorias, produto) => {
            const categoria = produto.categoria || "Sem categoria";
            const itens = categorias.get(categoria) ?? [];
            categorias.set(categoria, [...itens, produto]);
            return categorias;
        }, new Map()));
    }, [produtos]);
    const categoriasAtivas = useMemo(() => {
        return new Set(todosProdutos.map((produto) => produto.categoria)).size;
    }, [todosProdutos]);
    const itensEmFalta = todosProdutos.filter((produto) => !produto.disponivel).length;
    const itensEmDestaque = todosProdutos.filter((produto) => produto.destaque).length;

    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }

    if (sessao?.type !== "restaurant") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white px-5 text-app-cafe-profundo">
                <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
                    <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={88} height={88} className="mx-auto h-20 w-20" priority />
                    <h1 className="mt-6 text-3xl font-semibold">{ui("Acesso restrito")}</h1>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">{ui("Esta área é destinada a contas de restaurante.")}</p>
                    <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">{ui("Entrar")}</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
            <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
                <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:min-h-20">
                    <div aria-label={ui("Appono")}>
                        <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority />
                    </div>

                    <nav className="hidden items-center justify-self-center gap-6 text-xs font-semibold text-app-cinza xl:flex">
                        {navItems.map((item) => (
                            <Link key={item.label} href={item.href} className={item.href === "/restaurante/cardapio" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                                {ui(item.label)}
                            </Link>
                        ))}
                    </nav>

                    <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-[8px] border border-app-baunilha-dourada bg-white text-app-cafe-profundo xl:hidden" aria-label={ui("Abrir menu")}>
                        <Icon type="menu" />
                    </button>
                </div>

                {mobileMenuOpen ? (
                    <nav className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
                        <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
                            {navItems.map((item) => (
                                <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/restaurante/cardapio" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                                    {ui(item.label)}
                                </Link>
                            ))}
                        </div>
                    </nav>
                ) : null}
            </header>

            <section className="gestao-cardapio mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">{ui("Cardápio")}</p>
                        <h1 className="mt-2 text-3xl font-semibold leading-tight text-app-cafe-profundo sm:text-4xl">{ui("Gestão de Cardápio")}</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">{ui("Organize seus produtos, preços e disponibilidade em um só lugar.")}</p>
                    </div>

                    <Link href="/restaurante/cardapio/editar" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-app-dourado-mel px-7 text-xs font-bold uppercase text-white transition hover:bg-app-caramelo-torrado">
                        <Icon type="plus" className="h-4 w-4" />{ui("Adicionar item")}</Link>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-app-baunilha-dourada/60 bg-app-creme-leve p-4 sm:grid-cols-3 lg:grid-cols-5">
                    {[
                        ["Total de itens", todosProdutos.length],
                        ["Itens disponíveis", todosProdutos.filter((produto) => produto.disponivel).length],
                        ["Categorias ativas", categoriasAtivas],
                        ["Itens em falta", itensEmFalta],
                        ["Destaques", itensEmDestaque],
                    ].map(([label, value]) => (
                        <div key={label} className="min-w-0">
                            <dt className={`text-xs font-semibold ${
                                label === "Itens disponíveis"
                                    ? "text-green-800"
                                    : label === "Itens em falta"
                                      ? "text-red-800"
                                      : label === "Destaques"
                                        ? "text-app-amarelo-alerta"
                                        : "text-app-cinza"
                            }`}>{ui(label)}</dt>
                            <dd className="mt-1 text-2xl font-semibold tabular-nums text-app-cafe-profundo">{value}</dd>
                        </div>
                    ))}
                </dl>

                <details className="mt-4 rounded-xl border border-app-baunilha-dourada/55 bg-app-creme-leve">
                    <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-app-mocha hover:bg-app-creme-suave">{ui("Gerenciar categorias")}</summary>
                <div className="grid gap-6 border-t border-app-baunilha-dourada/55 p-4 lg:grid-cols-2">
                    <form onSubmit={salvarCategoria} className="grid gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Categorias")}</p>
                            <h2 className="mt-1 text-2xl font-bold text-app-cafe-profundo">
                                {ui(categoriaForm.id ? "Editar categoria" : "Nova categoria")}
                            </h2>
                        </div>
                        <input value={categoriaForm.name} onChange={(event) => setCategoriaForm((atual) => ({ ...atual, name: event.target.value }))} placeholder={ui("Nome da categoria")} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-white px-3 text-sm outline-none focus:border-app-caramelo-torrado"/>
                        <input value={categoriaForm.description} onChange={(event) => setCategoriaForm((atual) => ({ ...atual, description: event.target.value }))} placeholder={ui("Descrição opcional")} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-white px-3 text-sm outline-none focus:border-app-caramelo-torrado"/>
                        <input value={categoriaForm.displayOrder} onChange={(event) => setCategoriaForm((atual) => ({ ...atual, displayOrder: event.target.value.replace(/\D/g, "") }))} placeholder={ui("Ordem de exibição")} inputMode="numeric" className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-white px-3 text-sm outline-none focus:border-app-caramelo-torrado"/>
                        <div className="flex flex-wrap gap-2">
                            <button type="submit" disabled={categoriaAtualizandoId !== null} className="h-10 rounded-[8px] bg-app-dourado-mel px-5 text-xs font-bold uppercase text-white transition hover:bg-app-caramelo-torrado disabled:opacity-60">
                                {ui(categoriaAtualizandoId !== null ? "Salvando..." : "Salvar categoria")}
                            </button>
                            {categoriaForm.id ? (
                                <button type="button" onClick={() => setCategoriaForm(categoriaInicial)} className="h-10 rounded-[8px] border border-app-baunilha-dourada px-5 text-xs font-bold uppercase text-app-mocha transition hover:bg-app-creme-suave">{ui("Cancelar edição")}</button>
                            ) : null}
                        </div>
                    </form>

                    <div className="grid gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Categorias cadastradas")}</p>
                        <div className="grid max-h-72 gap-2 overflow-auto pr-1">
                            {categorias.length ? categorias.map((categoria) => (
                                <article key={categoria.id_categoria} className="grid gap-3 rounded-[8px] bg-app-creme-suave p-3 ring-1 ring-app-baunilha-dourada/45 sm:grid-cols-[1fr_auto] sm:items-center">
                                    <div>
                                        <h3 className="text-sm font-bold text-app-cafe-profundo">{categoria.nome}</h3>
                                        <p className="text-xs text-app-mocha">{ui("Ordem ")}{categoria.ordem_exibicao ?? 0}{categoria.descricao ? ` - ${categoria.descricao}` : ""}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setCategoriaForm({
                                            id: categoria.id_categoria,
                                            name: categoria.nome ?? "",
                                            description: categoria.descricao ?? "",
                                            displayOrder: String(categoria.ordem_exibicao ?? 0),
                                        })} className="h-9 rounded-[8px] border border-app-baunilha-dourada px-3 text-xs font-bold uppercase text-app-mocha transition hover:bg-app-creme-leve">{ui("Editar")}</button>
                                        <button type="button" onClick={() => setCategoriaParaArquivar(categoria)} disabled={categoriaAtualizandoId === categoria.id_categoria} className="h-9 rounded-[8px] border border-red-300 bg-transparent px-3 text-xs font-bold uppercase text-red-800 transition hover:border-app-vermelho-erro hover:text-app-vermelho-erro disabled:opacity-60">{ui("Arquivar")}</button>
                                    </div>
                                </article>
                            )) : (
                                <p className="rounded-[8px] bg-app-creme-suave p-4 text-sm font-semibold text-app-mocha">{ui("Nenhuma categoria criada ainda.")}</p>
                            )}
                        </div>
                    </div>
                </div>
                </details>

                <section aria-label={ui("Busca e filtros do cardápio")} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <label className="campo-busca-app flex h-11 items-center gap-3 rounded-[8px] border border-app-baunilha-dourada bg-white px-3 text-app-mocha transition">
                        <Icon type="search" className="h-4 w-4 shrink-0" />
                        <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder={ui("Buscar por item, descrição ou categoria")} className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo placeholder:text-app-cinza/60"/>
                    </label>
                    <select aria-label={ui("Filtrar disponibilidade")} value={filtro} onChange={(event) => setFiltro(event.target.value)} className="h-11 min-w-0 rounded-[8px] border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold text-app-mocha outline-none focus:border-app-caramelo-torrado">
                        <option value="todos">{ui("Todos os itens")}</option>
                        <option value="disponiveis">{ui("Disponíveis")}</option>
                        <option value="indisponiveis">{ui("Indisponíveis")}</option>
                        <option value="destaques">{ui("Destaques")}</option>
                    </select>
                </section>

                {mensagem ? <p className="mt-8 rounded-[8px] bg-app-creme-leve p-5 text-sm font-semibold text-app-caramelo-torrado ring-1 ring-app-baunilha-dourada">{ui(mensagem)}</p> : null}

                {produtos.length ? (
                    <section className="mt-10 grid gap-8">
                        {produtosPorCategoria.map(([categoria, itens]) => (
                            <div key={categoria} className="grid gap-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Categoria")}</p>
                                        <h2 className="text-2xl font-bold text-app-cafe-profundo">{categoria}</h2>
                                    </div>
                                    <span className="rounded-full bg-app-creme-leve px-4 py-2 text-xs font-bold uppercase text-app-mocha ring-1 ring-app-baunilha-dourada/55">
                                        {itens.length} {ui(itens.length === 1 ? "item" : "itens")}
                                    </span>
                                </div>

                                {itens.map((produto) => (
                            <article key={produto.id_produto} className={`produto-cardapio grid min-w-0 gap-4 rounded-xl p-4 ring-1 sm:grid-cols-[112px_minmax(0,1fr)] xl:grid-cols-[112px_minmax(0,1fr)_minmax(240px,340px)] sm:items-start ${produto.destaque ? "bg-app-baunilha-dourada/35 ring-app-caramelo-torrado/35" : "bg-app-creme-leve ring-app-baunilha-dourada/55"}`}>
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
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{produto.cardapio}</p>
                                        {produto.destaque ? (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-app-dourado-mel/40 bg-transparent px-2.5 py-1 text-[10px] font-bold uppercase text-app-amarelo-alerta">
                                                <Icon type="star" className="h-3 w-3" />{ui("Destaque")}</span>
                                        ) : null}
                                    </div>
                                    <h3 className="mt-1 text-xl font-bold text-app-cafe-profundo">{produto.nome}</h3>
                                    {produto.descricao ? <p className="mt-2 text-sm leading-6 text-app-mocha">{produto.descricao}</p> : null}
                                </div>
                                <div className="min-w-0 text-left sm:col-start-2 xl:col-start-auto xl:text-right">
                                    <strong className="text-lg text-app-cafe-profundo">{formatarMoeda(produto.preco, localeUI)}</strong>
                                    <span className={`mt-2 block rounded-full border bg-transparent px-3 py-1 text-xs font-bold uppercase ${produto.disponivel ? "border-green-200 text-green-800" : "border-red-300 text-red-800"}`}>
                                        {ui(produto.disponivel ? "Disponível" : "Indisponível")}
                                    </span>
                                    <div className="mt-3 flex flex-wrap gap-2 sm:justify-end">
                                        <button type="button" onClick={() => alterarDisponibilidade(produto)} disabled={produtoAtualizandoId === produto.id_produto} className={`inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border bg-transparent px-3 text-xs font-bold uppercase transition disabled:cursor-not-allowed disabled:opacity-60 ${produto.disponivel ? "border-red-300 text-red-800 hover:border-app-vermelho-erro hover:text-app-vermelho-erro" : "border-green-200 text-green-800 hover:border-app-verde-sucesso hover:text-app-verde-sucesso"}`}>
                                            <Icon type="check" className="h-4 w-4" />
                                            {ui(produto.disponivel ? "Pausar" : "Ativar")}
                                        </button>
                                        <button type="button" onClick={() => alterarDestaque(produto)} disabled={produtoAtualizandoId === produto.id_produto} className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-app-baunilha-dourada px-3 text-xs font-bold uppercase text-app-mocha transition hover:bg-app-creme-suave disabled:cursor-not-allowed disabled:opacity-60">
                                            <Icon type="star" className="h-4 w-4" />
                                            {ui(produto.destaque ? "Remover destaque" : "Destacar")}
                                        </button>
                                        <Link href={`/restaurante/cardapio/editar?produto=${produto.id_produto}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-app-baunilha-dourada px-3 text-xs font-bold uppercase text-app-mocha transition hover:bg-app-creme-suave">
                                            <Icon type="pencil" className="h-4 w-4" />{ui("Editar")}</Link>
                                        <button type="button" onClick={() => setProdutoParaExcluir(produto)} disabled={produtoExcluindoId === produto.id_produto} className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-red-300 bg-transparent px-3 text-xs font-bold uppercase text-red-800 transition hover:border-app-vermelho-erro hover:text-app-vermelho-erro disabled:cursor-not-allowed disabled:opacity-60">
                                            <Icon type="trash" className="h-4 w-4" />
                                            {ui(produtoExcluindoId === produto.id_produto ? "Excluindo" : "Excluir")}
                                        </button>
                                    </div>
                                </div>
                            </article>
                                ))}
                            </div>
                        ))}
                    </section>
                ) : (
                    todosProdutos.length ? <section className="mt-8 rounded-xl bg-app-creme-leve p-6 ring-1 ring-app-baunilha-dourada/60">
                        <h2 className="text-xl font-semibold">{ui("Nenhum item corresponde aos filtros")}</h2>
                        <button type="button" onClick={() => { setBusca(""); setFiltro("todos"); }} className="mt-4 rounded-lg border border-app-baunilha-dourada px-4 py-2 text-sm hover:bg-app-creme-suave">{ui("Limpar filtros")}</button>
                    </section> : <section className="mt-10 overflow-hidden rounded-[14px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <div className="grid gap-5 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8">
                            <span className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-app-cafe-profundo text-app-creme-leve">
                                <Icon type="utensils" />
                            </span>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Comece pelo essencial")}</p>
                                <h2 className="mt-2 text-2xl font-bold text-app-cafe-profundo">{ui("Cadastre seu primeiro item")}</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-app-mocha">{ui("Adicione nome, categoria, preço e, se quiser, uma imagem. Quando publicado, o item já aparece para o cliente na página do restaurante.")}</p>
                            </div>
                            <Link href="/restaurante/cardapio/editar" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-5 text-xs font-bold uppercase text-white transition hover:bg-app-caramelo-torrado sm:justify-self-end">{ui("Cadastrar item")}</Link>
                        </div>
                    </section>
                )}
            </section>

            {produtoParaExcluir ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[2px]">
                    <section className="w-full max-w-md rounded-[18px] bg-white p-6 text-app-cafe-profundo shadow-2xl ring-1 ring-black/10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Confirmar exclusão")}</p>
                        <h2 className="mt-3 text-2xl font-bold">{ui("Remover item do cardápio?")}</h2>
                        <p className="mt-3 text-sm leading-6 text-app-mocha">{ui("O item ")}<strong>{produtoParaExcluir.nome}</strong>{ui(" será excluído se ainda não tiver pedidos. Se já existir histórico, ele será arquivado e deixará de aparecer para o cliente.")}</p>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setProdutoParaExcluir(null)} className="h-11 rounded-[8px] border border-app-baunilha-dourada px-5 text-xs font-bold uppercase text-app-mocha transition hover:bg-app-creme-suave">{ui("Cancelar")}</button>
                            <button type="button" onClick={excluirProduto} disabled={produtoExcluindoId === produtoParaExcluir.id_produto} className="botao-acao-critica h-11 rounded-[8px] px-5 text-xs font-bold uppercase transition disabled:cursor-not-allowed disabled:opacity-60">
                                {ui(produtoExcluindoId === produtoParaExcluir.id_produto ? "Removendo..." : "Remover item")}
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}
            <ConfirmationDialog
                open={Boolean(categoriaParaArquivar)}
                eyebrow={ui("Arquivar categoria")}
                title={ui("Arquivar esta categoria?")}
                description={ui("A categoria deixará de aparecer no cardápio ativo. Itens e histórico permanecem preservados.")}
                confirmLabel={ui("Arquivar")}
                cancelLabel={ui("Voltar")}
                loading={categoriaAtualizandoId === categoriaParaArquivar?.id_categoria}
                onCancel={() => setCategoriaParaArquivar(null)}
                onConfirm={() => arquivarCategoria(categoriaParaArquivar)}
                details={categoriaParaArquivar ? <p className="font-semibold">{categoriaParaArquivar.nome}</p> : null}
            />
        </main>
    );
}

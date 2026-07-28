"use client";

import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { enviarImagemCardapio, validarImagemCardapio } from "@/lib/imagem-cardapio";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";

const initialForm = {
    name: "",
    category: "",
    price: "",
    preparationTime: "30",
    displayOrder: "0",
    description: "",
    available: true,
    featured: false,
    imageUrl: "",
};

const categories = ["Entradas", "Pratos principais", "Sobremesas", "Bebidas"];

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        "arrow-left": "M19 12H5M12 19l-7-7 7-7",
        check: "m5 12 4 4L19 6",
        "chevron-down": "m6 9 6 6 6-6",
    };
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
            <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function Field({ label, value, onChange, className = "", inputMode, placeholder = "", required = false, min, max }) {
    return (
        <label className={`grid gap-2 ${className}`}>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">{label}</span>
            <input value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} placeholder={placeholder} required={required} min={min} max={max} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-3 text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20" />
        </label>
    );
}

function normalizarPrecoDigitado(valor) {
    const apenasNumeros = valor.replace(/\D/g, "");
    if (!apenasNumeros) {
        return "";
    }
    const valorEmCentavos = Number(apenasNumeros) / 100;
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(valorEmCentavos);
}

function formatarPrecoParaFormulario(valor) {
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(valor ?? 0));
}

function obterPrecoNumerico(valor) {
    return Number(String(valor ?? "").replace(/\./g, "").replace(",", "."));
}

function validarFormularioCardapio(form) {
    const preco = obterPrecoNumerico(form.price);
    const tempoPreparo = Number(form.preparationTime);
    if (!form.name.trim()) {
        return "Informe o nome do item.";
    }
    if (!form.category.trim()) {
        return "Selecione a categoria do item.";
    }
    if (!Number.isFinite(preco) || preco <= 0) {
        return "Informe um preco valido maior que zero.";
    }
    if (!Number.isInteger(tempoPreparo) || tempoPreparo <= 0) {
        return "Informe o tempo de preparo em minutos.";
    }
    return "";
}

function RestaurantMenuItemEditorContent() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const searchParams = useSearchParams();
    const idParam = Number(searchParams.get("produto"));
    const produtoId = Number.isInteger(idParam) && idParam > 0 ? idParam : null;
    const [form, setForm] = useState(initialForm);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagem, setImagem] = useState(null);
    const [imagemPreview, setImagemPreview] = useState("");
    const [categoriasDisponiveis, setCategoriasDisponiveis] = useState(categories);

    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant") {
            return;
        }
        apiRequest("/cardapio")
            .then((resposta) => {
                const nomes = (resposta.cardapios ?? [])
                    .flatMap((cardapio) => cardapio.categorias ?? [])
                    .map((categoria) => categoria.nome)
                    .filter(Boolean);
                setCategoriasDisponiveis(nomes.length ? Array.from(new Set(nomes)) : categories);
            })
            .catch(() => setCategoriasDisponiveis(categories));
    }, [sessao, sessaoCarregada]);

    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant" || !produtoId) {
            return;
        }
        apiRequest(`/cardapio/produtos/${produtoId}`)
            .then((resposta) => {
                const produto = resposta.produto;
                setForm({
                    name: produto.nome ?? "",
                    category: produto.categoria ?? "",
                    price: formatarPrecoParaFormulario(produto.preco),
                    preparationTime: String(produto.tempo_preparo_minutos ?? 30),
                    displayOrder: String(produto.ordem_exibicao ?? 0),
                    description: produto.descricao ?? "",
                    available: produto.disponivel !== false,
                    featured: produto.destaque === true,
                    imageUrl: produto.imagem_url ?? "",
                });
                setImagemPreview(produto.imagem_url ?? "");
                setMessage("");
            })
            .catch((error) => {
                setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o item.");
            });
    }, [produtoId, sessao, sessaoCarregada]);

    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setMessage("");
    }

    function selecionarImagem(arquivo) {
        if (!arquivo) {
            return;
        }
        const erro = validarImagemCardapio(arquivo);
        if (erro) {
            setMessage(erro);
            return;
        }
        if (imagemPreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagemPreview);
        }
        setImagem(arquivo);
        setImagemPreview(URL.createObjectURL(arquivo));
        setMessage("");
    }

    async function submitForm(event) {
        event.preventDefault();
        const erroValidacao = validarFormularioCardapio(form);
        if (erroValidacao) {
            setMessage(erroValidacao);
            return;
        }
        setIsSubmitting(true);
        setMessage("");
        try {
            const imageUrl = imagem ? await enviarImagemCardapio(imagem) : form.imageUrl;
            const resposta = await apiRequest(produtoId ? `/cardapio/produtos/${produtoId}` : "/cardapio/produtos", {
                method: produtoId ? "PUT" : "POST",
                body: JSON.stringify({ ...form, imageUrl }),
            });
            setMessage(resposta.message ?? (produtoId ? "Item atualizado no cardapio." : "Item publicado no cardapio."));
            window.setTimeout(() => {
                window.location.href = "/restaurante/cardapio";
            }, 700);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Nao foi possivel publicar o item.");
        }
        finally {
            setIsSubmitting(false);
        }
    }

    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }

    if (sessao?.type !== "restaurant") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
                <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
                    <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority />
                    <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">Esta area e destinada a contas de restaurante.</p>
                    <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">
                        Entrar
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
            <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
                <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5">
                    <div aria-label="Appono">
                        <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-12 w-12" priority />
                    </div>
                    <div className="flex items-center justify-center gap-6">
                        <Link href="/restaurante/cardapio" className="transition hover:text-app-caramelo-torrado" aria-label="Voltar para gestao de cardapio">
                            <Icon type="arrow-left" className="h-5 w-5" />
                        </Link>
                        <h1 className="text-lg font-bold uppercase tracking-[0.16em] sm:text-2xl">Menu</h1>
                    </div>
                    <ItemHeaderNotificacoes href="/restaurante/notificacoes"/>
                </div>
            </header>

            <section className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
                <div className="mx-auto max-w-4xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">Cardapio</p>
                    <h2 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
                        {produtoId ? "Editar Item" : "Criar Novo Item"}
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-app-cinza sm:text-base">
                        Publique pratos que o cliente conseguira visualizar na pagina do restaurante e selecionar no pedido antecipado.
                    </p>
                </div>

                <form onSubmit={submitForm} className="mx-auto mt-10 grid max-w-4xl gap-6 rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
                    <Field label="Nome do prato" value={form.name} onChange={(value) => updateField("name", value)} placeholder="Ex: Risoto de cogumelos" required />

                    <div className="grid gap-5 sm:grid-cols-3">
                        <label className="grid gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">Categoria</span>
                            <span className="relative">
                                <select value={form.category} onChange={(event) => updateField("category", event.target.value)} required className="h-12 w-full appearance-none rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-3 pr-10 text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado">
                                    <option value="">Selecione</option>
                                    {categoriasDisponiveis.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                                <Icon type="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-cinza" />
                            </span>
                        </label>
                        <Field label="Preco (R$)" value={form.price} onChange={(value) => updateField("price", normalizarPrecoDigitado(value))} inputMode="decimal" placeholder="Ex: 49,90" required />
                        <Field label="Tempo de preparo (min)" value={form.preparationTime} onChange={(value) => updateField("preparationTime", value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" placeholder="30" required min="1" max="999" />
                        <Field label="Ordem" value={form.displayOrder} onChange={(value) => updateField("displayOrder", value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="0" />
                    </div>

                    <label className="grid gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">Descricao</span>
                        <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} className="min-h-36 resize-y rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-3 py-4 text-base leading-7 text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20" placeholder="Descreva ingredientes, preparo e diferenciais do prato." />
                    </label>

                    <label className="grid gap-3 rounded-[10px] border border-dashed border-app-caramelo-torrado/45 bg-app-creme-suave p-4">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">Imagem do item</span>
                        <span className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
                            <span className="relative h-32 overflow-hidden rounded-[10px] bg-app-baunilha-dourada/55">
                                {imagemPreview ? (
                                    <Image src={imagemPreview} alt="Previa do item" fill className="object-cover" />
                                ) : (
                                    <span className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold text-app-mocha">
                                        Sem imagem selecionada
                                    </span>
                                )}
                            </span>
                            <span className="grid gap-2">
                                <span className="text-sm leading-6 text-app-mocha">
                                    A imagem aparecera para o cliente na pagina do restaurante. Use JPG, PNG ou WebP de ate 5 MB.
                                </span>
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selecionarImagem(event.target.files?.[0])} className="text-xs text-app-mocha file:mr-3 file:rounded-[8px] file:border-0 file:bg-app-dourado-mel file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:text-white" />
                            </span>
                        </span>
                    </label>

                    <button type="button" onClick={() => updateField("available", !form.available)} className="inline-flex w-fit items-center gap-3 rounded-full bg-app-baunilha-dourada/45 px-4 py-2 text-sm font-semibold text-app-mocha transition hover:bg-app-baunilha-dourada">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-[4px] border border-app-baunilha-dourada bg-app-chantilly ${form.available ? "text-app-caramelo-torrado" : "text-transparent"}`}>
                            <Icon type="check" className="h-3 w-3" />
                        </span>
                        Item disponivel para pedidos
                    </button>

                    <button type="button" onClick={() => updateField("featured", !form.featured)} className="inline-flex w-fit items-center gap-3 rounded-full bg-app-cafe-profundo px-4 py-2 text-sm font-semibold text-app-creme-leve transition hover:bg-app-caramelo-torrado">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-[4px] border border-app-baunilha-dourada bg-app-chantilly ${form.featured ? "text-app-caramelo-torrado" : "text-transparent"}`}>
                            <Icon type="check" className="h-3 w-3" />
                        </span>
                        Marcar como destaque do cardapio
                    </button>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <Link href="/restaurante/cardapio" className="flex h-12 items-center justify-center rounded-[8px] border border-app-mocha px-8 text-xs font-bold uppercase tracking-wide text-app-mocha transition hover:bg-app-chantilly">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={isSubmitting} className="h-12 rounded-[8px] bg-app-dourado-mel px-8 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60">
                            {isSubmitting ? (produtoId ? "Salvando..." : "Publicando...") : (produtoId ? "Salvar alteracoes" : "Publicar item")}
                        </button>
                    </div>

                    {message ? <p className="text-sm font-semibold text-app-caramelo-torrado">{message}</p> : null}
                </form>
            </section>
        </main>
    );
}

export default function RestaurantMenuItemEditorPage() {
    return (
        <Suspense fallback={<TelaCarregandoSessao />}>
            <RestaurantMenuItemEditorContent />
        </Suspense>
    );
}

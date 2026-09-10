"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function FavoritosPage() {
    const [restaurantes, setRestaurantes] = useState([]);
    const [mensagem, setMensagem] = useState("Carregando favoritos...");
    const [atualizando, setAtualizando] = useState("");
    const [favoritoParaRemover, setFavoritoParaRemover] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        apiRequest("/restaurantes", { signal: controller.signal })
            .then((data) => {
                setRestaurantes(data ?? []);
                setMensagem("");
            })
            .catch((error) => {
                if (error?.name !== "AbortError") {
                    setMensagem(error instanceof Error ? error.message : "Não foi possível carregar favoritos.");
                }
            });

        return () => controller.abort();
    }, []);

    const favoritos = useMemo(() => restaurantes.filter((item) => item.favorito_cliente), [restaurantes]);

    async function remover(restaurante) {
        if (!restaurante) return;
        setAtualizando(String(restaurante.id_restaurante));
        try {
            await apiRequest(`/restaurantes/${restaurante.id_restaurante}/favorito`, {
                method: "PATCH",
                body: JSON.stringify({ favorito: false }),
            });
            setRestaurantes((items) => items.map((item) => item.id_restaurante === restaurante.id_restaurante ? { ...item, favorito_cliente: false } : item));
            setFavoritoParaRemover(null);
        } catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível remover o favorito.");
        } finally {
            setAtualizando("");
        }
    }

    return (
        <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo">
            <section className="mx-auto max-w-6xl">
                <Link href="/cliente/dashboard" className="text-sm font-bold text-app-caramelo-torrado">
                    ← Voltar
                </Link>

                <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Sua selecao</p>
                <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Restaurantes favoritos</h1>

                {mensagem ? <p role="status" className="mt-6 text-sm font-semibold text-app-mocha">{mensagem}</p> : null}

                {!mensagem && !favoritos.length ? (
                    <div className="mt-8 rounded-[14px] border border-dashed border-app-baunilha-dourada bg-white p-10 text-center">
                        <h2 className="text-xl font-bold">Nenhum favorito ainda</h2>
                        <p className="mt-2 text-app-cinza">Use o coracao no dashboard para guardar seus restaurantes preferidos.</p>
                    </div>
                ) : null}

                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {favoritos.map((restaurante) => (
                        <article key={restaurante.id_restaurante} className="overflow-hidden rounded-[14px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/70">
                            <div className="relative h-40 bg-app-baunilha-dourada/40">
                                {restaurante.logo_url ? <Image src={restaurante.logo_url} alt={restaurante.nome} fill className="object-cover" /> : null}
                            </div>
                            <div className="p-5">
                                <h2 className="text-xl font-bold">{restaurante.nome}</h2>
                                <p className="mt-2 text-sm text-app-cinza">
                                    {restaurante.avaliacao_media?.toFixed(1) ?? "Novo"} · {restaurante.total_avaliacoes ?? 0} avaliações
                                </p>
                                <div className="mt-5 flex gap-3">
                                    <Link href={`/cliente/restaurantes/${restaurante.id_restaurante}`} className="flex h-10 flex-1 items-center justify-center rounded-[8px] bg-app-dourado-mel text-xs font-bold uppercase text-white">
                                        Ver restaurante
                                    </Link>
                                    <button type="button" disabled={atualizando === String(restaurante.id_restaurante)} onClick={() => setFavoritoParaRemover(restaurante)} className="rounded-[8px] border border-app-caramelo-torrado px-4 text-xs font-bold text-app-caramelo-torrado disabled:opacity-50">
                                        Remover
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <ConfirmationDialog
                open={Boolean(favoritoParaRemover)}
                eyebrow="Remover favorito"
                title="Remover restaurante dos favoritos?"
                description="Ele sairá da sua lista, mas você poderá favoritar novamente pelo dashboard."
                confirmLabel="Remover"
                cancelLabel="Manter"
                loading={atualizando === String(favoritoParaRemover?.id_restaurante)}
                onCancel={() => setFavoritoParaRemover(null)}
                onConfirm={() => remover(favoritoParaRemover)}
                details={favoritoParaRemover ? <p className="font-semibold">{favoritoParaRemover.nome}</p> : null}
            />
        </main>
    );
}

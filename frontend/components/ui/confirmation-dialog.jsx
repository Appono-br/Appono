"use client";

import { useInterface } from "@/lib/use-interface";
export function ConfirmationDialog({
    open,
    eyebrow = "Confirmação",
    title,
    description,
    details,
    confirmLabel = "Confirmar",
    cancelLabel = "Voltar",
    variant = "danger",
    loading = false,
    onConfirm,
    onCancel,
}) {
    const { ui } = useInterface();
    if (!open) return null;

    const confirmClass = variant === "danger"
        ? "botao-acao-critica"
        : "bg-app-cafe-profundo text-app-creme-leve hover:bg-app-caramelo-torrado";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="confirmation-dialog-title">
            <section className="w-full max-w-md rounded-[18px] bg-white p-6 text-app-cafe-profundo shadow-2xl ring-1 ring-black/10">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
                    {ui(eyebrow)}
                </p>
                <h2 id="confirmation-dialog-title" className="mt-3 text-2xl font-semibold">
                    {ui(title)}
                </h2>
                {description ? (
                    <p className="mt-3 text-sm leading-6 text-app-mocha">
                        {ui(description)}
                    </p>
                ) : null}
                {details ? (
                    <div className="mt-5 rounded-[10px] bg-white p-4 text-sm ring-1 ring-app-baunilha-dourada/60">
                        {details}
                    </div>
                ) : null}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={onCancel} disabled={loading} className="h-11 rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:text-app-cinza">
                        {ui(cancelLabel)}
                    </button>
                    <button type="button" onClick={onConfirm} disabled={loading} className={`h-11 rounded-[8px] px-4 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:bg-app-cinza/50 ${confirmClass}`}>
                        {ui(loading ? "Processando..." : confirmLabel)}
                    </button>
                </div>
            </section>
        </div>
    );
}

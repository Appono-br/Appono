"use client";

export function ConfirmationDialog({
    open,
    eyebrow = "Confirmacao",
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
    if (!open) return null;

    const confirmClass = variant === "danger"
        ? "bg-app-vermelho-erro text-white hover:bg-app-cafe-profundo"
        : "bg-app-cafe-profundo text-app-creme-leve hover:bg-app-caramelo-torrado";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-cafe-profundo/70 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirmation-dialog-title">
            <section className="w-full max-w-md rounded-[16px] bg-white p-6 text-app-cafe-profundo shadow-xl ring-1 ring-app-baunilha-dourada/70">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
                    {eyebrow}
                </p>
                <h2 id="confirmation-dialog-title" className="mt-3 text-2xl font-semibold">
                    {title}
                </h2>
                {description ? (
                    <p className="mt-3 text-sm leading-6 text-app-mocha">
                        {description}
                    </p>
                ) : null}
                {details ? (
                    <div className="mt-5 rounded-[10px] bg-white p-4 text-sm ring-1 ring-app-baunilha-dourada/60">
                        {details}
                    </div>
                ) : null}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={onCancel} disabled={loading} className="h-11 rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:text-app-cinza">
                        {cancelLabel}
                    </button>
                    <button type="button" onClick={onConfirm} disabled={loading} className={`h-11 rounded-[8px] px-4 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:bg-app-cinza/50 ${confirmClass}`}>
                        {loading ? "Processando..." : confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}

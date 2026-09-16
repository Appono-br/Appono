import Link from "next/link";

const caminhos = {
    arrow: "M19 12H5m6-6-6 6 6 6",
    calendar: "M7 3v4M17 3v4M4 8h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
    check: "m5 12 4 4L19 6",
    clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
    route: "M6 19c3 0 3-14 6-14s3 14 6 14M6 19h12",
    spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
    warning: "M12 4 3.5 19h17L12 4zm0 5v4m0 3h.01",
    x: "M6 6l12 12M18 6 6 18",
};

export function RoutineIcon({ type, className = "h-5 w-5" }) {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 ${className}`}><path d={caminhos[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

export function RoutineBreadcrumb({ href = "/cliente/rotina", children = "Voltar para Appono Rotina" }) {
    return <Link href={href} className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"><RoutineIcon type="arrow" className="h-4 w-4" />{children}</Link>;
}

export function RoutineHero({ eyebrow, title, description, aside }) {
    return <header className="overflow-hidden rounded-[24px] bg-app-cafe-profundo px-6 py-8 text-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/35 sm:px-8 sm:py-10">
        <div className={`grid gap-7 ${aside ? "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" : ""}`}>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-app-baunilha-dourada">{eyebrow}</p>
                <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
                {description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-app-creme-suave">{description}</p> : null}
            </div>
            {aside}
        </div>
    </header>;
}

const noticeClasses = {
    error: "border-red-300 text-app-vermelho-erro",
    warning: "border-amber-300 text-app-amarelo-alerta",
    success: "border-green-300 text-app-verde-sucesso",
    info: "border-app-baunilha-dourada text-app-mocha",
};

export function RoutineNotice({ type = "info", children, action, live = "polite" }) {
    const isError = type === "error" || type === "warning";
    return <div role={isError ? "alert" : "status"} aria-live={live} className={`flex flex-col gap-3 rounded-[16px] border bg-white p-4 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between ${noticeClasses[type]}`}>
        <div className="flex min-w-0 items-start gap-3"><RoutineIcon type={isError ? "warning" : type === "success" ? "check" : "spark"} className="mt-0.5 h-4 w-4" /><div className="min-w-0 leading-6">{children}</div></div>
        {action ? <div className="shrink-0">{action}</div> : null}
    </div>;
}

const statusMap = {
    SUGERIDA: ["Sugerida", "text-app-mocha"],
    APROVADA: ["Aprovada", "text-app-verde-sucesso"],
    RECUSADA: ["Recusada", "text-app-vermelho-erro"],
    ALTERADA: ["Alterada", "text-app-caramelo-torrado"],
    CONVERTIDA_RESERVA: ["Reserva criada", "text-app-verde-sucesso"],
    CONVERTIDA_PEDIDO: ["Pedido criado", "text-app-verde-sucesso"],
    CANCELADA: ["Cancelada", "text-app-vermelho-erro"],
};

export function RoutineStatus({ status }) {
    const [label, className] = statusMap[status] ?? [status, "text-app-mocha"];
    return <span className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] ${className}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

export function RoutineEmpty({ title, description, action, icon = "spark" }) {
    return <section className="rounded-[24px] border border-dashed border-app-baunilha-dourada bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve"><RoutineIcon type={icon} /></div>
        <h2 className="mt-5 text-2xl font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-app-cinza">{description}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </section>;
}

export function RoutineSkeleton({ cards = 2 }) {
    return <div aria-label="Carregando conteúdo" aria-busy="true" className="grid gap-5">
        <span className="sr-only">Carregando...</span>
        <div className="h-44 animate-pulse rounded-[24px] bg-app-creme-suave ring-1 ring-app-baunilha-dourada/40" />
        <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: cards }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-[24px] bg-app-creme-suave ring-1 ring-app-baunilha-dourada/40" />)}
        </div>
    </div>;
}

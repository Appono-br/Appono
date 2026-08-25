"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";

const CHAVES_PAGAMENTO_LEGADAS = ["appono:paymentDraft", "appono:paymentMethod", "appono:card", "appono:cartao"];

export default function PaymentSettingsPage() {
    const [dadosRemovidos] = useState(() => {
        if (typeof window === "undefined") return false;
        let removeu = false;
        for (const chave of CHAVES_PAGAMENTO_LEGADAS) {
            if (window.localStorage.getItem(chave) !== null) removeu = true;
            window.localStorage.removeItem(chave);
        }
        return removeu;
    });

    return (
        <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
            <header className="border-b border-app-baunilha-dourada/50 bg-app-creme-suave">
                <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5">
                    <Image src="/brand/appono-mark.svg" alt="Appono" width={72} height={72} className="h-11 w-11" priority />
                    <div className="flex items-center justify-center gap-5">
                        <Link href="/cliente/configuracoes" aria-label="Voltar para configurações" className="text-2xl transition hover:text-app-caramelo-torrado">←</Link>
                        <h1 className="text-lg font-bold uppercase tracking-[0.14em] sm:text-2xl">Configurações</h1>
                    </div>
                    <div className="justify-self-end"><ItemHeaderNotificacoes href="/cliente/notificacoes" /></div>
                </div>
            </header>
            <section className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:py-16">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Pagamentos seguros</p>
                <h2 className="mt-3 text-4xl font-medium sm:text-5xl">Seus dados ficam com o Mercado Pago</h2>
                <p className="mt-5 max-w-3xl text-base leading-7 text-app-mocha">A Appono não coleta, armazena nem processa número de cartão, validade ou CVV. Ao pagar, você será direcionado ao checkout seguro do Mercado Pago.</p>
                <div className="mt-10 grid gap-5 sm:grid-cols-3">
                    {[["Coleta externa", "Os dados são informados somente no ambiente do Mercado Pago."], ["Sem cartão salvo", "Nenhum dado completo de cartão permanece no navegador ou nos servidores da Appono."], ["Escolha no checkout", "Cartão, Pix e outras opções disponíveis são apresentados pelo Mercado Pago."]].map(([titulo, texto]) => (
                        <article key={titulo} className="rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/70"><h3 className="font-bold">{titulo}</h3><p className="mt-3 text-sm leading-6 text-app-cinza">{texto}</p></article>
                    ))}
                </div>
                {dadosRemovidos ? <p role="status" className="mt-8 rounded-[10px] bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-200">Dados de pagamento legados foram removidos deste navegador.</p> : null}
                <div className="mt-8 rounded-[12px] bg-app-cafe-profundo p-6 text-app-creme-leve"><p className="text-sm leading-6">Para alterar ou remover cartões salvos, use diretamente a sua conta do Mercado Pago.</p><Link href="/cliente/detalhes-pedido" className="mt-5 inline-flex h-11 items-center rounded-[8px] bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-wide text-white">Ver meus pedidos</Link></div>
            </section>
        </main>
    );
}

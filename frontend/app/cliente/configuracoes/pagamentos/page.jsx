"use client";

import { useInterface } from "@/lib/use-interface";
import Link from "next/link";
import { useState } from "react";

const CHAVES_PAGAMENTO_LEGADAS = ["appono:paymentDraft", "appono:paymentMethod", "appono:card", "appono:cartao"];

export default function PaymentSettingsPage() {
    const { ui } = useInterface();
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
        <main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
            <section className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:py-16">
                <Link href="/cliente/configuracoes" className="inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-sm font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo">← {ui("Voltar para configurações")}</Link>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Pagamentos seguros")}</p>
                <h2 className="mt-3 text-4xl font-medium sm:text-5xl">{ui("Seus dados ficam com o Mercado Pago")}</h2>
                <p className="mt-5 max-w-3xl text-base leading-7 text-app-mocha">{ui("A Appono não coleta, armazena nem processa número de cartão, validade ou CVV. Ao pagar, você será direcionado ao checkout seguro do Mercado Pago.")}</p>
                <div className="mt-10 grid gap-5 sm:grid-cols-3">
                    {[["Coleta externa", "Os dados são informados somente no ambiente do Mercado Pago."], ["Sem cartão salvo", "Nenhum dado completo de cartão permanece no navegador ou nos servidores da Appono."], ["Escolha no checkout", "Cartão, Pix e outras opções disponíveis são apresentados pelo Mercado Pago."]].map(([titulo, texto]) => (
                        <article key={titulo} className="rounded-[12px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/70"><h3 className="font-bold">{ui(titulo)}</h3><p className="mt-3 text-sm leading-6 text-app-cinza">{ui(texto)}</p></article>
                    ))}
                </div>
                {dadosRemovidos ? <p role="status" className="mt-8 rounded-[10px] bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-200">{ui("Dados de pagamento legados foram removidos deste navegador.")}</p> : null}
                <div className="mt-8 rounded-[12px] bg-app-cafe-profundo p-6 text-app-creme-leve"><p className="text-sm leading-6">{ui("Para alterar ou remover cartões salvos, use diretamente a sua conta do Mercado Pago.")}</p><Link href="/cliente/detalhes-pedido" className="mt-5 inline-flex h-11 items-center rounded-[8px] bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-wide text-white">{ui("Ver meus pedidos")}</Link></div>
            </section>
        </main>
    );
}

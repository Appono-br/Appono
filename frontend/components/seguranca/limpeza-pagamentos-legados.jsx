"use client";
import { useEffect } from "react";
const CHAVES_LEGADAS = ["appono:paymentDraft", "appono:paymentMethod", "appono:card", "appono:cartao"];
export function LimpezaPagamentosLegados() {
    useEffect(() => { for (const chave of CHAVES_LEGADAS) window.localStorage.removeItem(chave); }, []);
    return null;
}

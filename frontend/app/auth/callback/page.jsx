"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getDashboardPath, persistAuthResponse } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { chaveRetornoRestaurante, obterRetornoRestaurante } from "@/lib/retorno-restaurante.mjs";
export default function AuthCallbackPage() {
    const [message, setMessage] = useState("");
    useEffect(() => {
        async function confirmEmailAndRedirect() {
            try {
                const currentUrl = new URL(window.location.href);
                const errorDescription = currentUrl.searchParams.get("error_description") ??
                    new URLSearchParams(window.location.hash.slice(1)).get("error_description");
                if (errorDescription) {
                    throw new Error("Não foi possível confirmar o acesso. Tente novamente.");
                }
                const code = currentUrl.searchParams.get("code");
                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                        throw error;
                    }
                }
                const hashParams = new URLSearchParams(window.location.hash.slice(1));
                const accessToken = hashParams.get("access_token");
                const refreshToken = hashParams.get("refresh_token");
                if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) {
                        throw error;
                    }
                }
                const { data: { session }, } = await supabase.auth.getSession();
                if (!session) {
                    throw new Error("Não foi possível recuperar a sessão confirmada.");
                }
                const emailVerificado = session.user?.user_metadata?.email_verified === true || Boolean(session.user?.email_confirmed_at);
                if (!emailVerificado || !session.user?.email) {
                    throw new Error("Confirme seu e-mail para continuar.");
                }
                await persistAuthResponse({ session });
                let profile;
                try {
                    profile = await apiRequest("/me");
                }
                catch (error) {
                    if (error instanceof Error && error.message.includes("Perfil")) {
                        window.location.replace("/completar-perfil");
                        return;
                    }
                    throw new Error(error instanceof Error
                        ? error.message
                        : "Não foi possível carregar seu perfil Appono.");
                }
                await persistAuthResponse({ ...profile, session });
                const checkoutProfissionalPendente = sessionStorage.getItem("appono_checkout_profissional_pendente") === "1";
                if (checkoutProfissionalPendente && profile.tipo === "restaurante") {
                    const contratacao = await apiRequest("/planos/checkout", {
                        method: "POST",
                        body: JSON.stringify({ plano: "PROFISSIONAL" }),
                    });
                    if (contratacao.checkout_url) {
                        sessionStorage.removeItem("appono_checkout_profissional_pendente");
                        window.location.replace(contratacao.checkout_url);
                        return;
                    }
                    throw new Error("Não foi possível abrir o checkout do Plano Profissional.");
                }
                const destino = obterRetornoRestaurante(sessionStorage.getItem(chaveRetornoRestaurante), profile.tipo);
                sessionStorage.removeItem(chaveRetornoRestaurante);
                window.location.replace(destino ?? getDashboardPath(profile.tipo));
            }
            catch (error) {
                if (sessionStorage.getItem("appono_checkout_profissional_pendente") === "1") {
                    setMessage("Não foi possível abrir o checkout do Plano Profissional. Você poderá tentar novamente no módulo de restaurante.");
                    sessionStorage.removeItem("appono_checkout_profissional_pendente");
                    window.setTimeout(() => window.location.replace("/restaurante/plano?checkout=pendente"), 1800);
                    return;
                }
                const permitidas = ["Não foi possível confirmar o acesso. Tente novamente.", "Confirme seu e-mail para continuar."];
                setMessage(permitidas.includes(error?.message) ? error.message : "Não foi possível confirmar o acesso. Tente novamente.");
                window.setTimeout(() => {
                    window.location.replace("/login");
                }, 3500);
            }
        }
        confirmEmailAndRedirect();
    }, []);
    if (!message) return null;
    return (
      <main className="mx-auto max-w-lg px-5 py-8 text-app-cafe-profundo">
        <p role="alert" className="text-sm leading-6">{message}</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-app-caramelo-torrado">Voltar ao login</Link>
      </main>
    );
}

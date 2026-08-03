"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getDashboardPath, persistAuthResponse } from "@/lib/session";
import { supabase } from "@/lib/supabase";
export default function AuthCallbackPage() {
    const [message, setMessage] = useState("Confirmando seu acesso...");
    useEffect(() => {
        async function confirmEmailAndRedirect() {
            try {
                const currentUrl = new URL(window.location.href);
                const errorDescription = currentUrl.searchParams.get("error_description") ??
                    new URLSearchParams(window.location.hash.slice(1)).get("error_description");
                if (errorDescription) {
                    throw new Error(errorDescription);
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
                    throw new Error("Nao foi possivel recuperar a sessao confirmada.");
                }
                await persistAuthResponse({ session });
                setMessage("Buscando seu perfil...");
                let profile;
                try {
                    profile = await apiRequest("/me");
                }
                catch (error) {
                    throw new Error(error instanceof Error && error.message.includes("Perfil")
                        ? "Conta Google autenticada, mas ainda sem perfil Appono. Cadastre-se como cliente ou restaurante antes de usar este acesso."
                        : error instanceof Error
                            ? error.message
                            : "Nao foi possivel carregar seu perfil Appono.");
                }
                await persistAuthResponse({ ...profile, session });
                window.location.replace(getDashboardPath(profile.tipo));
            }
            catch (error) {
                setMessage(error instanceof Error
                    ? error.message
                    : "Nao foi possivel confirmar seu cadastro.");
                window.setTimeout(() => {
                    window.location.replace("/login");
                }, 3500);
            }
        }
        confirmEmailAndRedirect();
    }, []);
    return (<main className="flex min-h-screen items-center justify-center bg-app-chantilly px-4 text-app-cafe-profundo">
      <section className="w-full max-w-md rounded-[16px] bg-app-creme-leve px-7 py-8 text-center shadow-[0_22px_70px_rgba(74,44,10,0.12)] ring-1 ring-app-baunilha-dourada">
        <Image src="/brand/appono-mark.svg" alt="Appono" width={92} height={92} className="mx-auto h-14 w-14" priority/>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.28em] text-app-caramelo-torrado">
          APPONO
        </p>
        <h1 className="mt-3 text-2xl font-bold">Cadastro confirmado</h1>
        <p className="mt-2 text-sm leading-6 text-app-mocha">{message}</p>
        <div className="mx-auto mt-6 h-1.5 w-36 overflow-hidden rounded-full bg-app-baunilha-dourada">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-app-dourado-mel"/>
        </div>
      </section>
    </main>);
}

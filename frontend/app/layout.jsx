import "./globals.css";
import "./tema-escuro.css";
import "./tipografia.css";
import "./bordas.css";
import { TemaAplicacao } from "@/components/configuracoes/tema-aplicacao";
import { LimpezaPagamentosLegados } from "@/components/seguranca/limpeza-pagamentos-legados";
import { ProvedorIdioma } from "@/components/internacionalizacao/provedor-idioma";
import { AppFooter } from "@/components/app-footer";
import { ToastProvider } from "@/components/ui/toast-provider";
import Script from "next/script";
export const metadata = {
    title: "Appono",
    description: "Aplicação Appono",
};
export default function RootLayout({ children, }) {
    return (<html lang="pt-BR" className="h-full antialiased" data-tema="claro" suppressHydrationWarning>
      <head>
        <Script id="appono-theme-init" strategy="beforeInteractive">{'!(function(){try{document.documentElement.dataset.tema=localStorage.getItem("appono:theme")==="dark"?"escuro":"claro";var l=localStorage.getItem("appono:language");if(l==="en")document.documentElement.lang="en";}catch(e){}})();'}</Script>
      </head>
      <body className="min-h-full flex flex-col"><ProvedorIdioma><ToastProvider><TemaAplicacao /><LimpezaPagamentosLegados />{children}<AppFooter /></ToastProvider></ProvedorIdioma></body>
    </html>);
}

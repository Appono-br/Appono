import "./globals.css";
import "./tema-escuro.css";
import { TemaAplicacao } from "@/components/configuracoes/tema-aplicacao";
import { LimpezaPagamentosLegados } from "@/components/seguranca/limpeza-pagamentos-legados";
import { TradutorInterface } from "@/components/internacionalizacao/tradutor-interface";
export const metadata = {
    title: "Appono",
    description: "Aplicacao Appono",
};
export default function RootLayout({ children, }) {
    return (<html lang="pt-BR" className="h-full antialiased" data-tema="claro" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: '(function(){try{document.documentElement.dataset.tema=localStorage.getItem("appono:theme")==="dark"?"escuro":"claro"}catch(e){}})()' }} />
      </head>
      <body className="min-h-full flex flex-col"><TemaAplicacao /><LimpezaPagamentosLegados /><TradutorInterface />{children}</body>
    </html>);
}

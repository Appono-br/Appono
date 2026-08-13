import "./globals.css";
import { LimpezaPagamentosLegados } from "@/components/seguranca/limpeza-pagamentos-legados";
export const metadata = {
    title: "Appono",
    description: "Aplicacao Appono",
};
export default function RootLayout({ children, }) {
    return (<html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><LimpezaPagamentosLegados />{children}</body>
    </html>);
}

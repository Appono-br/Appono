import { PainelNotificacoes } from "@/components/notificacoes/painel-notificacoes";

export default function ClienteNotificacoesPage() {
    return (
        <PainelNotificacoes
            modulo="cliente"
            voltarHref="/cliente/dashboard"
            dashboardHref="/cliente/dashboard"
        />
    );
}

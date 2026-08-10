import { PainelNotificacoes } from "@/components/notificacoes/painel-notificacoes";

export default function AdminNotificacoesPage() {
    return (
        <PainelNotificacoes
            modulo="administrativo"
            voltarHref="/admin/financeiro"
            dashboardHref="/admin/financeiro"
        />
    );
}

import { PainelNotificacoes } from "@/components/notificacoes/painel-notificacoes";

export default function RestauranteNotificacoesPage() {
    return (
        <PainelNotificacoes
            modulo="restaurante"
            voltarHref="/restaurante/dashboard"
            dashboardHref="/restaurante/dashboard"
        />
    );
}

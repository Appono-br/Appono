import { PainelNotificacoes } from "@/components/notificacoes/painel-notificacoes";

export default function RestauranteNotificaçõesPage() {
    return (
        <PainelNotificacoes
            modulo="restaurante"
            voltarHref="/restaurante/dashboard"
            dashboardHref="/restaurante/dashboard"
        />
    );
}

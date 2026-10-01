import PagamentoCheckout from "@/components/pagamentos/pagamento-checkout";

export default function PaginaPagamentoReserva({ params }) {
    return <PagamentoCheckout params={params} tipo="reserva" />;
}

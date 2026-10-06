import { redirect } from "next/navigation";

export default function PedidosClientePage() {
    redirect("/cliente/agenda?visao=pedidos");
}

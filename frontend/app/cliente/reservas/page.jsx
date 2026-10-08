import { redirect } from "next/navigation";

export default function ReservasPage() {
    redirect("/cliente/agenda?visao=reservas");
}

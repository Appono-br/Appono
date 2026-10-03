import { redirect } from "next/navigation";

export default async function SuporteClientePage({ searchParams }) {
    const parametros = new URLSearchParams();
    for (const [chave, valor] of Object.entries(await searchParams)) {
        for (const item of Array.isArray(valor) ? valor : [valor]) {
            if (item !== undefined) parametros.append(chave, item);
        }
    }
    parametros.set("painel", "suporte");
    redirect(`/cliente/configuracoes?${parametros.toString()}`);
}

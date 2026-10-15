"use client";

import { useInterface } from "@/lib/use-interface";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Megaphone } from "lucide-react";
import { apiRequest } from "@/lib/api";

const publishedStatuses = new Set(["ATIVA", "AGENDADA", "PAUSADA"]);

export default function CampanhasPublicadasPage() {
  const { ui } = useInterface();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/campanhas", { forceRefresh: true })
      .then((response) => setCampaigns((response.campanhas ?? []).filter((campaign) => publishedStatuses.has(campaign.status))))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as campanhas."))
      .finally(() => setLoading(false));
  }, []);

  return <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo"><section className="mx-auto max-w-5xl"><Link href="/restaurante/campanhas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-app-caramelo-torrado"><ArrowLeft size={16} aria-hidden="true" />{ui("Voltar para campanhas")}</Link><header className="mt-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Campanhas")}</p><h1 className="mt-2 text-3xl font-semibold">{ui("Campanhas publicadas")}</h1><p className="mt-2 text-sm text-app-cinza">{ui("Ofertas ativas, agendadas e pausadas do seu restaurante.")}</p></div><Megaphone className="h-9 w-9 text-app-caramelo-torrado" aria-hidden="true" /></header>{loading?<p className="mt-10 text-sm text-app-cinza">{ui("Carregando campanhas...")}</p>:error?<p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{ui(error)}</p>:<div className="mt-8 grid gap-4 md:grid-cols-2">{campaigns.map((campaign)=><article key={campaign.id_campanha} className="rounded-lg border border-app-baunilha-dourada bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{ui(campaign.status)}</span><span className="text-xs text-app-cinza">{campaign.usos_confirmados}/{campaign.limite_usos}{ui(" usos")}</span></div><h2 data-appono-sem-traducao className="mt-5 text-xl font-semibold">{campaign.titulo}</h2><p data-appono-sem-traducao className="mt-2 text-sm text-app-cinza">{campaign.descricao}</p><Link href="/restaurante/campanhas" className="mt-5 inline-flex text-sm font-semibold text-app-caramelo-torrado">{ui("Gerenciar campanha")}</Link></article>)}{!campaigns.length?<p className="rounded-lg border border-dashed border-app-baunilha-dourada p-6 text-sm text-app-cinza">{ui("Nenhuma campanha publicada.")}</p>:null}</div>}</section></main>;
}

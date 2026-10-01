"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function Ofertas() {
  const [habilitado, setH] = useState(false);
  const [ofertas, setO] = useState([]);
  const [beneficios, setB] = useState([]);
  const [erro, setE] = useState("");
  const [busy, setBusy] = useState(true);

  const buscarDados = useCallback(async () => {
    const c = await apiRequest("/campanhas/consentimento", { forceRefresh: true });
    const [o, b] = await Promise.all([
      c.consentimento.habilitado ? apiRequest("/campanhas/ofertas", { forceRefresh: true }) : Promise.resolve({ campanhas: [] }),
      apiRequest("/campanhas/meus-beneficios", { forceRefresh: true }),
    ]);
    return { habilitado: c.consentimento.habilitado, ofertas: o.campanhas ?? [], beneficios: b.beneficios ?? [] };
  }, []);

  const aplicarDados = useCallback((dados) => {
    setH(dados.habilitado);
    setO(dados.ofertas);
    setB(dados.beneficios);
  }, []);

  const carregar = useCallback(async () => {
    setBusy(true);
    try { aplicarDados(await buscarDados()); }
    catch (e) { setE(e.message); }
    finally { setBusy(false); }
  }, [aplicarDados, buscarDados]);

  useEffect(() => {
    let ativo = true;
    buscarDados().then((dados) => { if (ativo) aplicarDados(dados); })
      .catch((e) => { if (ativo) setE(e.message); })
      .finally(() => { if (ativo) setBusy(false); });
    const atualizar = () => { void carregar(); };
    window.addEventListener("focus", atualizar);
    return () => { ativo = false; window.removeEventListener("focus", atualizar); };
  }, [aplicarDados, buscarDados, carregar]);

  async function consentir(valor) {
    setBusy(true);
    setO([]);
    try {
      await apiRequest("/campanhas/consentimento", { method: "PUT", body: JSON.stringify({ habilitado: valor }) });
      await carregar();
    } catch (e) { setE(e.message); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-5xl p-6">
    <h1 className="text-3xl">Ofertas e benefícios</h1>
    <p className="my-4">Se você permitir, usaremos os restaurantes marcados como favoritos na Appono Rotina para selecionar ofertas dentro do aplicativo. Você pode revogar a qualquer momento. Esta escolha não autoriza mensagens por e-mail, WhatsApp ou push.</p>
    <label className="block rounded-lg border p-4"><input type="checkbox" disabled={busy} checked={habilitado} onChange={(e) => consentir(e.target.checked)} /> Quero receber ofertas personalizadas no aplicativo</label>
    <p>As ofertas públicas nos restaurantes continuam disponíveis sem essa opção.</p>
    {erro && <p role="alert">{erro}</p>}
    <section className="my-6 grid gap-4 md:grid-cols-2">{ofertas.map((o) => <article key={o.id_campanha} className="rounded-xl border p-4"><h2>{o.titulo}</h2><p>{o.descricao}</p><p>{o.explicacao}</p><Link href={`/cliente/restaurantes/${o.id_restaurante}`}>Ver oferta e condições</Link></article>)}</section>
    {habilitado && !busy && !ofertas.length && <p>Nenhuma oferta dos seus favoritos está disponível agora.</p>}
    <h2 className="my-4 text-2xl">Meus benefícios reservados</h2>
    {beneficios.map((b) => <article key={b.id_resgate} className="my-3 rounded-lg border p-4"><h3>{b.condicoes?.titulo ?? "Oferta anterior"}</h3><p>Reserva #{b.id_reserva} · {b.status.toLowerCase()}</p>{b.condicoes?.itens_oferecidos?.map((i) => <p key={i.id_produto}>{i.quantidade} × {i.nome}</p>)}<p>Desconto concedido: R$ {Number(b.valor_beneficio).toFixed(2)}</p><p>{b.condicoes?.regras}</p>{b.entregue_em && <p>Benefício entregue</p>}</article>)}
  </main>;
}

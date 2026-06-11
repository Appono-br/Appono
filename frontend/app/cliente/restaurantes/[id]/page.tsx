"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

type Restaurante = {
  id_restaurante: number;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  horario_funcionamento?: string | null;
  logo_url?: string | null;
  valor_minimo_reserva_por_pessoa: number;
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function obterDataInicial() {
  const data = new Date();
  data.setDate(data.getDate() + 1);
  return data.toISOString().slice(0, 10);
}

function adicionarDuasHoras(horario: string) {
  const [hora, minuto] = horario.split(":").map(Number);
  return `${String((hora + 2) % 24).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

export default function PaginaRestaurante({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [restauranteId, setRestauranteId] = useState<number | null>(null);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [data, setData] = useState(obterDataInicial);
  const [horario, setHorario] = useState("19:00");
  const [pessoas, setPessoas] = useState(2);
  const [observacoes, setObservacoes] = useState("");
  const [aceitouCondicao, setAceitouCondicao] = useState(false);
  const [mensagem, setMensagem] = useState("Carregando restaurante...");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    params.then(({ id }) => setRestauranteId(Number(id)));
  }, [params]);

  useEffect(() => {
    if (!restauranteId) return;

    apiRequest<Restaurante>(`/restaurantes/${restauranteId}`)
      .then((dados) => {
        setRestaurante(dados);
        setMensagem("");
      })
      .catch((erro) =>
        setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar o restaurante."),
      );
  }, [restauranteId]);

  const valorTotal = useMemo(
    () => (restaurante?.valor_minimo_reserva_por_pessoa ?? 0) * pessoas,
    [pessoas, restaurante],
  );

  async function reservar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!restaurante || !aceitouCondicao) {
      setMensagem("Aceite a condicao de consumo minimo para confirmar.");
      return;
    }

    setEnviando(true);
    setMensagem("");

    try {
      await apiRequest("/reservas", {
        method: "POST",
        body: JSON.stringify({
          id_restaurante: restaurante.id_restaurante,
          data_reserva: data,
          horario_inicio: horario,
          horario_fim: adicionarDuasHoras(horario),
          quantidade_pessoas: pessoas,
          observacoes,
        }),
      });
      window.location.assign("/cliente/reservas");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel criar a reserva.");
    } finally {
      setEnviando(false);
    }
  }

  if (!restaurante) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <p className="text-sm font-semibold">{mensagem}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app-chantilly px-5 py-8 text-app-cafe-profundo">
      <div className="mx-auto max-w-6xl">
        <Link href="/cliente/dashboard" className="text-sm font-bold text-app-caramelo-torrado">
          Voltar aos restaurantes
        </Link>

        <section className="mt-5 overflow-hidden rounded-[12px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada">
          <div className="relative h-52 bg-app-baunilha-dourada/45 sm:h-64">
            {restaurante.logo_url ? (
              <Image src={restaurante.logo_url} alt={restaurante.nome} fill priority className="object-cover" />
            ) : null}
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-semibold">{restaurante.nome}</h1>
            <p className="mt-2 text-sm text-app-mocha">{restaurante.endereco ?? "Endereco em atualizacao"}</p>
            <p className="mt-1 text-sm text-app-mocha">{restaurante.horario_funcionamento ?? "Horario a definir"}</p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
          <section className="rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada">
            <h2 className="text-2xl font-semibold">Sobre a experiencia</h2>
            <p className="mt-3 text-sm leading-6 text-app-mocha">
              Reserve sua mesa para uma visita de duas horas. A reserva sera confirmada automaticamente quando houver uma mesa disponivel.
            </p>
            <div className="mt-6 rounded-[8px] bg-app-creme-suave p-4">
              <p className="text-xs font-bold uppercase text-app-caramelo-torrado">Consumo minimo</p>
              <strong className="mt-2 block text-2xl">
                {formatarMoeda(restaurante.valor_minimo_reserva_por_pessoa)} por pessoa
              </strong>
            </div>
          </section>

          <form onSubmit={reservar} className="rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada">
            <h2 className="text-xl font-semibold">Reservar mesa</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold">Data<input type="date" min={obterDataInicial()} value={data} onChange={(e) => setData(e.target.value)} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm" /></label>
              <label className="grid gap-1 text-xs font-bold">Horario<input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm" /></label>
              <label className="grid gap-1 text-xs font-bold sm:col-span-2">Pessoas<input type="number" min={1} max={30} value={pessoas} onChange={(e) => setPessoas(Number(e.target.value))} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm" /></label>
              <label className="grid gap-1 text-xs font-bold sm:col-span-2">Observacoes<textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="min-h-20 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly p-3 text-sm" /></label>
            </div>
            <div className="mt-5 rounded-[8px] bg-app-creme-suave p-4 text-sm">
              Consumo minimo total: <strong>{formatarMoeda(valorTotal)}</strong>
            </div>
            <label className="mt-4 flex gap-3 text-xs leading-5 text-app-mocha">
              <input type="checkbox" checked={aceitouCondicao} onChange={(e) => setAceitouCondicao(e.target.checked)} />
              Estou ciente de que este valor representa consumo minimo, nao uma cobranca antecipada.
            </label>
            <button type="submit" disabled={enviando} className="mt-5 h-11 w-full rounded-[8px] bg-app-dourado-mel text-xs font-bold uppercase text-white disabled:opacity-60">
              {enviando ? "Reservando..." : "Confirmar reserva"}
            </button>
            {mensagem ? <p className="mt-3 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}
          </form>
        </div>
      </div>
    </main>
  );
}

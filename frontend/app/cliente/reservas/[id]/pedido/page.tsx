"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

type Produto = {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  tempo_preparo_minutos?: number | null;
  preco: number;
  disponivel: boolean;
};

type Categoria = {
  id_categoria: number;
  nome: string;
  produtos?: Produto[];
};

type Cardapio = {
  id_cardapio: number;
  nome: string;
  descricao?: string | null;
  categorias?: Categoria[];
};

type DadosPedido = {
  reserva: {
    id_reserva: number;
    data_reserva: string;
    horario_inicio: string;
    status_reserva: string;
    restaurantes?: { nome?: string } | null;
    pedidos?: Array<{
      id_pedido: number;
      status_pedido: string;
      valor_total: number;
      itens_pedido?: Array<{
        quantidade: number;
        observacoes?: string | null;
        produtos?: { nome?: string } | null;
      }>;
    }>;
  };
  cardapios: Cardapio[];
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export default function PaginaPedidoAntecipado({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [reservaId, setReservaId] = useState<number | null>(null);
  const [dados, setDados] = useState<DadosPedido | null>(null);
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [observacoes, setObservacoes] = useState("");
  const [mensagem, setMensagem] = useState("Carregando cardapio...");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    params.then(({ id }) => setReservaId(Number(id)));
  }, [params]);

  useEffect(() => {
    if (!reservaId) return;

    apiRequest<DadosPedido>(`/reservas/${reservaId}/cardapio`)
      .then((resultado) => {
        setDados(resultado);
        setMensagem("");
      })
      .catch((erro) =>
        setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar o cardapio."),
      );
  }, [reservaId]);

  const produtos = useMemo(
    () =>
      dados?.cardapios.flatMap((cardapio) =>
        (cardapio.categorias ?? []).flatMap((categoria) => categoria.produtos ?? []),
      ) ?? [],
    [dados],
  );

  const total = useMemo(
    () =>
      produtos.reduce(
        (soma, produto) => soma + Number(produto.preco) * (quantidades[produto.id_produto] ?? 0),
        0,
      ),
    [produtos, quantidades],
  );

  const pedidoAtivo = dados?.reserva.pedidos?.find((pedido) =>
    ["PENDENTE", "CONFIRMADO", "EM_PREPARO", "PRONTO"].includes(pedido.status_pedido),
  );

  function alterarQuantidade(produtoId: number, diferenca: number) {
    setQuantidades((atuais) => ({
      ...atuais,
      [produtoId]: Math.max(0, (atuais[produtoId] ?? 0) + diferenca),
    }));
  }

  async function criarPedido() {
    if (!reservaId) return;

    const itens = Object.entries(quantidades)
      .filter(([, quantidade]) => quantidade > 0)
      .map(([idProduto, quantidade]) => ({
        id_produto: Number(idProduto),
        quantidade,
      }));

    if (!itens.length) {
      setMensagem("Escolha ao menos um item do cardapio.");
      return;
    }

    setEnviando(true);
    setMensagem("");

    try {
      await apiRequest("/pedidos", {
        method: "POST",
        body: JSON.stringify({ id_reserva: reservaId, itens, observacoes }),
      });
      window.location.assign("/cliente/reservas");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel criar o pedido.");
    } finally {
      setEnviando(false);
    }
  }

  if (!dados) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <p className="text-sm font-semibold">{mensagem}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app-chantilly px-5 py-8 text-app-cafe-profundo">
      <div className="mx-auto max-w-6xl">
        <Link href="/cliente/reservas" className="text-sm font-bold text-app-caramelo-torrado">
          Voltar para reservas
        </Link>

        <header className="mt-6 rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada sm:p-8">
          <p className="text-xs font-bold uppercase text-app-caramelo-torrado">Pedido antecipado</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {dados.reserva.restaurantes?.nome ?? "Restaurante"}
          </h1>
          <p className="mt-3 text-sm text-app-mocha">
            Sua mesa esta reservada para {dados.reserva.data_reserva}, as{" "}
            {dados.reserva.horario_inicio.slice(0, 5)}. O restaurante recebera este horario como
            prazo para deixar o pedido pronto.
          </p>
        </header>

        {pedidoAtivo ? (
          <section className="mt-6 rounded-[12px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
            <h2 className="text-2xl font-semibold">Esta reserva ja possui um pedido ativo</h2>
            <p className="mt-3 text-sm text-app-mocha">
              Status: {pedidoAtivo.status_pedido} · Total {formatarMoeda(Number(pedidoAtivo.valor_total))}
            </p>
            <div className="mx-auto mt-6 grid max-w-lg gap-2 text-left">
              {pedidoAtivo.itens_pedido?.map((item, indice) => (
                <div key={`${item.produtos?.nome ?? "item"}-${indice}`} className="flex justify-between rounded-[8px] bg-app-creme-suave px-4 py-3 text-sm">
                  <span>{item.quantidade}x {item.produtos?.nome ?? "Item"}</span>
                  {item.observacoes ? <span className="text-app-mocha">{item.observacoes}</span> : null}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="grid gap-6">
              {dados.cardapios.map((cardapio) => (
                <article key={cardapio.id_cardapio} className="rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada">
                  <h2 className="text-2xl font-semibold">{cardapio.nome}</h2>
                  {cardapio.descricao ? <p className="mt-2 text-sm text-app-mocha">{cardapio.descricao}</p> : null}
                  <div className="mt-5 grid gap-4">
                    {(cardapio.categorias ?? []).flatMap((categoria) =>
                      (categoria.produtos ?? []).map((produto) => (
                        <div key={produto.id_produto} className="grid gap-4 rounded-[8px] bg-app-creme-suave p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <p className="text-xs font-bold uppercase text-app-caramelo-torrado">{categoria.nome}</p>
                            <h3 className="mt-1 text-lg font-semibold">{produto.nome}</h3>
                            {produto.descricao ? <p className="mt-1 text-sm text-app-mocha">{produto.descricao}</p> : null}
                            <p className="mt-2 text-sm font-bold">{formatarMoeda(Number(produto.preco))}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => alterarQuantidade(produto.id_produto, -1)} className="h-9 w-9 rounded-full bg-app-creme-leve text-lg font-bold">-</button>
                            <span className="min-w-6 text-center font-bold">{quantidades[produto.id_produto] ?? 0}</span>
                            <button type="button" onClick={() => alterarQuantidade(produto.id_produto, 1)} className="h-9 w-9 rounded-full bg-app-dourado-mel text-lg font-bold text-white">+</button>
                          </div>
                        </div>
                      )),
                    )}
                  </div>
                </article>
              ))}

              {!produtos.length ? (
                <p className="rounded-[12px] bg-app-creme-leve p-8 text-center text-sm font-semibold shadow-sm ring-1 ring-app-baunilha-dourada">
                  Este restaurante ainda nao publicou itens no cardapio.
                </p>
              ) : null}
            </section>

            <aside className="h-fit rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada lg:sticky lg:top-6">
              <h2 className="text-xl font-semibold">Resumo do pedido</h2>
              <p className="mt-4 text-sm text-app-mocha">
                Os precos e a disponibilidade sao validados novamente ao confirmar.
              </p>
              <label className="mt-5 grid gap-2 text-xs font-bold uppercase">
                Observacoes
                <textarea value={observacoes} onChange={(evento) => setObservacoes(evento.target.value)} className="min-h-24 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly p-3 text-sm font-normal normal-case" />
              </label>
              <div className="mt-5 flex items-center justify-between border-t border-app-baunilha-dourada pt-5">
                <span className="font-semibold">Total</span>
                <strong className="text-xl">{formatarMoeda(total)}</strong>
              </div>
              <button type="button" onClick={criarPedido} disabled={enviando || total <= 0} className="mt-5 h-11 w-full rounded-[8px] bg-app-dourado-mel text-xs font-bold uppercase text-white disabled:opacity-50">
                {enviando ? "Confirmando..." : "Confirmar pedido antecipado"}
              </button>
              {mensagem ? <p className="mt-3 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

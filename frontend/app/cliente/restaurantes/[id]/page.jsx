"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BotaoVoltar } from "@/components/botao-voltar";
import { apiRequest } from "@/lib/api";
import { calcularTempoPreparoItens } from "@/lib/tempo-preparo";

const LIMITE_UNIDADES_POR_ITEM = 10;

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor ?? 0));
}

function formatarDataInputLocal(data) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0"),
  ].join("-");
}

function obterDataPermitida() {
  return formatarDataInputLocal(new Date());
}

function obterDataLimiteReserva() {
  const data = new Date();
  data.setDate(data.getDate() + 30);
  return formatarDataInputLocal(data);
}

function adicionarDuasHoras(horario) {
  const [hora, minuto] = horario.split(":").map(Number);
  return `${String((hora + 2) % 24).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

function Icon({ type, className = "h-5 w-5" }) {
  const paths = {
    clock: "M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
    minus: "M5 12h14",
    plus: "M12 5v14M5 12h14",
    receipt: "M7 3h10v18l-2-1-2 1-2-1-2 1-2-1V3z M9 8h6M9 12h6M9 16h4",
    utensils: "M7 3v8M4 3v8M10 3v8M4 11h6M7 11v10M17 3v18M14 3h3a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3",
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function obterProdutosSelecionados(produtos, quantidades) {
  return produtos
    .map((produto) => ({
      ...produto,
      quantidade: quantidades[produto.id_produto] ?? 0,
    }))
    .filter((produto) => produto.quantidade > 0);
}

export default function PaginaRestaurante({ params }) {
  const [restauranteId, setRestauranteId] = useState(null);
  const [restaurante, setRestaurante] = useState(null);
  const [cardapios, setCardapios] = useState([]);
  const [data, setData] = useState(obterDataPermitida);
  const [horario, setHorario] = useState("19:00");
  const [pessoas, setPessoas] = useState(2);
  const [observacoesReserva, setObservacoesReserva] = useState("");
  const [observacoesPedido, setObservacoesPedido] = useState("");
  const [quantidades, setQuantidades] = useState({});
  const [observacoesItens, setObservacoesItens] = useState({});
  const [mensagem, setMensagem] = useState("Carregando restaurante...");
  const [disponibilidade, setDisponibilidade] = useState({ operacao_configurada: false, horarios: [], motivo: "" });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    params.then(({ id }) => setRestauranteId(Number(id)));
  }, [params]);

  useEffect(() => {
    if (!restauranteId) {
      return;
    }

    Promise.all([
      apiRequest(`/restaurantes/${restauranteId}`),
      apiRequest(`/restaurantes/${restauranteId}/cardapio`),
    ])
      .then(([dadosRestaurante, dadosCardapio]) => {
        setRestaurante(dadosRestaurante);
        setCardapios(dadosCardapio ?? []);
        setMensagem("");
      })
      .catch((erro) => setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar o restaurante."));
  }, [restauranteId]);

  const valorMinimoPorPessoa = Number(restaurante?.valor_minimo_reserva_por_pessoa ?? 0);
  const valorMinimoTotal = valorMinimoPorPessoa * pessoas;

  const produtosPorCategoria = useMemo(() => {
    return cardapios
      .flatMap((cardapio) =>
        (cardapio.categorias ?? []).map((categoria) => ({
          ...categoria,
          cardapio: cardapio.nome,
          produtos: categoria.produtos ?? [],
        })),
      )
      .filter((categoria) => categoria.produtos.length > 0);
  }, [cardapios]);

  const produtos = useMemo(() => {
    return produtosPorCategoria.flatMap((categoria) =>
      categoria.produtos.map((produto) => ({
        ...produto,
        categoria: categoria.nome,
      })),
    );
  }, [produtosPorCategoria]);

  const produtosDestaque = useMemo(() => {
    return produtos
      .filter((produto) => produto.destaque === true)
      .slice(0, 3);
  }, [produtos]);

  const produtosSelecionados = useMemo(() => obterProdutosSelecionados(produtos, quantidades), [produtos, quantidades]);
  const totalItens = produtosSelecionados.reduce((soma, produto) => soma + produto.quantidade, 0);
  const totalPedido = produtosSelecionados.reduce((soma, produto) => soma + Number(produto.preco ?? 0) * produto.quantidade, 0);
  const temPedidoAntecipado = totalItens > 0;
  const faltaParaMinimo = temPedidoAntecipado ? Math.max(0, valorMinimoTotal - totalPedido) : 0;
  const tempoEstimado = calcularTempoPreparoItens(produtosSelecionados);
  const horariosComStatus = disponibilidade.horarios ?? [];
  const horariosDisponiveis = horariosComStatus.filter((item) => item.disponivel);
  const slotSelecionado = horariosDisponiveis.find((item) => item.horario === horario) ?? horariosDisponiveis[0] ?? null;
  const horarioSelecionado = slotSelecionado?.horario ?? "";
  const horarioFimSelecionado = slotSelecionado?.horario_fim ?? (horarioSelecionado ? adicionarDuasHoras(horarioSelecionado) : "");
  const operacaoConfigurada = disponibilidade.operacao_configurada === true;

  useEffect(() => {
    if (!restauranteId || !restaurante) {
      return;
    }

    const params = new URLSearchParams({
      data,
      pessoas: String(pessoas),
      tempo_preparo: String(temPedidoAntecipado ? tempoEstimado : 0),
    });

    apiRequest(`/restaurantes/${restauranteId}/disponibilidade?${params.toString()}`)
      .then((resultado) => setDisponibilidade(resultado))
      .catch((erro) => setDisponibilidade({
        operacao_configurada: false,
        horarios: [],
        motivo: erro instanceof Error ? erro.message : "Nao foi possivel carregar os horarios.",
      }));
  }, [data, pessoas, restaurante, restauranteId, temPedidoAntecipado, tempoEstimado]);

  function alterarQuantidade(produtoId, diferenca) {
    setMensagem("");
    setQuantidades((atuais) => {
      const proximaQuantidade = Math.min(LIMITE_UNIDADES_POR_ITEM, Math.max(0, (atuais[produtoId] ?? 0) + diferenca));
      return {
        ...atuais,
        [produtoId]: proximaQuantidade,
      };
    });
  }

  function alterarObservacaoItem(produtoId, valor) {
    setMensagem("");
    setObservacoesItens((atuais) => ({
      ...atuais,
      [produtoId]: valor.slice(0, 180),
    }));
  }

  async function reservar(event) {
    event.preventDefault();
    if (!restaurante) {
      return;
    }
    if (!operacaoConfigurada) {
      setMensagem("Este restaurante ainda nao configurou horarios de funcionamento para receber reservas.");
      return;
    }
    if (!horarioSelecionado) {
      setMensagem("Escolha um horario disponivel dentro do funcionamento do restaurante.");
      return;
    }
    if (temPedidoAntecipado && faltaParaMinimo > 0) {
      setMensagem(`Para reservar com pedido antecipado, ainda faltam ${formatarMoeda(faltaParaMinimo)} para atingir o consumo minimo.`);
      return;
    }

    setEnviando(true);
    setMensagem("");

    try {
      if (!temPedidoAntecipado) {
        await apiRequest("/reservas", {
          method: "POST",
          body: JSON.stringify({
            id_restaurante: restaurante.id_restaurante,
            data_reserva: data,
            horario_inicio: horarioSelecionado,
            horario_fim: horarioFimSelecionado,
            quantidade_pessoas: pessoas,
            observacoes: observacoesReserva,
          }),
        });
        window.location.assign("/cliente/reservas");
        return;
      }

      const itens = produtosSelecionados.map((produto) => ({
        id_produto: produto.id_produto,
        quantidade: produto.quantidade,
        observacoes: observacoesItens[produto.id_produto]?.trim() || null,
      }));
      const fluxoCriado = await apiRequest("/reservas/com-pedido", {
        method: "POST",
        body: JSON.stringify({
          id_restaurante: restaurante.id_restaurante,
          data_reserva: data,
          horario_inicio: horarioSelecionado,
          horario_fim: horarioFimSelecionado,
          quantidade_pessoas: pessoas,
          observacoes_reserva: observacoesReserva,
          itens,
          observacoes_pedido: observacoesPedido,
        }),
      });
      window.location.assign(`/cliente/pagamentos/pedido/${fluxoCriado.pedido.id_pedido}`);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel concluir a reserva.");
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
      <div className="mx-auto max-w-7xl">
        <BotaoVoltar href="/cliente/dashboard" className="text-sm font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo">
          Voltar aos restaurantes
        </BotaoVoltar>

        <section className="mt-5 overflow-hidden rounded-[14px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada">
          <div className="relative h-52 bg-app-baunilha-dourada/45 sm:h-64">
            {restaurante.logo_url ? <Image src={restaurante.logo_url} alt={restaurante.nome} fill priority className="object-cover" /> : null}
          </div>
          <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">Restaurante parceiro</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{restaurante.nome}</h1>
              <p className="mt-2 text-sm text-app-mocha">{restaurante.endereco ?? "Endereco em atualizacao"}</p>
              <p className="mt-1 text-sm text-app-mocha">{restaurante.horario_funcionamento ?? "Horario a definir"}</p>
            </div>
            <div className="rounded-[12px] bg-app-creme-suave p-4 ring-1 ring-app-baunilha-dourada/55">
              <p className="text-xs font-bold uppercase text-app-caramelo-torrado">Consumo minimo para pedido</p>
              <strong className="mt-2 block text-2xl">{formatarMoeda(valorMinimoPorPessoa)}</strong>
              <p className="mt-1 text-xs text-app-mocha">por pessoa, aplicado apenas ao pedido antecipado.</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="grid gap-6">
            {produtosDestaque.length ? (
              <section className="rounded-[14px] bg-app-cafe-profundo p-5 text-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/50">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-dourado-mel">Selecionados pelo restaurante</p>
                <h2 className="mt-1 text-2xl font-bold">Destaques do cardapio</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {produtosDestaque.map((produto) => (
                    <article key={`destaque-${produto.id_produto}`} className="overflow-hidden rounded-[12px] bg-app-creme-leve text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/45">
                      <div className="relative h-24 bg-app-baunilha-dourada/45">
                        {produto.imagem_url ? <Image src={produto.imagem_url} alt={produto.nome} fill className="object-cover" /> : <span className="flex h-full items-center justify-center text-xs font-bold uppercase text-app-caramelo-torrado">Appono</span>}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{produto.categoria}</p>
                        <h3 className="mt-1 line-clamp-2 text-sm font-bold">{produto.nome}</h3>
                        <strong className="mt-2 block text-sm text-app-caramelo-torrado">{formatarMoeda(produto.preco)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {produtosPorCategoria.length ? (
              produtosPorCategoria.map((categoria) => (
                <section key={categoria.id_categoria} className="rounded-[14px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{categoria.cardapio}</p>
                      <h2 className="mt-1 text-2xl font-bold">{categoria.nome}</h2>
                    </div>
                    <span className="rounded-full bg-app-creme-suave px-3 py-1 text-xs font-bold text-app-mocha">
                      {categoria.produtos.length} itens
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {categoria.produtos.map((produto) => {
                      const quantidade = quantidades[produto.id_produto] ?? 0;
                      return (
                        <article key={produto.id_produto} className="grid gap-4 rounded-[12px] bg-app-creme-suave p-3 ring-1 ring-app-baunilha-dourada/55 sm:grid-cols-[128px_1fr_auto] sm:items-center">
                          <div className="relative h-28 overflow-hidden rounded-[10px] bg-app-baunilha-dourada/45">
                            {produto.imagem_url ? (
                              <Image src={produto.imagem_url} alt={produto.nome} fill className="object-cover" />
                            ) : (
                              <span className="flex h-full items-center justify-center text-app-caramelo-torrado">
                                <Icon type="utensils" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              {produto.destaque ? (
                                <span className="rounded-full bg-app-cafe-profundo px-2.5 py-1 text-[10px] font-bold uppercase text-app-creme-leve">
                                  Destaque
                                </span>
                              ) : null}
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-app-cinza">
                                <Icon type="clock" className="h-4 w-4" />
                                {produto.tempo_preparo_minutos ?? 30} min
                              </span>
                            </div>
                            <h3 className="mt-2 text-lg font-bold text-app-cafe-profundo">{produto.nome}</h3>
                            {produto.descricao ? <p className="mt-1 text-sm leading-6 text-app-mocha">{produto.descricao}</p> : null}
                            <p className="mt-2 text-base font-bold text-app-caramelo-torrado">{formatarMoeda(produto.preco)}</p>
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <button type="button" onClick={() => alterarQuantidade(produto.id_produto, -1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-app-creme-leve text-app-cafe-profundo ring-1 ring-app-baunilha-dourada transition hover:bg-app-baunilha-dourada">
                              <Icon type="minus" className="h-4 w-4" />
                            </button>
                            <span className="min-w-8 text-center text-lg font-bold">{quantidade}</span>
                            <button type="button" onClick={() => alterarQuantidade(produto.id_produto, 1)} disabled={quantidade >= LIMITE_UNIDADES_POR_ITEM} className="flex h-10 w-10 items-center justify-center rounded-full bg-app-dourado-mel text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-45">
                              <Icon type="plus" className="h-4 w-4" />
                            </button>
                          </div>
                          {quantidade > 0 ? (
                            <label className="grid gap-2 sm:col-span-3">
                              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-cinza">
                                Observacao deste item
                              </span>
                              <input value={observacoesItens[produto.id_produto] ?? ""} onChange={(evento) => alterarObservacaoItem(produto.id_produto, evento.target.value)} placeholder="Ex: sem cebola, molho separado, ponto da carne..." className="h-10 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado" />
                              <span className="text-[11px] text-app-cinza">Limite de {LIMITE_UNIDADES_POR_ITEM} unidades por item.</span>
                            </label>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))
            ) : (
              <section className="rounded-[14px] bg-app-creme-leve p-6 text-sm leading-6 text-app-mocha shadow-sm ring-1 ring-app-baunilha-dourada">
                <p className="font-bold text-app-cafe-profundo">Cardapio em atualizacao</p>
                <p className="mt-1">Este restaurante ainda nao publicou itens. Voce ainda pode reservar uma mesa normalmente.</p>
              </section>
            )}
          </section>

          <aside className="h-fit rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada lg:sticky lg:top-6">
            <form onSubmit={reservar}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-app-baunilha-dourada text-app-cafe-profundo">
                  <Icon type="receipt" />
                </span>
                <div>
                  <h2 className="text-xl font-bold">{temPedidoAntecipado ? "Reserva com pedido" : "Reservar mesa"}</h2>
                  <p className="text-xs text-app-cinza">
                    {temPedidoAntecipado ? `${totalItens} itens selecionados` : "Pedido antecipado opcional"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-bold uppercase text-app-cinza">
                  Data
                  <input type="date" min={obterDataPermitida()} max={obterDataLimiteReserva()} value={data} onChange={(evento) => setData(evento.target.value)} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm font-normal normal-case text-app-cafe-profundo outline-none" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase text-app-cinza">
                  Horario
                  <select value={horarioSelecionado} onChange={(evento) => setHorario(evento.target.value)} disabled={!horariosDisponiveis.length} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm font-normal normal-case text-app-cafe-profundo outline-none disabled:cursor-not-allowed disabled:opacity-60">
                    {horariosComStatus.length ? horariosComStatus.map((slot) => (
                      <option key={slot.horario} value={slot.horario} disabled={!slot.disponivel}>
                        {slot.disponivel ? slot.horario : `${slot.horario} - ${slot.motivo}`}
                      </option>
                    )) : (
                      <option value="">Sem horarios</option>
                    )}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase text-app-cinza sm:col-span-2">
                  Pessoas
                  <input type="number" min={1} max={30} value={pessoas} onChange={(evento) => setPessoas(Math.max(1, Number(evento.target.value) || 1))} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm font-normal normal-case text-app-cafe-profundo outline-none" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase text-app-cinza sm:col-span-2">
                  Observacoes da reserva
                  <textarea value={observacoesReserva} onChange={(evento) => setObservacoesReserva(evento.target.value)} placeholder="Ex: mesa proxima da janela, cadeira infantil..." className="min-h-20 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly p-3 text-sm font-normal normal-case text-app-cafe-profundo outline-none" />
                </label>
              </div>

              <div className="mt-5 grid gap-2 border-t border-app-baunilha-dourada pt-5">
                {produtosSelecionados.length ? produtosSelecionados.map((produto) => (
                  <div key={produto.id_produto} className="grid grid-cols-[1fr_auto] gap-3 rounded-[8px] bg-app-creme-suave p-3 text-sm">
                    <div>
                      <span><strong>{produto.quantidade}x</strong> {produto.nome}</span>
                      {observacoesItens[produto.id_produto]?.trim() ? <p className="mt-1 text-xs text-app-cinza">Obs.: {observacoesItens[produto.id_produto].trim()}</p> : null}
                    </div>
                    <strong>{formatarMoeda(Number(produto.preco ?? 0) * produto.quantidade)}</strong>
                  </div>
                )) : (
                  <p className="rounded-[8px] bg-app-creme-suave p-4 text-sm leading-6 text-app-mocha">
                    Voce pode reservar somente a mesa ou selecionar itens do cardapio para antecipar o pedido.
                  </p>
                )}
              </div>

              {temPedidoAntecipado ? (
                <label className="mt-5 grid gap-2 text-xs font-bold uppercase text-app-cinza">
                  Observacoes do pedido
                  <textarea value={observacoesPedido} onChange={(evento) => setObservacoesPedido(evento.target.value)} placeholder="Ex: alergias, ponto da carne, retirar cebola..." className="min-h-20 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly p-3 text-sm font-normal normal-case text-app-cafe-profundo outline-none" />
                </label>
              ) : null}

              <div className="mt-5 grid gap-3 border-t border-app-baunilha-dourada pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-app-mocha">Consumo minimo por pessoa</span>
                  <strong>{formatarMoeda(valorMinimoPorPessoa)}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-app-mocha">{temPedidoAntecipado ? `Minimo para ${pessoas} pessoa(s)` : "Aplicado somente se houver pedido"}</span>
                  <strong>{formatarMoeda(valorMinimoTotal)}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-app-mocha">Tempo estimado</span>
                  <strong>{temPedidoAntecipado ? `${tempoEstimado || 0} min` : "Sem pedido"}</strong>
                </div>
                <div className="flex items-center justify-between border-t border-app-baunilha-dourada pt-4">
                  <span className="font-bold">{temPedidoAntecipado ? "Total do pedido" : "Total a pagar agora"}</span>
                  <strong className="text-2xl text-app-cafe-profundo">{formatarMoeda(temPedidoAntecipado ? totalPedido : 0)}</strong>
                </div>
              </div>

              {temPedidoAntecipado && faltaParaMinimo > 0 ? (
                <p className="mt-5 rounded-[8px] bg-app-creme-suave p-3 text-sm font-semibold leading-6 text-app-caramelo-torrado">
                  Faltam {formatarMoeda(faltaParaMinimo)} para atingir o consumo minimo do pedido antecipado.
                </p>
              ) : null}
              {!operacaoConfigurada ? (
                <p className="mt-5 rounded-[8px] bg-app-creme-suave p-3 text-sm font-semibold leading-6 text-app-caramelo-torrado">
                  {disponibilidade.motivo ?? "Este restaurante ainda precisa configurar os horarios de funcionamento antes de receber reservas."}
                </p>
              ) : null}
              {operacaoConfigurada && !horariosDisponiveis.length ? (
                <p className="mt-5 rounded-[8px] bg-app-creme-suave p-3 text-sm font-semibold leading-6 text-app-caramelo-torrado">
                  {disponibilidade.motivo ?? "Nao ha horarios disponiveis para esta data considerando funcionamento, antecedencia minima, tempo de preparo e mesas ocupadas."}
                </p>
              ) : null}

              <button type="submit" disabled={enviando || !operacaoConfigurada || !horariosDisponiveis.length || (temPedidoAntecipado && faltaParaMinimo > 0)} className="mt-5 h-12 w-full rounded-[8px] bg-app-dourado-mel text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-50">
                {enviando ? "Confirmando..." : temPedidoAntecipado ? "Confirmar reserva e pagar pedido" : "Confirmar reserva sem pedido"}
              </button>
              {mensagem ? <p className="mt-3 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}
            </form>

            <div className="mt-5 rounded-[10px] bg-app-creme-suave p-4 text-xs leading-5 text-app-mocha">
              <strong className="text-app-cafe-profundo">Como funciona:</strong> reserva simples nao exige pagamento nem consumo minimo. Se voce selecionar itens, o pedido sera criado junto com a reserva e enviado para pagamento.
              <span className="mt-2 block">Os horarios aparecem conforme a configuracao de funcionamento do restaurante, antecedencia minima e disponibilidade de mesas.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { BotaoVoltar } from "@/components/botao-voltar";
function formatarMoeda(valor) {
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
function adicionarDuasHoras(horario) {
    const [hora, minuto] = horario.split(":").map(Number);
    return `${String((hora + 2) % 24).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}
export default function PaginaRestaurante({ params, }) {
    const [restauranteId, setRestauranteId] = useState(null);
    const [restaurante, setRestaurante] = useState(null);
    const [cardapios, setCardapios] = useState([]);
    const [data, setData] = useState(obterDataInicial);
    const [horario, setHorario] = useState("19:00");
    const [pessoas, setPessoas] = useState(2);
    const [observacoes, setObservacoes] = useState("");
    const [aceitouCondicao, setAceitouCondicao] = useState(false);
    const [mensagem, setMensagem] = useState("Carregando restaurante...");
    const [enviando, setEnviando] = useState(false);
    const [favoritando, setFavoritando] = useState(false);
    const [carrinho, setCarrinho] = useState({});
    const [observacoesPedido, setObservacoesPedido] = useState("");
    useEffect(() => {
        params.then(({ id }) => setRestauranteId(Number(id)));
    }, [params]);
    useEffect(() => {
        if (!restauranteId)
            return;
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
    const valorTotal = useMemo(() => (restaurante?.valor_minimo_reserva_por_pessoa ?? 0) * pessoas, [pessoas, restaurante]);
    const produtosPorCategoria = useMemo(() => {
        return cardapios.flatMap((cardapio) => (cardapio.categorias ?? []).map((categoria) => ({
            ...categoria,
            produtos: categoria.produtos ?? [],
        }))).filter((categoria) => categoria.produtos.length > 0);
    }, [cardapios]);
    const produtosDestaque = useMemo(() => {
        return produtosPorCategoria
            .flatMap((categoria) => categoria.produtos.map((produto) => ({
                ...produto,
                categoriaNome: categoria.nome,
            })))
            .filter((produto) => produto.destaque === true)
            .slice(0, 3);
    }, [produtosPorCategoria]);
    const itensSelecionados = useMemo(() => produtosPorCategoria.flatMap((categoria) => categoria.produtos)
        .filter((produto) => Number(carrinho[produto.id_produto] ?? 0) > 0)
        .map((produto) => ({ ...produto, quantidade: Number(carrinho[produto.id_produto]) })), [carrinho, produtosPorCategoria]);
    const totalPedido = useMemo(() => itensSelecionados.reduce((total, item) => total + Number(item.preco ?? 0) * item.quantidade, 0), [itensSelecionados]);
    function alterarQuantidade(produtoId, delta) {
        setCarrinho((atual) => {
            const quantidade = Math.max(0, Math.min(10, Number(atual[produtoId] ?? 0) + delta));
            const proximo = { ...atual };
            if (quantidade) proximo[produtoId] = quantidade;
            else delete proximo[produtoId];
            return proximo;
        });
    }
    async function reservar(event) {
        event.preventDefault();
        if (!restaurante || !aceitouCondicao) {
            setMensagem("Aceite a condicao de consumo minimo para confirmar.");
            return;
        }
        setEnviando(true);
        setMensagem("");
        try {
            const temPedido = itensSelecionados.length > 0;
            const resposta = await apiRequest(temPedido ? "/reservas/com-pedido" : "/reservas", {
                method: "POST",
                body: JSON.stringify({
                    id_restaurante: restaurante.id_restaurante,
                    data_reserva: data,
                    horario_inicio: horario,
                    horario_fim: adicionarDuasHoras(horario),
                    quantidade_pessoas: pessoas,
                    ...(temPedido ? {
                        observacoes_reserva: observacoes,
                        observacoes_pedido: observacoesPedido,
                        itens: itensSelecionados.map((item) => ({ id_produto: item.id_produto, quantidade: item.quantidade })),
                    } : { observacoes }),
                }),
            });
            window.location.assign(temPedido ? `/cliente/pagamentos/pedido/${resposta.pedido.id_pedido}` : "/cliente/reservas");
        }
        catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel criar a reserva.");
        }
        finally {
            setEnviando(false);
        }
    }
    async function alternarFavorito() {
        setFavoritando(true);
        try {
            const resposta = await apiRequest(`/restaurantes/${restauranteId}/favorito`, { method: "PATCH", body: JSON.stringify({ favorito: !restaurante.favorito_cliente }) });
            setRestaurante((atual) => ({ ...atual, ...resposta }));
        } catch (erro) { setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel atualizar o favorito."); }
        finally { setFavoritando(false); }
    }
    if (!restaurante) {
        return (<main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <p className="text-sm font-semibold">{mensagem}</p>
      </main>);
    }
    return (<main className="min-h-screen bg-app-chantilly px-5 py-8 text-app-cafe-profundo">
      <div className="mx-auto max-w-6xl">
        <BotaoVoltar href="/cliente/dashboard" className="text-sm font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo">
          Voltar aos restaurantes
        </BotaoVoltar>

        <section className="mt-5 overflow-hidden rounded-[12px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada">
          <div className="relative h-52 bg-app-baunilha-dourada/45 sm:h-64">
            {restaurante.logo_url ? (<Image src={restaurante.logo_url} alt={restaurante.nome} fill priority className="object-cover"/>) : null}
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold">{restaurante.nome}</h1><p className="mt-2 text-sm font-bold text-app-caramelo-torrado">{restaurante.avaliacao_media?.toFixed(1) ?? "Novo"} · {restaurante.total_avaliacoes ?? 0} avaliações · {restaurante.total_favoritos ?? 0} favoritos</p></div><button type="button" disabled={favoritando} onClick={alternarFavorito} className="rounded-[8px] border border-app-caramelo-torrado px-5 py-3 text-xs font-bold uppercase text-app-caramelo-torrado disabled:opacity-50">{restaurante.favorito_cliente ? "♥ Favorito" : "♡ Favoritar"}</button></div>
            <p className="mt-2 text-sm text-app-mocha">{restaurante.endereco ?? "Endereco em atualizacao"}</p>
            <p className="mt-1 text-sm text-app-mocha">{restaurante.horario_funcionamento ?? "Horario a definir"}</p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
          <section className="rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada">
            <h2 className="text-2xl font-semibold">Cardapio</h2>
            {produtosPorCategoria.length ? (
              <div className="mt-5 grid gap-7">
                {produtosDestaque.length ? (
                  <section className="rounded-[12px] bg-app-cafe-profundo p-4 text-app-creme-leve">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-dourado-mel">Selecionados pelo restaurante</p>
                        <h3 className="mt-1 text-xl font-bold">Destaques do cardapio</h3>
                      </div>
                      <span className="rounded-full bg-app-creme-leve/10 px-3 py-1 text-[10px] font-bold uppercase text-app-baunilha-dourada">
                        {produtosDestaque.length} sugestoes
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {produtosDestaque.map((produto) => (
                        <article key={`destaque-${produto.id_produto}`} className="overflow-hidden rounded-[10px] bg-app-creme-leve text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/45">
                          <div className="relative h-24 bg-app-baunilha-dourada/45">
                            {produto.imagem_url ? (
                              <Image src={produto.imagem_url} alt={produto.nome} fill className="object-cover"/>
                            ) : (
                              <span className="flex h-full items-center justify-center text-xs font-bold uppercase text-app-caramelo-torrado">
                                Appono
                              </span>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{produto.categoriaNome}</p>
                            <h4 className="mt-1 line-clamp-2 text-sm font-bold">{produto.nome}</h4>
                            <strong className="mt-2 block text-sm text-app-caramelo-torrado">{formatarMoeda(Number(produto.preco ?? 0))}</strong>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
                {produtosPorCategoria.map((categoria) => (
                  <div key={categoria.id_categoria}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                      {categoria.nome}
                    </h3>
                    <div className="mt-3 grid gap-3">
                      {categoria.produtos.map((produto) => (
                        <article key={produto.id_produto} className="grid gap-4 rounded-[10px] bg-app-creme-suave p-3 ring-1 ring-app-baunilha-dourada/55 sm:grid-cols-[112px_1fr]">
                          <div className="relative h-28 overflow-hidden rounded-[8px] bg-app-baunilha-dourada/45">
                            {produto.imagem_url ? (
                              <Image src={produto.imagem_url} alt={produto.nome} fill className="object-cover"/>
                            ) : (
                              <span className="flex h-full items-center justify-center text-xs font-bold uppercase text-app-caramelo-torrado">
                                Appono
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="text-lg font-bold text-app-cafe-profundo">{produto.nome}</h4>
                                {produto.destaque ? (
                                  <span className="mt-1 inline-flex rounded-full bg-app-cafe-profundo px-2.5 py-1 text-[10px] font-bold uppercase text-app-creme-leve">
                                    Destaque
                                  </span>
                                ) : null}
                              </div>
                              <strong className="text-base text-app-caramelo-torrado">{formatarMoeda(Number(produto.preco ?? 0))}</strong>
                            </div>
                            {produto.descricao ? <p className="mt-2 text-sm leading-6 text-app-mocha">{produto.descricao}</p> : null}
                            <p className="mt-2 text-xs font-semibold text-app-cinza">
                              {produto.tempo_preparo_minutos ?? 30} min de preparo
                            </p>
                            <div className="mt-4 flex items-center justify-between rounded-[8px] bg-app-chantilly p-2 ring-1 ring-app-baunilha-dourada/55">
                              <span className="text-xs font-bold uppercase text-app-mocha">Adicionar</span>
                              <div className="flex items-center gap-3">
                                <button type="button" onClick={() => alterarQuantidade(produto.id_produto, -1)} disabled={!carrinho[produto.id_produto]} className="flex h-8 w-8 items-center justify-center rounded-full border border-app-baunilha-dourada text-lg font-bold disabled:opacity-35" aria-label={`Remover ${produto.nome}`}>−</button>
                                <strong className="min-w-5 text-center">{carrinho[produto.id_produto] ?? 0}</strong>
                                <button type="button" onClick={() => alterarQuantidade(produto.id_produto, 1)} disabled={Number(carrinho[produto.id_produto] ?? 0) >= 10} className="flex h-8 w-8 items-center justify-center rounded-full bg-app-cafe-profundo text-lg font-bold text-white disabled:opacity-35" aria-label={`Adicionar ${produto.nome}`}>+</button>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[10px] bg-app-creme-suave p-5 text-sm leading-6 text-app-mocha ring-1 ring-app-baunilha-dourada/50">
                <p className="font-bold text-app-cafe-profundo">Cardapio em atualizacao</p>
                <p className="mt-1">Este restaurante ainda nao publicou itens no cardapio. A reserva continua disponivel normalmente.</p>
              </div>
            )}
          </section>

          <section className="rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada lg:row-start-2">
            <h2 className="text-2xl font-semibold">Sobre a experiencia</h2>
            <p className="mt-3 text-sm leading-6 text-app-mocha">
              Reserve sua mesa para uma visita de duas horas. O consumo minimo orienta o valor do pedido antecipado e sera validado quando voce montar o cardapio da reserva.
            </p>
            <div className="mt-6 rounded-[8px] bg-app-creme-suave p-4">
              <p className="text-xs font-bold uppercase text-app-caramelo-torrado">Consumo minimo</p>
              <strong className="mt-2 block text-2xl">
                {formatarMoeda(restaurante.valor_minimo_reserva_por_pessoa)} por pessoa
              </strong>
            </div>
          </section>

          <section className="rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada">
            <h2 className="text-2xl font-semibold">Avaliações</h2>
            <p className="mt-3 text-sm leading-6 text-app-mocha">Avaliações verificadas são publicadas somente depois que um pedido é entregue. O formulário fica no detalhe do pedido, separado da reserva.</p>
            {(restaurante.avaliacoes_recentes ?? []).length ? <div className="mt-5 grid gap-3">{restaurante.avaliacoes_recentes.map((avaliacao) => <article key={avaliacao.id_avaliacao} className="rounded-[12px] bg-app-chantilly p-5 ring-1 ring-app-baunilha-dourada/60"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-lg tracking-[0.12em] text-app-dourado-mel" aria-label={`${avaliacao.nota} de 5 estrelas`}>{"★".repeat(avaliacao.nota)}<span className="text-app-baunilha-dourada">{"★".repeat(5 - avaliacao.nota)}</span></p><span className="text-xs font-semibold text-app-cinza">Pedido verificado</span></div><p className="mt-3 text-sm leading-6 text-app-mocha">{avaliacao.comentario || "O cliente avaliou sem adicionar comentário."}</p><p className="mt-3 text-xs font-bold text-app-cafe-profundo">{avaliacao.clientes?.nome ?? "Cliente Appono"}</p></article>)}</div> : <div className="mt-5 rounded-[10px] bg-app-chantilly p-5 text-sm text-app-cinza ring-1 ring-app-baunilha-dourada/60">Este restaurante ainda não recebeu avaliações verificadas.</div>}
          </section>

          <form onSubmit={reservar} className="rounded-[12px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada lg:row-span-2">
            <h2 className="text-xl font-semibold">Reservar mesa</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold">Data<input type="date" min={obterDataInicial()} value={data} onChange={(e) => setData(e.target.value)} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm"/></label>
              <label className="grid gap-1 text-xs font-bold">Horario<input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm"/></label>
              <label className="grid gap-1 text-xs font-bold sm:col-span-2">Pessoas<input type="number" min={1} max={30} value={pessoas} onChange={(e) => setPessoas(Number(e.target.value))} className="h-11 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm"/></label>
              <label className="grid gap-1 text-xs font-bold sm:col-span-2">Observacoes<textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="min-h-20 rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly p-3 text-sm"/></label>
            </div>
            <div className="mt-5 rounded-[8px] bg-app-creme-suave p-4 text-sm">
              Consumo minimo total: <strong>{formatarMoeda(valorTotal)}</strong>
            </div>
            {itensSelecionados.length ? <section className="mt-4 rounded-[10px] bg-app-cafe-profundo p-4 text-app-creme-leve">
              <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-baunilha-dourada">Pedido antecipado</p><strong className="mt-1 block">{itensSelecionados.length} item(ns) selecionado(s)</strong></div><strong className="text-xl">{formatarMoeda(totalPedido)}</strong></div>
              <div className="mt-3 grid gap-1 text-xs text-app-creme-suave">{itensSelecionados.map((item) => <p key={`resumo-${item.id_produto}`}>{item.quantidade}x {item.nome}</p>)}</div>
              {totalPedido < valorTotal ? <p className="mt-3 rounded-[8px] bg-red-950/30 p-3 text-xs font-bold text-red-100">Adicione {formatarMoeda(valorTotal - totalPedido)} para atingir o consumo minimo.</p> : null}
              <label className="mt-4 grid gap-2 text-xs font-bold">Observações do pedido<textarea value={observacoesPedido} maxLength={500} onChange={(event) => setObservacoesPedido(event.target.value)} className="min-h-20 rounded-[8px] border border-app-baunilha-dourada/50 bg-app-creme-leve p-3 font-normal text-app-cafe-profundo" placeholder="Ponto da carne, alergias ou outras orientações."/></label>
            </section> : <p className="mt-4 rounded-[8px] border border-app-baunilha-dourada p-3 text-xs leading-5 text-app-cinza">Você pode reservar somente a mesa ou selecionar itens no cardápio para criar a reserva e o pedido na mesma operação.</p>}
            <label className="mt-4 flex gap-3 text-xs leading-5 text-app-mocha">
              <input type="checkbox" checked={aceitouCondicao} onChange={(e) => setAceitouCondicao(e.target.checked)}/>
              Estou ciente de que este valor representa o consumo minimo esperado para o pedido antecipado.
            </label>
            <button type="submit" disabled={enviando || (itensSelecionados.length > 0 && totalPedido < valorTotal)} className="mt-5 h-11 w-full rounded-[8px] bg-app-dourado-mel text-xs font-bold uppercase text-white disabled:opacity-60">
              {enviando ? "Confirmando..." : itensSelecionados.length ? "Reservar e ir para pagamento" : "Confirmar reserva"}
            </button>
            {mensagem ? <p className="mt-3 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}
          </form>
        </div>
      </div>
    </main>);
}

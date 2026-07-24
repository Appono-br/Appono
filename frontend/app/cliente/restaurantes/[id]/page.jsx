"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
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
    async function reservar(event) {
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
        }
        catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel criar a reserva.");
        }
        finally {
            setEnviando(false);
        }
    }
    if (!restaurante) {
        return (<main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <p className="text-sm font-semibold">{mensagem}</p>
      </main>);
    }
    return (<main className="min-h-screen bg-app-chantilly px-5 py-8 text-app-cafe-profundo">
      <div className="mx-auto max-w-6xl">
        <Link href="/cliente/dashboard" className="text-sm font-bold text-app-caramelo-torrado">
          Voltar aos restaurantes
        </Link>

        <section className="mt-5 overflow-hidden rounded-[12px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada">
          <div className="relative h-52 bg-app-baunilha-dourada/45 sm:h-64">
            {restaurante.logo_url ? (<Image src={restaurante.logo_url} alt={restaurante.nome} fill priority className="object-cover"/>) : null}
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-semibold">{restaurante.nome}</h1>
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
            <label className="mt-4 flex gap-3 text-xs leading-5 text-app-mocha">
              <input type="checkbox" checked={aceitouCondicao} onChange={(e) => setAceitouCondicao(e.target.checked)}/>
              Estou ciente de que este valor representa o consumo minimo esperado para o pedido antecipado.
            </label>
            <button type="submit" disabled={enviando} className="mt-5 h-11 w-full rounded-[8px] bg-app-dourado-mel text-xs font-bold uppercase text-white disabled:opacity-60">
              {enviando ? "Confirmando reserva..." : "Confirmar reserva"}
            </button>
            {mensagem ? <p className="mt-3 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}
          </form>
        </div>
      </div>
    </main>);
}

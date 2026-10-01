"use strict";

const TIPOS = ["DESCONTO_PERCENTUAL", "DESCONTO_FIXO", "ITEM_CORTESIA", "BEBIDA", "ENTRADA", "SOBREMESA", "COMBO"];
const STATUS = ["RASCUNHO", "AGENDADA", "ATIVA", "PAUSADA", "ENCERRADA"];
const TIPOS_EVENTO = ["IMPRESSION", "CLICK", "RESERVA_INICIADA"];
const MAX_TITULO = 120;
const MAX_TEXTO = 2000;

function dataComFusoValida(value) {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|([+-])(\d{2}):(\d{2}))$/i.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [, ano, mes, dia, hora, minuto, segundo = "0", , , offsetHora = "0", offsetMinuto = "0"] = match;
  const data = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
  return data.getUTCFullYear() === Number(ano) && data.getUTCMonth() + 1 === Number(mes) && data.getUTCDate() === Number(dia)
    && Number(hora) <= 23 && Number(minuto) <= 59 && Number(segundo) <= 59
    && Number(offsetHora) <= 14 && Number(offsetMinuto) <= 59 && (Number(offsetHora) < 14 || Number(offsetMinuto) === 0);
}

function validarCampanha(body, actor, storageUrl) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Informe os dados da campanha.");
  const d = Object.fromEntries(["titulo", "descricao", "imagem_url", "tipo_beneficio", "valor_beneficio", "regras", "inicio_em", "fim_em", "limite_usos", "minimo_pessoas", "minimo_itens", "status", "beneficio_itens", "preco_combo", "produtos"].map((k) => [k, body[k] ?? null]));
  d.titulo = String(d.titulo ?? "").trim();
  if (!TIPOS.includes(d.tipo_beneficio) || d.titulo.length < 3 || d.titulo.length > MAX_TITULO) throw new Error("Informe título e benefício válidos.");
  if (!STATUS.includes(d.status)) throw new Error("Status de campanha inválido.");
  for (const key of ["descricao", "regras"]) {
    if (d[key] != null && (typeof d[key] !== "string" || d[key].length > MAX_TEXTO)) throw new Error("Descrição ou regras excedem o limite permitido.");
  }
  for (const key of ["inicio_em", "fim_em"]) {
    if (!dataComFusoValida(d[key])) throw new Error("Informe datas válidas com fuso horário.");
  }
  if (Date.parse(d.fim_em) <= Date.parse(d.inicio_em)) throw new Error("O fim deve ser posterior ao início.");
  for (const key of ["limite_usos", "minimo_pessoas", "minimo_itens"]) {
    if (d[key] === "" || d[key] == null) { d[key] = null; continue; }
    d[key] = Number(d[key]);
    if (!Number.isInteger(d[key]) || d[key] < 1 || d[key] > (key === "limite_usos" ? 100000 : key === "minimo_pessoas" ? 30 : 100)) throw new Error("Limites inválidos.");
  }
  if (!d.limite_usos) throw new Error("Informe o limite de usos.");
  for (const key of ["valor_beneficio", "preco_combo"]) {
    d[key] = d[key] == null || d[key] === "" ? null : Number(d[key]);
    if (d[key] != null && (!Number.isFinite(d[key]) || d[key] < 0 || d[key] > 99999999.99 || Math.abs(d[key] * 100 - Math.round(d[key] * 100)) > 1e-8)) throw new Error("Valor inválido. Use até duas casas decimais.");
  }
  if (d.tipo_beneficio === "DESCONTO_PERCENTUAL" && (d.valor_beneficio == null || d.valor_beneficio <= 0 || d.valor_beneficio > 100)) throw new Error("O desconto percentual deve ser maior que zero e no máximo 100%.");
  if (d.tipo_beneficio === "DESCONTO_FIXO" && (d.valor_beneficio == null || d.valor_beneficio <= 0)) throw new Error("O desconto fixo deve ser maior que zero.");
  if (d.tipo_beneficio === "COMBO" && d.preco_combo == null) throw new Error("Informe o preço do combo.");
  d.produtos = d.produtos ?? [];
  d.beneficio_itens = d.beneficio_itens ?? [];
  if (!Array.isArray(d.produtos) || d.produtos.length > 100 || d.produtos.some((id) => !Number.isSafeInteger(Number(id)) || Number(id) < 1) || new Set(d.produtos.map(Number)).size !== d.produtos.length) throw new Error("Seleção de produtos inválida.");
  d.produtos = d.produtos.map(Number);
  if (!Array.isArray(d.beneficio_itens) || d.beneficio_itens.length > 20 || d.beneficio_itens.some((item) => !item || !Number.isSafeInteger(Number(item.id_produto)) || Number(item.id_produto) < 1 || !Number.isInteger(Number(item.quantidade)) || Number(item.quantidade) < 1 || Number(item.quantidade) > 100) || new Set(d.beneficio_itens.map((item) => Number(item.id_produto))).size !== d.beneficio_itens.length) throw new Error("Itens do benefício inválidos.");
  d.beneficio_itens = d.beneficio_itens.map((item) => ({ id_produto: Number(item.id_produto), quantidade: Number(item.quantidade) }));
  if (!d.tipo_beneficio.startsWith("DESCONTO_") && d.beneficio_itens.length === 0) throw new Error("Configure ao menos um item do benefício.");
  if (d.imagem_url) {
    let url;
    try { url = new URL(d.imagem_url); } catch { throw new Error("URL da imagem inválida."); }
    const base = String(storageUrl ?? "").replace(/\/$/, "");
    const prefix = `${base}/storage/v1/object/public/imagens-restaurantes/${actor}/cardapio/`;
    let caminho;
    try { caminho = decodeURIComponent(url.pathname); } catch { throw new Error("URL da imagem inválida."); }
    if (!base || url.origin !== new URL(base).origin || !url.href.startsWith(prefix) || caminho.includes("..")) throw new Error("Envie a imagem pela sua conta.");
  }
  return d;
}

function validarPeriodoMetricas(inicio, fim, campanhaCriadaEm, agora = new Date()) {
  const agoraDate = new Date(agora);
  const fimDate = fim == null ? new Date(agoraDate) : new Date(fim);
  const inicioCriacao = new Date(campanhaCriadaEm);
  const inicioMinimo = new Date(agoraDate.getTime() - 366 * 86400000);
  const inicioDate = inicio == null ? new Date(Math.max(inicioCriacao.getTime(), inicioMinimo.getTime())) : new Date(inicio);
  if (!Number.isFinite(inicioDate.getTime()) || !Number.isFinite(fimDate.getTime())) throw new Error("Informe um período válido.");
  if (fimDate < inicioDate) throw new Error("A data final deve ser igual ou posterior à inicial.");
  if (fimDate > agoraDate) throw new Error("A data final não pode estar no futuro.");
  if (fimDate.getTime() - inicioDate.getTime() > 366 * 86400000) throw new Error("O período máximo para consulta é de 366 dias.");
  return { inicio: inicioDate.toISOString(), fim: fimDate.toISOString() };
}

function agruparDemandaElegivel(demanda) {
  const coorteMinima = Math.max(5, Number(demanda?.coorte_minima) || 5);
  const itens = Array.isArray(demanda?.itens) ? demanda.itens : [];
  const grupos = new Map();
  for (const item of itens) {
    const data = new Date(`${item.data}T12:00:00-03:00`);
    if (!Number.isFinite(data.getTime()) || Number(item.clientes_distintos) < coorteMinima || Number(item.demanda_estimada) < coorteMinima) continue;
    const chave = `${data.getDay()}:${item.faixa_horario}`;
    const grupo = grupos.get(chave) ?? { dia_semana: data.getDay(), faixa_horario: item.faixa_horario, refeicoes_planejadas: 0, datas_observadas: new Set() };
    grupo.refeicoes_planejadas += Number(item.demanda_estimada);
    grupo.datas_observadas.add(item.data);
    grupos.set(chave, grupo);
  }
  return [...grupos.values()].map((grupo) => ({ ...grupo, dias_observados: grupo.datas_observadas.size }));
}

function analisarDemandaCampanha(demanda) {
  const coorteMinima = Math.max(5, Number(demanda?.coorte_minima) || 5);
  const grupos = agruparDemandaElegivel(demanda);
  const dias = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const datas = new Set();
  for (const grupo of grupos) for (const data of grupo.datas_observadas) datas.add(data);
  const janelas = grupos.sort((a, b) => b.refeicoes_planejadas - a.refeicoes_planejadas).slice(0, 3).map((grupo) => ({
    dia_semana: dias[grupo.dia_semana], faixa_horario: grupo.faixa_horario,
    refeicoes_planejadas: grupo.refeicoes_planejadas, dias_observados: grupo.dias_observados,
    media_refeicoes_por_dia: Math.round((grupo.refeicoes_planejadas / grupo.dias_observados) * 10) / 10,
  }));
  return {
    disponivel: grupos.length > 0,
    coorte_minima: coorteMinima,
    refeicoes_planejadas: grupos.reduce((total, grupo) => total + grupo.refeicoes_planejadas, 0),
    dias_com_sinais: datas.size,
    janelas_analisadas: grupos.length,
    janelas_recomendadas: janelas,
  };
}

function gerarSugestoesCampanha(demanda, produtos, agora = new Date()) {
  const coorteMinima = Math.max(5, Number(demanda?.coorte_minima) || 5);
  const produto = [...(Array.isArray(produtos) ? produtos : [])].filter((p) => Number.isFinite(Number(p.preco)) && Number(p.preco) > 0).sort((a, b) => Number(a.preco) - Number(b.preco))[0];
  if (!produto) return [];
  const horaPara = (item) => {
    const faixa = String(item.faixa_horario ?? "").toLowerCase();
    return faixa.includes("antes_12") ? 11 : faixa.includes("12h") ? 12 : 14;
  };
  const grupos = agruparDemandaElegivel(demanda);
  const proximoHorario = (diaSemana, hora) => {
    const referencia = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(agora)) + `T${String(hora).padStart(2, "0")}:00:00-03:00`);
    const diferenca = (diaSemana - referencia.getDay() + 7) % 7;
    referencia.setDate(referencia.getDate() + diferenca);
    if (referencia.getTime() < new Date(agora).getTime() + 3600000) referencia.setDate(referencia.getDate() + 7);
    return referencia;
  };
  return [...grupos.values()].sort((a, b) => b.refeicoes_planejadas - a.refeicoes_planejadas).slice(0, 6).map((item) => {
    const hora = horaPara(item);
    const inicio = proximoHorario(item.dia_semana, hora);
    const fim = new Date(inicio.getTime() + 2 * 3600000);
    const formatar = (data) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(data);
    return {
      mensagem: `Sugestão baseada em ${item.refeicoes_planejadas} refeições planejadas em ${item.dias_observados} dia(s) comparáveis, na faixa ${item.faixa_horario}.`,
      metodo: "REGRA_FIXA",
      limitacao: "Amostra agregada de refeições planejadas dos últimos 90 dias, não de vendas confirmadas. Produto de menor preço e desconto de 5% são um exemplo fixo, não uma previsão de resultado; revise funcionamento, margem e condições antes de publicar.",
      amostra: { refeicoes_planejadas: item.refeicoes_planejadas, dias_observados: item.dias_observados, coorte_minima: coorteMinima, faixa_horario: item.faixa_horario },
      rascunho: {
        titulo: `Oferta ${produto.nome ?? "especial"}`, tipo_beneficio: "DESCONTO_PERCENTUAL", valor_beneficio: 5,
        produtos: [Number(produto.id_produto)], inicio_em: `${formatar(inicio)}T${String(hora).padStart(2, "0")}:00:00-03:00`, fim_em: `${formatar(fim)}T${String(hora + 2).padStart(2, "0")}:00:00-03:00`,
        status: "RASCUNHO", limite_usos: 10,
      },
    };
  });
}

function calcularMetricas(eventos = [], resgates = [], pagamentos = []) {
  const byType = new Map();
  for (const type of TIPOS_EVENTO) byType.set(type, { total: 0, unique: new Set(), legacy: false });
  for (const event of eventos) {
    const metric = byType.get(event.tipo);
    if (!metric) continue;
    metric.total += 1;
    if (!event.chave_deduplicacao) metric.legacy = true;
    if (event.id_cliente != null) metric.unique.add(`cliente:${event.id_cliente}`);
  }
  const eventStats = (type) => byType.get(type);
  const pedidosValidos = new Set(resgates.filter((r) => r.status !== "CANCELADO").map((r) => r.id_pedido).filter(Boolean));
  const resgatesComPedido = pedidosValidos.size;
  const pedidos = new Set();
  let valorBrutoAtribuido = 0;
  let valorReembolsado = 0;
  let historicoFinanceiroLimitado = false;
  for (const payment of pagamentos) {
    if (!payment.id_pedido || !pedidosValidos.has(payment.id_pedido) || !["APROVADO", "ESTORNADO"].includes(payment.status_pagamento)) continue;
    const bruto = Math.max(0, Number(payment.valor_pago ?? payment.valor ?? 0) || 0);
    let reembolsado = Math.max(0, Number(payment.valor_reembolsado ?? 0) || 0);
    valorBrutoAtribuido += bruto;
    if (payment.status_pagamento === "ESTORNADO" && !reembolsado) {
      historicoFinanceiroLimitado = true;
      reembolsado = bruto;
    }
    valorReembolsado += reembolsado;
    if (Math.max(0, bruto - reembolsado) > 0) pedidos.add(payment.id_pedido);
  }
  const validos = resgates.filter((r) => r.status !== "CANCELADO");
  const impressao = eventStats("IMPRESSION");
  const clique = eventStats("CLICK");
  const reserva = eventStats("RESERVA_INICIADA");
  const totalDescontos = validos.reduce((sum, r) => sum + Math.max(0, Number(r.valor_beneficio) || 0), 0);
  const receitaLiquidaAtribuida = Math.max(0, valorBrutoAtribuido - valorReembolsado);
  return {
    visualizacoes: impressao.total,
    visualizacoes_unicas: impressao.unique.size,
    cliques: clique.total,
    cliques_unicos: clique.unique.size,
    reservas_iniciadas: reserva.total,
    reservas_iniciadas_unicas: reserva.unique.size,
    resgates_validos: validos.length,
    resgates_cancelados: resgates.length - validos.length,
    resgates_com_pedido: resgatesComPedido,
    beneficios_entregues: resgates.filter((r) => Boolean(r.entregue_em)).length,
    pedidos_pagos: pedidos.size,
    receita_bruta_atribuida: Math.round(valorBrutoAtribuido * 100) / 100,
    reembolsos_atribuidos: Math.round(valorReembolsado * 100) / 100,
    receita_liquida_atribuida: Math.round(receitaLiquidaAtribuida * 100) / 100,
    descontos_registrados: Math.round(totalDescontos * 100) / 100,
    indice_cliques_por_visualizacao: impressao.total ? clique.total / impressao.total : 0,
    indice_reservas_iniciadas_por_clique: clique.total ? reserva.total / clique.total : 0,
    taxa_pedido_pago_por_resgate_com_pedido: resgatesComPedido ? pedidos.size / resgatesComPedido : 0,
    historico_limitado: [...byType.values()].some((m) => m.legacy) || historicoFinanceiroLimitado || resgates.some((r) => r.valor_beneficio == null),
  };
}

module.exports = { TIPOS, TIPOS_EVENTO, validarCampanha, validarPeriodoMetricas, analisarDemandaCampanha, gerarSugestoesCampanha, calcularMetricas };

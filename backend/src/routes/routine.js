"use strict";

const { Router } = require("express");
const { createUserSupabaseClient, supabaseAdmin } = require("../lib/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");
const { gerarPlanejamentoRotina, normalizarDiasSemana, criarCandidatos, horarioCompativel, janelasLivresDia, motivoRecomendacao, semanaAtual, semanaPlanejamento, validarLimitesRotina } = require("../domain/routine-recommendation");
const { notificarCliente, notificarRestaurante } = require("../services/notificacoes");
const paymentConfig = require("../services/pagamentos/config");
const { geocodificarEnderecoRotina } = require("../services/geolocalizacao");
const { registrarSinalComportamental } = require("../domain/routine-behavior-signals");

const rotinaRouter = Router();

rotinaRouter.use(requireAuth, requireRole("cliente"));

const LIMITE_TEXTO_CURTO = 80;
const STATUS_CONVERTIDOS = ["CONVERTIDA_RESERVA", "CONVERTIDA_PEDIDO"];
const CAMPO_RESULTADO_SOMBRA = Object.freeze({
    APROVADA: "aprovado_em",
    RECUSADA: "recusado_em",
    ALTERNATIVA: "alternativa_solicitada_em",
    EDITADA: "editado_em",
    CONVERTIDA_RESERVA: "convertido_reserva_em",
    CONVERTIDA_PEDIDO: "convertido_pedido_em",
    FEEDBACK_POSITIVO: "feedback_positivo_em",
    FEEDBACK_NEGATIVO: "feedback_negativo_em",
});

function avaliacaoSombraAtiva() {
    return ["1", "true", "yes", "on"].includes(String(process.env.APPONO_ROTINA_SHADOW_ENABLED ?? "").toLowerCase());
}

function avisarFalhaSombra(operacao, error) {
    console.warn("ROUTINE_SHADOW_TELEMETRY_FAILED", { operacao, code: error?.code ?? "UNKNOWN" });
}

async function registrarSinalSemBloquear(banco, entrada) {
    try {
        await registrarSinalComportamental(banco, entrada);
    } catch (error) {
        console.warn("ROUTINE_BEHAVIOR_SIGNAL_FAILED", { tipo: entrada.tipoEvento, code: error?.code ?? "UNKNOWN" });
    }
}

async function registrarAvaliacoesSombra(banco, idCliente, planejamento, refeicoes, avaliacoes) {
    if (!avaliacaoSombraAtiva() || !planejamento || !Array.isArray(avaliacoes) || !avaliacoes.length) return;
    const refeicoesPorChave = new Map((refeicoes ?? []).map((item) => [
        `${item.data_refeicao}:${Number(item.id_janela_alimentacao)}`,
        item,
    ]));
    const linhas = avaliacoes.map((item) => {
        const refeicao = refeicoesPorChave.get(`${item.data_refeicao}:${Number(item.id_janela_alimentacao)}`);
        if (!refeicao?.id_refeicao_planejada) return null;
        return {
            id_cliente: idCliente,
            id_planejamento_rotina: planejamento.id_planejamento_rotina,
            id_refeicao_planejada: refeicao.id_refeicao_planejada,
            modelo_controle: item.modelo_controle,
            modelo_desafiante: item.modelo_desafiante,
            id_restaurante_controle: item.id_restaurante_controle,
            id_produto_controle: item.id_produto_controle,
            pontuacao_controle: item.pontuacao_controle,
            id_restaurante_desafiante: item.id_restaurante_desafiante,
            id_produto_desafiante: item.id_produto_desafiante,
            pontuacao_desafiante: item.pontuacao_desafiante,
            confianca_desafiante: item.confianca_desafiante,
            amostras_desafiante: item.amostras_desafiante,
            volume_efetivo_desafiante: item.volume_efetivo_desafiante,
            consistencia_desafiante: item.consistencia_desafiante,
            metadados_desafiante: item.metadados_desafiante ?? {},
            falhou: item.falhou === true,
            erro_codigo_desafiante: item.erro_codigo_desafiante,
            divergiu: item.divergiu,
        };
    }).filter(Boolean);
    if (!linhas.length) return;
    const { error } = await banco.from("avaliacoes_sombra_rotina").upsert(linhas, { onConflict: "id_refeicao_planejada,modelo_desafiante" });
    if (error) throw error;
}

async function registrarResultadoSombra(banco, idCliente, idRefeicao, resultado) {
    const campo = CAMPO_RESULTADO_SOMBRA[resultado];
    if (!avaliacaoSombraAtiva() || !campo) return;
    try {
        const { error } = await banco.from("avaliacoes_sombra_rotina")
            .update({ [campo]: new Date().toISOString() })
            .eq("id_cliente", idCliente)
            .eq("id_refeicao_planejada", idRefeicao);
        if (error) throw error;
    } catch (error) {
        avisarFalhaSombra(resultado, error);
    }
}

async function registrarResultadoPlanejamentoSombra(banco, idCliente, idPlanejamento, resultado) {
    const campo = CAMPO_RESULTADO_SOMBRA[resultado];
    if (!avaliacaoSombraAtiva() || !campo) return;
    try {
        const { error } = await banco.from("avaliacoes_sombra_rotina")
            .update({ [campo]: new Date().toISOString() })
            .eq("id_cliente", idCliente)
            .eq("id_planejamento_rotina", idPlanejamento);
        if (error) throw error;
    } catch (error) {
        avisarFalhaSombra(`PLANEJAMENTO_${resultado}`, error);
    }
}

function bancoRotina(res) {
    if (!supabaseAdmin) {
        res.status(503).json({ error: "SUPABASE_SECRET_KEY precisa estar configurada para usar o Appono Rotina." });
        return null;
    }
    return supabaseAdmin;
}

function textoCurto(valor, fallback = "") {
    const texto = String(valor ?? "").trim();
    return (texto || fallback).slice(0, LIMITE_TEXTO_CURTO);
}

function numeroOpcional(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function horaValida(valor, fallback = null) {
    const texto = String(valor ?? "").trim();
    const partes = texto.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!partes) return fallback;
    const hora = Number(partes[1]);
    const minuto = Number(partes[2]);
    const segundo = Number(partes[3] ?? 0);
    if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59 || segundo < 0 || segundo > 59) return fallback;
    return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:${String(segundo).padStart(2, "0")}`;
}

function dataValida(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor ?? ""))) return false;
    const data = new Date(`${valor}T12:00:00Z`);
    return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

function listaTexto(valor) {
    const lista = Array.isArray(valor) ? valor : String(valor ?? "").split(",");
    return [...new Set(lista.map((item) => textoCurto(item)).filter(Boolean))].slice(0, 20);
}

function listaNumerica(valor) {
    const lista = Array.isArray(valor) ? valor : [];
    return [...new Set(lista.map(Number).filter((item) => Number.isInteger(item) && item > 0))].slice(0, 50);
}

function normalizarPerfilEntrada(body, atual = {}) {
    for (const campo of ["nome", "dias_semana", "tempo_maximo_minutos", "raio_km", "origem_agenda", "eventos_importados", "janelas_disponiveis"]) {
        if (body[campo] === null) throw new Error(`O campo ${campo} não aceita null.`);
    }
    for (const campo of ["horario_inicio", "horario_fim"]) {
        if (body[campo] !== undefined && !horaValida(body[campo])) throw new Error("Informe horários válidos.");
    }
    for (const campo of ["tempo_maximo_minutos", "raio_km", "orcamento_diario", "orcamento_semanal"]) {
        const valor = body[campo];
        if (valor !== undefined && valor !== null && valor !== "" && !Number.isFinite(Number(valor))) throw new Error("Informe valores numéricos válidos.");
    }
    const horarioInicio = horaValida(body.horario_inicio ?? atual.horario_inicio, atual.horario_inicio ?? "11:30:00");
    const horarioFim = horaValida(body.horario_fim ?? atual.horario_fim, atual.horario_fim ?? "14:00:00");
    if (horarioInicio >= horarioFim) {
        throw new Error("A janela de almoço precisa ter início antes do fim.");
    }
    const tempoMaximo = Number(body.tempo_maximo_minutos ?? atual.tempo_maximo_minutos ?? 60);
    const raioKm = Number(body.raio_km ?? atual.raio_km ?? 5);
    validarLimitesRotina({ horario_inicio: horarioInicio, horario_fim: horarioFim, tempo_maximo_minutos: tempoMaximo, raio_km: raioKm,
        dias_semana: body.dias_semana ?? atual.dias_semana ?? normalizarDiasSemana() });
    const latitude = atual.latitude ?? null;
    const longitude = atual.longitude ?? null;
    if (!Number.isInteger(tempoMaximo)) throw new Error("O tempo disponível deve ser informado em minutos inteiros.");
    for (const campo of ["orcamento_diario", "orcamento_semanal"]) {
        if (numeroOpcional(body[campo]) < 0) throw new Error("O orçamento não pode ser negativo.");
    }
    return {
        nome: textoCurto(body.nome ?? atual.nome, "Rotina principal"),
        endereco_base: String((body.endereco_base !== undefined ? body.endereco_base : atual.endereco_base) ?? "").trim().slice(0, 180) || null,
        latitude,
        longitude,
        dias_semana: normalizarDiasSemana(body.dias_semana ?? atual.dias_semana),
        horario_inicio: horarioInicio,
        horario_fim: horarioFim,
        tempo_maximo_minutos: tempoMaximo,
        orcamento_diario: numeroOpcional(body.orcamento_diario !== undefined ? body.orcamento_diario : atual.orcamento_diario),
        orcamento_semanal: numeroOpcional(body.orcamento_semanal !== undefined ? body.orcamento_semanal : atual.orcamento_semanal),
        raio_km: raioKm,
        origem_agenda: ["MANUAL", "GOOGLE", "OUTLOOK"].includes(String(body.origem_agenda ?? atual.origem_agenda ?? "MANUAL").toUpperCase())
            ? String(body.origem_agenda ?? atual.origem_agenda ?? "MANUAL").toUpperCase()
            : "MANUAL",
        eventos_importados: Array.isArray(body.eventos_importados) ? body.eventos_importados.slice(0, 100) : atual.eventos_importados ?? [],
        janelas_disponiveis: Array.isArray(body.janelas_disponiveis) ? body.janelas_disponiveis.slice(0, 100) : atual.janelas_disponiveis ?? [],
        ativo: true,
    };
}

function serializarPerfil(perfil, preferencias = [], restricoes = [], janelas = []) {
    if (!perfil) return null;
    return {
        ...perfil,
        preferencias: preferencias.filter((item) => item.tipo === "PREFERENCIA").map((item) => item.valor).filter(Boolean),
        restaurantes_favoritos_rotina: preferencias.filter((item) => item.tipo === "RESTAURANTE_FAVORITO").map((item) => item.id_restaurante).filter(Boolean),
        pratos_favoritos_rotina: preferencias.filter((item) => item.tipo === "PRATO_FAVORITO").map((item) => item.id_produto).filter(Boolean),
        restricoes: restricoes.filter((item) => item.tipo === "RESTRICAO").map((item) => item.valor),
        alergias: restricoes.filter((item) => item.tipo === "ALERGIA").map((item) => item.valor),
        janelas_alimentacao: janelas,
    };
}

async function buscarPerfilCompleto(banco, idCliente) {
    const { data: perfil, error } = await banco
        .from("perfis_rotina_cliente")
        .select("*, preferencias_rotina_cliente(*), restricoes_rotina_cliente(*), janelas_alimentacao_rotina(*)")
        .eq("id_cliente", idCliente)
        .eq("ativo", true)
        .order("atualizado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw new Error(error.message);
    if (!perfil) return { perfil: null, preferencias: [], restricoes: [], janelas: [] };
    const { preferencias_rotina_cliente, restricoes_rotina_cliente, janelas_alimentacao_rotina, ...campos } = perfil;
    return {
        perfil: campos,
        preferencias: preferencias_rotina_cliente ?? [],
        restricoes: restricoes_rotina_cliente ?? [],
        janelas: (janelas_alimentacao_rotina ?? []).sort((a, b) => a.ordem - b.ordem || a.id_janela_alimentacao - b.id_janela_alimentacao),
    };
}

function versaoEsperada(body, campo) {
    const valor = body?.[campo];
    if (!Number.isSafeInteger(valor) || valor < 0) {
        throw Object.assign(new Error("Não foi possível confirmar a versão atual da rotina."), { status: 409 });
    }
    return valor;
}

function conferirVersao(atual, esperada) {
    if (Number(atual ?? 0) !== esperada) {
        throw Object.assign(new Error("A rotina foi atualizada e precisa ser sincronizada novamente."), { status: 409 });
    }
}

async function mutarRotina(banco, res, body, operacao, entidadeId = null, dados = {}) {
    const { data, error } = await banco.rpc("mutar_rotina", {
        actor_id: res.locals.user.id,
        operacao,
        versao_perfil: versaoEsperada(body, "versao_perfil"),
        versao_planejamento: operacao === "PERFIL" ? null : versaoEsperada(body, "versao_planejamento"),
        entidade_id: entidadeId,
        dados,
    });
    if (error) {
        const mensagem = error.code === "23503" ? "Uma seleção não está mais disponível. Atualize as opções da rotina."
            : ["23514", "23502", "22023", "22P02"].includes(error.code) ? "Revise os campos da rotina: há um valor inválido ou obrigatório ausente."
            : error.message.includes("Gere novas sugestoes") ? "Seu perfil mudou. Gere novas sugestões antes de alterar ou converter este planejamento."
            : error.message.includes("orcamento semanal") ? "O planejamento ultrapassa o orçamento semanal atual. Revise seu limite."
            : error.message;
        throw Object.assign(new Error(mensagem), { status: { PT409: 409, PT404: 404, "42501": 403 }[error.code] ?? 400 });
    }
    return data;
}

async function obterMetricasRestaurantes(banco, idsRestaurantes, idCliente) {
    const ids = [...new Set(idsRestaurantes.filter(Boolean))];
    const metricas = new Map(ids.map((id) => [id, {
        avaliacao_media: null,
        total_avaliacoes: 0,
        total_favoritos: 0,
        favorito_cliente: false,
        score_operacional: 100,
    }]));
    if (!ids.length) return metricas;
    const [avaliacoes, favoritos, meusFavoritos, suporte] = await Promise.all([
        banco.from("avaliacoes_restaurante").select("id_restaurante, nota").in("id_restaurante", ids),
        banco.from("restaurantes_favoritos").select("id_restaurante").in("id_restaurante", ids),
        banco.from("restaurantes_favoritos").select("id_restaurante").eq("id_cliente", idCliente).in("id_restaurante", ids),
        banco.from("chamados_suporte").select("id_restaurante, impacto_reputacao").in("id_restaurante", ids).eq("procedencia", "PROCEDENTE").then((resposta) => resposta).catch(() => ({ data: [] })),
    ]);
    for (const avaliacao of avaliacoes.data ?? []) {
        const metrica = metricas.get(avaliacao.id_restaurante);
        metrica.soma = Number(metrica.soma ?? 0) + Number(avaliacao.nota ?? 0);
        metrica.total_avaliacoes += 1;
    }
    for (const metrica of metricas.values()) {
        if (metrica.total_avaliacoes) metrica.avaliacao_media = Number((metrica.soma / metrica.total_avaliacoes).toFixed(1));
        delete metrica.soma;
    }
    for (const favorito of favoritos.data ?? []) metricas.get(favorito.id_restaurante).total_favoritos += 1;
    for (const favorito of meusFavoritos.data ?? []) metricas.get(favorito.id_restaurante).favorito_cliente = true;
    for (const chamado of suporte.data ?? []) {
        const metrica = metricas.get(chamado.id_restaurante);
        if (!metrica) continue;
        metrica.penalidade_suporte = Number(metrica.penalidade_suporte ?? 0) + Number(chamado.impacto_reputacao ?? 1);
    }
    for (const metrica of metricas.values()) {
        metrica.score_operacional = Math.max(0, Number((100 - Number(metrica.penalidade_suporte ?? 0) * 3).toFixed(1)));
    }
    return metricas;
}

async function carregarRestaurantesParaRotina(banco, idCliente) {
    const [restaurantesResposta, produtosResposta] = await Promise.all([
        banco
            .from("restaurantes")
            .select("id_restaurante, nome, endereco, logo_url, latitude, longitude, valor_minimo_reserva_por_pessoa, configuracao_operacao")
            .eq("ativo", true)
            .order("nome"),
        banco
            .from("produtos")
            .select("id_produto, id_restaurante, nome, descricao, preco, imagem_url, disponivel, arquivado, categorias(nome, descricao, ativo, arquivado, cardapios(nome, descricao, ativo)), seguranca_alimentar_produto(status, versao), alergenos_produto(tipo, alergenos_catalogo(codigo, nome))")
            .eq("disponivel", true)
            .eq("arquivado", false),
    ]);
    if (restaurantesResposta.error) throw new Error(restaurantesResposta.error.message);
    if (produtosResposta.error) throw new Error(produtosResposta.error.message);
    const produtosPorRestaurante = new Map();
    for (const produto of produtosResposta.data ?? []) {
        const lista = produtosPorRestaurante.get(produto.id_restaurante) ?? [];
        lista.push(produto);
        produtosPorRestaurante.set(produto.id_restaurante, lista);
    }
    const ids = (restaurantesResposta.data ?? []).map((restaurante) => restaurante.id_restaurante);
    const metricas = await obterMetricasRestaurantes(banco, ids, idCliente);
    return (restaurantesResposta.data ?? []).map((restaurante) => ({
        ...restaurante,
        ...metricas.get(restaurante.id_restaurante),
        produtos: produtosPorRestaurante.get(restaurante.id_restaurante) ?? [],
    }));
}

async function carregarFeedbacksPersonalizacao(banco, idCliente, restaurantes) {
    const { data, error } = await banco.from("feedback_rotina_cliente")
        .select("id_feedback_rotina,gostou,repetiria,tags,consentiu_personalizacao,criado_em,atualizado_em,refeicoes_planejadas!inner(id_restaurante,id_produto,preco_estimado,distancia_km,metadados)")
        .eq("id_cliente", idCliente)
        .eq("consentiu_personalizacao", true)
        .is("excluido_em", null)
        .order("criado_em", { ascending: false })
        .limit(100);
    if (error) throw error;
    const produtos = new Map((restaurantes ?? []).flatMap((restaurante) =>
        (restaurante.produtos ?? []).map((produto) => [Number(produto.id_produto), produto])));
    const feedbacks = (data ?? []).map((item) => {
        const refeicao = item.refeicoes_planejadas ?? {};
        const produto = produtos.get(Number(refeicao.id_produto));
        return {
            id_sinal: item.id_feedback_rotina,
            tipo_evento: item.gostou ? "FEEDBACK_POSITIVO" : "FEEDBACK_NEGATIVO",
            gostou: item.gostou,
            repetiria: item.repetiria,
            tags: item.tags ?? [],
            consentiu_personalizacao: item.consentiu_personalizacao,
            criado_em: item.criado_em,
            atualizado_em: item.atualizado_em,
            id_restaurante: refeicao.id_restaurante,
            id_produto: refeicao.id_produto,
            categoria: produto?.categorias?.nome ?? null,
            preco_estimado: refeicao.preco_estimado,
            distancia_km: refeicao.distancia_km,
            tipo_janela: refeicao.metadados?.janela?.tipo ?? null,
        };
    });
    const { data: consentimento, error: erroConsentimento } = await banco
        .from("consentimentos_personalizacao_rotina")
        .select("habilitado,concedido_em")
        .eq("id_cliente", idCliente)
        .maybeSingle();
    if (erroConsentimento) {
        avisarFalhaSombra("CARREGAR_CONSENTIMENTO", erroConsentimento);
        return feedbacks;
    }
    if (!consentimento?.habilitado || !consentimento.concedido_em) return feedbacks;
    const { data: sinais, error: erroSinais } = await banco
        .from("sinais_comportamentais_rotina")
        .select("id_sinal_comportamental,tipo_evento,ocorreu_em,id_restaurante,id_produto,id_janela_alimentacao,atributos_escolhidos")
        .eq("id_cliente", idCliente)
        .eq("consentimento_valido", true)
        .gte("ocorreu_em", consentimento.concedido_em)
        .is("excluido_em", null)
        .order("ocorreu_em", { ascending: false })
        .limit(200);
    if (erroSinais) {
        avisarFalhaSombra("CARREGAR_SINAIS", erroSinais);
        return feedbacks;
    }
    return feedbacks.concat((sinais ?? []).map((item) => ({
        id_sinal: `behavior:${item.id_sinal_comportamental}`,
        tipo_evento: item.tipo_evento,
        consentiu_personalizacao: true,
        criado_em: item.ocorreu_em,
        id_restaurante: item.id_restaurante,
        id_produto: item.id_produto,
        categoria: produtos.get(Number(item.id_produto))?.categorias?.nome ?? null,
        tipo_janela: item.atributos_escolhidos?.tipo_janela ?? null,
    })));
}

async function buscarPlanejamentoComRefeicoes(banco, idCliente, filtros = {}) {
    let consulta = banco
        .from("planejamentos_rotina")
        .select("*, refeicoes_planejadas(*, restaurantes(id_restaurante, nome, endereco, logo_url, valor_minimo_reserva_por_pessoa), produtos(id_produto, nome, descricao, preco, imagem_url), reservas(id_reserva, status_reserva, data_reserva, horario_inicio), pedidos(id_pedido, status_pedido, valor_total))")
        .eq("id_cliente", idCliente);
    if (filtros.id_planejamento_rotina) consulta = consulta.eq("id_planejamento_rotina", filtros.id_planejamento_rotina);
    if (filtros.semana_inicio) consulta = consulta.eq("semana_inicio", filtros.semana_inicio);
    if (!filtros.id_planejamento_rotina && !filtros.semana_inicio) {
        consulta = consulta.gte("semana_fim", dataSaoPauloAtual());
    }
    const { data: planejamento, error } = await consulta
        .order("semana_inicio", { ascending: !filtros.id_planejamento_rotina && !filtros.semana_inicio })
        .limit(1)
        .maybeSingle();
    if (error) throw new Error(error.message);
    if (!planejamento) return { planejamento: null, refeicoes: [] };
    const { refeicoes_planejadas: refeicoes, ...campos } = planejamento;
    const refeicoesOrdenadas = (refeicoes ?? []).sort((a, b) => a.data_refeicao.localeCompare(b.data_refeicao));
    const idsRefeicoes = refeicoesOrdenadas.map((item) => item.id_refeicao_planejada).filter(Boolean);
    if (!idsRefeicoes.length) return { planejamento: campos, refeicoes: refeicoesOrdenadas };
    const { data: feedbacks, error: erroFeedback } = await banco
        .from("feedback_rotina_cliente")
        .select("id_feedback_rotina,id_refeicao_planejada,gostou,repetiria,motivo,tags,consentiu_personalizacao,versao_modelo,criado_em,atualizado_em")
        .eq("id_cliente", idCliente)
        .in("id_refeicao_planejada", idsRefeicoes)
        .is("excluido_em", null);
    if (erroFeedback) throw new Error(erroFeedback.message);
    const feedbackPorRefeicao = new Map((feedbacks ?? []).map((item) => [item.id_refeicao_planejada, item]));
    return {
        planejamento: campos,
        refeicoes: refeicoesOrdenadas.map((item) => ({ ...item, feedback_rotina: feedbackPorRefeicao.get(item.id_refeicao_planejada) ?? null })),
    };
}

function dataSaoPauloAtual() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function inicioSemanaAnteriorPermitida() {
    const atual = new Date(`${semanaAtual(new Date()).inicio}T12:00:00Z`);
    atual.setUTCDate(atual.getUTCDate() - 7);
    return atual.toISOString().slice(0, 10);
}

async function obterRefeicaoDoCliente(banco, idCliente, idRefeicao) {
    const { data, error } = await banco
        .from("refeicoes_planejadas")
        .select("*, planejamentos_rotina(id_perfil_rotina, semana_inicio)")
        .eq("id_refeicao_planejada", idRefeicao)
        .eq("id_cliente", idCliente)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
}

async function restaurantePodeReceberPedidoPago(banco, restauranteId) {
    if (!paymentConfig.isRealMarketplace()) return true;
    const { data, error } = await banco
        .from("mercado_pago_conexoes_restaurante")
        .select("id_conexao")
        .eq("id_restaurante", restauranteId)
        .eq("status", "CONECTADO")
        .not("access_token_cifrado", "is", null)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data);
}

function mapearErroConversao(mensagem) {
    if (mensagem.includes("Gere novas sugestoes")) return "Seu perfil mudou. Gere novas sugestões antes de converter esta refeição.";
    if (mensagem.includes("mesa")) return "Não há mesa disponível para o horário sugerido.";
    if (mensagem.includes("funcionamento")) return "O horário sugerido está fora do funcionamento do restaurante.";
    if (mensagem.includes("anteced")) return "O horário sugerido não respeita a antecedência mínima do restaurante.";
    if (mensagem.includes("consumo minimo") || mensagem.includes("consumo mínimo")) return "O pedido não atingiu o consumo mínimo da reserva.";
    if (mensagem.includes("indispon")) return "Um item sugerido ficou indisponível no cardápio.";
    return mensagem;
}

rotinaRouter.get("/perfil", async (_req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    try {
        const dados = await buscarPerfilCompleto(banco, res.locals.profileId);
        return res.json(serializarPerfil(dados.perfil, dados.preferencias, dados.restricoes, dados.janelas));
    } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível carregar a rotina." });
    }
});

rotinaRouter.get("/catalogo", async (_req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    try {
        const restaurantes = await carregarRestaurantesParaRotina(banco, res.locals.profileId);
        return res.json(restaurantes.map((item) => ({
            id_restaurante: item.id_restaurante, nome: item.nome, favorito_cliente: item.favorito_cliente,
            produtos: item.produtos.filter((produto) => produto.categorias?.ativo !== false && produto.categorias?.arquivado !== true && produto.categorias?.cardapios?.ativo !== false)
                .map((produto) => ({ id_produto: produto.id_produto, nome: produto.nome })),
        })));
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

async function salvarPerfil(req, res) {
    const banco = bancoRotina(res);
    if (!banco) return;
    try {
        const completoAtual = await buscarPerfilCompleto(banco, res.locals.profileId);
        const atual = completoAtual.perfil;
        conferirVersao(atual?.versao, versaoEsperada(req.body, "versao_perfil"));
        const dados = normalizarPerfilEntrada(req.body ?? {}, atual ?? {});
        const enderecoMudou = dados.endereco_base !== (atual?.endereco_base ?? null);
        const precisaGeocodificar = enderecoMudou || dados.latitude === null || dados.longitude === null;
        if (precisaGeocodificar) {
            if (!dados.endereco_base) {
                return res.status(422).json({ code: "ROUTINE_ADDRESS_REQUIRED", error: "Informe seu endereço-base para calcular restaurantes próximos." });
            }
            const candidatos = await geocodificarEnderecoRotina(dados.endereco_base);
            const selecionado = candidatos.find((item) => item.place_id === String(req.body?.geocodificacao_selecionada ?? ""));
            if (candidatos.length > 1 && !selecionado) {
                return res.status(422).json({ code: "ROUTINE_ADDRESS_AMBIGUOUS", error: "Escolha o endereço correspondente para continuar.", candidatos: candidatos.map(({ place_id, nome }) => ({ place_id, nome })) });
            }
            const local = selecionado ?? candidatos[0];
            if (!local) return res.status(422).json({ code: "ROUTINE_ADDRESS_NOT_FOUND", error: "Não foi possível localizar esse endereço. Revise os dados e tente novamente." });
            Object.assign(dados, { latitude: local.latitude, longitude: local.longitude, endereco_normalizado: local.nome, status_geocodificacao: "CONFIRMADO", geocodificado_em: new Date().toISOString() });
        }
        for (const campo of ["preferencias", "restricoes", "alergias", "restaurantes_favoritos_rotina", "pratos_favoritos_rotina"]) {
            if (req.body[campo] === undefined) continue;
            if (!Array.isArray(req.body[campo])) throw new Error("As seleções devem ser listas. Use uma lista vazia para remover.");
            dados[campo] = campo.endsWith("_rotina") ? listaNumerica(req.body[campo]) : listaTexto(req.body[campo]);
        }
        if (req.body?.janelas_alimentacao !== undefined && !Array.isArray(req.body.janelas_alimentacao)) {
            throw new Error("As janelas alimentares devem ser uma lista.");
        }
        const janelas = Array.isArray(req.body?.janelas_alimentacao) ? req.body.janelas_alimentacao : null;
        let completo;
        if (janelas) {
            const { data, error } = await banco.rpc("salvar_rotina_com_janelas", {
                p_actor: res.locals.user.id,
                p_versao_perfil: versaoEsperada(req.body, "versao_perfil"),
                p_dados: dados,
                p_janelas: janelas,
            });
            if (error) {
                const status = { PT409: 409, PT404: 404, "42501": 403 }[error.code] ?? 400;
                throw Object.assign(new Error(error.message), { status, code: error.code });
            }
            completo = data;
        } else {
            completo = await mutarRotina(banco, res, req.body, "PERFIL", null, dados);
        }
        return res.status(atual ? 200 : 201).json(serializarPerfil(completo.perfil, completo.preferencias, completo.restricoes, completo.janelas_alimentacao));
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error instanceof Error ? error.message : "Não foi possível salvar a rotina." });
    }
}

rotinaRouter.post("/perfil", salvarPerfil);
rotinaRouter.patch("/perfil", salvarPerfil);

rotinaRouter.get("/consentimento-personalizacao", async (_req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    try {
        const { data, error } = await banco.from("consentimentos_personalizacao_rotina")
            .select("habilitado,versao_texto,origem,concedido_em,revogado_em,versao,atualizado_em")
            .eq("id_cliente", res.locals.profileId)
            .maybeSingle();
        if (error) throw error;
        return res.json({ consentimento: data ?? { habilitado: false, versao_texto: "rotina-personalizacao-v1" } });
    } catch (error) {
        return res.status(400).json({ code: "ROUTINE_CONSENT_READ_FAILED", error: error.message });
    }
});

rotinaRouter.put("/consentimento-personalizacao", async (req, res) => {
    if (typeof req.body?.habilitado !== "boolean") {
        return res.status(400).json({ code: "ROUTINE_CONSENT_INVALID", error: "Informe se deseja ativar a personalizacao." });
    }
    try {
        const supabaseUsuario = createUserSupabaseClient(res.locals.accessToken);
        const { data, error } = await supabaseUsuario.rpc("alterar_consentimento_personalizacao_rotina", {
            p_habilitado: req.body.habilitado,
            p_versao_texto: "rotina-personalizacao-v1",
            p_origem: "CONFIGURACOES",
        });
        if (error) throw error;
        return res.json({ consentimento: data });
    } catch (error) {
        const status = error.code === "PT401" ? 401 : 422;
        return res.status(status).json({ code: "ROUTINE_CONSENT_UPDATE_FAILED", error: error.message });
    }
});

rotinaRouter.get("/planejamento", async (req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    try {
        const semanaInicio = dataValida(req.query.semana_inicio) ? String(req.query.semana_inicio) : null;
        if (semanaInicio && semanaInicio < inicioSemanaAnteriorPermitida()) {
            return res.status(422).json({
                code: "ROUTINE_WEEK_OUT_OF_HISTORY_RANGE",
                error: "Você pode consultar somente a semana atual, a próxima e a semana imediatamente anterior.",
            });
        }
        const resposta = await buscarPlanejamentoComRefeicoes(banco, res.locals.profileId, semanaInicio ? { semana_inicio: semanaInicio } : {});
        return res.json(resposta);
    } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível carregar o planejamento." });
    }
});

rotinaRouter.post("/planejamento/gerar", async (req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    try {
        const dadosPerfil = await buscarPerfilCompleto(banco, res.locals.profileId);
        if (!dadosPerfil.perfil) {
            return res.status(404).json({ error: "Configure sua rotina antes de gerar o planejamento." });
        }
        conferirVersao(dadosPerfil.perfil.versao, versaoEsperada(req.body, "versao_perfil"));
        validarLimitesRotina(dadosPerfil.perfil);
        const semanaInicio = req.body?.semana_inicio || semanaPlanejamento(new Date(), dadosPerfil.perfil.dias_semana, dadosPerfil.perfil.horario_fim).inicio;
        if (semanaInicio && !dataValida(semanaInicio)) {
            return res.status(400).json({ error: "Semana inicial inválida." });
        }
        if (new Date(`${semanaInicio}T12:00:00Z`).getUTCDay() !== 1) return res.status(400).json({ error: "A semana deve começar na segunda-feira." });
        if (semanaInicio < semanaAtual(new Date()).inicio) {
            return res.status(422).json({
                code: "ROUTINE_PAST_WEEK_NOT_ALLOWED",
                error: "Semanas anteriores ficam disponíveis somente para consulta e não podem ser geradas novamente.",
            });
        }
        if (dadosPerfil.perfil.latitude === null || dadosPerfil.perfil.longitude === null) return res.status(400).json({ error: "Defina a localização da rotina antes de gerar sugestões por distância." });
        const anterior = await buscarPlanejamentoComRefeicoes(banco, res.locals.profileId, { semana_inicio: semanaInicio });
        const versaoExibida = versaoEsperada(req.body, "versao_planejamento");
        const versaoAlvo = req.body.semana_base && req.body.semana_base !== semanaInicio ? 0 : versaoExibida;
        conferirVersao(anterior.planejamento?.versao, versaoAlvo);
        const restaurantes = await carregarRestaurantesParaRotina(banco, res.locals.profileId);
        const favoritosPerfil = dadosPerfil.preferencias
            .filter((item) => item.tipo === "RESTAURANTE_FAVORITO")
            .map((item) => item.id_restaurante);
        const pratosFavoritos = dadosPerfil.preferencias
            .filter((item) => item.tipo === "PRATO_FAVORITO")
            .map((item) => item.id_produto);
        const preferencias = dadosPerfil.preferencias
            .filter((item) => item.tipo === "PREFERENCIA")
            .map((item) => item.valor);
        const restricoes = dadosPerfil.restricoes.filter((item) => item.tipo === "RESTRICAO").map((item) => item.valor);
        const semanaFim = new Date(`${semanaInicio}T23:59:59-03:00`);
        semanaFim.setDate(semanaFim.getDate() + 6);
        const { data: janelasOcupadas, error: erroAgenda } = await banco.from("janelas_ocupadas_rotina")
            .select("inicio_em,fim_em")
            .eq("id_cliente", res.locals.profileId)
            .lt("inicio_em", semanaFim.toISOString())
            .gt("fim_em", new Date(`${semanaInicio}T00:00:00-03:00`).toISOString());
        if (erroAgenda) throw erroAgenda;
        const inicioHistorico = new Date(`${semanaInicio}T00:00:00-03:00`);
        inicioHistorico.setDate(inicioHistorico.getDate() - 60);
        const { data: historicoRecente, error: erroHistorico } = await banco.from("refeicoes_planejadas")
            .select("id_restaurante,id_produto,data_refeicao")
            .eq("id_cliente", res.locals.profileId)
            .in("status", STATUS_CONVERTIDOS)
            .gte("data_refeicao", inicioHistorico.toISOString().slice(0, 10))
            .lt("data_refeicao", semanaInicio)
            .order("data_refeicao", { ascending: false }).limit(100);
        if (erroHistorico) throw erroHistorico;
        const feedbacksParaRanking = await carregarFeedbacksPersonalizacao(banco, res.locals.profileId, restaurantes);
        const planejamentoGerado = gerarPlanejamentoRotina({
            perfil: dadosPerfil.perfil,
            janelasAlimentacao: dadosPerfil.janelas,
            restaurantes,
            preferencias,
            restricoes,
            alergias: dadosPerfil.restricoes.filter((item) => item.tipo === "ALERGIA").map((item) => item.valor),
            refeicoesExistentes: anterior.refeicoes.filter((item) => STATUS_CONVERTIDOS.includes(item.status)),
            favoritosRestaurantes: favoritosPerfil,
            pratosFavoritos,
            semanaInicio: semanaInicio || undefined,
            janelasOcupadas: janelasOcupadas ?? [],
            historicoRecente: historicoRecente ?? [],
            feedbacks: feedbacksParaRanking,
        });
        await mutarRotina(banco, res, { ...req.body, versao_planejamento: versaoAlvo }, "GERAR", null, planejamentoGerado);
        const respostaPersistida = await buscarPlanejamentoComRefeicoes(banco, res.locals.profileId, { semana_inicio: semanaInicio });
        if (!respostaPersistida.planejamento) throw new Error("Não foi possível confirmar o planejamento recém-gerado.");
        try {
            await registrarAvaliacoesSombra(banco, res.locals.profileId, respostaPersistida.planejamento, respostaPersistida.refeicoes, planejamentoGerado.avaliacoes_sombra);
        } catch (error) {
            avisarFalhaSombra("GERAR", error);
        }
        return res.status(201).json(respostaPersistida);
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error instanceof Error ? error.message : "Não foi possível gerar o planejamento." });
    }
});

rotinaRouter.post("/planejamento/:id/aprovar", async (req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    const idPlanejamento = Number(req.params.id);
    if (!Number.isInteger(idPlanejamento) || idPlanejamento <= 0) {
        return res.status(400).json({ error: "Planejamento inválido." });
    }
    try {
        const data = await mutarRotina(banco, res, req.body, "APROVAR_PLANO", idPlanejamento);
        await registrarResultadoPlanejamentoSombra(banco, res.locals.profileId, idPlanejamento, "APROVADA");
        return res.json(data);
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error instanceof Error ? error.message : "Não foi possível aprovar o planejamento." });
    }
});

async function opcoesDaRefeicao(banco, idCliente, refeicao, horario = null, versoes = null) {
    const dados = await buscarPerfilCompleto(banco, idCliente);
    if (!dados.perfil) throw new Error("Configure sua rotina antes de alterar a refeição.");
    const perfil = serializarPerfil(dados.perfil, dados.preferencias, dados.restricoes);
    const semana = await buscarPlanejamentoComRefeicoes(banco, idCliente, { id_planejamento_rotina: refeicao.id_planejamento_rotina });
    if (versoes) {
        conferirVersao(dados.perfil.versao, versaoEsperada(versoes, "versao_perfil"));
        conferirVersao(semana.planejamento?.versao, versaoEsperada(versoes, "versao_planejamento"));
    }
    const gasto = semana.refeicoes.filter((item) => item.id_refeicao_planejada !== refeicao.id_refeicao_planejada && !["RECUSADA", "CANCELADA"].includes(item.status))
        .reduce((total, item) => total + Number(item.preco_estimado ?? 0), 0);
    const saldo = perfil.orcamento_semanal === null ? Infinity : Number(perfil.orcamento_semanal) - gasto;
    const { data: ocupadas, error: erroAgenda } = await banco.from("janelas_ocupadas_rotina").select("inicio_em,fim_em")
        .eq("id_cliente", idCliente)
        .lt("inicio_em", new Date(`${refeicao.data_refeicao}T23:59:59-03:00`).toISOString())
        .gt("fim_em", new Date(`${refeicao.data_refeicao}T00:00:00-03:00`).toISOString());
    if (erroAgenda) throw erroAgenda;
    const janelasLivres = janelasLivresDia(perfil, refeicao.data_refeicao, ocupadas ?? []);
    const restaurantes = await carregarRestaurantesParaRotina(banco, idCliente);
    const feedbacks = await carregarFeedbacksPersonalizacao(banco, idCliente, restaurantes);
    const janelaAtual = perfil.janelas_alimentacao?.find((item) => Number(item.id_janela_alimentacao) === Number(refeicao.id_janela_alimentacao));
    const opcoes = criarCandidatos({
        perfil: { ...perfil, tipo_janela: janelaAtual?.tipo ?? null }, restaurantes,
        preferencias: perfil.preferencias, restricoes: perfil.restricoes, alergias: perfil.alergias,
        favoritosRestaurantes: new Set(perfil.restaurantes_favoritos_rotina.map(Number)),
        pratosFavoritos: new Set(perfil.pratos_favoritos_rotina.map(Number)),
        feedbacks,
    }).filter((item) => item.preco_estimado <= saldo).flatMap((item) => {
        const janela = janelasLivres.map((livre) => horarioCompativel(item, { ...perfil, ...livre }, refeicao.data_refeicao, new Date(), horario)).find(Boolean);
        return janela ? [{
            id_restaurante: item.restaurante.id_restaurante, restaurante: item.restaurante.nome,
            id_produto: item.produto?.id_produto ?? null, prato: item.produto?.nome ?? null,
            preco_estimado: item.preco_estimado, distancia_km: item.distancia_km,
            pontuacao: item.pontuacao, motivo_recomendacao: motivoRecomendacao(item),
            metadados: { pesos: item.pesos, modelo_recomendacao: "deterministico-v3" }, ...janela,
        }] : [];
    });
    const referencia = opcoes[0];
    return opcoes.map((item) => ({ ...item, comparacao: referencia ? {
        diferenca_preco: Number((item.preco_estimado - referencia.preco_estimado).toFixed(2)),
        diferenca_distancia_km: item.distancia_km === null || referencia.distancia_km === null ? null : Number((item.distancia_km - referencia.distancia_km).toFixed(2)),
        diferenca_aderencia: Number((item.pontuacao - referencia.pontuacao).toFixed(2)),
    } : null }));
}

rotinaRouter.get("/refeicoes/:id/opcoes", async (req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    try {
        const refeicao = await obterRefeicaoDoCliente(banco, res.locals.profileId, Number(req.params.id));
        if (!refeicao) return res.status(404).json({ error: "Refeição não encontrada." });
        return res.json(await opcoesDaRefeicao(banco, res.locals.profileId, refeicao));
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

rotinaRouter.patch("/refeicoes/:id", async (req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    const idRefeicao = Number(req.params.id);
    if (!Number.isInteger(idRefeicao) || idRefeicao <= 0) {
        return res.status(400).json({ error: "Refeição inválida." });
    }
    try {
        const refeicao = await obterRefeicaoDoCliente(banco, res.locals.profileId, idRefeicao);
        if (!refeicao) return res.status(404).json({ error: "Refeição não encontrada." });
        if (STATUS_CONVERTIDOS.includes(refeicao.status)) {
            return res.status(409).json({ error: "Esta refeição já foi convertida." });
        }
        const horario = req.body?.horario_sugerido !== undefined ? horaValida(req.body.horario_sugerido) : null;
        if (req.body?.horario_sugerido !== undefined && !horario) {
            return res.status(400).json({ error: "Horário inválido." });
        }
        const opcoes = await opcoesDaRefeicao(banco, res.locals.profileId, refeicao, horario ?? refeicao.horario_sugerido, req.body);
        const escolhido = opcoes.find((item) => Number(item.id_restaurante) === Number(req.body?.id_restaurante ?? refeicao.id_restaurante)
            && Number(item.id_produto) === Number(req.body?.id_produto !== undefined ? req.body.id_produto : refeicao.id_produto));
        if (!escolhido) return res.status(409).json({ error: "A opção não atende ao horário, orçamento, distância ou restrições da rotina. Consulte as alternativas disponíveis." });
        const { restaurante: _nomeRestaurante, prato: _nomePrato, ...campos } = escolhido;
        const atualizacao = { ...campos, status: "ALTERADA", motivo_recomendacao: "Ajustado por você dentro dos critérios da rotina." };
        const data = await mutarRotina(banco, res, req.body, "EDITAR", idRefeicao, atualizacao);
        await registrarResultadoSombra(banco, res.locals.profileId, idRefeicao, "EDITADA");
        await registrarSinalSemBloquear(banco, {
            idCliente: res.locals.profileId,
            tipoEvento: "EDICAO",
            refeicao: data.refeicao,
            atributos: {
                restaurante_alterado: Number(refeicao.id_restaurante) !== Number(data.refeicao?.id_restaurante),
                produto_alterado: Number(refeicao.id_produto) !== Number(data.refeicao?.id_produto),
                horario_alterado: String(refeicao.horario_sugerido) !== String(data.refeicao?.horario_sugerido),
                tipo_janela: refeicao.metadados?.janela?.tipo ?? null,
            },
        });
        return res.json(data.refeicao);
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error instanceof Error ? error.message : "Não foi possível alterar a refeição." });
    }
});

rotinaRouter.post("/refeicoes/:id/outra-sugestao", async (req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    const idRefeicao = Number(req.params.id);
    try {
        const refeicao = await obterRefeicaoDoCliente(banco, res.locals.profileId, idRefeicao);
        if (!refeicao) return res.status(404).json({ code: "ROUTINE_MEAL_NOT_FOUND", error: "Refeição não encontrada." });
        if (STATUS_CONVERTIDOS.includes(refeicao.status)) return res.status(409).json({ code: "ROUTINE_MEAL_ALREADY_CONVERTED", error: "Esta refeição já foi convertida." });
        const opcoes = await opcoesDaRefeicao(banco, res.locals.profileId, refeicao, null, req.body);
        const alternativa = opcoes.find((item) => Number(item.id_restaurante) !== Number(refeicao.id_restaurante)
            || Number(item.id_produto) !== Number(refeicao.id_produto));
        if (!alternativa) return res.status(409).json({ code: "ROUTINE_NO_ALTERNATIVE", error: "Não há outra sugestão compatível para este dia." });
        const { restaurante: _restaurante, prato: _prato, comparacao: _comparacao, ...dados } = alternativa;
        const resultado = await mutarRotina(banco, res, req.body, "EDITAR", idRefeicao, { ...dados, status: "ALTERADA" });
        await registrarResultadoSombra(banco, res.locals.profileId, idRefeicao, "ALTERNATIVA");
        await registrarSinalSemBloquear(banco, {
            idCliente: res.locals.profileId,
            tipoEvento: "ALTERNATIVA",
            refeicao,
            atributos: { tipo_janela: refeicao.metadados?.janela?.tipo ?? null },
        });
        return res.json(resultado.refeicao);
    } catch (error) {
        return res.status(error.status ?? 400).json({ code: error.code ?? "ROUTINE_ALTERNATIVE_FAILED", error: error.message });
    }
});

rotinaRouter.post("/refeicoes/:id/aprovar", async (req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    try {
        const data = await mutarRotina(banco, res, req.body, "APROVAR", Number(req.params.id));
        await registrarResultadoSombra(banco, res.locals.profileId, Number(req.params.id), "APROVADA");
        await registrarSinalSemBloquear(banco, {
            idCliente: res.locals.profileId,
            tipoEvento: "APROVACAO",
            refeicao: data.refeicao,
            atributos: { tipo_janela: data.refeicao?.metadados?.janela?.tipo ?? null },
        });
        return res.json(data.refeicao);
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error instanceof Error ? error.message : "Não foi possível aprovar a refeição." });
    }
});

function validarFeedbackEntrada(body = {}) {
    if (typeof body.gostou !== "boolean") {
        throw Object.assign(new Error("Informe se a sugestão foi útil."), { status: 400 });
    }
    if (body.repetiria !== undefined && body.repetiria !== null && typeof body.repetiria !== "boolean") {
        throw Object.assign(new Error("Informe se você repetiria a sugestão."), { status: 400 });
    }
    const motivo = body.motivo === undefined || body.motivo === null ? null : String(body.motivo).trim();
    if (motivo && (motivo.length < 2 || motivo.length > 500)) {
        throw Object.assign(new Error("O comentário deve ter entre 2 e 500 caracteres."), { status: 422 });
    }
    const tags = Array.isArray(body.tags) ? [...new Set(body.tags.map((item) => textoCurto(item)).filter(Boolean))].slice(0, 8) : [];
    if (Array.isArray(body.tags) && tags.length !== body.tags.length) {
        throw Object.assign(new Error("Revise as tags do feedback."), { status: 422 });
    }
    return {
        gostou: body.gostou,
        repetiria: body.repetiria ?? null,
        motivo: motivo || null,
        tags,
        consentiu_personalizacao: body.consentiu_personalizacao === true,
    };
}

rotinaRouter.post("/refeicoes/:id/feedback", async (req, res) => {
    const idRefeicao = Number(req.params.id);
    if (!Number.isInteger(idRefeicao) || idRefeicao <= 0) return res.status(400).json({ code: "ROUTINE_MEAL_INVALID", error: "Refeição inválida." });
    try {
        const entrada = validarFeedbackEntrada(req.body);
        const supabaseUsuario = createUserSupabaseClient(res.locals.accessToken);
        const { data, error } = await supabaseUsuario.rpc("registrar_feedback_rotina", {
            p_id_refeicao: idRefeicao,
            p_gostou: entrada.gostou,
            p_repetiria: entrada.repetiria,
            p_motivo: entrada.motivo,
            p_tags: entrada.tags,
            p_consentiu: entrada.consentiu_personalizacao,
        });
        if (error) {
            const status = error.code === "PT404" ? 404 : error.code === "PT409" ? 409 : error.code === "PT401" ? 401 : 422;
            return res.status(status).json({ code: "ROUTINE_FEEDBACK_REJECTED", error: error.message });
        }
        await registrarResultadoSombra(supabaseAdmin, res.locals.profileId, idRefeicao, entrada.gostou ? "FEEDBACK_POSITIVO" : "FEEDBACK_NEGATIVO");
        return res.status(201).json({ feedback: data });
    } catch (error) {
        return res.status(error.status ?? 400).json({ code: "ROUTINE_FEEDBACK_INVALID", error: error instanceof Error ? error.message : "Não foi possível registrar o feedback." });
    }
});

rotinaRouter.delete("/refeicoes/:id/feedback", async (req, res) => {
    const idRefeicao = Number(req.params.id);
    if (!Number.isInteger(idRefeicao) || idRefeicao <= 0) return res.status(400).json({ code: "ROUTINE_MEAL_INVALID", error: "Refeição inválida." });
    try {
        const supabaseUsuario = createUserSupabaseClient(res.locals.accessToken);
        const { error } = await supabaseUsuario.rpc("excluir_feedback_rotina", { p_id_refeicao: idRefeicao });
        if (error) {
            const status = error.code === "PT404" ? 404 : error.code === "PT401" ? 401 : 400;
            return res.status(status).json({ code: "ROUTINE_FEEDBACK_DELETE_FAILED", error: error.message });
        }
        return res.status(204).end();
    } catch (error) {
        return res.status(400).json({ code: "ROUTINE_FEEDBACK_DELETE_FAILED", error: error instanceof Error ? error.message : "Não foi possível excluir o feedback." });
    }
});

rotinaRouter.post("/refeicoes/:id/recusar", async (req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    try {
        const data = await mutarRotina(banco, res, req.body, "RECUSAR", Number(req.params.id));
        await registrarResultadoSombra(banco, res.locals.profileId, Number(req.params.id), "RECUSADA");
        await registrarSinalSemBloquear(banco, {
            idCliente: res.locals.profileId,
            tipoEvento: "RECUSA",
            refeicao: data.refeicao,
            atributos: { tipo_janela: data.refeicao?.metadados?.janela?.tipo ?? null },
        });
        return res.json(data.refeicao);
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error instanceof Error ? error.message : "Não foi possível recusar a refeição." });
    }
});

rotinaRouter.post("/refeicoes/:id/converter-reserva", async (req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    const idRefeicao = Number(req.params.id);
    try {
        const refeicao = await obterRefeicaoDoCliente(banco, res.locals.profileId, idRefeicao);
        if (!refeicao) return res.status(404).json({ error: "Refeição não encontrada." });
        if (!refeicao.id_restaurante) return res.status(409).json({ error: "Esta refeição não possui restaurante sugerido." });
        if (STATUS_CONVERTIDOS.includes(refeicao.status)) return res.status(409).json({ error: "Esta refeição já foi convertida." });
        const supabaseUsuario = createUserSupabaseClient(res.locals.accessToken);
        const { data: conversao, error } = await supabaseUsuario.rpc("converter_refeicao_rotina", {
            refeicao_id: idRefeicao, com_pedido: false,
            versao_perfil: versaoEsperada(req.body, "versao_perfil"),
            versao_planejamento: versaoEsperada(req.body, "versao_planejamento"),
        });
        if (error) return res.status(409).json({ error: mapearErroConversao(error.message) });
        const reservaConfirmada = conversao.reserva;
        const refeicaoAtualizada = conversao.refeicao;
        await registrarResultadoSombra(banco, res.locals.profileId, idRefeicao, "CONVERTIDA_RESERVA");
        await registrarSinalSemBloquear(banco, {
            idCliente: res.locals.profileId,
            tipoEvento: "CONVERSAO_RESERVA",
            refeicao: refeicaoAtualizada,
            origem: "CONVERSAO_API",
            atributos: { tipo_janela: refeicaoAtualizada?.metadados?.janela?.tipo ?? null },
        });
        await Promise.allSettled([
            notificarCliente(res.locals.profileId, {
                titulo: "Reserva criada pela rotina",
                mensagem: "Sua sugestão da rotina virou uma reserva confirmada.",
                tipo_evento: "RESERVA_CONFIRMADA",
                link_destino: "/cliente/reservas",
                dados: { id_reserva: reservaConfirmada.id_reserva, id_refeicao_planejada: idRefeicao },
            }),
            notificarRestaurante(reservaConfirmada.id_restaurante, {
                titulo: "Nova reserva recebida",
                mensagem: "Uma reserva foi criada pelo Appono Rotina.",
                tipo_evento: "NOVA_RESERVA",
                link_destino: "/restaurante/reservas",
                dados: { id_reserva: reservaConfirmada.id_reserva },
            }),
        ]);
        return res.status(201).json({ refeicao: refeicaoAtualizada, reserva: reservaConfirmada });
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error instanceof Error ? error.message : "Não foi possível converter em reserva." });
    }
});

rotinaRouter.post("/refeicoes/:id/converter-pedido", async (req, res) => {
    const banco = bancoRotina(res);
    if (!banco) return;
    const idRefeicao = Number(req.params.id);
    try {
        const refeicao = await obterRefeicaoDoCliente(banco, res.locals.profileId, idRefeicao);
        if (!refeicao) return res.status(404).json({ error: "Refeição não encontrada." });
        if (!refeicao.id_restaurante || !refeicao.id_produto) return res.status(409).json({ error: "Esta refeição precisa de restaurante e item do cardápio." });
        if (STATUS_CONVERTIDOS.includes(refeicao.status)) return res.status(409).json({ error: "Esta refeição já foi convertida." });
        if (!(await restaurantePodeReceberPedidoPago(banco, refeicao.id_restaurante))) {
            return res.status(409).json({ error: "Este restaurante ainda não conectou uma conta Mercado Pago para receber pedidos antecipados." });
        }
        const supabaseUsuario = createUserSupabaseClient(res.locals.accessToken);
        const { data, error } = await supabaseUsuario.rpc("converter_refeicao_rotina", {
            refeicao_id: idRefeicao, com_pedido: true,
            versao_perfil: versaoEsperada(req.body, "versao_perfil"),
            versao_planejamento: versaoEsperada(req.body, "versao_planejamento"),
        });
        if (error) return res.status(409).json({ error: mapearErroConversao(error.message) });
        const reservaCriada = data?.reserva;
        const pedidoCriado = data?.pedido;
        if (!reservaCriada?.id_reserva || !pedidoCriado?.id_pedido) {
            return res.status(400).json({ error: "A reserva e o pedido foram processados, mas a resposta veio incompleta." });
        }
        const refeicaoAtualizada = data.refeicao;
        await registrarResultadoSombra(banco, res.locals.profileId, idRefeicao, "CONVERTIDA_PEDIDO");
        await registrarSinalSemBloquear(banco, {
            idCliente: res.locals.profileId,
            tipoEvento: "CONVERSAO_PEDIDO",
            refeicao: refeicaoAtualizada,
            origem: "CONVERSAO_API",
            atributos: { tipo_janela: refeicaoAtualizada?.metadados?.janela?.tipo ?? null },
        });
        await Promise.allSettled([
            notificarCliente(res.locals.profileId, {
                titulo: "Pedido da rotina criado",
                mensagem: "Sua refeição planejada virou reserva com pedido antecipado. Falta concluir o pagamento.",
                tipo_evento: "PEDIDO_CRIADO",
                link_destino: `/cliente/pagamentos/pedido/${pedidoCriado.id_pedido}`,
                dados: { id_reserva: reservaCriada.id_reserva, id_pedido: pedidoCriado.id_pedido, id_refeicao_planejada: idRefeicao },
            }),
        ]);
        return res.status(201).json({
            refeicao: refeicaoAtualizada,
            reserva: reservaCriada,
            pedido: pedidoCriado,
            checkout_href: `/cliente/pagamentos/pedido/${pedidoCriado.id_pedido}`,
        });
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error instanceof Error ? error.message : "Não foi possível converter em pedido." });
    }
});

module.exports = { rotinaRouter };

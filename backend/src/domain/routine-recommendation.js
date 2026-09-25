"use strict";

const { MODELO_RECOMENDACAO_ROTINA, impactoFeedback, penalidadeRepeticao, pontuarCandidato } = require("./routine-scoring");
const { MODELO_INTELIGENCIA_ROTINA, pontuarInteligenciaRotina } = require("./routine-intelligence");
const { MODELO_INTELIGENCIA_ROTINA_V2, pontuarInteligenciaRotinaV2 } = require("./routine-intelligence-v2");
const { compararRankingSombra, ordenarPorPontuacao } = require("./routine-shadow-evaluation");
const { decidirCandidatoInteligencia } = require("./routine-intelligence-policy");
const { criarDiagnosticoOperacional } = require("./routine-intelligence-operational");
const { criarDiagnosticoV2_1, decidirCandidatoV2_1Titular, selecionarCandidatoV2_1 } = require("./routine-intelligence-v2-1-titular");

const DIAS_SEMANA = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DIAS_UTEIS_PADRAO = ["monday", "tuesday", "wednesday", "thursday", "friday"];

function executarInteligenciaSombra(modelo, executor) {
    try {
        return executor();
    } catch (error) {
        console.warn("ROUTINE_SHADOW_MODEL_FAILED", { modelo, code: error?.code ?? error?.name ?? "UNKNOWN" });
        return {
            modelo,
            ajuste: 0,
            confianca: 0,
            amostras: 0,
            contribuicoes: {},
            falhou: true,
            erro_codigo: error?.code ?? error?.name ?? "UNKNOWN",
        };
    }
}

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenizar(valor) {
    return normalizarTexto(valor).split(" ").filter(Boolean);
}

function numeroValido(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function calcularDistanciaKm(origemLatitude, origemLongitude, destinoLatitude, destinoLongitude) {
    const latOrigem = numeroValido(origemLatitude);
    const lonOrigem = numeroValido(origemLongitude);
    const latDestino = numeroValido(destinoLatitude);
    const lonDestino = numeroValido(destinoLongitude);
    if ([latOrigem, lonOrigem, latDestino, lonDestino].some((valor) => valor === null)) {
        return null;
    }
    const raioTerraKm = 6371;
    const paraRadianos = (valor) => (valor * Math.PI) / 180;
    const deltaLatitude = paraRadianos(latDestino - latOrigem);
    const deltaLongitude = paraRadianos(lonDestino - lonOrigem);
    const a = Math.sin(deltaLatitude / 2) ** 2 +
        Math.cos(paraRadianos(latOrigem)) *
        Math.cos(paraRadianos(latDestino)) *
        Math.sin(deltaLongitude / 2) ** 2;
    return Number((raioTerraKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

function normalizarDiasSemana(dias) {
    const recebidos = Array.isArray(dias) ? dias : [];
    const validos = recebidos
        .map((dia) => String(dia ?? "").trim().toLowerCase())
        .filter((dia) => DIAS_SEMANA.includes(dia));
    return [...new Set(validos.length ? validos : DIAS_UTEIS_PADRAO)];
}

function dataIsoLocal(data) {
    return [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0"),
    ].join("-");
}

function somarDias(data, dias) {
    const novaData = new Date(data);
    novaData.setDate(novaData.getDate() + dias);
    return novaData;
}

function inicioSemana(data = new Date()) {
    const base = new Date(data);
    base.setHours(12, 0, 0, 0);
    const dia = base.getDay();
    const diferenca = dia === 0 ? -6 : 1 - dia;
    return somarDias(base, diferenca);
}

function dataSaoPaulo(data) {
    return new Date(data).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function semanaAtual(dataReferencia = new Date()) {
    const hojeIso = dataSaoPaulo(dataReferencia);
    const inicio = inicioSemana(new Date(`${hojeIso}T12:00:00`));
    return {
        inicio: dataIsoLocal(inicio),
        fim: dataIsoLocal(somarDias(inicio, 6)),
    };
}

function semanaPlanejamento(dataReferencia = new Date(), diasSemana = DIAS_UTEIS_PADRAO, horarioFim = "23:59") {
    const hojeIso = dataSaoPaulo(dataReferencia);
    let inicio = inicioSemana(new Date(`${hojeIso}T12:00:00`));
    const datas = datasDaSemana(inicio, diasSemana);
    const fimHoje = new Date(`${hojeIso}T${normalizarHora(horarioFim)}-03:00`);
    const temDiaFuturo = datas.some((item) => item.data > hojeIso || (item.data === hojeIso && fimHoje.getTime() - new Date(dataReferencia).getTime() > 30 * 60000));
    if (!temDiaFuturo) {
        inicio = somarDias(inicio, 7);
    }
    const fim = somarDias(inicio, 6);
    return {
        inicio: dataIsoLocal(inicio),
        fim: dataIsoLocal(fim),
    };
}

function datasDaSemana(semanaInicio, diasSemana) {
    const inicio = typeof semanaInicio === "string"
        ? new Date(`${semanaInicio}T12:00:00`)
        : new Date(semanaInicio);
    return normalizarDiasSemana(diasSemana)
        .map((dia) => {
        const indice = DIAS_SEMANA.indexOf(dia);
        const data = somarDias(inicio, indice === 0 ? 6 : indice - 1);
        return {
            data: dataIsoLocal(data),
            dia_semana: dia,
        };
    })
        .sort((a, b) => a.data.localeCompare(b.data));
}

function normalizarHora(horario, fallback = "12:00:00") {
    const valor = String(horario ?? "").trim();
    const partes = valor.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!partes) return fallback;
    const hora = Number(partes[1]);
    const minuto = Number(partes[2]);
    const segundo = Number(partes[3] ?? 0);
    if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59 || segundo < 0 || segundo > 59) return fallback;
    return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:${String(segundo).padStart(2, "0")}`;
}

function horarioSugerido(perfil) {
    return normalizarHora(perfil?.horario_inicio ?? perfil?.janela_inicio ?? "12:00:00");
}

function minutos(hora) {
    const normalizada = normalizarHora(hora, null);
    if (!normalizada) return null;
    const [h, m] = normalizada.split(":").map(Number);
    return h * 60 + m;
}

function janelasLivresDia(perfil, data, janelasOcupadas = []) {
    const inicioPerfil = minutos(perfil.horario_inicio);
    const fimPerfil = minutos(perfil.horario_fim);
    if (inicioPerfil === null || fimPerfil === null || fimPerfil <= inicioPerfil) return [];
    const inicioDia = new Date(`${data}T00:00:00-03:00`).getTime();
    const fimDia = inicioDia + 24 * 60 * 60 * 1000;
    const ocupadas = (Array.isArray(janelasOcupadas) ? janelasOcupadas : []).map((janela) => {
        const inicio = Math.max(new Date(janela.inicio_em).getTime(), inicioDia);
        const fim = Math.min(new Date(janela.fim_em).getTime(), fimDia);
        if (!Number.isFinite(inicio) || !Number.isFinite(fim) || inicio >= fim) return null;
        return {
            inicio: Math.max(inicioPerfil, Math.floor((inicio - inicioDia) / 60000)),
            fim: Math.min(fimPerfil, Math.ceil((fim - inicioDia) / 60000)),
        };
    }).filter((janela) => janela && janela.inicio < janela.fim).sort((a, b) => a.inicio - b.inicio);
    const unidas = [];
    for (const janela of ocupadas) {
        const anterior = unidas.at(-1);
        if (anterior && janela.inicio <= anterior.fim) anterior.fim = Math.max(anterior.fim, janela.fim);
        else unidas.push({ ...janela });
    }
    const livres = [];
    let cursor = inicioPerfil;
    for (const ocupada of unidas) {
        if (cursor < ocupada.inicio) livres.push({ inicio: cursor, fim: ocupada.inicio });
        cursor = Math.max(cursor, ocupada.fim);
    }
    if (cursor < fimPerfil) livres.push({ inicio: cursor, fim: fimPerfil });
    return livres.map((janela) => ({
        horario_inicio: `${String(Math.floor(janela.inicio / 60)).padStart(2, "0")}:${String(janela.inicio % 60).padStart(2, "0")}:00`,
        horario_fim: `${String(Math.floor(janela.fim / 60)).padStart(2, "0")}:${String(janela.fim % 60).padStart(2, "0")}:00`,
    }));
}

function validarLimitesRotina(perfil) {
    const inicio = minutos(perfil.horario_inicio);
    const fim = minutos(perfil.horario_fim);
    if (inicio === null || fim === null || fim <= inicio) throw new Error("Informe uma janela de almoço válida, com fim após o início.");
    const tempo = Number(perfil.tempo_maximo_minutos);
    if (!Number.isInteger(tempo) || tempo < 30 || tempo > 240) throw new Error("O tempo máximo deve ser um número inteiro entre 30 e 240 minutos.");
    if (tempo > fim - inicio) throw new Error(`O tempo máximo não pode ultrapassar os ${fim - inicio} minutos da janela de almoço.`);
    const raio = Number(perfil.raio_km);
    if (!Number.isFinite(raio) || raio < 1 || raio > 100) throw new Error("O raio deve estar entre 1 e 100 km.");
    if (!Array.isArray(perfil.dias_semana) || !perfil.dias_semana.length || perfil.dias_semana.some((dia) => !DIAS_SEMANA.includes(dia))) throw new Error("Selecione ao menos um dia válido para sua rotina.");
}

function horarioCompativel(candidato, perfil, data, agora = new Date(), horarioExato = null) {
    const config = candidato.restaurante.configuracao_operacao ?? {};
    const dia = DIAS_SEMANA[new Date(`${data}T12:00:00Z`).getUTCDay()];
    const operacao = config.days?.find((item) => item.id === dia && item.enabled === true);
    if (!operacao || candidato.restaurante.ativo === false || candidato.restaurante.aceita_reserva === false) return null;
    const deslocamento = Math.ceil((candidato.distancia_km ?? 0) * 1.3 / 5 * 60);
    const tempoTotal = 30 + deslocamento * 2;
    if (tempoTotal > Number(perfil.tempo_maximo_minutos ?? 60)) return null;
    const inicio = minutos(perfil.horario_inicio) + deslocamento;
    const fim = minutos(perfil.horario_fim ?? "14:00");
    const instante = new Date(agora).getTime();
    const antecedencia = Math.max(0, Number(config.antecedenciaMinutosReserva ?? 60));
    for (const turno of operacao.shifts ?? []) {
        const abertura = minutos(turno.open);
        const fechamento = minutos(turno.close);
        if (abertura === null || fechamento === null || abertura >= fechamento) continue;
        const primeiro = horarioExato ? minutos(horarioExato) : Math.ceil(Math.max(inicio, abertura) / 30) * 30;
        const ultimo = horarioExato ? primeiro : Math.min(fim - 30 - deslocamento, fechamento - 120);
        for (let horario = primeiro; horario !== null && horario <= ultimo; horario += 30) {
            if (horario < inicio || horario < abertura || horario + 120 > fechamento || horario + 30 + deslocamento > fim) continue;
            const texto = `${String(Math.floor(horario / 60)).padStart(2, "0")}:${String(horario % 60).padStart(2, "0")}:00`;
            if (new Date(`${data}T${texto}-03:00`).getTime() < instante + antecedencia * 60000) continue;
            return { horario_sugerido: texto, tempo_estimado_minutos: tempoTotal };
        }
    }
    return null;
}

function textoProduto(produto, restaurante) {
    return [
        produto?.nome,
        produto?.descricao,
        produto?.categorias?.nome,
        produto?.categorias?.descricao,
        produto?.categorias?.cardapios?.nome,
        produto?.categorias?.cardapios?.descricao,
        restaurante?.nome,
        restaurante?.endereco,
    ].map(normalizarTexto).filter(Boolean).join(" ");
}

function contemAlgumToken(texto, tokens) {
    if (!texto || !tokens.length) return false;
    return tokens.some((token) => texto.includes(token));
}

function produtoIncompativel(produto, restaurante, restricoes = []) {
    const grupos = {
        vegetariano: ["carne", "frango", "peixe", "bacon", "presunto", "camarao", "costela", "picanha"],
        vegano: ["carne", "frango", "peixe", "bacon", "presunto", "camarao", "costela", "picanha", "queijo", "leite", "ovo", "manteiga", "mel"],
        lactose: ["lactose", "leite", "queijo", "creme de leite", "manteiga"],
        gluten: ["gluten", "trigo", "massa", "pao", "lasanha", "macarrao"],
    };
    const tokens = restricoes.flatMap((item) => {
        const termos = tokenizar(item).filter((termo) => !["sem", "com", "de", "nao", "contem", "restricao"].includes(termo));
        return termos.flatMap((termo) => grupos[termo] ?? [termo]);
    });
    if (!tokens.length) return false;
    return contemAlgumToken(textoProduto(produto, restaurante), tokens);
}

function produtoSeguroParaAlergias(produto, alergias = []) {
    if (!alergias.length) return true;
    const seguranca = Array.isArray(produto?.seguranca_alimentar_produto)
        ? produto.seguranca_alimentar_produto[0] : produto?.seguranca_alimentar_produto;
    if (seguranca?.status !== "REVISADA") return false;
    const termos = alergias.flatMap((item) => tokenizar(item));
    const registros = produto?.alergenos_produto ?? [];
    return !registros.some((registro) => {
        const catalogo = registro.alergenos_catalogo ?? {};
        const texto = normalizarTexto(`${catalogo.codigo ?? ""} ${catalogo.nome ?? ""}`);
        const severo = ["PRESENTE", "PODE_CONTER", "CONTAMINACAO_CRUZADA"].includes(registro.tipo);
        return severo && termos.some((termo) => texto.includes(termo));
    });
}

function produtoCombinaPreferencia(produto, restaurante, preferencias = []) {
    const tokens = preferencias.flatMap((item) => tokenizar(item));
    if (!tokens.length) return false;
    return contemAlgumToken(textoProduto(produto, restaurante), tokens);
}

function produtoPublicado(produto) {
    const categoria = produto?.categorias ?? {};
    const cardapio = categoria?.cardapios ?? {};
    return produto?.disponivel === true &&
        produto?.arquivado !== true &&
        categoria.ativo !== false &&
        categoria.arquivado !== true &&
        cardapio.ativo !== false;
}

function obterProdutosRestaurante(restaurante) {
    return (restaurante?.produtos ?? [])
        .filter(produtoPublicado)
        .sort((a, b) => {
        const precoA = numeroValido(a.preco) ?? Number.POSITIVE_INFINITY;
        const precoB = numeroValido(b.preco) ?? Number.POSITIVE_INFINITY;
        return precoA - precoB || String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR");
    });
}

function criarCandidatos({ perfil, restaurantes, preferencias = [], restricoes = [], alergias = [], favoritosRestaurantes = new Set(), pratosFavoritos = new Set(), feedbacks = [], diagnostico = {}, referencia = new Date(), sequenciaV2 = {} }) {
    const orcamento = numeroValido(perfil.orcamento_diario);
    const raio = numeroValido(perfil.raio_km);
    const temCoordenada = numeroValido(perfil.latitude) !== null && numeroValido(perfil.longitude) !== null;
    const candidatos = [];
    for (const restaurante of restaurantes ?? []) {
        const distancia = temCoordenada
            ? calcularDistanciaKm(perfil.latitude, perfil.longitude, restaurante.latitude, restaurante.longitude)
            : null;
        if (Number.isFinite(raio) && (distancia === null || distancia > raio)) {
            const motivo = distancia === null ? "sem_localizacao" : "fora_raio";
            diagnostico[motivo] = (diagnostico[motivo] ?? 0) + 1;
            continue;
        }
        const minimo = numeroValido(restaurante.valor_minimo_reserva_por_pessoa) ?? 0;
        const produtos = obterProdutosRestaurante(restaurante);
        const produtosCompativeis = produtos.filter((produto) =>
            !produtoIncompativel(produto, restaurante, restricoes) && produtoSeguroParaAlergias(produto, alergias));
        const produtosNoMinimo = produtosCompativeis.filter((produto) => (numeroValido(produto.preco) ?? 0) >= minimo);
        const produtosParaPontuar = produtosNoMinimo;
        if (!produtosParaPontuar.length && produtos.length && !alergias.length) {
            diagnostico.sem_item_compativel = (diagnostico.sem_item_compativel ?? 0) + 1;
            continue;
        }
        const produtosCandidatos = produtosParaPontuar.length ? produtosParaPontuar : [null];
        for (const produto of produtosCandidatos) {
            const preco = numeroValido(produto?.preco) ?? minimo;
            const favoritoRestaurante = Boolean(restaurante.favorito_cliente) || favoritosRestaurantes.has(Number(restaurante.id_restaurante));
            const pratoFavorito = produto ? pratosFavoritos.has(Number(produto.id_produto)) : false;
            const dentroOrcamento = !Number.isFinite(orcamento) || preco <= orcamento;
            if (!dentroOrcamento) {
                diagnostico.fora_orcamento = (diagnostico.fora_orcamento ?? 0) + 1;
                continue;
            }
            const perto = distancia !== null && distancia < 2;
            const bemAvaliado = Number(restaurante.avaliacao_media ?? 0) > 4;
            const combinaPreferencia = produto ? produtoCombinaPreferencia(produto, restaurante, preferencias) : false;
            const scoreOperacional = Math.max(0, Math.min(100, Number(restaurante.score_operacional ?? 100)));
            const score = pontuarCandidato({
                favoritoRestaurante, dentroOrcamento, perto, bemAvaliado,
                combinaPreferencia: combinaPreferencia || pratoFavorito, scoreOperacional,
            });
            const ajusteFeedback = impactoFeedback(feedbacks, {
                idRestaurante: restaurante.id_restaurante,
                idProduto: produto?.id_produto,
            });
            const inteligencia = executarInteligenciaSombra(MODELO_INTELIGENCIA_ROTINA.versao, () => pontuarInteligenciaRotina({
                candidato: { restaurante, produto, distancia_km: distancia, preco_estimado: preco },
                perfil,
                feedbacks,
                tipoJanela: perfil.tipo_janela ?? null,
            }));
            const inteligenciaV2 = executarInteligenciaSombra(MODELO_INTELIGENCIA_ROTINA_V2.versao, () => pontuarInteligenciaRotinaV2({
                candidato: { restaurante, produto, distancia_km: distancia, preco_estimado: preco },
                sinais: feedbacks,
                tipoJanela: perfil.tipo_janela ?? null,
                referencia,
                sequencia: sequenciaV2,
            }));
            candidatos.push({
                restaurante,
                produto,
                distancia_km: distancia,
                preco_estimado: preco,
                pontuacao: Number((score.pontuacao + ajusteFeedback).toFixed(2)),
                pontuacaoDesafiante: Number((score.pontuacao + ajusteFeedback + inteligencia.ajuste).toFixed(2)),
                pontuacaoDesafianteV2: Number((score.pontuacao + ajusteFeedback + inteligenciaV2.ajuste).toFixed(2)),
                pesos: { ...score.componentes, feedback_controlado: ajusteFeedback },
                combinaPreferenciaExplicita: combinaPreferencia,
                inteligencia,
                inteligenciaV2,
            });
        }
    }
    return candidatos.sort((a, b) => {
        const distanciaA = a.distancia_km ?? Number.POSITIVE_INFINITY;
        const distanciaB = b.distancia_km ?? Number.POSITIVE_INFINITY;
        return b.pontuacao - a.pontuacao ||
            distanciaA - distanciaB ||
            Number(a.preco_estimado ?? 0) - Number(b.preco_estimado ?? 0) ||
            String(a.restaurante?.nome ?? "").localeCompare(String(b.restaurante?.nome ?? ""), "pt-BR") ||
            String(a.produto?.nome ?? "").localeCompare(String(b.produto?.nome ?? ""), "pt-BR");
    });
}

function motivoRecomendacao(candidato) {
    const partes = [];
    if (candidato.pesos.favorito_restaurante) partes.push("restaurante favorito");
    if (candidato.pesos.distancia_menor_2km) partes.push("perto da sua base");
    if (candidato.pesos.dentro_orcamento) partes.push("dentro do orçamento");
    if (candidato.pesos.avaliacao_maior_4) partes.push("bem avaliado");
    if (candidato.pesos.preferencia_produto) partes.push("combina com suas preferências");
    if (candidato.pesos.feedback_controlado > 0) partes.push("considera seus retornos anteriores");
    if (!partes.length) partes.push("melhor opção disponível para sua rotina");
    return partes.join(", ");
}

function normalizarJanelasAlimentacao(perfil, janelasAlimentacao = []) {
    const recebidas = Array.isArray(janelasAlimentacao) ? janelasAlimentacao.filter((janela) => janela?.ativa !== false) : [];
    const base = recebidas.length ? recebidas : [{
        id_janela_alimentacao: perfil?.id_janela_alimentacao ?? null,
        tipo: "ALMOCO",
        nome: "Almoço",
        dias_semana: perfil?.dias_semana,
        horario_inicio: perfil?.horario_inicio,
        horario_fim: perfil?.horario_fim,
        tempo_maximo_minutos: perfil?.tempo_maximo_minutos,
        orcamento_por_refeicao: perfil?.orcamento_diario,
        raio_km: perfil?.raio_km,
    }];
    return base.map((janela, ordem) => ({
        ...janela,
        id_janela_alimentacao: Number(janela.id_janela_alimentacao) || null,
        tipo: ["CAFE", "ALMOCO", "JANTAR", "PERSONALIZADA"].includes(janela.tipo) ? janela.tipo : "PERSONALIZADA",
        nome: String(janela.nome ?? "Refeição").trim() || "Refeição",
        dias_semana: normalizarDiasSemana(janela.dias_semana),
        horario_inicio: normalizarHora(janela.horario_inicio, "12:00:00"),
        horario_fim: normalizarHora(janela.horario_fim, "14:00:00"),
        tempo_maximo_minutos: Number(janela.tempo_maximo_minutos ?? perfil?.tempo_maximo_minutos ?? 60),
        orcamento_por_refeicao: numeroValido(janela.orcamento_por_refeicao),
        raio_km: numeroValido(janela.raio_km) ?? numeroValido(perfil?.raio_km) ?? 5,
        ordem,
    })).filter((janela) => janela.id_janela_alimentacao !== null || !recebidas.length);
}

function gerarPlanejamentoRotina({
    perfil,
    restaurantes,
    preferencias = [],
    restricoes = [],
    alergias = [],
    favoritosRestaurantes = [],
    pratosFavoritos = [],
    semanaInicio,
    agora = new Date(),
    refeicoesExistentes = [],
    janelasOcupadas = [],
    historicoRecente = [],
    feedbacks = [],
    janelasAlimentacao = [],
    politicaInteligencia = null,
    requestId = null,
}) {
    const modoLegado = !Array.isArray(janelasAlimentacao) || janelasAlimentacao.length === 0;
    const janelas = normalizarJanelasAlimentacao(perfil, janelasAlimentacao);
    if (!janelas.length) throw new Error("Configure ao menos uma janela alimentar ativa antes de gerar sugestões.");
    const diasSemana = [...new Set(janelas.flatMap((janela) => janela.dias_semana))];
    const maiorHorarioFim = janelas.map((janela) => janela.horario_fim).sort().at(-1) ?? perfil.horario_fim;
    if (semanaInicio && semanaInicio < semanaAtual(agora).inicio) {
        throw new Error("Não é possível gerar ou regenerar um planejamento para uma semana anterior à atual.");
    }
    const semana = semanaInicio
        ? { inicio: semanaInicio, fim: dataIsoLocal(somarDias(new Date(`${semanaInicio}T12:00:00`), 6)) }
        : semanaPlanejamento(agora, diasSemana, maiorHorarioFim);
    const hoje = dataSaoPaulo(agora);
    const itensPlanejamento = janelas.flatMap((janela) => datasDaSemana(semana.inicio, janela.dias_semana).map((item) => ({ ...item, janela })))
        .filter((item) => modoLegado ? item.data >= hoje : item.data > hoje || (item.data === hoje && new Date(`${item.data}T${item.janela.horario_fim}-03:00`).getTime() - new Date(agora).getTime() > 30 * 60000))
        .sort((a, b) => a.data.localeCompare(b.data) || a.janela.ordem - b.janela.ordem);
    const refeicoes = [];
    const avaliacoesSombra = [];
    const baseDiversidade = [...historicoRecente, ...refeicoesExistentes];
    const usoRestaurante = new Map();
    const usoProduto = new Map();
    const usoCategoria = new Map();
    for (const refeicao of baseDiversidade) {
        if (refeicao.id_restaurante) usoRestaurante.set(refeicao.id_restaurante, (usoRestaurante.get(refeicao.id_restaurante) ?? 0) + 1);
        if (refeicao.id_produto) usoProduto.set(refeicao.id_produto, (usoProduto.get(refeicao.id_produto) ?? 0) + 1);
        if (refeicao.categoria) usoCategoria.set(refeicao.categoria, (usoCategoria.get(refeicao.categoria) ?? 0) + 1);
    }
    const usoRestauranteV2 = new Map(usoRestaurante);
    const usoProdutoV2 = new Map(usoProduto);
    const usoCategoriaV2 = new Map(usoCategoria);
    const sequenciaV2 = {};
    const historicoV2_1 = [...baseDiversidade];
    const historicoSemanaV2_1 = [...refeicoesExistentes];
    let anteriorV2_1 = null;
    const modelosDecisao = new Set();
    let saldoSemanal = numeroValido(perfil.orcamento_semanal) ?? Infinity;
    saldoSemanal -= refeicoesExistentes.reduce((total, item) => total + Number(item.preco_estimado ?? 0), 0);
    for (const item of itensPlanejamento) {
        const perfilDaJanela = {
            ...perfil,
            dias_semana: item.janela.dias_semana,
            horario_inicio: item.janela.horario_inicio,
            horario_fim: item.janela.horario_fim,
            tempo_maximo_minutos: item.janela.tempo_maximo_minutos,
            orcamento_diario: item.janela.orcamento_por_refeicao ?? perfil.orcamento_diario,
            raio_km: item.janela.raio_km,
            tipo_janela: item.janela.tipo,
        };
        if (refeicoesExistentes.some((refeicao) => refeicao.data_refeicao === item.data && (modoLegado || Number(refeicao.id_janela_alimentacao) === item.janela.id_janela_alimentacao))) continue;
        const diagnostico = {};
        const candidatos = criarCandidatos({
            perfil: perfilDaJanela, restaurantes, preferencias, restricoes, alergias,
            favoritosRestaurantes: new Set(favoritosRestaurantes.map(Number)), pratosFavoritos: new Set(pratosFavoritos.map(Number)), feedbacks, diagnostico,
            referencia: agora,
            sequenciaV2,
        });
        const janelasLivres = janelasLivresDia(perfilDaJanela, item.data, janelasOcupadas);
        const opcoesDoDia = candidatos
            .filter((atual) => atual.preco_estimado <= saldoSemanal)
            .map((atual) => ({
                ...atual,
                janela: janelasLivres.map((janelaLivre) => horarioCompativel(atual, { ...perfilDaJanela, ...janelaLivre }, item.data, agora)).find(Boolean) ?? null,
            }))
            .filter((atual) => atual.janela)
            .map((atual) => {
            const categoria = atual.produto?.categorias?.nome ?? null;
            const penalidadeDiversidade = penalidadeRepeticao({
                restaurantes: usoRestaurante.get(atual.restaurante.id_restaurante) ?? 0,
                produtos: atual.produto ? usoProduto.get(atual.produto.id_produto) ?? 0 : 0,
                categorias: categoria ? usoCategoria.get(categoria) ?? 0 : 0,
            });
            const penalidadeDiversidadeV2 = penalidadeRepeticao({
                restaurantes: usoRestauranteV2.get(atual.restaurante.id_restaurante) ?? 0,
                produtos: atual.produto ? usoProdutoV2.get(atual.produto.id_produto) ?? 0 : 0,
                categorias: categoria ? usoCategoriaV2.get(categoria) ?? 0 : 0,
            });
            return {
                ...atual,
                pontuacaoControle: Number((atual.pontuacao - penalidadeDiversidade).toFixed(2)),
                pontuacaoDesafiante: Number((atual.pontuacaoDesafiante - penalidadeDiversidade).toFixed(2)),
                pontuacaoDesafianteV2: Number((atual.pontuacaoDesafianteV2 - penalidadeDiversidadeV2).toFixed(2)),
            };
        });
        const rankingControle = ordenarPorPontuacao(opcoesDoDia, "pontuacaoControle");
        const rankingDesafianteV1 = ordenarPorPontuacao(opcoesDoDia, "pontuacaoDesafiante");
        const rankingDesafianteV2 = ordenarPorPontuacao(opcoesDoDia, "pontuacaoDesafianteV2");
        const candidatoControle = rankingControle[0];
        const candidatoV2 = rankingDesafianteV2[0];
        const resultadoV2_1 = politicaInteligencia?.usarV2_1 ? selecionarCandidatoV2_1({
            candidatos: opcoesDoDia,
            perfil: perfilDaJanela,
            preferencias,
            historico: historicoV2_1,
            historicoSemana: historicoSemanaV2_1,
            sinais: politicaInteligencia.personalizacaoConsentida ? feedbacks : [],
            tipoJanela: item.janela.tipo,
            referencia: agora,
            anterior: anteriorV2_1,
        }) : null;
        const decisao = politicaInteligencia?.usarV2_1
            ? decidirCandidatoV2_1Titular({ controle: candidatoControle, resultadoV2_1, politica: politicaInteligencia })
            : decidirCandidatoInteligencia({ controle: candidatoControle, v2: candidatoV2, politica: politicaInteligencia });
        const candidato = decisao.candidato;
        modelosDecisao.add(decisao.modelo);
        const diagnosticoInteligencia = decisao.usouV2_1
            ? criarDiagnosticoV2_1({ decisao, requestId })
            : criarDiagnosticoOperacional({ decisao, requestId });
        const avaliacaoSombraV1 = compararRankingSombra(candidatoControle, rankingDesafianteV1[0], {
            controle: MODELO_RECOMENDACAO_ROTINA.versao,
            desafiante: MODELO_INTELIGENCIA_ROTINA.versao,
        });
        const avaliacaoSombraV2 = compararRankingSombra(candidatoControle, candidatoV2, {
            controle: MODELO_RECOMENDACAO_ROTINA.versao,
            desafiante: MODELO_INTELIGENCIA_ROTINA_V2.versao,
        }, {
            pontuacao: "pontuacaoDesafianteV2",
            inteligencia: "inteligenciaV2",
        });
        if (!candidato) {
            const motivo = decisao.motivo === "V2_1_SEM_DIVERSIDADE"
                ? "A única opção disponível já foi usada nesta semana. Aumente a janela da refeição ou use uma localização com mais restaurantes próximos."
                : candidatos.length && !candidatos.some((item) => item.preco_estimado <= saldoSemanal)
                ? "O saldo do orçamento semanal não comporta outra refeição."
                : candidatos.length
                    ? janelasLivres.length
                        ? "Não há opção neste dia que combine funcionamento, antecedência da reserva e tempo para ida, refeição e volta."
                        : "Sua agenda não deixou uma janela livre suficiente para o almoço neste dia."
                    : !restaurantes?.length
                        ? "Nenhum restaurante está disponível no catálogo."
                        : [
                            diagnostico.fora_raio ? "Há restaurantes fora da distância máxima." : null,
                            diagnostico.sem_localizacao ? "Há restaurantes sem localização cadastrada." : null,
                            diagnostico.fora_orcamento ? "Há opções acima do orçamento diário." : null,
                            diagnostico.sem_item_compativel ? "Há cardápios incompatíveis com as restrições ou o consumo mínimo." : null,
                        ].filter(Boolean).join(" ") || "Nenhuma opção atende aos critérios da rotina.";
            refeicoes.push({
                data_refeicao: item.data,
                dia_semana: item.dia_semana,
                id_janela_alimentacao: item.janela.id_janela_alimentacao,
                horario_sugerido: horarioSugerido(perfilDaJanela),
                status: "SUGERIDA",
                motivo_recomendacao: motivo,
                pontuacao: 0,
                metadados: {
                    sem_sugestao: true,
                    diagnostico,
                    modelo_recomendacao: decisao.modelo,
                    decisao_inteligencia: {
                        segmento: decisao.segmento,
                        motivo: decisao.motivo,
                        confianca: decisao.confianca,
                        amostras: decisao.amostras,
                    },
                    diagnostico_inteligencia: diagnosticoInteligencia,
                    janela: { tipo: item.janela.tipo, nome: item.janela.nome },
                },
            });
            continue;
        }
        usoRestaurante.set(candidatoControle.restaurante.id_restaurante, (usoRestaurante.get(candidatoControle.restaurante.id_restaurante) ?? 0) + 1);
        if (candidatoControle.produto) {
            usoProduto.set(candidatoControle.produto.id_produto, (usoProduto.get(candidatoControle.produto.id_produto) ?? 0) + 1);
            const categoria = candidatoControle.produto.categorias?.nome;
            if (categoria) usoCategoria.set(categoria, (usoCategoria.get(categoria) ?? 0) + 1);
        }
        if (candidatoV2) {
            const restauranteIdV2 = candidatoV2.restaurante.id_restaurante;
            usoRestauranteV2.set(restauranteIdV2, (usoRestauranteV2.get(restauranteIdV2) ?? 0) + 1);
            sequenciaV2.id_restaurante_anterior = restauranteIdV2;
            if (candidatoV2.produto) {
                const produtoIdV2 = candidatoV2.produto.id_produto;
                usoProdutoV2.set(produtoIdV2, (usoProdutoV2.get(produtoIdV2) ?? 0) + 1);
                sequenciaV2.id_produto_anterior = produtoIdV2;
                const categoriaV2 = candidatoV2.produto.categorias?.nome;
                if (categoriaV2) usoCategoriaV2.set(categoriaV2, (usoCategoriaV2.get(categoriaV2) ?? 0) + 1);
            } else {
                delete sequenciaV2.id_produto_anterior;
            }
        }
        if (decisao.usouV2_1 && candidato) {
            const categoriaV2_1 = candidato.produto?.categorias?.nome ?? null;
            historicoV2_1.push({
                id_restaurante: candidato.restaurante.id_restaurante,
                id_produto: candidato.produto?.id_produto ?? null,
                categoria: categoriaV2_1,
            });
            historicoSemanaV2_1.push({
                id_restaurante: candidato.restaurante.id_restaurante,
                id_produto: candidato.produto?.id_produto ?? null,
                categoria: categoriaV2_1,
            });
            anteriorV2_1 = {
                restaurant_id: candidato.restaurante.id_restaurante,
                product_id: candidato.produto?.id_produto ?? `sem-produto-${candidato.restaurante.id_restaurante}`,
            };
        }
        saldoSemanal = Number((saldoSemanal - candidato.preco_estimado).toFixed(2));
        for (const avaliacaoSombra of [avaliacaoSombraV1, avaliacaoSombraV2]) {
            if (!avaliacaoSombra) continue;
            avaliacoesSombra.push({
                data_refeicao: item.data,
                id_janela_alimentacao: item.janela.id_janela_alimentacao,
                ...avaliacaoSombra,
            });
        }
        refeicoes.push({
            data_refeicao: item.data,
            dia_semana: item.dia_semana,
            id_janela_alimentacao: item.janela.id_janela_alimentacao,
            horario_sugerido: candidato.janela.horario_sugerido,
            id_restaurante: candidato.restaurante.id_restaurante,
            id_produto: candidato.produto?.id_produto ?? null,
            preco_estimado: candidato.preco_estimado,
            distancia_km: candidato.distancia_km,
            tempo_estimado_minutos: candidato.janela.tempo_estimado_minutos,
            motivo_recomendacao: motivoRecomendacao(candidato),
            pontuacao: decisao.usouV2_1 ? decisao.pontuacao : candidato.pontuacaoControle ?? candidato.pontuacao,
            status: "SUGERIDA",
            metadados: {
                pesos: candidato.pesos,
                restaurante: {
                    nome: candidato.restaurante.nome,
                    endereco: candidato.restaurante.endereco,
                    logo_url: candidato.restaurante.logo_url,
                },
                produto: candidato.produto ? {
                    nome: candidato.produto.nome,
                    preco: candidato.produto.preco,
                } : null,
                alternativas: (decisao.usouV2 || decisao.usouV2_1 ? rankingDesafianteV2 : rankingControle)
                    .filter((alternativa) => alternativa !== candidato)
                    .slice(0, 3).map((alternativa) => ({
                    id_restaurante: alternativa.restaurante.id_restaurante,
                    restaurante: alternativa.restaurante.nome,
                    id_produto: alternativa.produto?.id_produto ?? null,
                    prato: alternativa.produto?.nome ?? null,
                    diferenca_preco: Number((alternativa.preco_estimado - candidato.preco_estimado).toFixed(2)),
                    diferenca_distancia_km: alternativa.distancia_km === null || candidato.distancia_km === null
                        ? null : Number((alternativa.distancia_km - candidato.distancia_km).toFixed(2)),
                    diferenca_aderencia: Number((((decisao.usouV2 || decisao.usouV2_1) ? alternativa.pontuacaoDesafianteV2 : alternativa.pontuacaoControle)
                        - ((decisao.usouV2 || decisao.usouV2_1) ? candidato.pontuacaoDesafianteV2 : candidato.pontuacaoControle)).toFixed(2)),
                })),
                modelo_recomendacao: decisao.modelo,
                decisao_inteligencia: {
                    segmento: decisao.segmento,
                    motivo: decisao.motivo,
                    confianca: decisao.confianca,
                    amostras: decisao.amostras,
                },
                diagnostico_inteligencia: diagnosticoInteligencia,
                janela: { tipo: item.janela.tipo, nome: item.janela.nome },
            },
        });
    }
    return {
        semana_inicio: semana.inicio,
        semana_fim: semana.fim,
        refeicoes,
        avaliacoes_sombra: avaliacoesSombra,
        resumo: {
            total_refeicoes: refeicoes.length,
            total_com_sugestao: refeicoes.filter((item) => item.id_restaurante).length,
            gerado_em: new Date(agora).toISOString(),
            modelo: modelosDecisao.size === 1 ? [...modelosDecisao][0] : MODELO_RECOMENDACAO_ROTINA.versao,
            modelos_decisao: [...modelosDecisao],
            diagnosticos_inteligencia: refeicoes
                .map((item) => item.metadados?.diagnostico_inteligencia)
                .filter(Boolean),
            segmento_inteligencia: politicaInteligencia?.segmento ?? "controle",
            experimento_sombra: MODELO_INTELIGENCIA_ROTINA.versao,
            experimentos_sombra: [MODELO_INTELIGENCIA_ROTINA.versao, MODELO_INTELIGENCIA_ROTINA_V2.versao],
            agenda_aplicada: janelasOcupadas.length > 0,
            total_janelas: janelas.length,
        },
    };
}

module.exports = {
    DIAS_SEMANA,
    calcularDistanciaKm,
    criarCandidatos,
    executarInteligenciaSombra,
    datasDaSemana,
    gerarPlanejamentoRotina,
    semanaAtual,
    normalizarJanelasAlimentacao,
    normalizarDiasSemana,
    normalizarTexto,
    produtoIncompativel,
    produtoSeguroParaAlergias,
    horarioCompativel,
    janelasLivresDia,
    motivoRecomendacao,
    validarLimitesRotina,
    semanaPlanejamento,
};

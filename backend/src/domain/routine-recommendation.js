"use strict";

const DIAS_SEMANA = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DIAS_UTEIS_PADRAO = ["monday", "tuesday", "wednesday", "thursday", "friday"];

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

function criarCandidatos({ perfil, restaurantes, preferencias = [], restricoes = [], alergias = [], favoritosRestaurantes = new Set(), pratosFavoritos = new Set(), diagnostico = {} }) {
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
        // Sem ingredientes/alergenos estruturados, nao recomendar pratos como seguros para alergias.
        const produtosCompativeis = alergias.length ? [] : produtos.filter((produto) => !produtoIncompativel(produto, restaurante, restricoes));
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
            const penalidadeOperacional = Number(((100 - scoreOperacional) / 5).toFixed(2));
            const abaixoMinimo = produto && preco < minimo;
            const pontuacao =
                (favoritoRestaurante ? 20 : 0) +
                (dentroOrcamento ? 20 : 0) +
                (perto ? 15 : 0) +
                (bemAvaliado ? 10 : 0) +
                (combinaPreferencia || pratoFavorito ? 10 : 0) -
                penalidadeOperacional -
                (abaixoMinimo ? 20 : 0);
            candidatos.push({
                restaurante,
                produto,
                distancia_km: distancia,
                preco_estimado: preco,
                pontuacao: Number(pontuacao.toFixed(2)),
                pesos: {
                    favorito_restaurante: favoritoRestaurante ? 20 : 0,
                    dentro_orcamento: dentroOrcamento ? 20 : 0,
                    distancia_menor_2km: perto ? 15 : 0,
                    avaliacao_maior_4: bemAvaliado ? 10 : 0,
                    preferencia_produto: combinaPreferencia || pratoFavorito ? 10 : 0,
                    penalidade_operacional: -penalidadeOperacional,
                    abaixo_consumo_minimo: abaixoMinimo ? -20 : 0,
                },
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
    if (!partes.length) partes.push("melhor opção disponível para sua rotina");
    return partes.join(", ");
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
}) {
    const diasSemana = normalizarDiasSemana(perfil?.dias_semana);
    const semana = semanaInicio
        ? { inicio: semanaInicio, fim: dataIsoLocal(somarDias(new Date(`${semanaInicio}T12:00:00`), 6)) }
        : semanaPlanejamento(agora, diasSemana, perfil.horario_fim);
    const datas = datasDaSemana(semana.inicio, diasSemana).filter((item) => item.data >= dataSaoPaulo(agora));
    const diagnostico = {};
    const candidatos = criarCandidatos({
        perfil,
        restaurantes,
        preferencias,
        restricoes,
        alergias,
        favoritosRestaurantes: new Set(favoritosRestaurantes.map(Number)),
        pratosFavoritos: new Set(pratosFavoritos.map(Number)),
        diagnostico,
    });
    const refeicoes = [];
    const usoRestaurante = new Map();
    const usoProduto = new Map();
    let saldoSemanal = numeroValido(perfil.orcamento_semanal) ?? Infinity;
    saldoSemanal -= refeicoesExistentes.reduce((total, item) => total + Number(item.preco_estimado ?? 0), 0);
    for (const item of datas) {
        if (refeicoesExistentes.some((refeicao) => refeicao.data_refeicao === item.data)) continue;
        const candidato = candidatos
            .filter((atual) => atual.preco_estimado <= saldoSemanal)
            .map((atual) => ({ ...atual, janela: horarioCompativel(atual, perfil, item.data, agora) }))
            .filter((atual) => atual.janela)
            .map((atual) => {
            const penalidadeDiversidade = (usoRestaurante.get(atual.restaurante.id_restaurante) ?? 0) * 3 +
                (atual.produto ? (usoProduto.get(atual.produto.id_produto) ?? 0) * 2 : 0);
            return { ...atual, pontuacaoFinal: Number((atual.pontuacao - penalidadeDiversidade).toFixed(2)) };
        })
            .sort((a, b) => {
            const distanciaA = a.distancia_km ?? Number.POSITIVE_INFINITY;
            const distanciaB = b.distancia_km ?? Number.POSITIVE_INFINITY;
            return b.pontuacaoFinal - a.pontuacaoFinal ||
                distanciaA - distanciaB ||
                Number(a.preco_estimado ?? 0) - Number(b.preco_estimado ?? 0) ||
                String(a.restaurante?.nome ?? "").localeCompare(String(b.restaurante?.nome ?? ""), "pt-BR") ||
                String(a.produto?.nome ?? "").localeCompare(String(b.produto?.nome ?? ""), "pt-BR");
        })[0];
        if (!candidato) {
            const motivo = candidatos.length && !candidatos.some((item) => item.preco_estimado <= saldoSemanal)
                ? "O saldo do orçamento semanal não comporta outra refeição."
                : candidatos.length
                    ? "Não há opção neste dia que combine funcionamento, antecedência da reserva e tempo para ida, refeição e volta."
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
                horario_sugerido: horarioSugerido(perfil),
                status: "SUGERIDA",
                motivo_recomendacao: motivo,
                pontuacao: 0,
                metadados: { sem_sugestao: true, diagnostico },
            });
            continue;
        }
        usoRestaurante.set(candidato.restaurante.id_restaurante, (usoRestaurante.get(candidato.restaurante.id_restaurante) ?? 0) + 1);
        if (candidato.produto) {
            usoProduto.set(candidato.produto.id_produto, (usoProduto.get(candidato.produto.id_produto) ?? 0) + 1);
        }
        saldoSemanal = Number((saldoSemanal - candidato.preco_estimado).toFixed(2));
        refeicoes.push({
            data_refeicao: item.data,
            dia_semana: item.dia_semana,
            horario_sugerido: candidato.janela.horario_sugerido,
            id_restaurante: candidato.restaurante.id_restaurante,
            id_produto: candidato.produto?.id_produto ?? null,
            preco_estimado: candidato.preco_estimado,
            distancia_km: candidato.distancia_km,
            tempo_estimado_minutos: candidato.janela.tempo_estimado_minutos,
            motivo_recomendacao: motivoRecomendacao(candidato),
            pontuacao: candidato.pontuacaoFinal ?? candidato.pontuacao,
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
            },
        });
    }
    return {
        semana_inicio: semana.inicio,
        semana_fim: semana.fim,
        refeicoes,
        resumo: {
            total_refeicoes: refeicoes.length,
            total_com_sugestao: refeicoes.filter((item) => item.id_restaurante).length,
            gerado_em: new Date(agora).toISOString(),
            modelo: "deterministico-v1",
        },
    };
}

module.exports = {
    DIAS_SEMANA,
    calcularDistanciaKm,
    criarCandidatos,
    datasDaSemana,
    gerarPlanejamentoRotina,
    normalizarDiasSemana,
    normalizarTexto,
    produtoIncompativel,
    horarioCompativel,
    validarLimitesRotina,
    semanaPlanejamento,
};

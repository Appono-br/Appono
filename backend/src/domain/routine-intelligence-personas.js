"use strict";

const crypto = require("node:crypto");

const DIAS = new Set(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
const RESULTADOS = new Set(["A_MAIOR_QUE_B", "B_MAIOR_QUE_A", "A_INELEGIVEL", "B_INELEGIVEL", "EMPATE"]);
const CHAVES_PERSONA = new Set([
    "id", "nome_tecnico", "objetivo", "descricao", "semente_offset", "perfil", "afinidades", "aversoes",
    "tracos", "politica_decisao", "consentimento_sintetico", "mudanca_temporal", "contradicao", "casos_esperados",
]);

function objeto(valor) {
    return valor && typeof valor === "object" && !Array.isArray(valor);
}

function numeroFinito(valor) {
    return Number.isFinite(Number(valor));
}

function canonicalizar(valor) {
    if (Array.isArray(valor)) return valor.map(canonicalizar);
    if (!objeto(valor)) return valor;
    return Object.fromEntries(Object.keys(valor).sort().map((chave) => [chave, canonicalizar(valor[chave])]));
}

function serializarCanonico(valor) {
    return JSON.stringify(canonicalizar(valor));
}

function hashCanonico(valor) {
    return crypto.createHash("sha256").update(serializarCanonico(valor)).digest("hex");
}

function exigir(condicao, mensagem) {
    if (!condicao) throw new Error(`PERSONA_INVALIDA: ${mensagem}`);
}

function validarMapaNumerico(mapa, campo) {
    exigir(objeto(mapa), `${campo} deve ser objeto`);
    for (const [chave, valor] of Object.entries(mapa)) {
        exigir(chave.length > 0 && numeroFinito(valor), `${campo}.${chave} deve ser numero finito`);
    }
}

function validarPersona(persona) {
    exigir(objeto(persona), "definicao deve ser objeto");
    for (const chave of Object.keys(persona)) exigir(CHAVES_PERSONA.has(chave), `campo desconhecido ${chave}`);
    exigir(/^[a-z][a-z0-9_]*$/.test(persona.id ?? ""), "id deve usar snake_case");
    exigir(typeof persona.nome_tecnico === "string" && persona.nome_tecnico.length >= 3, `${persona.id}: nome tecnico invalido`);
    exigir(typeof persona.objetivo === "string" && persona.objetivo.length >= 10, `${persona.id}: objetivo invalido`);
    exigir(typeof persona.descricao === "string" && persona.descricao.length >= 10, `${persona.id}: descricao invalida`);
    exigir(Number.isInteger(persona.semente_offset), `${persona.id}: semente_offset invalido`);
    exigir(objeto(persona.perfil), `${persona.id}: perfil ausente`);
    exigir(numeroFinito(persona.perfil.orcamento) && persona.perfil.orcamento > 0, `${persona.id}: orcamento invalido`);
    exigir(numeroFinito(persona.perfil.raio_km) && persona.perfil.raio_km > 0, `${persona.id}: raio invalido`);
    exigir(Array.isArray(persona.perfil.janelas) && persona.perfil.janelas.length > 0, `${persona.id}: janelas ausentes`);
    for (const janela of persona.perfil.janelas) {
        exigir(typeof janela.tipo === "string" && /^\d{2}:\d{2}$/.test(janela.inicio) && /^\d{2}:\d{2}$/.test(janela.fim), `${persona.id}: janela invalida`);
        exigir(janela.inicio < janela.fim, `${persona.id}: intervalo de janela invalido`);
        exigir(Array.isArray(janela.dias) && janela.dias.length > 0 && janela.dias.every((dia) => DIAS.has(dia)), `${persona.id}: dias invalidos`);
    }
    exigir(Array.isArray(persona.perfil.preferencias_explicitas), `${persona.id}: preferencias invalidas`);
    exigir(objeto(persona.afinidades), `${persona.id}: afinidades ausentes`);
    validarMapaNumerico(persona.afinidades.categorias, `${persona.id}.afinidades.categorias`);
    validarMapaNumerico(persona.afinidades.restaurantes, `${persona.id}.afinidades.restaurantes`);
    validarMapaNumerico(persona.afinidades.produtos, `${persona.id}.afinidades.produtos`);
    exigir(objeto(persona.aversoes), `${persona.id}: aversoes ausentes`);
    for (const campo of ["categorias", "restaurantes", "produtos"]) exigir(Array.isArray(persona.aversoes[campo]), `${persona.id}: aversoes.${campo} invalido`);
    for (const categoria of persona.aversoes.categorias) exigir(!Object.hasOwn(persona.afinidades.categorias, categoria), `${persona.id}: categoria simultaneamente afinidade e aversao`);
    for (const restaurante of persona.aversoes.restaurantes) exigir(!Object.hasOwn(persona.afinidades.restaurantes, restaurante), `${persona.id}: restaurante simultaneamente afinidade e aversao`);
    for (const produto of persona.aversoes.produtos) exigir(!Object.hasOwn(persona.afinidades.produtos, produto), `${persona.id}: produto simultaneamente afinidade e aversao`);
    exigir(objeto(persona.tracos), `${persona.id}: tracos ausentes`);
    for (const campo of ["forca_preferencia_explicita", "forca_aversao", "sensibilidade_preco", "sensibilidade_distancia", "preferencia_novidade", "tolerancia_repeticao", "amplitude_ruido", "sensibilidade_comportamental"]) {
        exigir(numeroFinito(persona.tracos[campo]), `${persona.id}: traco ${campo} invalido`);
    }
    exigir(persona.tracos.tolerancia_repeticao >= 0 && persona.tracos.tolerancia_repeticao <= 1, `${persona.id}: tolerancia de repeticao fora do limite`);
    exigir(persona.tracos.amplitude_ruido >= 0 && persona.tracos.amplitude_ruido <= 2, `${persona.id}: ruido fora do limite`);
    exigir(objeto(persona.politica_decisao), `${persona.id}: politica ausente`);
    const limites = ["converter_min", "aprovar_min", "editar_min", "alternativa_min"].map((campo) => Number(persona.politica_decisao[campo]));
    exigir(limites.every(Number.isFinite) && limites[0] >= limites[1] && limites[1] >= limites[2] && limites[2] >= limites[3], `${persona.id}: limiares contraditorios`);
    exigir(typeof persona.consentimento_sintetico === "boolean", `${persona.id}: consentimento sintetico invalido`);
    exigir(Array.isArray(persona.casos_esperados) && persona.casos_esperados.length >= 3, `${persona.id}: informe tres casos esperados`);
    for (const caso of persona.casos_esperados) {
        exigir(typeof caso.id === "string" && caso.id.startsWith(`${persona.id}_`), `${persona.id}: id de caso invalido`);
        exigir(objeto(caso.contexto) && objeto(caso.opcao_a) && objeto(caso.opcao_b), `${persona.id}: caso ${caso.id} incompleto`);
        exigir(RESULTADOS.has(caso.esperado), `${persona.id}: resultado esperado invalido`);
        exigir(typeof caso.motivo === "string" && caso.motivo.length >= 3, `${persona.id}: motivo de caso ausente`);
    }
    return persona;
}

function validarArtefatoPersonas(artefato) {
    exigir(objeto(artefato), "artefato ausente");
    exigir(artefato.schema_version === 1, "schema_version deve ser 1");
    exigir(artefato.personas_version === "personas-sinteticas-v1", "personas_version inesperada");
    exigir(Array.isArray(artefato.personas) && artefato.personas.length >= 10, "dez personas sao obrigatorias");
    const ids = new Set();
    for (const persona of artefato.personas) {
        validarPersona(persona);
        exigir(!ids.has(persona.id), `id duplicado ${persona.id}`);
        ids.add(persona.id);
    }
    return artefato;
}

function contar(historico, campo, valor) {
    return (historico ?? []).filter((item) => String(item?.[campo] ?? "") === String(valor ?? "")).length;
}

function ruidoDeterministico(persona, candidato, contexto) {
    if (contexto.aplicar_ruido === false || persona.tracos.amplitude_ruido === 0) return 0;
    const entrada = `${persona.semente_offset}:${contexto.semente ?? 0}:${contexto.semana ?? 0}:${contexto.indice ?? 0}:${candidato.id_restaurante ?? ""}:${candidato.id_produto ?? ""}:${candidato.categoria}`;
    const inteiro = Number.parseInt(crypto.createHash("sha256").update(entrada).digest("hex").slice(0, 8), 16);
    const normalizado = inteiro / 0xffffffff;
    return (normalizado * 2 - 1) * persona.tracos.amplitude_ruido;
}

function elegibilidade(persona, candidato) {
    if (!numeroFinito(candidato.preco) || Number(candidato.preco) < 0) return { elegivel: false, motivo: "PRECO_INVALIDO" };
    if (!numeroFinito(candidato.distancia) || Number(candidato.distancia) < 0) return { elegivel: false, motivo: "DISTANCIA_INVALIDA" };
    if (Number(candidato.preco) > Number(persona.perfil.orcamento)) return { elegivel: false, motivo: "FORA_ORCAMENTO" };
    if (Number(candidato.distancia) > Number(persona.perfil.raio_km)) return { elegivel: false, motivo: "FORA_RAIO" };
    return { elegivel: true, motivo: null };
}

function contribuicaoTemporal(persona, candidato, semana) {
    const mudanca = persona.mudanca_temporal;
    if (!mudanca) return 0;
    const intervalo = Math.max(1, mudanca.semana_fim - mudanca.semana_inicio);
    const progresso = Math.max(0, Math.min(1, (Number(semana ?? 0) - mudanca.semana_inicio) / intervalo));
    if (candidato.categoria === mudanca.categoria_inicial) return mudanca.forca * (1 - progresso);
    if (candidato.categoria === mudanca.categoria_futura) return mudanca.forca * progresso;
    return 0;
}

function contribuicaoComportamental(persona, candidato, sinais) {
    return (sinais ?? []).reduce((total, sinal) => {
        const combina = String(sinal.categoria ?? "") === String(candidato.categoria ?? "")
            || String(sinal.id_restaurante ?? "") === String(candidato.id_restaurante ?? "")
            || String(sinal.id_produto ?? "") === String(candidato.id_produto ?? "");
        return total + (combina && numeroFinito(sinal.valor) ? Number(sinal.valor) : 0);
    }, 0) * persona.tracos.sensibilidade_comportamental;
}

function avaliarUtilidadePersona(persona, candidato, contexto = {}) {
    validarPersona(persona);
    const estado = elegibilidade(persona, candidato);
    if (!estado.elegivel) return { ...estado, utilidade: null, contribuicoes: {} };
    const historico = contexto.historico ?? [];
    const preferencias = persona.perfil.preferencias_explicitas;
    const contribuicoes = {
        preferencia_explicita: preferencias.includes(candidato.categoria) ? persona.tracos.forca_preferencia_explicita : 0,
        afinidade_categoria: Number(persona.afinidades.categorias[candidato.categoria] ?? 0),
        afinidade_restaurante: Number(persona.afinidades.restaurantes[candidato.id_restaurante] ?? 0),
        afinidade_produto: Number(persona.afinidades.produtos[candidato.id_produto] ?? 0),
        aversao: persona.aversoes.categorias.includes(candidato.categoria)
            || persona.aversoes.restaurantes.includes(candidato.id_restaurante)
            || persona.aversoes.produtos.includes(candidato.id_produto) ? -persona.tracos.forca_aversao : 0,
        custo: -(Number(candidato.preco) / persona.perfil.orcamento) * persona.tracos.sensibilidade_preco * 3,
        distancia: -(Number(candidato.distancia) / persona.perfil.raio_km) * persona.tracos.sensibilidade_distancia * 3,
        variedade: 0,
        temporal: contribuicaoTemporal(persona, candidato, contexto.semana),
        comportamental: contribuicaoComportamental(persona, candidato, contexto.sinais),
        ruido: ruidoDeterministico(persona, candidato, contexto),
    };
    const repeticoes = contar(historico, "id_restaurante", candidato.id_restaurante)
        + contar(historico, "id_produto", candidato.id_produto) * 1.2
        + contar(historico, "categoria", candidato.categoria) * 0.6;
    const anterior = historico.at(-1);
    const consecutiva = anterior && String(anterior.id_restaurante) === String(candidato.id_restaurante) ? 1 : 0;
    const penalidadeBruta = (repeticoes + consecutiva) * (1 - persona.tracos.tolerancia_repeticao) * persona.tracos.preferencia_novidade * 1.5;
    const limitePenalidade = Math.max(1, persona.tracos.forca_aversao * 0.75);
    const penalidade = limitePenalidade * (1 - Math.exp(-penalidadeBruta / limitePenalidade));
    const novo = repeticoes === 0 ? persona.tracos.preferencia_novidade * 1.2 : 0;
    contribuicoes.variedade = novo - penalidade;
    const utilidade = Object.values(contribuicoes).reduce((soma, valor) => soma + valor, 0);
    exigir(Number.isFinite(utilidade), `${persona.id}: utilidade nao finita`);
    return { elegivel: true, motivo: null, utilidade: Number(utilidade.toFixed(6)), contribuicoes };
}

function reagirPersona(persona, { utilidade, melhor_utilidade, chave } = {}) {
    validarPersona(persona);
    if (!persona.consentimento_sintetico || persona.id === "controle_sem_historico") return null;
    if (!numeroFinito(utilidade) || !numeroFinito(melhor_utilidade)) throw new Error("REACAO_PERSONA_INVALIDA");
    const delta = Number(utilidade) - Number(melhor_utilidade);
    const politica = persona.politica_decisao;
    let tipo = "RECUSA";
    if (delta >= politica.converter_min) tipo = "CONVERSAO_SIMULADA";
    else if (delta >= politica.aprovar_min) tipo = "APROVACAO";
    else if (delta >= politica.editar_min) tipo = "EDICAO";
    else if (delta >= politica.alternativa_min) tipo = "ALTERNATIVA";
    return {
        tipo,
        delta: Number(delta.toFixed(6)),
        chave_idempotencia: `offline:${persona.id}:${chave ?? "sem-chave"}`,
        sintetico: true,
        persistir: false,
    };
}

function verificarCasoEsperado(persona, caso) {
    const a = avaliarUtilidadePersona(persona, caso.opcao_a, { ...caso.contexto, aplicar_ruido: false });
    const b = avaliarUtilidadePersona(persona, caso.opcao_b, { ...caso.contexto, aplicar_ruido: false });
    let observado;
    if (!a.elegivel) observado = "A_INELEGIVEL";
    else if (!b.elegivel) observado = "B_INELEGIVEL";
    else if (Math.abs(a.utilidade - b.utilidade) < 1e-9) observado = "EMPATE";
    else observado = a.utilidade > b.utilidade ? "A_MAIOR_QUE_B" : "B_MAIOR_QUE_A";
    return { passou: observado === caso.esperado, observado, esperado: caso.esperado, a, b };
}

module.exports = {
    avaliarUtilidadePersona,
    hashCanonico,
    reagirPersona,
    serializarCanonico,
    validarArtefatoPersonas,
    validarPersona,
    verificarCasoEsperado,
};

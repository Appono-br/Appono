"use strict";

require("dotenv").config({ quiet: true });

const { createClient } = require("@supabase/supabase-js");
const { calcularDistanciaKm, normalizarTexto } = require("../src/domain/routine-recommendation");

const REGUA_AVALIACAO = "auditoria-tecnica-v2";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_URL e SUPABASE_SECRET_KEY sao obrigatorias para avaliar o teste sombra.");
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

function contemPreferencia(produto, preferencias) {
    const texto = normalizarTexto([produto?.nome, produto?.descricao, produto?.categorias?.nome].filter(Boolean).join(" "));
    return preferencias.some((preferencia) => texto.includes(normalizarTexto(preferencia)));
}

function pontuar({ produto, restaurante, perfil, preferencias, usosRestaurante }) {
    const preco = Number(produto?.preco ?? 0);
    const orcamento = Number(perfil?.orcamento_diario ?? 0);
    const raio = Number(perfil?.raio_km ?? 0);
    const distancia = calcularDistanciaKm(perfil?.latitude, perfil?.longitude, restaurante?.latitude, restaurante?.longitude);
    const preferencia = contemPreferencia(produto, preferencias);
    const aderencia = preferencia ? 50 : 0;
    const proximidade = distancia !== null && raio > 0 ? Math.max(0, 20 * (1 - distancia / raio)) : 0;
    const economia = orcamento > 0 && preco <= orcamento ? Math.max(0, 15 * (1 - preco / orcamento)) : 0;
    const repeticoes = usosRestaurante.get(restaurante?.nome) ?? 0;
    const variedade = Math.max(0, 15 - repeticoes * 7.5);
    return { total: Number((aderencia + proximidade + economia + variedade).toFixed(2)), distancia, preco, preferencia, repeticoes };
}

function vencedor(controle, desafiante, divergiu) {
    if (!divergiu) return { vencedor: "EMPATE_TECNICO", diferenca: 0 };
    const diferenca = Number((desafiante.total - controle.total).toFixed(2));
    if (Math.abs(diferenca) < 1.5) return { vencedor: "EMPATE_TECNICO", diferenca };
    return { vencedor: diferenca > 0 ? "DESAFIANTE" : "CONTROLE", diferenca };
}

function motivos(controle, desafiante, resultado) {
    if (resultado.vencedor === "EMPATE_TECNICO") return "diferenca insuficiente para preferencia tecnica";
    const ganhou = resultado.vencedor === "DESAFIANTE" ? desafiante : controle;
    const perdeu = resultado.vencedor === "DESAFIANTE" ? controle : desafiante;
    const razoes = [];
    if (ganhou.preferencia && !perdeu.preferencia) razoes.push("maior aderencia a preferencia explicita");
    if (ganhou.distancia !== null && perdeu.distancia !== null && ganhou.distancia + 0.1 < perdeu.distancia) razoes.push("menor distancia");
    if (ganhou.preco + 1 < perdeu.preco) razoes.push("maior folga no orcamento");
    if (ganhou.repeticoes < perdeu.repeticoes) razoes.push("maior variedade semanal");
    return razoes.join(", ") || "melhor resultado combinado na regua tecnica";
}

async function carregar() {
    const { data: avaliacoes, error } = await supabase.from("avaliacoes_sombra_rotina").select(`
        id_avaliacao_sombra,id_cliente,id_planejamento_rotina,modelo_desafiante,divergiu,confianca_desafiante,amostras_desafiante,
        refeicoes_planejadas(data_refeicao),clientes(nome),
        restaurante_controle:restaurantes!avaliacoes_sombra_rotina_id_restaurante_controle_fkey(nome,latitude,longitude),
        restaurante_desafiante:restaurantes!avaliacoes_sombra_rotina_id_restaurante_desafiante_fkey(nome,latitude,longitude),
        produto_controle:produtos!avaliacoes_sombra_rotina_id_produto_controle_fkey(nome,descricao,preco,categorias(nome)),
        produto_desafiante:produtos!avaliacoes_sombra_rotina_id_produto_desafiante_fkey(nome,descricao,preco,categorias(nome))
    `);
    if (error) throw error;
    const ids = [...new Set((avaliacoes ?? []).map((item) => item.id_cliente))];
    if (!ids.length) return { avaliacoes: [], perfis: new Map(), preferencias: new Map() };
    const [{ data: perfis, error: erroPerfis }, { data: preferencias, error: erroPreferencias }] = await Promise.all([
        supabase.from("perfis_rotina_cliente").select("id_cliente,orcamento_diario,raio_km,latitude,longitude").in("id_cliente", ids).eq("ativo", true),
        supabase.from("preferencias_rotina_cliente").select("id_cliente,valor").in("id_cliente", ids).eq("tipo", "PREFERENCIA"),
    ]);
    if (erroPerfis) throw erroPerfis;
    if (erroPreferencias) throw erroPreferencias;
    return {
        avaliacoes: (avaliacoes ?? []).sort((a, b) => Number(a.id_cliente) - Number(b.id_cliente)
            || String(a.modelo_desafiante).localeCompare(String(b.modelo_desafiante))
            || String(a.refeicoes_planejadas?.data_refeicao ?? "").localeCompare(String(b.refeicoes_planejadas?.data_refeicao ?? ""))
            || Number(a.id_avaliacao_sombra) - Number(b.id_avaliacao_sombra)),
        perfis: new Map((perfis ?? []).map((item) => [item.id_cliente, item])),
        preferencias: (preferencias ?? []).reduce((mapa, item) => {
            if (!mapa.has(item.id_cliente)) mapa.set(item.id_cliente, []);
            mapa.get(item.id_cliente).push(item.valor);
            return mapa;
        }, new Map()),
    };
}

function resumir(resultados) {
    const porModelo = {};
    for (const item of resultados) {
        if (!porModelo[item.modelo]) {
            porModelo[item.modelo] = {
                total: 0, concordancias: 0, divergencias: 0, com_historico: 0, confiancas: [],
                vencedores: { CONTROLE: 0, DESAFIANTE: 0, EMPATE_TECNICO: 0 }, escolhas: new Map(),
                restaurantes: new Set(), produtos: new Set(), categorias: new Set(),
                precos: [], distancias: [], preferencias: 0, violacoes: 0,
            };
        }
        const grupo = porModelo[item.modelo];
        grupo.total += 1;
        grupo[item.divergiu ? "divergencias" : "concordancias"] += 1;
        if (item.amostras > 0) grupo.com_historico += 1;
        if (Number.isFinite(item.confianca)) grupo.confiancas.push(item.confianca);
        grupo.vencedores[item.vencedor] += 1;
        grupo.escolhas.set(item.desafiante, (grupo.escolhas.get(item.desafiante) ?? 0) + 1);
        if (item.restaurante_desafiante) grupo.restaurantes.add(item.restaurante_desafiante);
        if (item.produto_desafiante) grupo.produtos.add(item.produto_desafiante);
        if (item.categoria_desafiante) grupo.categorias.add(item.categoria_desafiante);
        if (Number.isFinite(item.preco_desafiante)) grupo.precos.push(item.preco_desafiante);
        if (Number.isFinite(item.distancia_desafiante)) grupo.distancias.push(item.distancia_desafiante);
        if (item.cobriu_preferencia_explicita) grupo.preferencias += 1;
        if (item.violou_limite_detectavel) grupo.violacoes += 1;
    }
    return Object.fromEntries(Object.entries(porModelo).map(([modelo, grupo]) => [modelo, {
        total: grupo.total,
        concordancias: grupo.concordancias,
        divergencias: grupo.divergencias,
        taxa_divergencia: grupo.total ? Number((grupo.divergencias / grupo.total).toFixed(4)) : 0,
        com_historico: grupo.com_historico,
        confianca_media: grupo.confiancas.length
            ? Number((grupo.confiancas.reduce((soma, valor) => soma + valor, 0) / grupo.confiancas.length).toFixed(4)) : null,
        vencedores: grupo.vencedores,
        maior_concentracao_mesma_opcao: Math.max(0, ...grupo.escolhas.values()),
        diversidade: {
            restaurantes: grupo.restaurantes.size,
            produtos: grupo.produtos.size,
            categorias: grupo.categorias.size,
        },
        preco_medio: grupo.precos.length
            ? Number((grupo.precos.reduce((soma, valor) => soma + valor, 0) / grupo.precos.length).toFixed(2)) : null,
        distancia_media_km: grupo.distancias.length
            ? Number((grupo.distancias.reduce((soma, valor) => soma + valor, 0) / grupo.distancias.length).toFixed(2)) : null,
        cobertura_preferencia_explicita: grupo.total ? Number((grupo.preferencias / grupo.total).toFixed(4)) : 0,
        violacoes_orcamento_ou_raio: grupo.violacoes,
    }]));
}

async function main() {
    const { avaliacoes, perfis, preferencias } = await carregar();
    const usos = new Map();
    const resultados = avaliacoes.map((item) => {
        const perfil = perfis.get(item.id_cliente);
        const preferenciasCliente = preferencias.get(item.id_cliente) ?? [];
        const chaveUso = `${item.id_cliente}:${item.modelo_desafiante}`;
        if (!usos.has(chaveUso)) usos.set(chaveUso, { controle: new Map(), desafiante: new Map() });
        const uso = usos.get(chaveUso);
        const controle = pontuar({ produto: item.produto_controle, restaurante: item.restaurante_controle, perfil, preferencias: preferenciasCliente, usosRestaurante: uso.controle });
        const desafiante = pontuar({ produto: item.produto_desafiante, restaurante: item.restaurante_desafiante, perfil, preferencias: preferenciasCliente, usosRestaurante: uso.desafiante });
        const resultado = vencedor(controle, desafiante, item.divergiu);
        uso.controle.set(item.restaurante_controle?.nome, (uso.controle.get(item.restaurante_controle?.nome) ?? 0) + 1);
        uso.desafiante.set(item.restaurante_desafiante?.nome, (uso.desafiante.get(item.restaurante_desafiante?.nome) ?? 0) + 1);
        return {
            modelo: item.modelo_desafiante,
            divergiu: item.divergiu,
            cliente: item.clientes?.nome,
            data: item.refeicoes_planejadas?.data_refeicao,
            controle: `${item.restaurante_controle?.nome} / ${item.produto_controle?.nome}`,
            desafiante: `${item.restaurante_desafiante?.nome} / ${item.produto_desafiante?.nome}`,
            pontos_controle: controle.total,
            pontos_desafiante: desafiante.total,
            ...resultado,
            motivo: motivos(controle, desafiante, resultado),
            amostras: Number(item.amostras_desafiante ?? 0),
            confianca: Number(item.confianca_desafiante),
            restaurante_desafiante: item.restaurante_desafiante?.nome ?? null,
            produto_desafiante: item.produto_desafiante?.nome ?? null,
            categoria_desafiante: item.produto_desafiante?.categorias?.nome ?? null,
            preco_desafiante: desafiante.preco,
            distancia_desafiante: desafiante.distancia,
            cobriu_preferencia_explicita: desafiante.preferencia,
            violou_limite_detectavel: (Number(perfil?.orcamento_diario) > 0 && desafiante.preco > Number(perfil.orcamento_diario))
                || (Number(perfil?.raio_km) > 0 && desafiante.distancia !== null && desafiante.distancia > Number(perfil.raio_km)),
        };
    });
    const exibidos = process.argv.includes("--divergencias") ? resultados.filter((item) => item.divergiu) : resultados;
    console.log(JSON.stringify({ regua: REGUA_AVALIACAO, resumo_por_modelo: resumir(resultados), resultados: exibidos }, null, 2));
}

main().catch((error) => {
    console.error("ROUTINE_SHADOW_EVALUATION_FAILED", error.code ?? "UNKNOWN", error.message);
    process.exitCode = 1;
});

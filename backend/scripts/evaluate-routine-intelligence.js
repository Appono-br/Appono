"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { validarCompatibilidadeRelatorio } = require("../src/domain/routine-experiment-manifest");

const argumento = (nome, fallback) => {
    const prefixo = `--${nome}=`;
    const item = process.argv.find((valor) => valor.startsWith(prefixo));
    return item ? item.slice(prefixo.length) : fallback;
};

const conjunto = argumento("dataset", "validacao");
const arquivo = path.resolve(__dirname, `../reports/routine-intelligence/${conjunto}.json`);
if (!fs.existsSync(arquivo)) throw new Error(`Execute primeiro a simulacao do conjunto ${conjunto}`);
const relatorio = JSON.parse(fs.readFileSync(arquivo, "utf8"));
const manifesto = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../experiments/routine-intelligence/manifest.json"), "utf8"));
validarCompatibilidadeRelatorio(manifesto, relatorio);

function media(campo, modelo) {
    return relatorio.personas.reduce((soma, item) => soma + Number(item[modelo][campo] ?? 0), 0) / relatorio.personas.length;
}

const controleSemHistorico = relatorio.personas.find((item) => item.persona === "controle_sem_historico");
const regressoes = relatorio.personas.map((item) => ({
    persona: item.persona,
    delta_arrependimento: Number((item.v2.arrependimento_medio - item.controle.arrependimento_medio).toFixed(4)),
})).filter((item) => item.delta_arrependimento > 2);
const criterios = {
    zero_violacoes: relatorio.violacoes_eliminatorias === 0,
    v2_supera_v1_em_arrependimento: media("arrependimento_medio", "v2") <= media("arrependimento_medio", "v1"),
    v2_nao_inferior_ao_controle: media("arrependimento_medio", "v2") <= media("arrependimento_medio", "controle"),
    sem_regressao_grave_por_persona: regressoes.length === 0,
    neutra_sem_historico: Boolean(controleSemHistorico)
        && controleSemHistorico.v2.confianca_media === 0
        && controleSemHistorico.v2.utilidade_media === controleSemHistorico.controle.utilidade_media
        && controleSemHistorico.v2.arrependimento_medio === controleSemHistorico.controle.arrependimento_medio,
    concentracao_nao_pior_que_v1: Math.max(...relatorio.personas.map((item) => item.v2.concentracao_maxima))
        <= Math.max(...relatorio.personas.map((item) => item.v1.concentracao_maxima)),
};
const aprovado = Object.values(criterios).every(Boolean);
const resultado = {
    protocolo: relatorio.protocolo,
    conjunto,
    criterios,
    regressoes_graves: regressoes,
    medias: {
        controle_arrependimento: Number(media("arrependimento_medio", "controle").toFixed(4)),
        v1_arrependimento: Number(media("arrependimento_medio", "v1").toFixed(4)),
        v2_arrependimento: Number(media("arrependimento_medio", "v2").toFixed(4)),
    },
    decisao: aprovado ? "IA_PRONTA_EM_HOMOLOGACAO" : "MANTER_EM_SOMBRA",
};
console.log(JSON.stringify(resultado, null, 2));
if (!aprovado) process.exitCode = 2;

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { anonimizarRevisaoCega, simularInteligenciaRotina } = require("../src/domain/routine-intelligence-simulation");
const { validarCompatibilidadeRelatorio } = require("../src/domain/routine-experiment-manifest");

const argumento = (nome, fallback) => {
    const prefixo = `--${nome}=`;
    const item = process.argv.find((valor) => valor.startsWith(prefixo));
    return item ? item.slice(prefixo.length) : fallback;
};

const conjunto = argumento("dataset", "desenvolvimento");
const semanas = Number(argumento("weeks", "6"));
if (conjunto === "reserva" && !process.argv.includes("--confirm-reserve")) {
    throw new Error("O conjunto de reserva exige --confirm-reserve e deve ser executado somente apos congelar a candidata.");
}

const relatorio = simularInteligenciaRotina({ conjunto, semanas });
const manifesto = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../experiments/routine-intelligence/manifest.json"), "utf8"));
validarCompatibilidadeRelatorio(manifesto, relatorio);
const destino = path.resolve(__dirname, "../reports/routine-intelligence");
fs.mkdirSync(destino, { recursive: true });
fs.writeFileSync(path.join(destino, `${conjunto}.json`), `${JSON.stringify(relatorio, null, 2)}\n`);
if (conjunto === "validacao") {
    fs.writeFileSync(path.join(destino, "blind-review.json"), `${JSON.stringify(anonimizarRevisaoCega(relatorio), null, 2)}\n`);
}

const agregado = relatorio.personas.reduce((total, item) => {
    for (const modelo of ["controle", "v1", "v2"]) {
        total[modelo].utilidade += item[modelo].utilidade_media;
        total[modelo].arrependimento += item[modelo].arrependimento_medio;
        total[modelo].concentracao = Math.max(total[modelo].concentracao, item[modelo].concentracao_maxima);
    }
    return total;
}, {
    controle: { utilidade: 0, arrependimento: 0, concentracao: 0 },
    v1: { utilidade: 0, arrependimento: 0, concentracao: 0 },
    v2: { utilidade: 0, arrependimento: 0, concentracao: 0 },
});
for (const item of Object.values(agregado)) {
    item.utilidade_media_personas = Number((item.utilidade / relatorio.personas.length).toFixed(4));
    item.arrependimento_medio_personas = Number((item.arrependimento / relatorio.personas.length).toFixed(4));
    delete item.utilidade;
    delete item.arrependimento;
}
console.log(JSON.stringify({
    conjunto: relatorio.conjunto,
    semanas: relatorio.semanas,
    personas: relatorio.personas.length,
    decisoes_por_modelo: relatorio.personas.reduce((soma, item) => soma + item.controle.decisoes, 0),
    desacordos_controle_v2: relatorio.desacordos.length,
    violacoes_eliminatorias: relatorio.violacoes_eliminatorias,
    agregado,
    relatorio: path.relative(process.cwd(), path.join(destino, `${conjunto}.json`)),
}, null, 2));

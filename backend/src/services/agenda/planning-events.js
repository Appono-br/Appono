"use strict";

const crypto = require("node:crypto");

function relacao(valor) {
    return Array.isArray(valor) ? valor[0] ?? null : valor ?? null;
}

function limitarTexto(valor, limite) {
    return String(valor ?? "").trim().slice(0, limite);
}

function dataHoraLocal(data, hora, minutosAdicionar = 0) {
    const partesHora = String(hora ?? "12:00").split(":").map(Number);
    const partesData = String(data).split("-").map(Number);
    const instante = new Date(Date.UTC(partesData[0], partesData[1] - 1, partesData[2], partesHora[0], partesHora[1], partesHora[2] || 0));
    instante.setUTCMinutes(instante.getUTCMinutes() + minutosAdicionar);
    return instante.toISOString().slice(0, 19);
}

function inicioSemana(data) {
    const instante = new Date(`${data}T12:00:00Z`);
    const dia = instante.getUTCDay() || 7;
    instante.setUTCDate(instante.getUTCDate() - dia + 1);
    return instante.toISOString().slice(0, 10);
}

function idEventoGoogle(idCliente, idRefeicao) {
    const digest = crypto.createHash("sha256").update(`appono:${idCliente}:${idRefeicao}`).digest("hex");
    return `appono${digest}`;
}

function montarEventoGoogle(refeicao, frontendPublicUrl) {
    const restaurante = relacao(refeicao.restaurantes);
    const produto = relacao(refeicao.produtos);
    const janela = relacao(refeicao.janelas_alimentacao_rotina);
    const duracao = Math.min(240, Math.max(30, Number(janela?.tempo_maximo_minutos) || 60));
    const nomeRestaurante = limitarTexto(restaurante?.nome || "Refeição planejada", 120);
    const linhas = [
        janela?.nome ? `Janela: ${limitarTexto(janela.nome, 80)}` : null,
        produto?.nome ? `Prato sugerido: ${limitarTexto(produto.nome, 120)}` : null,
        "Planejamento gerado pelo Appono Rotina. Revise disponibilidade e valores antes de reservar.",
    ].filter(Boolean);
    const origem = String(frontendPublicUrl ?? "").split(",")[0].trim().replace(/\/$/, "");
    return {
        summary: limitarTexto(`Appono Rotina: ${nomeRestaurante}`, 180),
        description: linhas.join("\n"),
        ...(restaurante?.endereco ? { location: limitarTexto(restaurante.endereco, 500) } : {}),
        start: {
            dateTime: dataHoraLocal(refeicao.data_refeicao, refeicao.horario_sugerido),
            timeZone: "America/Sao_Paulo",
        },
        end: {
            dateTime: dataHoraLocal(refeicao.data_refeicao, refeicao.horario_sugerido, duracao),
            timeZone: "America/Sao_Paulo",
        },
        transparency: "opaque",
        visibility: "private",
        reminders: { useDefault: true },
        extendedProperties: {
            private: {
                appono_planejamento_id: String(refeicao.id_planejamento_rotina),
                appono_refeicao_id: String(refeicao.id_refeicao_planejada),
            },
        },
        ...(origem ? { source: { title: "Appono Rotina", url: `${origem}/cliente/rotina/planejamento?semana_inicio=${inicioSemana(refeicao.data_refeicao)}` } } : {}),
    };
}

function hashEvento(evento) {
    return crypto.createHash("sha256").update(JSON.stringify(evento)).digest("hex");
}

module.exports = { hashEvento, idEventoGoogle, montarEventoGoogle };

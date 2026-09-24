export function validarJanela(form) {
    const hora = (valor) => {
        if (!/^\d{2}:\d{2}$/.test(String(valor))) return NaN;
        const [h, m] = valor.split(":").map(Number);
        return h < 24 && m < 60 ? h * 60 + m : NaN;
    };
    const janela = hora(form.horario_fim) - hora(form.horario_inicio);
    if (!Number.isFinite(janela) || janela <= 0) return "O fim da janela precisa ser após o início.";
    if (!form.dias_semana?.length) return "Selecione pelo menos um dia da semana.";
    const tempo = Number(form.tempo_maximo_minutos);
    if (!Number.isInteger(tempo) || tempo < 30 || tempo > 240) return "Informe um limite entre 30 e 240 minutos inteiros.";
    if (tempo > janela) return `O limite não pode ultrapassar os ${janela} minutos da janela.`;
    if (Number(form.raio_km) < 1 || Number(form.raio_km) > 100 || !Number.isFinite(Number(form.raio_km))) return "Informe um raio entre 1 e 100 km.";
    return "";
}

export function refeicaoCancelada(refeicao) {
    if (["RECUSADA", "CANCELADA"].includes(refeicao?.status)) return true;
    return ["CANCELADA", "RECUSADA", "NAO_COMPARECEU"].includes(refeicao?.reservas?.status_reserva);
}

export function estadoPlanejamento({ perfil, planejamento, refeicoes, agora = new Date() }) {
    if (!perfil) return { titulo: "Configure sua rotina", descricao: "Defina seus dias e preferências para começar.", acao: "configurar" };
    if (!planejamento) return { titulo: "Sua semana ainda não foi gerada", descricao: "Seu perfil está salvo. Gere as sugestões para os próximos almoços.", acao: "gerar" };
    const hoje = agora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    if (planejamento.semana_fim < hoje) return { titulo: "Planejamento encerrado", descricao: "A semana anterior terminou. Gere um novo planejamento.", acao: "gerar" };
    const futuras = refeicoes.filter((item) => new Date(`${item.data_refeicao}T${item.horario_sugerido || "00:00:00"}-03:00`) > agora);
    const proxima = futuras.find((item) => item.id_restaurante && !refeicaoCancelada(item));
    if (proxima) return { proxima, titulo: proxima.restaurantes?.nome ?? "Sua próxima refeição", acao: "ver" };
    if (futuras.some((item) => !item.id_restaurante)) {
        const motivos = [...new Set(futuras.filter((item) => !item.id_restaurante).map((item) => item.motivo_recomendacao).filter(Boolean))];
        return {
            titulo: "Nenhuma opção compatível",
            descricao: motivos.length === 1
                ? motivos[0]
                : "O planejamento foi gerado, mas não há sugestões futuras dentro dos seus critérios. Abra a semana para consultar o motivo de cada dia.",
            acao: "ver",
        };
    }
    return { titulo: "Sem próximas refeições", descricao: "As refeições desta semana passaram ou foram recusadas. Consulte o planejamento ou gere outra semana.", acao: "ver" };
}

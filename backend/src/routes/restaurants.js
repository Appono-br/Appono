"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restaurantsRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
exports.restaurantsRouter = (0, express_1.Router)();
function obterClienteLeituraPublica() {
    return supabase_1.supabaseAdmin ?? supabase_1.supabaseAuth;
}
function ordenarPorExibicaoENome(a, b) {
    const ordemA = Number(a.ordem_exibicao ?? 0);
    const ordemB = Number(b.ordem_exibicao ?? 0);
    if (ordemA !== ordemB) {
        return ordemA - ordemB;
    }
    return String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR");
}
function organizarCardapiosPublicos(cardapios) {
    return (cardapios ?? []).map((cardapio) => ({
        ...cardapio,
        categorias: (cardapio.categorias ?? [])
            .filter((categoria) => categoria.ativo !== false && categoria.arquivado !== true)
            .sort(ordenarPorExibicaoENome)
            .map((categoria) => ({
                ...categoria,
                produtos: (categoria.produtos ?? [])
                    .filter((produto) => produto.disponivel === true && produto.arquivado !== true)
                    .sort(ordenarPorExibicaoENome),
            }))
            .filter((categoria) => categoria.produtos.length > 0),
    }));
}

const diasSemanaOperacao = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function obterDataLocalSaoPaulo() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}

function formatarDataLocal(data) {
    return [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0"),
    ].join("-");
}

function converterHoraParaMinutos(horario) {
    const [hora, minuto] = String(horario ?? "").split(":").map(Number);
    if (!Number.isFinite(hora) || !Number.isFinite(minuto)) {
        return null;
    }
    return hora * 60 + minuto;
}

function converterMinutosParaHora(totalMinutos) {
    const hora = Math.floor(totalMinutos / 60);
    const minuto = totalMinutos % 60;
    return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

function obterFimReserva(horarioInicio) {
    const inicio = converterHoraParaMinutos(horarioInicio);
    return converterMinutosParaHora((inicio + 120) % (24 * 60));
}

function intervalosSobrepoem(inicioA, fimA, inicioB, fimB) {
    return inicioA < fimB && fimA > inicioB;
}

function restauranteTemOperacaoConfigurada(configuracao = {}) {
    return Array.isArray(configuracao.days) &&
        configuracao.days.some((day) => day.enabled === true &&
            Array.isArray(day.shifts) &&
            day.shifts.some((shift) => shift.open && shift.close));
}

function obterDiaOperacao(configuracao, dataReserva) {
    const data = new Date(`${dataReserva}T12:00:00`);
    return configuracao.days?.find((day) => day.id === diasSemanaOperacao[data.getDay()]);
}

function montarHorariosOperacionais({ restaurante, dataReserva, pessoas, tempoPreparo, reservas, mesas }) {
    const configuracao = restaurante.configuracao_operacao ?? {};
    if (!restauranteTemOperacaoConfigurada(configuracao)) {
        return {
            operacao_configurada: false,
            horarios: [],
            motivo: "Restaurante ainda nao configurou horarios de funcionamento.",
        };
    }

    const dia = obterDiaOperacao(configuracao, dataReserva);
    if (!dia?.enabled || !Array.isArray(dia.shifts)) {
        return {
            operacao_configurada: true,
            horarios: [],
            motivo: "Restaurante fechado nesta data.",
        };
    }

    const agora = obterDataLocalSaoPaulo();
    const hoje = formatarDataLocal(agora);
    const antecedenciaMinima = Math.max(Number(configuracao.antecedenciaMinutosReserva ?? 60), Number(tempoPreparo ?? 0), 0);
    const minimoMesmoDia = dataReserva === hoje ? agora.getHours() * 60 + agora.getMinutes() + antecedenciaMinima : 0;
    const duracaoReserva = 120;
    const mesasCompativeis = (mesas ?? []).filter((mesa) => Number(mesa.capacidade ?? 0) >= pessoas);
    const horarios = [];

    for (const shift of dia.shifts) {
        const abertura = converterHoraParaMinutos(shift.open);
        const fechamento = converterHoraParaMinutos(shift.close);
        if (abertura === null || fechamento === null || abertura >= fechamento) {
            continue;
        }

        const primeiroSlot = Math.ceil(abertura / 30) * 30;
        for (let minuto = primeiroSlot; minuto + duracaoReserva <= fechamento; minuto += 30) {
            const horario = converterMinutosParaHora(minuto);
            const fim = minuto + duracaoReserva;
            let motivo = null;

            if (minuto < minimoMesmoDia) {
                motivo = "antecedencia minima";
            }
            else if (!mesasCompativeis.length) {
                motivo = "sem mesa para este grupo";
            }
            else {
                const mesaLivre = mesasCompativeis.some((mesa) => !(reservas ?? []).some((reserva) => {
                    if (reserva.id_mesa !== mesa.id_mesa) {
                        return false;
                    }
                    const inicioReserva = converterHoraParaMinutos(reserva.horario_inicio);
                    const fimReserva = converterHoraParaMinutos(reserva.horario_fim);
                    return intervalosSobrepoem(minuto, fim, inicioReserva, fimReserva);
                }));

                if (!mesaLivre) {
                    motivo = "mesas ocupadas";
                }
            }

            horarios.push({
                horario,
                horario_fim: obterFimReserva(horario),
                disponivel: !motivo,
                motivo,
            });
        }
    }

    return {
        operacao_configurada: true,
        antecedencia_minima_minutos: antecedenciaMinima,
        horarios,
        motivo: horarios.length ? null : "Nao ha turnos validos nesta data.",
    };
}
exports.restaurantsRouter.get("/", async (_req, res) => {
    const { data, error } = await obterClienteLeituraPublica()
        .from("restaurantes")
        .select("id_restaurante, nome, telefone, email, cep, endereco, horario_funcionamento, logo_url")
        .eq("ativo", true)
        .order("nome");
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
});
exports.restaurantsRouter.get("/:id/disponibilidade", async (req, res) => {
    const restaurantId = Number(req.params.id);
    const dataReserva = String(req.query.data ?? "");
    const pessoas = Math.max(1, Number(req.query.pessoas ?? 1));
    const tempoPreparo = Math.max(0, Number(req.query.tempo_preparo ?? 0));
    if (!Number.isFinite(restaurantId) || !/^\d{4}-\d{2}-\d{2}$/.test(dataReserva) || !Number.isFinite(pessoas)) {
        return res.status(400).json({ error: "Parametros de disponibilidade invalidos." });
    }
    const cliente = obterClienteLeituraPublica();
    const { data: restaurante, error: restauranteError } = await cliente
        .from("restaurantes")
        .select("id_restaurante, configuracao_operacao")
        .eq("id_restaurante", restaurantId)
        .eq("ativo", true)
        .single();
    if (restauranteError || !restaurante) {
        return res.status(404).json({ error: "Restaurante nao encontrado." });
    }
    const [{ data: mesas, error: mesasError }, { data: reservas, error: reservasError }] = await Promise.all([
        cliente
            .from("mesas")
            .select("id_mesa, capacidade")
            .eq("id_restaurante", restaurantId),
        cliente
            .from("reservas")
            .select("id_reserva, id_mesa, horario_inicio, horario_fim, status_reserva")
            .eq("id_restaurante", restaurantId)
            .eq("data_reserva", dataReserva)
            .in("status_reserva", ["PENDENTE", "CONFIRMADA"]),
    ]);
    if (mesasError || reservasError) {
        return res.status(400).json({ error: mesasError?.message ?? reservasError?.message });
    }
    return res.json(montarHorariosOperacionais({
        restaurante,
        dataReserva,
        pessoas,
        tempoPreparo,
        reservas: reservas ?? [],
        mesas: mesas ?? [],
    }));
});
exports.restaurantsRouter.get("/:id", async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isFinite(restaurantId)) {
        return res.status(400).json({ error: "Restaurante invalido." });
    }
    const { data, error } = await obterClienteLeituraPublica()
        .from("restaurantes")
        .select("id_restaurante, nome, telefone, email, endereco, horario_funcionamento, logo_url, valor_minimo_reserva_por_pessoa, configuracao_operacao")
        .eq("id_restaurante", restaurantId)
        .eq("ativo", true)
        .single();
    if (error) {
        return res.status(404).json({ error: "Restaurante nao encontrado." });
    }
    return res.json(data);
});
exports.restaurantsRouter.get("/:id/cardapio", async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isFinite(restaurantId)) {
        return res.status(400).json({ error: "Restaurante invalido." });
    }
    const { data: cardapios, error: cardapiosError } = await obterClienteLeituraPublica()
        .from("cardapios")
        .select("id_cardapio, nome, descricao, horario_inicio, horario_fim, categorias(id_categoria, nome, descricao, ativo, arquivado, ordem_exibicao, produtos(id_produto, nome, descricao, tempo_preparo_minutos, preco, imagem_url, disponivel, destaque, arquivado, ordem_exibicao))")
        .eq("id_restaurante", restaurantId)
        .eq("ativo", true)
        .eq("categorias.ativo", true)
        .eq("categorias.arquivado", false)
        .eq("categorias.produtos.disponivel", true)
        .eq("categorias.produtos.arquivado", false)
        .order("nome");
    if (cardapiosError) {
        return res.status(400).json({ error: cardapiosError.message });
    }
    return res.json(organizarCardapiosPublicos(cardapios));
});

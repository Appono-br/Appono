"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restaurantsRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
exports.restaurantsRouter = (0, express_1.Router)();
function obterClienteLeituraPublica() {
    return supabase_1.supabaseAdmin ?? supabase_1.supabaseAuth;
}
async function obterUsuarioOpcional(req) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        return null;
    }
    const accessToken = authorization.slice(7);
    const clienteAutenticacao = supabase_1.supabaseAdmin ?? supabase_1.supabaseAuth;
    const { data: { user } } = await clienteAutenticacao.auth.getUser(accessToken);
    return user ?? null;
}
async function obterClientePorUsuario(userId) {
    if (!userId) {
        return null;
    }
    const { data, error } = await obterClienteLeituraPublica()
        .from("clientes")
        .select("id_cliente")
        .eq("id_auth", userId)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return data ?? null;
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
function normalizarBusca(valor) {
    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}
function restauranteCorrespondeBusca(restaurante, termo) {
    if (!termo) {
        return true;
    }
    return [
        restaurante.nome,
        restaurante.razao_social,
        restaurante.endereco,
        restaurante.cep,
        restaurante.horario_funcionamento,
    ].map(normalizarBusca).join(" ").includes(termo);
}
async function obterProdutosCorrespondentes(termo) {
    if (!termo) {
        return new Map();
    }
    const { data, error } = await obterClienteLeituraPublica()
        .from("produtos")
        .select("id_restaurante, nome, descricao")
        .eq("disponivel", true)
        .eq("arquivado", false);
    if (error) {
        return new Map();
    }
    return (data ?? []).reduce((mapa, produto) => {
        const conteudo = [produto.nome, produto.descricao].map(normalizarBusca).join(" ");
        if (!conteudo.includes(termo)) {
            return mapa;
        }
        const atuais = mapa.get(produto.id_restaurante) ?? [];
        atuais.push({ nome: produto.nome, descricao: produto.descricao });
        mapa.set(produto.id_restaurante, atuais.slice(0, 3));
        return mapa;
    }, new Map());
}
async function obterMetricasRestaurantes(idsRestaurantes, idCliente) {
    const ids = [...new Set((idsRestaurantes ?? []).filter(Boolean))];
    const metricas = new Map(ids.map((id) => [id, {
        avaliacao_media: null,
        total_avaliacoes: 0,
        total_favoritos: 0,
        favorito_cliente: false,
    }]));
    if (!ids.length) {
        return metricas;
    }
    const cliente = obterClienteLeituraPublica();
    const [avaliacoesResposta, favoritosResposta, favoritosClienteResposta] = await Promise.all([
        cliente.from("avaliacoes_restaurante").select("id_restaurante, nota").in("id_restaurante", ids),
        cliente.from("restaurantes_favoritos").select("id_restaurante").in("id_restaurante", ids),
        idCliente
            ? cliente.from("restaurantes_favoritos").select("id_restaurante").eq("id_cliente", idCliente).in("id_restaurante", ids)
            : Promise.resolve({ data: [], error: null }),
    ]);
    if (!avaliacoesResposta.error) {
        const agrupadas = new Map();
        for (const avaliacao of avaliacoesResposta.data ?? []) {
            const atual = agrupadas.get(avaliacao.id_restaurante) ?? { soma: 0, total: 0 };
            atual.soma += Number(avaliacao.nota ?? 0);
            atual.total += 1;
            agrupadas.set(avaliacao.id_restaurante, atual);
        }
        for (const [id, dados] of agrupadas.entries()) {
            const metrica = metricas.get(id);
            if (metrica) {
                metrica.avaliacao_media = Number((dados.soma / dados.total).toFixed(1));
                metrica.total_avaliacoes = dados.total;
            }
        }
    }
    if (!favoritosResposta.error) {
        for (const favorito of favoritosResposta.data ?? []) {
            const metrica = metricas.get(favorito.id_restaurante);
            if (metrica) {
                metrica.total_favoritos += 1;
            }
        }
    }
    if (!favoritosClienteResposta.error) {
        for (const favorito of favoritosClienteResposta.data ?? []) {
            const metrica = metricas.get(favorito.id_restaurante);
            if (metrica) {
                metrica.favorito_cliente = true;
            }
        }
    }
    return metricas;
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
exports.restaurantsRouter.get("/", async (req, res) => {
    try {
        const termoBusca = normalizarBusca(req.query.q);
        const usuario = await obterUsuarioOpcional(req);
        const cliente = await obterClientePorUsuario(usuario?.id);
        const [restaurantesResposta, produtosCorrespondentes] = await Promise.all([
            obterClienteLeituraPublica()
                .from("restaurantes")
                .select("id_restaurante, nome, razao_social, telefone, email, cep, endereco, horario_funcionamento, logo_url, valor_minimo_reserva_por_pessoa")
                .eq("ativo", true)
                .order("nome"),
            obterProdutosCorrespondentes(termoBusca),
        ]);
        if (restaurantesResposta.error) {
            return res.status(400).json({ error: restaurantesResposta.error.message });
        }
        const restaurantesFiltrados = (restaurantesResposta.data ?? []).filter((restaurante) => restauranteCorrespondeBusca(restaurante, termoBusca) ||
            produtosCorrespondentes.has(restaurante.id_restaurante));
        const metricas = await obterMetricasRestaurantes(restaurantesFiltrados.map((restaurante) => restaurante.id_restaurante), cliente?.id_cliente);
        return res.json(restaurantesFiltrados.map((restaurante) => ({
            ...restaurante,
            produtos_encontrados: produtosCorrespondentes.get(restaurante.id_restaurante) ?? [],
            ...(metricas.get(restaurante.id_restaurante) ?? {}),
        })));
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível listar restaurantes.",
        });
    }
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
            .in("status_reserva", ["PENDENTE", "CONFIRMADA", "CHECK_IN"]),
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
    try {
        const usuario = await obterUsuarioOpcional(req);
        const cliente = await obterClientePorUsuario(usuario?.id);
        const [{ data, error }, metricas, { data: avaliacoes }] = await Promise.all([
            obterClienteLeituraPublica()
                .from("restaurantes")
                .select("id_restaurante, nome, telefone, email, endereco, horario_funcionamento, logo_url, valor_minimo_reserva_por_pessoa, configuracao_operacao")
                .eq("id_restaurante", restaurantId)
                .eq("ativo", true)
                .single(),
            obterMetricasRestaurantes([restaurantId], cliente?.id_cliente),
            obterClienteLeituraPublica()
                .from("avaliacoes_restaurante")
                .select("id_avaliacao, nota, comentario, created_at, clientes(nome)")
                .eq("id_restaurante", restaurantId)
                .order("created_at", { ascending: false })
                .limit(4),
        ]);
        if (error) {
            return res.status(404).json({ error: "Restaurante nao encontrado." });
        }
        return res.json({
            ...data,
            ...(metricas.get(restaurantId) ?? {}),
            avaliacoes_recentes: (avaliacoes ?? []).filter((avaliacao) => avaliacao.comentario),
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível carregar o restaurante.",
        });
    }
});
exports.restaurantsRouter.patch("/:id/favorito", auth_1.requireAuth, async (req, res) => {
    const restaurantId = Number(req.params.id);
    const favorito = Boolean(req.body?.favorito);
    if (!Number.isFinite(restaurantId)) {
        return res.status(400).json({ error: "Restaurante inválido." });
    }
    try {
        if (!res.locals.user?.id) {
            return res.status(403).json({ error: "Apenas clientes podem favoritar restaurantes." });
        }
        const cliente = await obterClientePorUsuario(res.locals.user?.id);
        if (!cliente) {
            return res.status(403).json({ error: "Cliente não encontrado." });
        }
        const banco = obterClienteLeituraPublica();
        if (favorito) {
            const { error } = await banco
                .from("restaurantes_favoritos")
                .upsert({ id_cliente: cliente.id_cliente, id_restaurante: restaurantId }, { onConflict: "id_cliente,id_restaurante" });
            if (error) {
                throw new Error(error.message);
            }
        }
        else {
            const { error } = await banco
                .from("restaurantes_favoritos")
                .delete()
                .eq("id_cliente", cliente.id_cliente)
                .eq("id_restaurante", restaurantId);
            if (error) {
                throw new Error(error.message);
            }
        }
        const metricas = await obterMetricasRestaurantes([restaurantId], cliente.id_cliente);
        return res.json({ id_restaurante: restaurantId, ...(metricas.get(restaurantId) ?? {}) });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível atualizar favorito.",
        });
    }
});
exports.restaurantsRouter.get("/:id/minha-avaliacao", auth_1.requireAuth, async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isFinite(restaurantId)) {
        return res.status(400).json({ error: "Restaurante inválido." });
    }
    try {
        if (!res.locals.user?.id) {
            return res.status(403).json({ error: "Apenas clientes podem consultar avaliações próprias." });
        }
        const cliente = await obterClientePorUsuario(res.locals.user?.id);
        if (!cliente) {
            return res.status(403).json({ error: "Cliente não encontrado." });
        }
        const { data, error } = await obterClienteLeituraPublica()
            .from("avaliacoes_restaurante")
            .select("*")
            .eq("id_cliente", cliente.id_cliente)
            .eq("id_restaurante", restaurantId)
            .maybeSingle();
        if (error) {
            throw new Error(error.message);
        }
        return res.json(data);
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível carregar a avaliação.",
        });
    }
});
exports.restaurantsRouter.post("/:id/avaliacoes", auth_1.requireAuth, async (req, res) => {
    const restaurantId = Number(req.params.id);
    const nota = Number(req.body?.nota);
    const comentario = String(req.body?.comentario ?? "").trim() || null;
    if (!Number.isFinite(restaurantId) || !Number.isInteger(nota) || nota < 1 || nota > 5) {
        return res.status(400).json({ error: "Informe uma nota de 1 a 5." });
    }
    try {
        if (!res.locals.user?.id) {
            return res.status(403).json({ error: "Apenas clientes podem avaliar restaurantes." });
        }
        const cliente = await obterClientePorUsuario(res.locals.user?.id);
        if (!cliente) {
            return res.status(403).json({ error: "Cliente não encontrado." });
        }
        const banco = obterClienteLeituraPublica();
        const [reservaResposta, pedidoResposta] = await Promise.all([
            banco.from("reservas").select("id_reserva").eq("id_cliente", cliente.id_cliente).eq("id_restaurante", restaurantId).eq("status_reserva", "CONCLUIDA").limit(1),
            banco.from("pedidos").select("id_pedido").eq("id_cliente", cliente.id_cliente).eq("id_restaurante", restaurantId).eq("status_pedido", "ENTREGUE").limit(1),
        ]);
        const reserva = reservaResposta.data?.[0] ?? null;
        const pedido = pedidoResposta.data?.[0] ?? null;
        if (!reserva && !pedido) {
            return res.status(403).json({
                error: "Finalize uma reserva ou receba um pedido antes de avaliar este restaurante.",
            });
        }
        const { data, error } = await banco
            .from("avaliacoes_restaurante")
            .upsert({
                id_cliente: cliente.id_cliente,
                id_restaurante: restaurantId,
                id_reserva: reserva?.id_reserva ?? null,
                id_pedido: pedido?.id_pedido ?? null,
                nota,
                comentario,
            }, { onConflict: "id_cliente,id_restaurante" })
            .select("*")
            .single();
        if (error) {
            throw new Error(error.message);
        }
        const metricas = await obterMetricasRestaurantes([restaurantId], cliente.id_cliente);
        return res.json({ avaliacao: data, ...(metricas.get(restaurantId) ?? {}) });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível registrar a avaliação.",
        });
    }
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

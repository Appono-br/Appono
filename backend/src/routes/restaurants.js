"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restaurantsRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const geolocalizacao_1 = require("../services/geolocalizacao");
exports.restaurantsRouter = (0, express_1.Router)();
function obterClienteLeituraPublica() {
    return supabase_1.supabaseAdmin ?? supabase_1.supabaseAuth;
}
function numeroValido(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}
function calcularDistanciaKm(origemLatitude, origemLongitude, destinoLatitude, destinoLongitude) {
    const raioTerraKm = 6371;
    const paraRadianos = (valor) => (valor * Math.PI) / 180;
    const deltaLatitude = paraRadianos(destinoLatitude - origemLatitude);
    const deltaLongitude = paraRadianos(destinoLongitude - origemLongitude);
    const a = Math.sin(deltaLatitude / 2) ** 2 +
        Math.cos(paraRadianos(origemLatitude)) *
            Math.cos(paraRadianos(destinoLatitude)) *
            Math.sin(deltaLongitude / 2) ** 2;
    return raioTerraKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
async function preencherCoordenadasAusentes(restaurantes) {
    if (!supabase_1.supabaseAdmin || !Array.isArray(restaurantes) || !restaurantes.length) {
        return restaurantes;
    }
    const resultado = [];
    for (const restaurante of restaurantes) {
        const latitudeAtual = numeroValido(restaurante.latitude);
        const longitudeAtual = numeroValido(restaurante.longitude);
        if ((0, geolocalizacao_1.coordenadaValida)(latitudeAtual, longitudeAtual)) {
            resultado.push(restaurante);
            continue;
        }
        const coordenadas = await (0, geolocalizacao_1.geocodificarEnderecoRestaurante)(restaurante);
        if (!coordenadas) {
            resultado.push(restaurante);
            continue;
        }
        const geocodificadoEm = new Date().toISOString();
        const { error } = await supabase_1.supabaseAdmin
            .from("restaurantes")
            .update({
            latitude: coordenadas.latitude,
            longitude: coordenadas.longitude,
            geocodificado_em: geocodificadoEm,
        })
            .eq("id_restaurante", restaurante.id_restaurante);
        resultado.push(error
            ? restaurante
            : {
                ...restaurante,
                latitude: coordenadas.latitude,
                longitude: coordenadas.longitude,
                geocodificado_em: geocodificadoEm,
            });
    }
    return resultado;
}
function erroColunaGeolocalizacaoAusente(error) {
    const mensagem = String(error?.message ?? "").toLowerCase();
    return mensagem.includes("latitude") || mensagem.includes("longitude") || mensagem.includes("geocodificado");
}
async function consultarRestaurantesPublicos() {
    const cliente = obterClienteLeituraPublica();
    const consulta = cliente
        .from("restaurantes")
        .select("id_restaurante, nome, razao_social, telefone, email, cep, endereco, horario_funcionamento, logo_url, valor_minimo_reserva_por_pessoa, latitude, longitude")
        .eq("ativo", true)
        .order("nome");
    const resposta = await consulta;
    if (!resposta.error || !erroColunaGeolocalizacaoAusente(resposta.error)) {
        return resposta;
    }
    return cliente
        .from("restaurantes")
        .select("id_restaurante, nome, razao_social, telefone, email, cep, endereco, horario_funcionamento, logo_url, valor_minimo_reserva_por_pessoa")
        .eq("ativo", true)
        .order("nome");
}
async function consultarRestaurantePublicoPorId(restaurantId) {
    const cliente = obterClienteLeituraPublica();
    const resposta = await cliente
        .from("restaurantes")
        .select("id_restaurante, nome, telefone, email, endereco, horario_funcionamento, logo_url, valor_minimo_reserva_por_pessoa, configuracao_operacao, latitude, longitude")
        .eq("id_restaurante", restaurantId)
        .eq("ativo", true)
        .single();
    if (!resposta.error || !erroColunaGeolocalizacaoAusente(resposta.error)) {
        return resposta;
    }
    return cliente
        .from("restaurantes")
        .select("id_restaurante, nome, telefone, email, endereco, horario_funcionamento, logo_url, valor_minimo_reserva_por_pessoa, configuracao_operacao")
        .eq("id_restaurante", restaurantId)
        .eq("ativo", true)
        .single();
}
async function obterUsuarioOpcional(req) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) return null;
    const { data: { user } } = await supabase_1.supabaseAuth.auth.getUser(authorization.slice(7));
    return user ?? null;
}
async function obterClientePorUsuario(userId) {
    if (!userId || !supabase_1.supabaseAdmin) return null;
    const { data, error } = await supabase_1.supabaseAdmin.from("clientes").select("id_cliente").eq("id_auth", userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
}
async function obterMetricas(idsRestaurantes, idCliente = null) {
    const ids = [...new Set(idsRestaurantes.filter(Boolean))];
    const resultado = new Map(ids.map((id) => [id, { avaliacao_media: null, total_avaliacoes: 0, total_favoritos: 0, favorito_cliente: false }]));
    if (!ids.length || !supabase_1.supabaseAdmin) return resultado;
    const [avaliacoes, favoritos, meusFavoritos] = await Promise.all([
        supabase_1.supabaseAdmin.from("avaliacoes_restaurante").select("id_restaurante, nota").in("id_restaurante", ids),
        supabase_1.supabaseAdmin.from("restaurantes_favoritos").select("id_restaurante").in("id_restaurante", ids),
        idCliente ? supabase_1.supabaseAdmin.from("restaurantes_favoritos").select("id_restaurante").eq("id_cliente", idCliente).in("id_restaurante", ids) : Promise.resolve({ data: [] }),
    ]);
    for (const avaliacao of avaliacoes.data ?? []) {
        const metrica = resultado.get(avaliacao.id_restaurante);
        metrica.soma_notas = (metrica.soma_notas ?? 0) + Number(avaliacao.nota);
        metrica.total_avaliacoes += 1;
    }
    for (const metrica of resultado.values()) {
        if (metrica.total_avaliacoes) metrica.avaliacao_media = Number((metrica.soma_notas / metrica.total_avaliacoes).toFixed(1));
        delete metrica.soma_notas;
    }
    for (const favorito of favoritos.data ?? []) resultado.get(favorito.id_restaurante).total_favoritos += 1;
    for (const favorito of meusFavoritos.data ?? []) resultado.get(favorito.id_restaurante).favorito_cliente = true;
    return resultado;
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
    if (!termo) return true;
    return [
        restaurante.nome,
        restaurante.razao_social,
        restaurante.endereco,
        restaurante.cep,
        restaurante.horario_funcionamento,
    ].map(normalizarBusca).join(" ").includes(termo);
}
async function obterProdutosCorrespondentes(termo) {
    if (!termo) return new Map();
    const { data, error } = await obterClienteLeituraPublica()
        .from("produtos")
        .select("id_restaurante, nome, descricao")
        .eq("disponivel", true)
        .eq("arquivado", false);
    if (error) return new Map();
    return (data ?? []).reduce((mapa, produto) => {
        const conteudo = [produto.nome, produto.descricao].map(normalizarBusca).join(" ");
        if (!conteudo.includes(termo)) return mapa;
        const atuais = mapa.get(produto.id_restaurante) ?? [];
        atuais.push({ nome: produto.nome, descricao: produto.descricao });
        mapa.set(produto.id_restaurante, atuais.slice(0, 3));
        return mapa;
    }, new Map());
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
    if (!Number.isFinite(hora) || !Number.isFinite(minuto)) return null;
    return hora * 60 + minuto;
}
function converterMinutosParaHora(totalMinutos) {
    const hora = Math.floor(totalMinutos / 60);
    const minuto = totalMinutos % 60;
    return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}
function obterFimReserva(horarioInicio) {
    const inicio = converterHoraParaMinutos(horarioInicio);
    if (inicio === null) return null;
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
function montarHorariosOperacionais({ restaurante, dataReserva, pessoas, reservas, mesas }) {
    const configuracao = restaurante.configuracao_operacao ?? {};
    if (!restauranteTemOperacaoConfigurada(configuracao)) {
        return {
            operacao_configurada: false,
            horarios: [],
            motivo: "Restaurante ainda não configurou horários de funcionamento.",
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
    const antecedenciaMinima = Math.max(Number(configuracao.antecedenciaMinutosReserva ?? 60), 0);
    const minimoMesmoDia = dataReserva === hoje ? agora.getHours() * 60 + agora.getMinutes() + antecedenciaMinima : 0;
    const duracaoReserva = 120;
    const mesasCompativeis = (mesas ?? []).filter((mesa) => Number(mesa.capacidade ?? 0) >= pessoas);
    const horarios = [];
    for (const shift of dia.shifts) {
        const abertura = converterHoraParaMinutos(shift.open);
        const fechamento = converterHoraParaMinutos(shift.close);
        if (abertura === null || fechamento === null || abertura >= fechamento) continue;
        const primeiroSlot = Math.ceil(abertura / 30) * 30;
        for (let minuto = primeiroSlot; minuto + duracaoReserva <= fechamento; minuto += 30) {
            const horario = converterMinutosParaHora(minuto);
            const fim = minuto + duracaoReserva;
            let motivo = null;
            if (minuto < minimoMesmoDia) {
                motivo = "antecedência mínima";
            }
            else if (!mesasCompativeis.length) {
                motivo = "sem mesa para este grupo";
            }
            else {
                const mesaLivre = mesasCompativeis.some((mesa) => !(reservas ?? []).some((reserva) => {
                    if (reserva.id_mesa !== mesa.id_mesa) return false;
                    const inicioReserva = converterHoraParaMinutos(reserva.horario_inicio);
                    const fimReserva = converterHoraParaMinutos(reserva.horario_fim);
                    return intervalosSobrepoem(minuto, fim, inicioReserva, fimReserva);
                }));
                if (!mesaLivre) motivo = "mesas ocupadas";
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
        motivo: horarios.length ? null : "Não há turnos válidos nesta data.",
    };
}
exports.restaurantsRouter.get("/", async (req, res) => {
    try {
        const termoBusca = normalizarBusca(req.query.q);
        let latitudeCliente = numeroValido(req.query.latitude);
        let longitudeCliente = numeroValido(req.query.longitude);
        let origemDistancia = (0, geolocalizacao_1.coordenadaValida)(latitudeCliente, longitudeCliente) ? "navegador" : null;
        let localizacaoResolvida = null;
        if (!origemDistancia && req.query.localizacao) {
            localizacaoResolvida = await (0, geolocalizacao_1.geocodificarLocalizacao)(req.query.localizacao);
            if (localizacaoResolvida) {
                latitudeCliente = localizacaoResolvida.latitude;
                longitudeCliente = localizacaoResolvida.longitude;
                origemDistancia = "busca";
            }
        }
        const podeCalcularDistancia = Boolean(origemDistancia);
        const raioKm = numeroValido(req.query.raio_km);
        const usuario = await obterUsuarioOpcional(req);
        const cliente = await obterClientePorUsuario(usuario?.id);
        const [restaurantesResposta, produtosCorrespondentes] = await Promise.all([
            consultarRestaurantesPublicos(),
            obterProdutosCorrespondentes(termoBusca),
        ]);
        if (restaurantesResposta.error) {
            return res.status(400).json({ error: restaurantesResposta.error.message });
        }
        const restaurantesFiltrados = (restaurantesResposta.data ?? []).filter((restaurante) => restauranteCorrespondeBusca(restaurante, termoBusca) ||
            produtosCorrespondentes.has(restaurante.id_restaurante));
        const restaurantesComGeolocalizacao = podeCalcularDistancia
            ? await preencherCoordenadasAusentes(restaurantesFiltrados)
            : restaurantesFiltrados;
        const metricas = await obterMetricas(restaurantesComGeolocalizacao.map((item) => item.id_restaurante), cliente?.id_cliente);
        const resposta = restaurantesComGeolocalizacao.map((item) => {
            const latitudeRestaurante = numeroValido(item.latitude);
            const longitudeRestaurante = numeroValido(item.longitude);
            const distanciaKm = podeCalcularDistancia && (0, geolocalizacao_1.coordenadaValida)(latitudeRestaurante, longitudeRestaurante)
                ? Number(calcularDistanciaKm(latitudeCliente, longitudeCliente, latitudeRestaurante, longitudeRestaurante).toFixed(1))
                : null;
            return {
                ...item,
                distancia_km: distanciaKm,
                origem_distancia: origemDistancia,
                localizacao_resolvida: localizacaoResolvida?.nome ?? null,
                produtos_encontrados: produtosCorrespondentes.get(item.id_restaurante) ?? [],
                ...metricas.get(item.id_restaurante),
            };
        }).filter((item) => {
            if (!podeCalcularDistancia || !Number.isFinite(raioKm) || raioKm <= 0) return true;
            return item.distancia_km !== null && item.distancia_km <= raioKm;
        }).sort((a, b) => {
            if (!podeCalcularDistancia) return 0;
            if (a.distancia_km === null && b.distancia_km === null) return 0;
            if (a.distancia_km === null) return 1;
            if (b.distancia_km === null) return -1;
            return a.distancia_km - b.distancia_km;
        });
        return res.json(resposta);
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível listar restaurantes.",
        });
    }
});
exports.restaurantsRouter.get("/me/avaliacoes", auth_1.requireAuth, (0, auth_1.requireRole)("restaurante"), async (req, res) => {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(req.query.page_size, 10) || 20, 1), 50);
    const from = (page - 1) * pageSize;
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data, error, count } = await supabase.from("avaliacoes_restaurante")
        .select("id_avaliacao, nota, comentario, created_at, clientes(nome)", { count: "exact" })
        .eq("id_restaurante", res.locals.profileId).order("created_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) return res.status(400).json({ error: error.message });
    const metricas = await obterMetricas([res.locals.profileId]);
    return res.json({ items: data ?? [], page, page_size: pageSize, total: count ?? 0, metricas: metricas.get(res.locals.profileId) });
});
exports.restaurantsRouter.get("/:id/disponibilidade", async (req, res) => {
    const restaurantId = Number(req.params.id);
    const dataReserva = String(req.query.data ?? "");
    const pessoas = Math.max(1, Number(req.query.pessoas ?? 1));
    if (!Number.isFinite(restaurantId) || !/^\d{4}-\d{2}-\d{2}$/.test(dataReserva) || !Number.isFinite(pessoas)) {
        return res.status(400).json({ error: "Parametros de disponibilidade inválidos." });
    }
    const cliente = obterClienteLeituraPublica();
    const { data: restaurante, error: restauranteError } = await cliente
        .from("restaurantes")
        .select("id_restaurante, configuracao_operacao")
        .eq("id_restaurante", restaurantId)
        .eq("ativo", true)
        .single();
    if (restauranteError || !restaurante) {
        return res.status(404).json({ error: "Restaurante não encontrado." });
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
        reservas: reservas ?? [],
        mesas: mesas ?? [],
    }));
});
exports.restaurantsRouter.get("/:id", async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isFinite(restaurantId)) {
        return res.status(400).json({ error: "Restaurante inválido." });
    }
    try {
        const usuario = await obterUsuarioOpcional(req);
        const cliente = await obterClientePorUsuario(usuario?.id);
        const [{ data, error }, metricas, avaliacoes, conexaoResposta] = await Promise.all([
            consultarRestaurantePublicoPorId(restaurantId),
            obterMetricas([restaurantId], cliente?.id_cliente),
            obterClienteLeituraPublica().from("avaliacoes_restaurante")
                .select("id_avaliacao, nota, comentario, created_at, clientes(nome)")
                .eq("id_restaurante", restaurantId).order("created_at", { ascending: false }).limit(10),
            supabase_1.supabaseAdmin
                ? supabase_1.supabaseAdmin
                    .from("mercado_pago_conexoes_restaurante")
                    .select("id_conexao")
                    .eq("id_restaurante", restaurantId)
                    .eq("status", "CONECTADO")
                    .not("access_token", "is", null)
                    .maybeSingle()
                : Promise.resolve({ data: null }),
        ]);
        if (error) {
            return res.status(404).json({ error: "Restaurante não encontrado." });
        }
        return res.json({
            ...data,
            ...metricas.get(restaurantId),
            pedidos_antecipados_habilitados: !["MARKETPLACE_REAL", "REAL", "PRODUCAO"].includes(String(process.env.MERCADO_PAGO_MODO_REPASSE ?? "SIMULADO").trim().toUpperCase()) || Boolean(conexaoResposta.data),
            avaliacoes_recentes: (avaliacoes.data ?? []).filter((avaliacao) => avaliacao.comentario),
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível carregar o restaurante.",
        });
    }
});
exports.restaurantsRouter.patch("/:id/favorito", auth_1.requireAuth, (0, auth_1.requireRole)("cliente"), async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0 || typeof req.body?.favorito !== "boolean") {
        return res.status(400).json({ error: "Restaurante ou estado de favorito inválido." });
    }
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data: restaurante } = await supabase.from("restaurantes").select("id_restaurante").eq("id_restaurante", restaurantId).eq("ativo", true).maybeSingle();
    if (!restaurante) return res.status(404).json({ error: "Restaurante não encontrado." });
    const operacao = req.body.favorito
        ? supabase.from("restaurantes_favoritos").upsert({ id_cliente: res.locals.profileId, id_restaurante: restaurantId }, { onConflict: "id_cliente,id_restaurante" })
        : supabase.from("restaurantes_favoritos").delete().eq("id_cliente", res.locals.profileId).eq("id_restaurante", restaurantId);
    const { error } = await operacao;
    if (error) return res.status(400).json({ error: error.message });
    const metricas = await obterMetricas([restaurantId], res.locals.profileId);
    return res.json({ id_restaurante: restaurantId, ...metricas.get(restaurantId) });
});
exports.restaurantsRouter.get("/:id/minha-avaliacao", auth_1.requireAuth, (0, auth_1.requireRole)("cliente"), async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isFinite(restaurantId)) {
        return res.status(400).json({ error: "Restaurante inválido." });
    }
    const { data, error } = await obterClienteLeituraPublica()
        .from("avaliacoes_restaurante")
        .select("*")
        .eq("id_cliente", res.locals.profileId)
        .eq("id_restaurante", restaurantId)
        .maybeSingle();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
});
exports.restaurantsRouter.post("/:id/avaliacoes", auth_1.requireAuth, (0, auth_1.requireRole)("cliente"), async (req, res) => {
    const restaurantId = Number(req.params.id);
    const nota = Number(req.body?.nota);
    const comentario = String(req.body?.comentario ?? "").trim() || null;
    if (!Number.isFinite(restaurantId) || !Number.isInteger(nota) || nota < 1 || nota > 5) {
        return res.status(400).json({ error: "Informe uma nota de 1 a 5." });
    }
    const banco = obterClienteLeituraPublica();
    const [reservaResposta, pedidoResposta] = await Promise.all([
        banco.from("reservas").select("id_reserva").eq("id_cliente", res.locals.profileId).eq("id_restaurante", restaurantId).eq("status_reserva", "CONCLUIDA").limit(1),
        banco.from("pedidos").select("id_pedido").eq("id_cliente", res.locals.profileId).eq("id_restaurante", restaurantId).eq("status_pedido", "ENTREGUE").limit(1),
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
            id_cliente: res.locals.profileId,
            id_restaurante: restaurantId,
            id_reserva: reserva?.id_reserva ?? null,
            id_pedido: pedido?.id_pedido ?? null,
            nota,
            comentario,
        }, { onConflict: "id_cliente,id_restaurante" })
        .select("*")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const metricas = await obterMetricas([restaurantId], res.locals.profileId);
    return res.json({ avaliacao: data, ...metricas.get(restaurantId) });
});
exports.restaurantsRouter.get("/:id/cardapio", async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isFinite(restaurantId)) {
        return res.status(400).json({ error: "Restaurante inválido." });
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

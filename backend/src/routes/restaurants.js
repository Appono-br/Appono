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
exports.restaurantsRouter.get("/", async (req, res) => {
    const usuario = await obterUsuarioOpcional(req);
    const cliente = await obterClientePorUsuario(usuario?.id);
    const { data, error } = await obterClienteLeituraPublica()
        .from("restaurantes")
        .select("id_restaurante, nome, telefone, email, cep, endereco, horario_funcionamento, logo_url")
        .eq("ativo", true)
        .order("nome");
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const metricas = await obterMetricas((data ?? []).map((item) => item.id_restaurante), cliente?.id_cliente);
    return res.json((data ?? []).map((item) => ({ ...item, ...metricas.get(item.id_restaurante) })));
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
exports.restaurantsRouter.get("/:id", async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isFinite(restaurantId)) {
        return res.status(400).json({ error: "Restaurante invalido." });
    }
    const usuario = await obterUsuarioOpcional(req);
    const cliente = await obterClientePorUsuario(usuario?.id);
    const { data, error } = await obterClienteLeituraPublica()
        .from("restaurantes")
        .select("id_restaurante, nome, telefone, email, endereco, horario_funcionamento, logo_url, valor_minimo_reserva_por_pessoa")
        .eq("id_restaurante", restaurantId)
        .eq("ativo", true)
        .single();
    if (error) {
        return res.status(404).json({ error: "Restaurante nao encontrado." });
    }
    const [metricas, avaliacoes] = await Promise.all([
        obterMetricas([restaurantId], cliente?.id_cliente),
        obterClienteLeituraPublica().from("avaliacoes_restaurante")
            .select("id_avaliacao, nota, comentario, created_at, clientes(nome)")
            .eq("id_restaurante", restaurantId).order("created_at", { ascending: false }).limit(10),
    ]);
    return res.json({ ...data, ...metricas.get(restaurantId), avaliacoes_recentes: avaliacoes.data ?? [] });
});
exports.restaurantsRouter.patch("/:id/favorito", auth_1.requireAuth, (0, auth_1.requireRole)("cliente"), async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0 || typeof req.body?.favorito !== "boolean") {
        return res.status(400).json({ error: "Restaurante ou estado de favorito invalido." });
    }
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data: restaurante } = await supabase.from("restaurantes").select("id_restaurante").eq("id_restaurante", restaurantId).eq("ativo", true).maybeSingle();
    if (!restaurante) return res.status(404).json({ error: "Restaurante nao encontrado." });
    const operacao = req.body.favorito
        ? supabase.from("restaurantes_favoritos").upsert({ id_cliente: res.locals.profileId, id_restaurante: restaurantId }, { onConflict: "id_cliente,id_restaurante" })
        : supabase.from("restaurantes_favoritos").delete().eq("id_cliente", res.locals.profileId).eq("id_restaurante", restaurantId);
    const { error } = await operacao;
    if (error) return res.status(400).json({ error: error.message });
    const metricas = await obterMetricas([restaurantId], res.locals.profileId);
    return res.json({ id_restaurante: restaurantId, ...metricas.get(restaurantId) });
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

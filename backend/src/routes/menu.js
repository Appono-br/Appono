"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.menuRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");

exports.menuRouter = (0, express_1.Router)();
exports.menuRouter.use(auth_1.requireAuth);

const BUCKET_IMAGENS_RESTAURANTES = "imagens-restaurantes";

function textoObrigatorio(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}

function normalizarPreco(valor) {
    if (typeof valor === "number") {
        return valor;
    }
    return Number(String(valor ?? "").replace(/\./g, "").replace(",", "."));
}

function normalizarProdutoId(valor) {
    const produtoId = Number(valor);
    return Number.isInteger(produtoId) && produtoId > 0 ? produtoId : null;
}

function normalizarBooleano(valor) {
    return valor === true;
}

function normalizarInteiro(valor, fallback = 0) {
    const numero = Number(valor);
    return Number.isInteger(numero) ? numero : fallback;
}

function normalizarTempoPreparo(valor) {
    const tempo = Number(valor);
    return Number.isInteger(tempo) && tempo > 0 ? tempo : 30;
}

function obterCaminhoStoragePorUrl(url) {
    if (!url) {
        return "";
    }
    const marcador = `/storage/v1/object/public/${BUCKET_IMAGENS_RESTAURANTES}/`;
    const indice = url.indexOf(marcador);
    if (indice === -1) {
        return "";
    }
    return decodeURIComponent(url.slice(indice + marcador.length).split("?")[0]);
}

async function removerImagemCardapioPorUrl(url) {
    if (!supabase_1.supabaseAdmin) {
        return;
    }
    const caminho = obterCaminhoStoragePorUrl(url);
    if (!caminho || !caminho.includes("/cardapio/")) {
        return;
    }
    await supabase_1.supabaseAdmin.storage
        .from(BUCKET_IMAGENS_RESTAURANTES)
        .remove([caminho]);
}

function ordenarPorExibicaoENome(a, b) {
    const ordemA = Number(a.ordem_exibicao ?? 0);
    const ordemB = Number(b.ordem_exibicao ?? 0);
    if (ordemA !== ordemB) {
        return ordemA - ordemB;
    }
    return String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR");
}

function organizarCardapios(cardapios) {
    return (cardapios ?? []).map((cardapio) => ({
        ...cardapio,
        categorias: (cardapio.categorias ?? [])
            .filter((categoria) => categoria.arquivado !== true)
            .sort(ordenarPorExibicaoENome)
            .map((categoria) => ({
                ...categoria,
                produtos: (categoria.produtos ?? [])
                    .filter((produto) => produto.arquivado !== true)
                    .sort(ordenarPorExibicaoENome),
            })),
    }));
}

async function obterRestauranteLogado(supabase, userId) {
    const { data, error } = await supabase
        .from("restaurantes")
        .select("id_restaurante, nome")
        .eq("id_auth", userId)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

async function obterOuCriarCardapio(supabase, restauranteId) {
    const { data: cardapioExistente, error: buscaError } = await supabase
        .from("cardapios")
        .select("id_cardapio, nome, descricao, ativo")
        .eq("id_restaurante", restauranteId)
        .eq("ativo", true)
        .order("id_cardapio", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (buscaError) {
        throw new Error(buscaError.message);
    }
    if (cardapioExistente) {
        return cardapioExistente;
    }
    const { data: novoCardapio, error: criacaoError } = await supabase
        .from("cardapios")
        .insert({
        id_restaurante: restauranteId,
        nome: "Cardápio principal",
        descricao: "Itens publicados pelo restaurante na Appono.",
        ativo: true,
    })
        .select("id_cardapio, nome, descricao, ativo")
        .single();
    if (criacaoError) {
        throw new Error(criacaoError.message);
    }
    return novoCardapio;
}

async function obterOuCriarCategoria(supabase, cardapioId, nomeCategoria) {
    const nome = nomeCategoria || "Pratos principais";
    const { data: categoriaExistente, error: buscaError } = await supabase
        .from("categorias")
        .select("id_categoria, nome, descricao, ativo, arquivado, ordem_exibicao")
        .eq("id_cardapio", cardapioId)
        .eq("arquivado", false)
        .ilike("nome", nome)
        .order("id_categoria", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (buscaError) {
        throw new Error(buscaError.message);
    }
    if (categoriaExistente) {
        return categoriaExistente;
    }
    const { data: novaCategoria, error: criacaoError } = await supabase
        .from("categorias")
        .insert({
        id_cardapio: cardapioId,
        nome,
        descricao: null,
        ativo: true,
        arquivado: false,
        ordem_exibicao: 0,
    })
        .select("id_categoria, nome, descricao, ativo, arquivado, ordem_exibicao")
        .single();
    if (criacaoError) {
        throw new Error(criacaoError.message);
    }
    return novaCategoria;
}

exports.menuRouter.get("/", async (_req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    try {
        const restaurante = await obterRestauranteLogado(supabase, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem gerenciar cardápio." });
        }
        const { data, error } = await supabase
            .from("cardapios")
            .select("id_cardapio, nome, descricao, ativo, categorias(id_categoria, nome, descricao, ativo, arquivado, ordem_exibicao, produtos(id_produto, nome, descricao, preco, tempo_preparo_minutos, imagem_url, disponivel, destaque, arquivado, ordem_exibicao))")
            .eq("id_restaurante", restaurante.id_restaurante)
            .order("nome", { ascending: true });
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        return res.json({
            restaurante,
            cardapios: organizarCardapios(data),
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível carregar o cardápio.",
        });
    }
});

async function obterCategoriaDoRestaurante(supabase, categoriaId, restauranteId) {
    const { data, error } = await supabase
        .from("categorias")
        .select("id_categoria, nome, descricao, ativo, arquivado, ordem_exibicao, cardapios!inner(id_restaurante)")
        .eq("id_categoria", categoriaId)
        .eq("cardapios.id_restaurante", restauranteId)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

exports.menuRouter.post("/categorias", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const nome = textoObrigatorio(req.body?.name);
    const descricao = textoObrigatorio(req.body?.description);
    const ordemExibicao = normalizarInteiro(req.body?.displayOrder);
    if (!nome) {
        return res.status(400).json({ error: "Informe o nome da categoria." });
    }
    try {
        const restaurante = await obterRestauranteLogado(supabase, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem criar categorias." });
        }
        const cardapio = await obterOuCriarCardapio(supabase, restaurante.id_restaurante);
        const { data: categoria, error } = await supabase
            .from("categorias")
            .insert({
            id_cardapio: cardapio.id_cardapio,
            nome,
            descricao: descricao || null,
            ativo: true,
            arquivado: false,
            ordem_exibicao: ordemExibicao,
        })
            .select("id_categoria, nome, descricao, ativo, arquivado, ordem_exibicao")
            .single();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(201).json({ message: "Categoria criada.", categoria });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível criar a categoria.",
        });
    }
});

exports.menuRouter.put("/categorias/:id", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const categoriaId = normalizarProdutoId(req.params.id);
    const nome = textoObrigatorio(req.body?.name);
    const descricao = textoObrigatorio(req.body?.description);
    const ordemExibicao = normalizarInteiro(req.body?.displayOrder);
    if (!categoriaId) {
        return res.status(400).json({ error: "Categoria invalida." });
    }
    if (!nome) {
        return res.status(400).json({ error: "Informe o nome da categoria." });
    }
    try {
        const restaurante = await obterRestauranteLogado(supabase, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem editar categorias." });
        }
        const categoriaExistente = await obterCategoriaDoRestaurante(supabase, categoriaId, restaurante.id_restaurante);
        if (!categoriaExistente) {
            return res.status(404).json({ error: "Categoria não encontrada." });
        }
        const { data: categoria, error } = await supabase
            .from("categorias")
            .update({
            nome,
            descricao: descricao || null,
            ordem_exibicao: ordemExibicao,
            ativo: req.body?.active === false ? false : true,
            arquivado: false,
        })
            .eq("id_categoria", categoriaId)
            .select("id_categoria, nome, descricao, ativo, arquivado, ordem_exibicao")
            .single();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        return res.json({ message: "Categoria atualizada.", categoria });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível atualizar a categoria.",
        });
    }
});

exports.menuRouter.delete("/categorias/:id", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const categoriaId = normalizarProdutoId(req.params.id);
    if (!categoriaId) {
        return res.status(400).json({ error: "Categoria invalida." });
    }
    try {
        const restaurante = await obterRestauranteLogado(supabase, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem arquivar categorias." });
        }
        const categoriaExistente = await obterCategoriaDoRestaurante(supabase, categoriaId, restaurante.id_restaurante);
        if (!categoriaExistente) {
            return res.status(404).json({ error: "Categoria não encontrada." });
        }
        const { error: produtosError } = await supabase
            .from("produtos")
            .update({
            arquivado: true,
            disponivel: false,
            destaque: false,
        })
            .eq("id_categoria", categoriaId)
            .eq("id_restaurante", restaurante.id_restaurante);
        if (produtosError) {
            return res.status(400).json({ error: produtosError.message });
        }
        const { error } = await supabase
            .from("categorias")
            .update({ arquivado: true, ativo: false })
            .eq("id_categoria", categoriaId);
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        return res.json({ message: "Categoria arquivada junto com seus itens." });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível arquivar a categoria.",
        });
    }
});

exports.menuRouter.get("/produtos/:id", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const produtoId = normalizarProdutoId(req.params.id);
    if (!produtoId) {
        return res.status(400).json({ error: "Produto inválido." });
    }
    try {
        const restaurante = await obterRestauranteLogado(supabase, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem gerenciar cardápio." });
        }
        const { data: produto, error } = await supabase
            .from("produtos")
            .select("id_produto, id_categoria, nome, descricao, preco, tempo_preparo_minutos, imagem_url, disponivel, destaque, arquivado, ordem_exibicao, categorias(nome)")
            .eq("id_produto", produtoId)
            .eq("id_restaurante", restaurante.id_restaurante)
            .eq("arquivado", false)
            .maybeSingle();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        if (!produto) {
            return res.status(404).json({ error: "Produto não encontrado." });
        }
        return res.json({
            produto: {
                ...produto,
                categoria: produto.categorias?.nome ?? "",
            },
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível carregar o produto.",
        });
    }
});

exports.menuRouter.post("/produtos", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const body = req.body;
    const nome = textoObrigatorio(body.name);
    const categoriaNome = textoObrigatorio(body.category);
    const descricao = textoObrigatorio(body.description);
    const preco = normalizarPreco(body.price);
    const tempoPreparo = normalizarTempoPreparo(body.preparationTime);
    const ordemExibicao = normalizarInteiro(body.displayOrder);
    if (!nome || !categoriaNome || !Number.isFinite(preco) || preco <= 0) {
        return res.status(400).json({
            error: "Informe nome, categoria e preço válido para publicar o item.",
        });
    }
    try {
        const restaurante = await obterRestauranteLogado(supabase, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem publicar itens." });
        }
        const cardapio = await obterOuCriarCardapio(supabase, restaurante.id_restaurante);
        const categoria = await obterOuCriarCategoria(supabase, cardapio.id_cardapio, categoriaNome);
        const { data: produto, error: produtoError } = await supabase
            .from("produtos")
            .insert({
            id_restaurante: restaurante.id_restaurante,
            id_categoria: categoria.id_categoria,
            nome,
            descricao: descricao || null,
            preco,
            tempo_preparo_minutos: tempoPreparo,
            imagem_url: textoObrigatorio(body.imageUrl) || null,
            disponivel: body.available === false ? false : true,
            destaque: normalizarBooleano(body.featured),
            arquivado: false,
            ordem_exibicao: ordemExibicao,
        })
            .select("id_produto, nome, descricao, preco, tempo_preparo_minutos, imagem_url, disponivel, destaque, arquivado, ordem_exibicao")
            .single();
        if (produtoError) {
            return res.status(400).json({ error: produtoError.message });
        }
        return res.status(201).json({
            message: "Item publicado no cardápio.",
            produto,
            categoria,
            cardapio,
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível publicar o item.",
        });
    }
});

exports.menuRouter.put("/produtos/:id", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const produtoId = normalizarProdutoId(req.params.id);
    if (!produtoId) {
        return res.status(400).json({ error: "Produto inválido." });
    }
    const body = req.body;
    const nome = textoObrigatorio(body.name);
    const categoriaNome = textoObrigatorio(body.category);
    const descricao = textoObrigatorio(body.description);
    const preco = normalizarPreco(body.price);
    const tempoPreparo = normalizarTempoPreparo(body.preparationTime);
    const ordemExibicao = normalizarInteiro(body.displayOrder);
    if (!nome || !categoriaNome || !Number.isFinite(preco) || preco <= 0) {
        return res.status(400).json({
            error: "Informe nome, categoria e preço válido para atualizar o item.",
        });
    }
    try {
        const restaurante = await obterRestauranteLogado(supabase, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem editar itens." });
        }
        const { data: produtoExistente, error: buscaError } = await supabase
            .from("produtos")
            .select("id_produto, imagem_url")
            .eq("id_produto", produtoId)
            .eq("id_restaurante", restaurante.id_restaurante)
            .eq("arquivado", false)
            .maybeSingle();
        if (buscaError) {
            return res.status(400).json({ error: buscaError.message });
        }
        if (!produtoExistente) {
            return res.status(404).json({ error: "Produto não encontrado." });
        }
        const cardapio = await obterOuCriarCardapio(supabase, restaurante.id_restaurante);
        const categoria = await obterOuCriarCategoria(supabase, cardapio.id_cardapio, categoriaNome);
        const { data: produto, error: produtoError } = await supabase
            .from("produtos")
            .update({
            id_categoria: categoria.id_categoria,
            nome,
            descricao: descricao || null,
            preco,
            tempo_preparo_minutos: tempoPreparo,
            imagem_url: textoObrigatorio(body.imageUrl) || null,
            disponivel: body.available === false ? false : true,
            destaque: normalizarBooleano(body.featured),
            arquivado: false,
            ordem_exibicao: ordemExibicao,
        })
            .eq("id_produto", produtoId)
            .eq("id_restaurante", restaurante.id_restaurante)
            .select("id_produto, nome, descricao, preco, tempo_preparo_minutos, imagem_url, disponivel, destaque, arquivado, ordem_exibicao")
            .single();
        if (produtoError) {
            return res.status(400).json({ error: produtoError.message });
        }
        if (produtoExistente.imagem_url &&
            produtoExistente.imagem_url !== produto.imagem_url) {
            removerImagemCardapioPorUrl(produtoExistente.imagem_url).catch(() => undefined);
        }
        return res.json({
            message: "Item atualizado no cardápio.",
            produto,
            categoria,
            cardapio,
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível atualizar o item.",
        });
    }
});

exports.menuRouter.get("/seguranca-alimentar/catalogo", async (_req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data, error } = await supabase.from("alergenos_catalogo").select("codigo,nome").eq("ativo", true).order("nome");
    if (error) return res.status(400).json({ code: "FOOD_SAFETY_CATALOG_FAILED", error: error.message });
    return res.json({ alergenos: data ?? [] });
});

exports.menuRouter.get("/produtos/:id/seguranca-alimentar", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const produtoId = normalizarProdutoId(req.params.id);
    if (!produtoId) return res.status(400).json({ code: "FOOD_SAFETY_PRODUCT_INVALID", error: "Produto inválido." });
    const [revisao, ingredientes, alergenos] = await Promise.all([
        supabase.from("seguranca_alimentar_produto").select("status,origem_informacao,responsavel_revisao,revisado_em,versao").eq("id_produto", produtoId).maybeSingle(),
        supabase.from("ingredientes_produto").select("nome").eq("id_produto", produtoId).order("nome"),
        supabase.from("alergenos_produto").select("tipo,alergenos_catalogo(codigo,nome)").eq("id_produto", produtoId),
    ]);
    const error = revisao.error || ingredientes.error || alergenos.error;
    if (error) return res.status(400).json({ code: "FOOD_SAFETY_LOAD_FAILED", error: error.message });
    return res.json({
        seguranca_alimentar: {
            status: revisao.data?.status ?? "INCOMPLETA",
            origem_informacao: revisao.data?.origem_informacao ?? "",
            responsavel_revisao: revisao.data?.responsavel_revisao ?? "",
            revisado_em: revisao.data?.revisado_em ?? null,
            versao: Number(revisao.data?.versao ?? 0),
            ingredientes: (ingredientes.data ?? []).map((item) => item.nome),
            alergenos: (alergenos.data ?? []).map((item) => ({
                codigo: item.alergenos_catalogo?.codigo,
                nome: item.alergenos_catalogo?.nome,
                tipo: item.tipo,
            })).filter((item) => item.codigo),
        },
    });
});

exports.menuRouter.put("/produtos/:id/seguranca-alimentar", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const produtoId = normalizarProdutoId(req.params.id);
    if (!produtoId) return res.status(400).json({ code: "FOOD_SAFETY_PRODUCT_INVALID", error: "Produto inválido." });
    const ingredientes = Array.isArray(req.body?.ingredientes)
        ? [...new Set(req.body.ingredientes.map((item) => textoObrigatorio(item)).filter(Boolean))].slice(0, 80).map((nome) => ({ nome })) : null;
    const alergenos = Array.isArray(req.body?.alergenos) ? req.body.alergenos.slice(0, 50).map((item) => ({
        codigo: textoObrigatorio(item?.codigo).toUpperCase(), tipo: textoObrigatorio(item?.tipo).toUpperCase(),
    })) : null;
    if (!ingredientes || !alergenos) return res.status(400).json({ code: "FOOD_SAFETY_INPUT_INVALID", error: "Ingredientes e alérgenos devem ser listas." });
    const { data, error } = await supabase.rpc("salvar_seguranca_alimentar_produto", {
        p_id_produto: produtoId,
        p_ingredientes: ingredientes,
        p_alergenos: alergenos,
        p_status: textoObrigatorio(req.body.status).toUpperCase() || "INCOMPLETA",
        p_origem_informacao: textoObrigatorio(req.body.origem_informacao) || null,
        p_responsavel_revisao: textoObrigatorio(req.body.responsavel_revisao) || null,
        p_versao: Number(req.body.versao ?? 0),
    });
    if (error) {
        const conflito = error.code === "PT409" || /outra aba/i.test(error.message);
        return res.status(conflito ? 409 : error.code === "PT404" ? 404 : 422).json({ code: conflito ? "FOOD_SAFETY_VERSION_CONFLICT" : "FOOD_SAFETY_SAVE_FAILED", error: error.message });
    }
    return res.json({ message: "Informações de segurança alimentar atualizadas.", seguranca_alimentar: data });
});

exports.menuRouter.patch("/produtos/:id/disponibilidade", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const produtoId = normalizarProdutoId(req.params.id);
    if (!produtoId) {
        return res.status(400).json({ error: "Produto inválido." });
    }
    try {
        const restaurante = await obterRestauranteLogado(supabase, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem alterar disponibilidade." });
        }
        const disponivel = req.body?.available !== false;
        const { data: produto, error } = await supabase
            .from("produtos")
            .update({ disponivel })
            .eq("id_produto", produtoId)
            .eq("id_restaurante", restaurante.id_restaurante)
            .eq("arquivado", false)
            .select("id_produto, nome, disponivel, destaque")
            .maybeSingle();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        if (!produto) {
            return res.status(404).json({ error: "Produto não encontrado." });
        }
        return res.json({
            message: disponivel ? "Item disponibilizado no cardápio." : "Item marcado como indisponível.",
            produto,
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível alterar a disponibilidade.",
        });
    }
});

exports.menuRouter.patch("/produtos/:id/destaque", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const produtoId = normalizarProdutoId(req.params.id);
    if (!produtoId) {
        return res.status(400).json({ error: "Produto inválido." });
    }
    try {
        const restaurante = await obterRestauranteLogado(supabase, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem destacar itens." });
        }
        const destaque = req.body?.featured === true;
        const { data: produto, error } = await supabase
            .from("produtos")
            .update({ destaque })
            .eq("id_produto", produtoId)
            .eq("id_restaurante", restaurante.id_restaurante)
            .eq("arquivado", false)
            .select("id_produto, nome, disponivel, destaque")
            .maybeSingle();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        if (!produto) {
            return res.status(404).json({ error: "Produto não encontrado." });
        }
        return res.json({
            message: destaque ? "Item marcado como destaque." : "Item removido dos destaques.",
            produto,
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível alterar o destaque.",
        });
    }
});

exports.menuRouter.delete("/produtos/:id", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const produtoId = normalizarProdutoId(req.params.id);
    if (!produtoId) {
        return res.status(400).json({ error: "Produto inválido." });
    }
    try {
        const restaurante = await obterRestauranteLogado(supabase, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem excluir itens." });
        }
        const { data: produtoExistente, error: buscaError } = await supabase
            .from("produtos")
            .select("id_produto, imagem_url")
            .eq("id_produto", produtoId)
            .eq("id_restaurante", restaurante.id_restaurante)
            .eq("arquivado", false)
            .maybeSingle();
        if (buscaError) {
            return res.status(400).json({ error: buscaError.message });
        }
        if (!produtoExistente) {
            return res.status(404).json({ error: "Produto não encontrado." });
        }

        const { data: itemVinculado, error: itemVinculadoError } = await supabase
            .from("itens_pedido")
            .select("id_item")
            .eq("id_produto", produtoId)
            .limit(1)
            .maybeSingle();
        if (itemVinculadoError) {
            return res.status(400).json({ error: itemVinculadoError.message });
        }

        if (itemVinculado) {
            const { error } = await supabase
                .from("produtos")
                .update({
                arquivado: true,
                disponivel: false,
                destaque: false,
            })
                .eq("id_produto", produtoId)
                .eq("id_restaurante", restaurante.id_restaurante);
            if (error) {
                return res.status(400).json({
                    error: "Não foi possível arquivar este item.",
                });
            }
            return res.json({ message: "Item arquivado para preservar o histórico de pedidos." });
        }

        const { error } = await supabase
            .from("produtos")
            .delete()
            .eq("id_produto", produtoId)
            .eq("id_restaurante", restaurante.id_restaurante);
        if (error) {
            if (error.code === "23503" || String(error.message ?? "").toLowerCase().includes("foreign key")) {
                const { error: arquivoError } = await supabase
                    .from("produtos")
                    .update({
                    arquivado: true,
                    disponivel: false,
                    destaque: false,
                })
                    .eq("id_produto", produtoId)
                    .eq("id_restaurante", restaurante.id_restaurante);
                if (arquivoError) {
                    return res.status(400).json({
                        error: "Não foi possível arquivar este item.",
                    });
                }
                return res.json({ message: "Item arquivado para preservar o histórico de pedidos." });
            }
            return res.status(400).json({
                error: "Não foi possível excluir este item.",
            });
        }
        if (produtoExistente.imagem_url) {
            removerImagemCardapioPorUrl(produtoExistente.imagem_url).catch(() => undefined);
        }
        return res.json({ message: "Item excluído definitivamente do cardápio." });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Não foi possível excluir o item.",
        });
    }
});

"use strict";

const { randomBytes } = require("node:crypto");
const { supabaseAdmin } = require("../src/lib/supabase");

const EMAIL_DOMAIN = "example.com";
const CONFIRMATION = "confirmado";
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const restaurants = [
    { slug: "esquina-brasa", name: "[DEMO] Esquina da Brasa", address: "Alameda Rio Negro, 500, Barueri - SP", cep: "06454000", lat: -23.5035, lng: -46.8488, minimum: 28, categories: { "Grelhados": [
        ["Frango grelhado com legumes", "Frango, arroz integral e legumes sazonais.", 39.9, ["frango", "arroz integral", "abobrinha", "cenoura"], []],
        ["Contra-filé executivo", "Contra-filé, arroz, feijão e salada.", 54.9, ["carne bovina", "arroz", "feijão", "folhas"], []],
        ["Legumes na brasa", "Legumes, grão-de-bico e molho de ervas.", 34.9, ["abobrinha", "berinjela", "grão-de-bico", "ervas"], []],
    ] } },
    { slug: "trattoria-urbana", name: "[DEMO] Trattoria Urbana", address: "Alameda Madeira, 180, Barueri - SP", cep: "06454100", lat: -23.5011, lng: -46.8509, minimum: 35, categories: { "Massas": [
        ["Penne ao pomodoro", "Massa de trigo, tomate, manjericão e parmesão.", 38.9, ["massa de trigo", "tomate", "manjericão", "parmesão"], [["TRIGO_GLUTEN", "PRESENTE"], ["LEITE", "PRESENTE"]]],
        ["Nhoque de mandioquinha", "Nhoque artesanal com molho de tomates assados.", 44.9, ["mandioquinha", "farinha de trigo", "tomate"], [["TRIGO_GLUTEN", "PRESENTE"]]],
        ["Lasanha da casa", "Lasanha bolonhesa com queijo gratinado.", 52.9, ["massa de trigo", "carne bovina", "leite", "queijo"], [["TRIGO_GLUTEN", "PRESENTE"], ["LEITE", "PRESENTE"]]],
    ] } },
    { slug: "verde-grao", name: "[DEMO] Verde & Grão", address: "Alameda Araguaia, 900, Barueri - SP", cep: "06455000", lat: -23.5074, lng: -46.8521, minimum: 24, categories: { "Bowls": [
        ["Bowl mediterrâneo", "Quinoa, grão-de-bico, tomate, pepino e tahine.", 36.9, ["quinoa", "grão-de-bico", "tomate", "pepino", "gergelim"], [["GERGELIM", "PRESENTE"]]],
        ["Bowl brasileiro", "Arroz integral, feijão, abóbora e couve.", 32.9, ["arroz integral", "feijão", "abóbora", "couve"], []],
        ["Salada crocante", "Folhas, cenoura, castanhas e molho cítrico.", 29.9, ["folhas", "cenoura", "castanhas", "limão"], [["OLEAGINOSAS", "PRESENTE"]]],
    ] } },
    { slug: "bento-paulista", name: "[DEMO] Bento Paulista", address: "Avenida Copacabana, 320, Barueri - SP", cep: "06472001", lat: -23.4968, lng: -46.8451, minimum: 30, categories: { "Oriental": [
        ["Bento de salmão", "Salmão grelhado, arroz japonês e legumes.", 58.9, ["salmão", "arroz", "legumes", "soja"], [["PEIXES", "PRESENTE"], ["SOJA", "PRESENTE"]]],
        ["Frango teriyaki", "Frango, arroz e molho teriyaki.", 42.9, ["frango", "arroz", "soja", "trigo"], [["SOJA", "PRESENTE"], ["TRIGO_GLUTEN", "PRESENTE"]]],
        ["Tofu com legumes", "Tofu dourado, arroz e legumes orientais.", 37.9, ["tofu", "soja", "arroz", "legumes"], [["SOJA", "PRESENTE"]]],
    ] } },
    { slug: "cantina-bairro", name: "[DEMO] Cantina do Bairro", address: "Calçada das Margaridas, 60, Barueri - SP", cep: "06453038", lat: -23.5092, lng: -46.8467, minimum: 26, categories: { "Comida caseira": [
        ["Picadinho caseiro", "Carne em cubos, arroz, feijão e farofa.", 41.9, ["carne bovina", "arroz", "feijão", "farinha de mandioca"], []],
        ["Filé de frango à parmegiana", "Frango empanado, queijo, arroz e molho de tomate.", 46.9, ["frango", "trigo", "ovo", "leite", "tomate"], [["TRIGO_GLUTEN", "PRESENTE"], ["OVOS", "PRESENTE"], ["LEITE", "PRESENTE"]]],
        ["Omelete de forno", "Ovos, queijo, tomate e salada.", 31.9, ["ovos", "leite", "queijo", "tomate"], [["OVOS", "PRESENTE"], ["LEITE", "PRESENTE"]]],
    ] } },
    { slug: "cafe-estacao", name: "[DEMO] Café Estação", address: "Alameda Mamoré, 700, Barueri - SP", cep: "06454040", lat: -23.5002, lng: -46.8556, minimum: 18, open: "07:00", categories: { "Café e lanches": [
        ["Tostada de avocado", "Pão de fermentação natural, avocado e ovo.", 28.9, ["trigo", "avocado", "ovo"], [["TRIGO_GLUTEN", "PRESENTE"], ["OVOS", "PRESENTE"]]],
        ["Tapioca caprese", "Tapioca, queijo, tomate e manjericão.", 24.9, ["mandioca", "leite", "tomate", "manjericão"], [["LEITE", "PRESENTE"]]],
        ["Sanduíche de frango", "Pão integral, frango desfiado e salada.", 27.9, ["trigo", "frango", "folhas"], [["TRIGO_GLUTEN", "PRESENTE"]]],
    ] } },
    { slug: "levante-casual", name: "[DEMO] Levante Casual", address: "Avenida Andrômeda, 250, Barueri - SP", cep: "06473000", lat: -23.5126, lng: -46.8494, minimum: 25, categories: { "Árabe": [
        ["Prato de falafel", "Falafel, homus, tabule e pão sírio.", 35.9, ["grão-de-bico", "gergelim", "trigo", "salsa"], [["GERGELIM", "PRESENTE"], ["TRIGO_GLUTEN", "PRESENTE"]]],
        ["Kafta com arroz", "Kafta bovina, arroz com lentilha e salada.", 43.9, ["carne bovina", "arroz", "lentilha", "trigo"], [["TRIGO_GLUTEN", "PODE_CONTER"]]],
        ["Tabule com homus", "Tabule, homus e legumes assados.", 29.9, ["trigo", "grão-de-bico", "gergelim", "legumes"], [["TRIGO_GLUTEN", "PRESENTE"], ["GERGELIM", "PRESENTE"]]],
    ] } },
    { slug: "panela-minas", name: "[DEMO] Panela de Minas", address: "Alameda Tocantins, 410, Barueri - SP", cep: "06455020", lat: -23.5059, lng: -46.8428, minimum: 29, categories: { "Brasileira": [
        ["Frango com quiabo", "Frango, quiabo, arroz e angu.", 39.9, ["frango", "quiabo", "arroz", "milho"], []],
        ["Tropeiro vegetariano", "Feijão, farinha de mandioca, couve, ovo e queijo.", 36.9, ["feijão", "mandioca", "couve", "ovo", "leite"], [["OVOS", "PRESENTE"], ["LEITE", "PRESENTE"]]],
        ["Carne de panela", "Carne cozida, batata, arroz e feijão.", 45.9, ["carne bovina", "batata", "arroz", "feijão"], []],
    ] } },
];

const clients = [
    ["ana", "[DEMO] Ana Planejada", "Massas", 55, 4, "ALMOCO"],
    ["bruno", "[DEMO] Bruno Econômico", "Comida caseira", 38, 5, "ALMOCO"],
    ["carla", "[DEMO] Carla Vegetariana", "Vegetariano", 45, 6, "ALMOCO"],
    ["diego", "[DEMO] Diego Grelhados", "Grelhados", 65, 8, "JANTAR"],
    ["elisa", "[DEMO] Elisa Oriental", "Oriental", 70, 5, "ALMOCO"],
    ["fabio", "[DEMO] Fábio Café", "Café", 32, 3, "CAFE"],
    ["gabriela", "[DEMO] Gabriela Brasileira", "Brasileira", 50, 7, "ALMOCO"],
    ["henrique", "[DEMO] Henrique Árabe", "Árabe", 48, 6, "JANTAR"],
    ["iris", "[DEMO] Íris Saudável", "Bowls", 42, 4, "ALMOCO"],
    ["joao", "[DEMO] João Variado", "Experimentar sabores", 75, 10, "ALMOCO"],
].map(([slug, name, preference, budget, radius, meal], index) => ({ slug, name, preference, budget, radius, meal, index }));

function cpf(seed) {
    const digits = String(seed).padStart(9, "1").slice(-9).split("").map(Number);
    for (const weight of [10, 11]) {
        const sum = digits.reduce((total, digit, index) => total + digit * (weight - index), 0);
        const rest = (sum * 10) % 11;
        digits.push(rest === 10 ? 0 : rest);
    }
    return digits.join("");
}

function cnpj(seed) {
    const digits = String(seed).padStart(12, "1").slice(-12).split("").map(Number);
    for (const weights of [[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]]) {
        const sum = digits.reduce((total, digit, index) => total + digit * weights[index], 0);
        const rest = sum % 11;
        digits.push(rest < 2 ? 0 : 11 - rest);
    }
    return digits.join("");
}

function operation(open = "08:00") {
    return { antecedenciaMinutosReserva: 30, days: DAYS.map((id) => ({ id, enabled: true, shifts: [{ open, close: "22:30" }] })) };
}

function email(kind, slug) {
    return `demo.rotina.${kind}.${slug}@${EMAIL_DOMAIN}`;
}

async function allUsers() {
    const users = [];
    for (let page = 1; page <= 20; page += 1) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        users.push(...(data.users ?? []));
        if ((data.users ?? []).length < 1000) break;
    }
    return users;
}

async function ensureUser({ userEmail, password, profile }) {
    const existing = (await allUsers()).find((item) => item.email?.toLowerCase() === userEmail.toLowerCase());
    if (existing) {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
        if (error || !data.user) throw error ?? new Error(`Usuário ${userEmail} não foi atualizado.`);
        return data.user;
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password,
        email_confirm: true,
        user_metadata: { appono_profile: profile },
    });
    if (error || !data.user) throw error ?? new Error(`Usuário ${userEmail} não foi criado.`);
    return data.user;
}

async function one(table, filters, columns = "*") {
    let query = supabaseAdmin.from(table).select(columns);
    for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;
    return data;
}

async function ensureRestaurant(definition, index, password) {
    const userEmail = email("restaurante", definition.slug);
    const user = await ensureUser({
        userEmail,
        password,
        profile: {
            tipo: "restaurante", nome: definition.name, razao_social: `${definition.name} Alimentação Ltda.`,
            cnpj: cnpj(`70000000${index + 1}01`), telefone: `1197000${String(index + 1).padStart(4, "0")}`,
            email: userEmail, cep: definition.cep, endereco: definition.address,
            horario_funcionamento: "Todos os dias, conforme agenda", quantidade_mesas: 8,
        },
    });
    const restaurant = await one("restaurantes", { id_auth: user.id }, "id_restaurante");
    if (!restaurant) throw new Error(`Perfil do restaurante ${definition.name} não foi criado pelo trigger.`);
    const { error: updateError } = await supabaseAdmin.from("restaurantes").update({
        latitude: definition.lat, longitude: definition.lng, geocodificado_em: new Date().toISOString(),
        valor_minimo_reserva_por_pessoa: definition.minimum, configuracao_operacao: operation(definition.open), ativo: true,
    }).eq("id_restaurante", restaurant.id_restaurante);
    if (updateError) throw updateError;

    let menu = await one("cardapios", { id_restaurante: restaurant.id_restaurante, nome: "Cardápio de demonstração" }, "id_cardapio");
    if (!menu) {
        const response = await supabaseAdmin.from("cardapios").insert({ id_restaurante: restaurant.id_restaurante, nome: "Cardápio de demonstração", descricao: "Dados sintéticos para avaliação do Appono Rotina.", ativo: true }).select("id_cardapio").single();
        if (response.error) throw response.error;
        menu = response.data;
    }
    let productCount = 0;
    for (const [categoryName, products] of Object.entries(definition.categories)) {
        let category = await one("categorias", { id_cardapio: menu.id_cardapio, nome: categoryName }, "id_categoria");
        if (!category) {
            const response = await supabaseAdmin.from("categorias").insert({ id_cardapio: menu.id_cardapio, nome: categoryName, descricao: `Categoria sintética ${categoryName}.`, ativo: true, arquivado: false, ordem_exibicao: 0 }).select("id_categoria").single();
            if (response.error) throw response.error;
            category = response.data;
        }
        for (const [name, description, price, ingredients, allergens] of products) {
            let product = await one("produtos", { id_restaurante: restaurant.id_restaurante, nome: name }, "id_produto");
            const payload = { id_restaurante: restaurant.id_restaurante, id_categoria: category.id_categoria, nome: name, descricao: description, preco: price, tempo_preparo_minutos: 25, disponivel: true, destaque: productCount === 0, arquivado: false, ordem_exibicao: productCount };
            if (product) {
                const response = await supabaseAdmin.from("produtos").update(payload).eq("id_produto", product.id_produto);
                if (response.error) throw response.error;
            } else {
                const response = await supabaseAdmin.from("produtos").insert(payload).select("id_produto").single();
                if (response.error) throw response.error;
                product = response.data;
            }
            const ingredientsDelete = await supabaseAdmin.from("ingredientes_produto").delete().eq("id_produto", product.id_produto);
            if (ingredientsDelete.error) throw ingredientsDelete.error;
            if (ingredients.length) {
                const response = await supabaseAdmin.from("ingredientes_produto").insert(ingredients.map((name) => ({ id_produto: product.id_produto, id_restaurante: restaurant.id_restaurante, nome: name })));
                if (response.error) throw response.error;
            }
            const allergensDelete = await supabaseAdmin.from("alergenos_produto").delete().eq("id_produto", product.id_produto);
            if (allergensDelete.error) throw allergensDelete.error;
            for (const [code, type] of allergens) {
                const allergen = await one("alergenos_catalogo", { codigo: code }, "id_alergeno");
                if (!allergen) throw new Error(`Alérgeno ${code} não está disponível.`);
                const response = await supabaseAdmin.from("alergenos_produto").insert({ id_produto: product.id_produto, id_restaurante: restaurant.id_restaurante, id_alergeno: allergen.id_alergeno, tipo: type });
                if (response.error) throw response.error;
            }
            const safety = await supabaseAdmin.from("seguranca_alimentar_produto").upsert({ id_produto: product.id_produto, id_restaurante: restaurant.id_restaurante, status: "REVISADA", origem_informacao: "Seed sintético Appono", responsavel_revisao: "Equipe de demonstração", revisado_em: new Date().toISOString() }, { onConflict: "id_produto" });
            if (safety.error) throw safety.error;
            productCount += 1;
        }
    }
    return { restaurant: definition.name, products: productCount };
}

async function ensureClient(definition, password) {
    const userEmail = email("cliente", definition.slug);
    const user = await ensureUser({
        userEmail,
        password,
        profile: { tipo: "cliente", nome: definition.name, cpf: cpf(`8000000${definition.index + 10}`), telefone: `1198000${String(definition.index + 1).padStart(4, "0")}`, email: userEmail, dt_nasc: "1992-06-15" },
    });
    const client = await one("clientes", { id_auth: user.id }, "id_cliente");
    if (!client) throw new Error(`Perfil do cliente ${definition.name} não foi criado pelo trigger.`);
    const meal = definition.meal;
    const times = meal === "CAFE" ? ["07:30", "09:00"] : meal === "JANTAR" ? ["18:30", "21:00"] : ["11:30", "14:00"];
    let profile = await one("perfis_rotina_cliente", { id_cliente: client.id_cliente, ativo: true }, "id_perfil_rotina");
    const profilePayload = { id_cliente: client.id_cliente, nome: "[DEMO] Rotina principal", endereco_base: "Alphaville, Barueri - SP", endereco_normalizado: "Alphaville, Barueri - SP", latitude: -23.5045, longitude: -46.8499, status_geocodificacao: "CONFIRMADO", geocodificado_em: new Date().toISOString(), dias_semana: ["monday", "tuesday", "wednesday", "thursday", "friday"], horario_inicio: times[0], horario_fim: times[1], tempo_maximo_minutos: 60, orcamento_diario: definition.budget, orcamento_semanal: definition.budget * 5, raio_km: definition.radius, origem_agenda: "MANUAL", ativo: true };
    if (profile) {
        const response = await supabaseAdmin.from("perfis_rotina_cliente").update(profilePayload).eq("id_perfil_rotina", profile.id_perfil_rotina);
        if (response.error) throw response.error;
    } else {
        const response = await supabaseAdmin.from("perfis_rotina_cliente").insert(profilePayload).select("id_perfil_rotina").single();
        if (response.error) throw response.error;
        profile = response.data;
    }
    const existingWindow = await one("janelas_alimentacao_rotina", { id_perfil_rotina: profile.id_perfil_rotina, nome: meal === "CAFE" ? "Café da manhã" : meal === "JANTAR" ? "Jantar" : "Almoço" }, "id_janela_alimentacao");
    const windowPayload = { id_perfil_rotina: profile.id_perfil_rotina, id_cliente: client.id_cliente, tipo: meal, nome: meal === "CAFE" ? "Café da manhã" : meal === "JANTAR" ? "Jantar" : "Almoço", dias_semana: ["monday", "tuesday", "wednesday", "thursday", "friday"], horario_inicio: times[0], horario_fim: times[1], tempo_maximo_minutos: 60, orcamento_por_refeicao: definition.budget, raio_km: definition.radius, ativa: true, ordem: 0 };
    const windowResponse = existingWindow
        ? await supabaseAdmin.from("janelas_alimentacao_rotina").update(windowPayload).eq("id_janela_alimentacao", existingWindow.id_janela_alimentacao)
        : await supabaseAdmin.from("janelas_alimentacao_rotina").insert(windowPayload);
    if (windowResponse.error) throw windowResponse.error;
    const deleted = await supabaseAdmin.from("preferencias_rotina_cliente").delete().eq("id_perfil_rotina", profile.id_perfil_rotina).eq("tipo", "PREFERENCIA");
    if (deleted.error) throw deleted.error;
    const preference = await supabaseAdmin.from("preferencias_rotina_cliente").insert({ id_perfil_rotina: profile.id_perfil_rotina, id_cliente: client.id_cliente, tipo: "PREFERENCIA", valor: definition.preference });
    if (preference.error) throw preference.error;
    return { client: definition.name, preference: definition.preference };
}

async function cleanup() {
    const users = (await allUsers()).filter((user) => user.email?.startsWith("demo.rotina.") && user.email?.endsWith(`@${EMAIL_DOMAIN}`));
    const ids = users.map((user) => user.id);
    if (ids.length) {
        const restaurantDelete = await supabaseAdmin.from("restaurantes").delete().in("id_auth", ids);
        if (restaurantDelete.error) throw restaurantDelete.error;
        const clientDelete = await supabaseAdmin.from("clientes").delete().in("id_auth", ids);
        if (clientDelete.error) throw clientDelete.error;
    }
    for (const user of users) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (error) throw error;
    }
    return users.length;
}

async function verifyPopulation() {
    const { data: restaurantRows, error: restaurantError } = await supabaseAdmin.from("restaurantes").select("id_restaurante,nome").like("nome", "[DEMO]%");
    if (restaurantError) throw restaurantError;
    const { data: clientRows, error: clientError } = await supabaseAdmin.from("clientes").select("id_cliente,nome").like("nome", "[DEMO]%");
    if (clientError) throw clientError;
    const restaurantIds = (restaurantRows ?? []).map((item) => item.id_restaurante);
    const clientIds = (clientRows ?? []).map((item) => item.id_cliente);
    const productsResponse = restaurantIds.length
        ? await supabaseAdmin.from("produtos").select("id_produto").in("id_restaurante", restaurantIds)
        : { data: [], error: null };
    if (productsResponse.error) throw productsResponse.error;
    const productIds = (productsResponse.data ?? []).map((item) => item.id_produto);
    const [menus, safety, profiles, windows] = await Promise.all([
        restaurantIds.length ? supabaseAdmin.from("cardapios").select("id_cardapio", { count: "exact", head: true }).in("id_restaurante", restaurantIds) : { count: 0 },
        productIds.length ? supabaseAdmin.from("seguranca_alimentar_produto").select("id_produto", { count: "exact", head: true }).in("id_produto", productIds).eq("status", "REVISADA") : { count: 0 },
        clientIds.length ? supabaseAdmin.from("perfis_rotina_cliente").select("id_perfil_rotina", { count: "exact", head: true }).in("id_cliente", clientIds).eq("ativo", true) : { count: 0 },
        clientIds.length ? supabaseAdmin.from("janelas_alimentacao_rotina").select("id_janela_alimentacao", { count: "exact", head: true }).in("id_cliente", clientIds).eq("ativa", true) : { count: 0 },
    ]);
    for (const response of [menus, safety, profiles, windows]) if (response.error) throw response.error;
    const authUsers = (await allUsers()).filter((user) => user.email?.startsWith("demo.rotina.") && user.email?.endsWith(`@${EMAIL_DOMAIN}`));
    return {
        auth_users: authUsers.length,
        restaurants: restaurantRows?.length ?? 0,
        menus: menus.count ?? 0,
        products: productIds.length,
        reviewed_food_safety: safety.count ?? 0,
        clients: clientRows?.length ?? 0,
        active_routine_profiles: profiles.count ?? 0,
        active_meal_windows: windows.count ?? 0,
    };
}

async function main() {
    const command = process.argv.includes("--cleanup") ? "cleanup" : process.argv.includes("--preview") ? "preview" : process.argv.includes("--verify") ? "verify" : "seed";
    if (command === "preview") {
        console.log(JSON.stringify({ mode: "preview", restaurants: restaurants.length, products: restaurants.reduce((total, item) => total + Object.values(item.categories).flat().length, 0), clients: clients.length, realPeople: 0, markedAsDemo: true }, null, 2));
        return;
    }
    if (command === "verify") {
        if (!supabaseAdmin) throw new Error("SUPABASE_SECRET_KEY precisa estar configurada somente no backend.");
        console.log(JSON.stringify(await verifyPopulation(), null, 2));
        return;
    }
    const confirmed = process.env.APPONO_DEMO_SEED === CONFIRMATION || process.argv.includes("--confirm");
    if (!confirmed) throw new Error("Defina APPONO_DEMO_SEED=confirmado ou use --confirm para alterar a base de desenvolvimento/homologação.");
    if (process.env.NODE_ENV === "production") throw new Error("O seed de demonstração é bloqueado em NODE_ENV=production.");
    if (!supabaseAdmin) throw new Error("SUPABASE_SECRET_KEY precisa estar configurada somente no backend.");
    const targetHost = new URL(String(process.env.SUPABASE_URL)).hostname;
    const targetArgument = process.argv.find((item) => item.startsWith("--target-host="))?.slice("--target-host=".length);
    if ((process.env.APPONO_DEMO_TARGET_HOST || targetArgument) !== targetHost) throw new Error(`Confirme o projeto com APPONO_DEMO_TARGET_HOST=${targetHost} ou --target-host=${targetHost}.`);
    if (command === "cleanup") {
        console.log(JSON.stringify({ removedUsers: await cleanup() }, null, 2));
        return;
    }
    const configuredPassword = String(process.env.APPONO_DEMO_PASSWORD ?? "");
    const password = configuredPassword || `ApponoDemo!${randomBytes(18).toString("base64url")}`;
    if (password.length < 12) throw new Error("Defina APPONO_DEMO_PASSWORD com ao menos 12 caracteres.");
    const restaurantResults = [];
    for (const [index, restaurant] of restaurants.entries()) restaurantResults.push(await ensureRestaurant(restaurant, index, password));
    const clientResults = [];
    for (const client of clients) clientResults.push(await ensureClient(client, password));
    console.log(JSON.stringify({ restaurants: restaurantResults, clients: clientResults, loginDomain: EMAIL_DOMAIN, temporaryPassword: configuredPassword ? null : password }, null, 2));
}

main().catch((error) => {
    console.error(`DEMO_SEED_FAILED:${error?.message ?? error}`);
    process.exitCode = 1;
});

const { createClient } = require("@supabase/supabase-js");
const { criarCandidatos, calcularDistanciaKm, horarioCompativel } = require("../src/domain/routine-recommendation");

const banco = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function diagnosticar() {
    const { data: restaurantes } = await banco.from("restaurantes")
        .select("id_restaurante, nome, endereco, logo_url, latitude, longitude, valor_minimo_reserva_por_pessoa, configuracao_operacao")
        .eq("ativo", true);

    const { data: produtos } = await banco.from("produtos")
        .select("id_produto, id_restaurante, nome, descricao, preco, imagem_url, disponivel, arquivado, categorias(nome, descricao, ativo, arquivado, cardapios(nome, descricao, ativo)), seguranca_alimentar_produto(status, versao), alergenos_produto(tipo, alergenos_catalogo(codigo, nome))")
        .eq("disponivel", true)
        .eq("arquivado", false);

    const produtosPorRestaurante = new Map();
    for (const p of produtos ?? []) {
        const lista = produtosPorRestaurante.get(p.id_restaurante) ?? [];
        lista.push(p);
        produtosPorRestaurante.set(p.id_restaurante, lista);
    }

    const listaRestaurantes = (restaurantes ?? []).map((r) => ({
        ...r,
        produtos: produtosPorRestaurante.get(r.id_restaurante) ?? [],
    }));

    const perfil = {
        latitude: -23.5005045,
        longitude: -46.8482171,
        raio_km: 100,
        tempo_maximo_minutos: 60,
        orcamento_diario: 40,
        horario_inicio: "12:00:00",
        horario_fim: "16:30:00",
        dias_semana: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    };

    console.log("=== RESTAURANTES CARREGADOS ===");
    for (const r of listaRestaurantes) {
        const dist = calcularDistanciaKm(perfil.latitude, perfil.longitude, r.latitude, r.longitude);
        const config = r.configuracao_operacao;
        const temConfig = config && config.days && config.days.length > 0;
        const wednesdayOp = config?.days?.find((d) => d.id === "wednesday");
        console.log(`  ${r.nome}: ${r.produtos.length} produtos, dist=${dist?.toFixed(2)}km, config=${temConfig}, wed=${JSON.stringify(wednesdayOp?.enabled)}, shifts=${JSON.stringify(wednesdayOp?.shifts)}`);
    }

    console.log("\n=== CANDIDATOS ===");
    const diagnostico = {};
    const candidatos = criarCandidatos({
        perfil,
        restaurantes: listaRestaurantes,
        preferencias: [],
        restricoes: [],
        alergias: [],
        diagnostico,
    });

    console.log(`Total candidatos: ${candidatos.length}`);
    console.log("Diagnóstico filtros:", JSON.stringify(diagnostico));
    for (const c of candidatos) {
        console.log(`  ${c.restaurante.nome} - ${c.produto?.nome ?? "sem produto"} - R$${c.preco_estimado} - ${c.distancia_km?.toFixed(2)}km - score=${c.pontuacao}`);
    }

    console.log("\n=== HORARIO COMPATIVEL (qua 15/10) ===");
    const data = "2026-10-15";
    const agora = new Date("2026-10-14T10:00:00-03:00");
    for (const c of candidatos.slice(0, 20)) {
        const janela = horarioCompativel(c, perfil, data, agora);
        console.log(`  ${c.restaurante.nome} - ${c.produto?.nome ?? "sem produto"}: ${janela ? `OK ${janela.horario_sugerido}` : "BLOQUEADO"}`);
    }
}

diagnosticar().catch(console.error);

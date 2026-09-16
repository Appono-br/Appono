"use strict";

const { supabaseAdmin } = require("../src/lib/supabase");
const { cifrarTokenMercadoPago, possuiChaveCredenciaisMercadoPago } = require("../src/services/pagamentos/credenciais-restaurante");

async function migrarTokensMercadoPago({ banco = supabaseAdmin, tamanhoLote = 100 } = {}) {
    if (!banco) throw new Error("SUPABASE_SECRET_KEY precisa estar configurada para migrar as credenciais Mercado Pago.");
    if (!possuiChaveCredenciaisMercadoPago()) {
        throw new Error("APPONO_MERCADO_PAGO_TOKEN_ENCRYPTION_KEY precisa estar configurada para migrar as credenciais Mercado Pago.");
    }

    let ultimoId = 0;
    let migradas = 0;
    while (true) {
        const { data: conexoes, error } = await banco
            .from("mercado_pago_conexoes_restaurante")
            .select("id_conexao, access_token, refresh_token, access_token_cifrado, refresh_token_cifrado")
            .gt("id_conexao", ultimoId)
            .order("id_conexao", { ascending: true })
            .limit(tamanhoLote);
        if (error) throw new Error(error.message);
        if (!conexoes?.length) break;

        for (const conexao of conexoes) {
            ultimoId = conexao.id_conexao;
            if (!conexao.access_token && !conexao.refresh_token) continue;
            const { error: atualizacaoError } = await banco
                .from("mercado_pago_conexoes_restaurante")
                .update({
                    access_token_cifrado: conexao.access_token ? cifrarTokenMercadoPago(conexao.access_token) : conexao.access_token_cifrado ?? null,
                    refresh_token_cifrado: conexao.refresh_token ? cifrarTokenMercadoPago(conexao.refresh_token) : conexao.refresh_token_cifrado ?? null,
                    token_cifrado_em: new Date().toISOString(),
                    access_token: null,
                    refresh_token: null,
                })
                .eq("id_conexao", conexao.id_conexao);
            if (atualizacaoError) throw new Error(atualizacaoError.message);
            migradas += 1;
        }
        if (conexoes.length < tamanhoLote) break;
    }
    return { migradas };
}

if (require.main === module) {
    migrarTokensMercadoPago()
        .then(({ migradas }) => console.log(`Credenciais Mercado Pago migradas: ${migradas}.`))
        .catch((error) => {
            console.error("Não foi possível migrar as credenciais Mercado Pago:", error.message);
            process.exitCode = 1;
        });
}

module.exports = { migrarTokensMercadoPago };

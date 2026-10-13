"use strict";

const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { supabaseAdmin } = require("../src/lib/supabase");

async function main() {
    const email = process.argv[2] || process.env.APPONO_ADMIN_EMAILS?.split(",")[0]?.trim();
    if (!email) { console.error("Uso: node get-admin-token.js <email>"); process.exit(1); }

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const admin = users.find((u) => u.email === email);
    if (!admin) { console.error(`Usuario ${email} nao encontrado.`); process.exit(1); }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    if (error) { console.error("Erro:", error.message); process.exit(1); }

    const url = new URL(data.properties.action_link);
    const token = url.hash ? url.hash.replace("#", "") : url.searchParams.toString();

    const verifyUrl = `${process.env.SUPABASE_URL}/auth/v1/verify`;
    const params = new URLSearchParams(token);
    const tokenHash = params.get("token") || data.properties.hashed_token;

    const response = await fetch(`${verifyUrl}?token=${tokenHash}&type=magiclink`, {
        method: "GET",
        headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY },
        redirect: "manual",
    });

    if (response.status === 303 || response.status === 302) {
        const location = response.headers.get("location");
        const fragment = new URL(location).hash.substring(1);
        const fragmentParams = new URLSearchParams(fragment);
        const accessToken = fragmentParams.get("access_token");
        if (accessToken) {
            console.log("\n=== ACCESS TOKEN ===\n");
            console.log(accessToken);
            console.log("\n=== USO ===\n");
            console.log(`node backend/scripts/evaluate-rag.js --base-url=http://localhost:3001 --token=${accessToken}`);
            return;
        }
    }

    const body = await response.json().catch(() => null);
    if (body?.access_token) {
        console.log("\n=== ACCESS TOKEN ===\n");
        console.log(body.access_token);
        console.log("\n=== USO ===\n");
        console.log(`node backend/scripts/evaluate-rag.js --base-url=http://localhost:3001 --token=${body.access_token}`);
        return;
    }

    console.log("Nao foi possivel extrair o token automaticamente.");
    console.log("Link magico gerado:", data.properties.action_link);
    console.log("\nAbra este link no navegador, depois copie o access_token da URL de redirecionamento.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });

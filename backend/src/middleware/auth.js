"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const supabase_1 = require("../lib/supabase");
async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Não autenticado" });
    }
    const accessToken = authorization.slice(7);
    const clienteAutenticacao = supabase_1.supabaseAdmin ?? supabase_1.supabaseAuth;
    const { data: { user }, error, } = await clienteAutenticacao.auth.getUser(accessToken);
    if (error || !user) {
        return res.status(401).json({ error: "Token inválido" });
    }
    res.locals.user = user;
    res.locals.accessToken = accessToken;
    next();
}

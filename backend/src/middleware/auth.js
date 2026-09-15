"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const supabase_1 = require("../lib/supabase");
const { isRoleAllowed, resolveRole } = require("../domain/authorization");
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
function requireRole(...roles) {
    return async function authorizeRole(_req, res, next) {
        const permitidos = new Set(roles.flat());
        const admins = new Set(String(process.env.APPONO_ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
        if (permitidos.has("admin") && admins.has(String(res.locals.user?.email ?? "").toLowerCase())) {
            res.locals.role = "admin";
            return next();
        }
        const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
        const [{ data: cliente }, { data: restaurante }] = await Promise.all([
            supabase.from("clientes").select("id_cliente").eq("id_auth", res.locals.user.id).maybeSingle(),
            supabase.from("restaurantes").select("id_restaurante").eq("id_auth", res.locals.user.id).maybeSingle(),
        ]);
        const role = resolveRole({ clientId: cliente?.id_cliente, restaurantId: restaurante?.id_restaurante });
        if (!isRoleAllowed(role, permitidos)) return res.status(403).json({ error: "Perfil sem permissão para este recurso." });
        res.locals.role = role;
        res.locals.profileId = cliente?.id_cliente ?? restaurante?.id_restaurante;
        return next();
    };
}

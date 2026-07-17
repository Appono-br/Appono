"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabaseAuth = void 0;
exports.isSupabaseConfigured = isSupabaseConfigured;
exports.createUserSupabaseClient = createUserSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
if (process.env.NODE_ENV !== "production" &&
    process.env.SUPABASE_ALLOW_INSECURE_TLS === "true") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const missingSupabaseConfigMessage = "O acesso esta temporariamente indisponivel. Tente novamente mais tarde.";
function hasSupabasePlaceholder(value) {
    return (!value ||
        value.includes("seu-projeto") ||
        value.includes("sua-chave") ||
        value.includes("sua-chave-secreta"));
}
function createUnavailableSupabaseClient() {
    return new Proxy({}, {
        get() {
            throw new Error(missingSupabaseConfigMessage);
        },
    });
}
function isSupabaseConfigured() {
    return !hasSupabasePlaceholder(supabaseUrl) && !hasSupabasePlaceholder(publishableKey);
}
exports.supabaseAuth = isSupabaseConfigured()
    ? (0, supabase_js_1.createClient)(supabaseUrl, publishableKey)
    : createUnavailableSupabaseClient();
exports.supabaseAdmin = isSupabaseConfigured() && !hasSupabasePlaceholder(secretKey)
    ? (0, supabase_js_1.createClient)(supabaseUrl, secretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;
function createUserSupabaseClient(accessToken) {
    if (!isSupabaseConfigured()) {
        throw new Error(missingSupabaseConfigMessage);
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, publishableKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}

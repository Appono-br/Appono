import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const missingSupabaseConfigMessage = 'Não conseguimos conectar sua conta agora. Tente novamente em alguns instantes.';
function hasSupabasePlaceholder(value) {
    return (!value ||
        value.includes('seu-projeto') ||
        value.includes('sua-chave'));
}
function createMissingSupabaseClient() {
    return new Proxy({}, {
        get() {
            throw new Error(missingSupabaseConfigMessage);
        },
    });
}
export const supabase = !hasSupabasePlaceholder(supabaseUrl) && !hasSupabasePlaceholder(publishableKey)
    ? createClient(supabaseUrl, publishableKey)
    : createMissingSupabaseClient();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const missingSupabaseConfigMessage =
    'Nao conseguimos conectar sua conta agora. Tente novamente em alguns instantes.';

function hasSupabasePlaceholder(value?: string) {
    return (
        !value ||
        value.includes('seu-projeto') ||
        value.includes('sua-chave')
    );
}

function createMissingSupabaseClient(): ReturnType<typeof createClient> {
    return new Proxy(
        {},
        {
            get() {
                throw new Error(missingSupabaseConfigMessage);
            },
        },
    ) as ReturnType<typeof createClient>;
}

export const supabase =
    !hasSupabasePlaceholder(supabaseUrl) && !hasSupabasePlaceholder(publishableKey)
        ? createClient(supabaseUrl!, publishableKey!)
        : createMissingSupabaseClient();

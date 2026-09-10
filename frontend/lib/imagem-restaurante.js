import { obterTokensAutenticacao } from "./session";
import { supabase } from "./supabase";
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const BUCKET_IMAGENS_RESTAURANTES = "imagens-restaurantes";
export function validarImagemRestaurante(arquivo) {
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
        return "Selecione uma imagem JPG, PNG ou WebP.";
    }
    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
        return "A imagem deve possuir no maximo 5 MB.";
    }
    return null;
}
export async function enviarImagemRestaurante(arquivo, sessao) {
    const erroValidacao = validarImagemRestaurante(arquivo);
    if (erroValidacao) {
        throw new Error(erroValidacao);
    }
    const tokens = sessao
        ? {
            accessToken: sessao.access_token,
            refreshToken: sessao.refresh_token,
        }
        : obterTokensAutenticacao();
    if (tokens?.accessToken && tokens.refreshToken) {
        const { error } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
        });
        if (error) {
            throw new Error("Não foi possível autenticar o envio da imagem.");
        }
    }
    const { data: usuario, error: erroUsuario } = await supabase.auth.getUser();
    if (erroUsuario || !usuario.user) {
        throw new Error("Entre na conta do restaurante para enviar a imagem.");
    }
    const caminho = `${usuario.user.id}/perfil`;
    const { error: erroUpload } = await supabase.storage
        .from(BUCKET_IMAGENS_RESTAURANTES)
        .upload(caminho, arquivo, {
        cacheControl: "3600",
        contentType: arquivo.type,
        upsert: true,
    });
    if (erroUpload) {
        throw new Error(erroUpload.message);
    }
    const { data } = supabase.storage
        .from(BUCKET_IMAGENS_RESTAURANTES)
        .getPublicUrl(caminho);
    const logoUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: erroAtualizacao } = await supabase
        .from("restaurantes")
        .update({ logo_url: logoUrl })
        .eq("id_auth", usuario.user.id);
    if (erroAtualizacao) {
        throw new Error(erroAtualizacao.message);
    }
    return logoUrl;
}

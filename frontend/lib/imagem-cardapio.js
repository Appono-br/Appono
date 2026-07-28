import { obterTokensAutenticacao } from "./session";
import { supabase } from "./supabase";

const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const BUCKET_IMAGENS_RESTAURANTES = "imagens-restaurantes";

export function validarImagemCardapio(arquivo) {
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
        return "Selecione uma imagem JPG, PNG ou WebP.";
    }
    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
        return "A imagem deve possuir no maximo 5 MB.";
    }
    return null;
}

function limparNomeArquivo(nome) {
    return nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9.-]/g, "-")
        .toLowerCase();
}

export async function enviarImagemCardapio(arquivo) {
    const erroValidacao = validarImagemCardapio(arquivo);
    if (erroValidacao) {
        throw new Error(erroValidacao);
    }

    const tokens = obterTokensAutenticacao();
    if (tokens?.accessToken && tokens.refreshToken) {
        const { error } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
        });
        if (error) {
            throw new Error("Nao foi possivel autenticar o envio da imagem.");
        }
    }

    const { data: usuario, error: erroUsuario } = await supabase.auth.getUser();
    if (erroUsuario || !usuario.user) {
        throw new Error("Entre na conta do restaurante para enviar a imagem.");
    }

    const caminho = `${usuario.user.id}/cardapio/${Date.now()}-${limparNomeArquivo(arquivo.name)}`;
    const { error: erroUpload } = await supabase.storage
        .from(BUCKET_IMAGENS_RESTAURANTES)
        .upload(caminho, arquivo, {
            cacheControl: "3600",
            contentType: arquivo.type,
            upsert: false,
        });

    if (erroUpload) {
        throw new Error(erroUpload.message);
    }

    const { data } = supabase.storage
        .from(BUCKET_IMAGENS_RESTAURANTES)
        .getPublicUrl(caminho);

    return data.publicUrl;
}

function obterCaminhoStoragePorUrl(url) {
    if (!url) {
        return "";
    }
    const marcador = `/storage/v1/object/public/${BUCKET_IMAGENS_RESTAURANTES}/`;
    const indice = url.indexOf(marcador);
    if (indice === -1) {
        return "";
    }
    const caminhoComBusca = url.slice(indice + marcador.length);
    return decodeURIComponent(caminhoComBusca.split("?")[0]);
}

export async function excluirImagemCardapioPorUrl(url) {
    const caminho = obterCaminhoStoragePorUrl(url);
    if (!caminho || !caminho.includes("/cardapio/")) {
        return;
    }
    const tokens = obterTokensAutenticacao();
    if (tokens?.accessToken && tokens.refreshToken) {
        const { error } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
        });
        if (error) {
            throw new Error("Nao foi possivel autenticar a exclusao da imagem anterior.");
        }
    }
    const { error } = await supabase.storage
        .from(BUCKET_IMAGENS_RESTAURANTES)
        .remove([caminho]);
    if (error) {
        throw new Error(error.message);
    }
}

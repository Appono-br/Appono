import { supabase } from "./supabase";

function obterUrlRecuperacaoSenha() {
  const urlConfigurada = process.env.NEXT_PUBLIC_PASSWORD_RECOVERY_REDIRECT_URL?.trim();
  return urlConfigurada || `${window.location.origin}/recuperar-senha`;
}

export async function solicitarRecuperacaoSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: obterUrlRecuperacaoSenha() },
  );
  if (error) throw error;
}

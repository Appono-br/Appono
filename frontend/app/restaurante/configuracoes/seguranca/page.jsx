"use client";
import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useState } from "react";
const initialForm = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    inviteEmail: "",
    inviteRole: "manager",
    twoFactorEnabled: false,
    requireTwoFactorForTeam: true,
    sessionTimeout: "30",
    orderApprovalRequired: false,
    financeApprovalRequired: true,
};
const roleLabels = {
    manager: "Gestão",
    kitchen: "Cozinha",
    host: "Salao",
    finance: "Financeiro",
};
function getStorage() {
    if (typeof window === "undefined" || !window.localStorage) {
        return null;
    }
    return window.localStorage;
}
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "arrow-left": "M19 12H5M12 19l-7-7 7-7",
        help: "M9.1 9a3 3 0 1 1 4.9 2.3c-1 .6-1.5 1.1-1.5 2.2M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        key: "M21 2l-2 2M15.5 7.5l2 2M14 4l6 6-7 7H9v4H5v-4H1v-4h4l9-9z",
        lock: "M6 10V8a6 6 0 0 1 12 0v2M5 10h14v11H5V10z",
        shield: "M12 21s7-3.2 7-9.8V5l-7-3-7 3v6.2C5 17.8 12 21 12 21z",
        "user-plus": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M19 8v6M22 11h-6",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function Toggle({ checked, onChange, label, }) {
    return (<button type="button" onClick={onChange} className={`relative h-8 w-14 rounded-full transition ${checked ? "bg-app-mocha" : "bg-app-cinza/35"}`} aria-label={label}>
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${checked ? "left-7" : "left-1"}`}/>
    </button>);
}
function PasswordField({ label, value, onChange, }) {
    return (<label className="grid gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
        {label}
      </span>
      <input type="password" value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20"/>
    </label>);
}
export default function RestaurantSecuritySettingsPage() {
    const [session] = useState(() => {
        if (typeof window === "undefined") {
            return null;
        }
        const storedSession = getStorage()?.getItem("appono:session");
        return storedSession ? JSON.parse(storedSession) : null;
    });
    const [form, setForm] = useState(() => {
        if (typeof window === "undefined") {
            return initialForm;
        }
        const stored = getStorage()?.getItem("appono:restaurantSecurityDraft");
        return stored ? JSON.parse(stored) : initialForm;
    });
    const [message, setMessage] = useState("");
    const isRestaurant = session?.type === "restaurant";
    const passwordsMatch = !form.newPassword || form.newPassword === form.confirmPassword;
    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setMessage("");
    }
    function submitForm(event) {
        event.preventDefault();
        if (!passwordsMatch) {
            setMessage("A nova senha e a confirmação precisam ser iguais.");
            return;
        }
        const safeDraft = {
            inviteEmail: form.inviteEmail,
            inviteRole: form.inviteRole,
            twoFactorEnabled: form.twoFactorEnabled,
            requireTwoFactorForTeam: form.requireTwoFactorForTeam,
            sessionTimeout: form.sessionTimeout,
            orderApprovalRequired: form.orderApprovalRequired,
            financeApprovalRequired: form.financeApprovalRequired,
        };
        getStorage()?.setItem("appono:restaurantSecurityDraft", JSON.stringify(safeDraft));
        setMessage("Configurações de segurança salvas neste navegador.");
    }
    if (!isRestaurant) {
        return (<main className="flex min-h-screen items-center justify-center bg-white px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority/>
          <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">
            Esta área é destinada a contas de restaurante.
          </p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">
            Entrar
          </Link>
        </section>
      </main>);
    }
    return (<main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid min-h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-2">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={72} height={72} className="h-11 w-11" priority/>
          </div>
          <div className="flex items-center justify-center gap-6">
            <Link href="/restaurante/configuracoes" className="transition hover:text-app-caramelo-torrado" aria-label="Voltar para configurações">
              <Icon type="arrow-left" className="h-5 w-5"/>
            </Link>
            <h1 className="text-lg font-bold uppercase tracking-[0.14em] sm:text-2xl">
              Configurações
            </h1>
          </div>
          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
            <Icon type="help" className="hidden h-5 w-5 justify-self-end text-app-mocha sm:block"/>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="border-t border-app-baunilha-dourada/60 pt-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
            Controle administrativo
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
            Segurança e Acesso
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-app-cinza sm:text-base">
            Proteja a conta do restaurante, convide pessoas da equipe e limite
            acoes sensiveis por perfil de trabalho.
          </p>
        </div>

        <form onSubmit={submitForm} className="mt-10 grid gap-8 lg:grid-cols-[0.72fr_1fr]">
          <aside className="grid gap-6">
            <section className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-app-baunilha-dourada text-app-caramelo-torrado">
                  <Icon type="key" className="h-6 w-6"/>
                </span>
                <div>
                  <h3 className="text-2xl font-medium text-app-cafe-profundo">
                    Alterar senha
                  </h3>
                  <p className="mt-1 text-sm text-app-cinza">
                    A senha não fica salva no rascunho local.
                  </p>
                </div>
              </div>
              <div className="mt-7 grid gap-5">
                <PasswordField label="Senha atual" value={form.currentPassword} onChange={(value) => updateField("currentPassword", value)}/>
                <PasswordField label="Nova senha" value={form.newPassword} onChange={(value) => updateField("newPassword", value)}/>
                <PasswordField label="Confirmar nova senha" value={form.confirmPassword} onChange={(value) => updateField("confirmPassword", value)}/>
              </div>
              {!passwordsMatch ? (<p className="mt-3 text-sm font-semibold text-app-vermelho-erro">
                  A confirmação precisa repetir a nova senha.
                </p>) : null}
            </section>

            <section className="rounded-[8px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
              <h3 className="flex items-center gap-3 text-2xl font-medium text-app-cafe-profundo">
                <Icon type="user-plus" className="h-6 w-6 text-app-caramelo-torrado"/>
                Convidar equipe
              </h3>
              <div className="mt-6 grid gap-5">
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                    Email do colaborador
                  </span>
                  <input type="email" value={form.inviteEmail} onChange={(event) => updateField("inviteEmail", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado"/>
                </label>
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                    Perfil de acesso
                  </span>
                  <select value={form.inviteRole} onChange={(event) => updateField("inviteRole", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado">
                    {Object.keys(roleLabels).map((role) => (<option key={role} value={role}>
                        {roleLabels[role]}
                      </option>))}
                  </select>
                </label>
              </div>
            </section>
          </aside>

          <section className="rounded-[8px] bg-app-baunilha-dourada p-5 shadow-sm ring-1 ring-app-caramelo-torrado/15 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-medium text-app-cafe-profundo">
                  Políticas de acesso
                </h3>
                <p className="mt-2 text-sm leading-6 text-app-mocha">
                  Restrinja decisoes criticas e reduza risco em turnos com muitos
                  operadores.
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-white text-app-caramelo-torrado">
                <Icon type="shield" className="h-6 w-6"/>
              </span>
            </div>

            <div className="mt-7 grid gap-4">
              {[
            {
                title: "Autenticação em duas etapas",
                description: "Exige uma etapa adicional para acessar o painel administrativo.",
                checked: form.twoFactorEnabled,
                action: () => updateField("twoFactorEnabled", !form.twoFactorEnabled),
            },
            {
                title: "Obrigar 2FA para equipe",
                description: "Novos convites só ficam ativos quando o colaborador configurar proteção extra.",
                checked: form.requireTwoFactorForTeam,
                action: () => updateField("requireTwoFactorForTeam", !form.requireTwoFactorForTeam),
            },
            {
                title: "Aprovar alterações de pedido",
                description: "Mudancas sensíveis em reservas e pedidos exigem perfil de gestão.",
                checked: form.orderApprovalRequired,
                action: () => updateField("orderApprovalRequired", !form.orderApprovalRequired),
            },
            {
                title: "Aprovar alterações financeiras",
                description: "Dados bancários e repasses exigem confirmação administrativa.",
                checked: form.financeApprovalRequired,
                action: () => updateField("financeApprovalRequired", !form.financeApprovalRequired),
            },
        ].map((item) => (<article key={item.title} className="flex flex-col gap-4 rounded-[8px] bg-white p-5 ring-1 ring-app-baunilha-dourada/50 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-app-cafe-profundo">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-app-cinza">
                      {item.description}
                    </p>
                  </div>
                  <Toggle checked={item.checked} onChange={item.action} label={`${item.checked ? "Desativar" : "Ativar"} ${item.title}`}/>
                </article>))}
            </div>

            <label className="mt-6 grid gap-2 rounded-[8px] bg-white p-5 ring-1 ring-app-baunilha-dourada/50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                Encerrar sessão após inatividade
              </span>
              <select value={form.sessionTimeout} onChange={(event) => updateField("sessionTimeout", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado">
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
                <option value="240">4 horas</option>
              </select>
            </label>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Link href="/restaurante/configuracoes" className="flex h-12 items-center justify-center rounded-[8px] border border-app-mocha px-8 text-xs font-bold uppercase tracking-wide text-app-mocha transition hover:bg-app-creme-leve">
                Cancelar
              </Link>
              <button type="submit" className="h-12 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado">
                Salvar segurança
              </button>
            </div>
            {message ? <p className="mt-4 text-sm font-semibold text-app-mocha">{message}</p> : null}
          </section>
        </form>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
          <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">Política de Privacidade</Link>
            <Link href="#" className="transition hover:text-app-chantilly">Termos de Uso</Link>
            <Link href="#" className="transition hover:text-app-chantilly">Contato</Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">
            &copy; 2026 APPONO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>);
}

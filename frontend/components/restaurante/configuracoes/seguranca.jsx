"use client";
import { useInterface } from "@/lib/use-interface";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CircleHelp, KeyRound, Lock, ShieldCheck, UserPlus } from "lucide-react";
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
const securityIcons = { help: CircleHelp, key: KeyRound, lock: Lock, shield: ShieldCheck, "user-plus": UserPlus };
function Icon({ type, className = "h-5 w-5" }) {
    const IconComponent = securityIcons[type] ?? ShieldCheck;
    return <IconComponent className={className} aria-hidden="true" />;
}
function Toggle({ checked, onChange, label, }) {
    const { ui } = useInterface();
    return (<button type="button" onClick={onChange} className={`relative h-8 w-14 rounded-full transition ${checked ? "bg-app-mocha" : "bg-app-cinza/35"}`} aria-label={ui(label)}>
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${checked ? "left-7" : "left-1"}`}/>
    </button>);
}
function PasswordField({ label, value, onChange, }) {
    const { ui } = useInterface();
    return (<label className="grid gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
        {ui(label)}
      </span>
      <input type="password" value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20"/>
    </label>);
}
export default function RestaurantSecuritySettingsPage({ onVoltar }) {
    const { ui } = useInterface();
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
          <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={88} height={88} className="mx-auto h-20 w-20" priority/>
          <h1 className="mt-6 text-3xl font-semibold">{ui("Acesso restrito")}</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">{ui("Esta área é destinada a contas de restaurante.")}</p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">{ui("Entrar")}</Link>
        </section>
      </main>);
    }
    return (<div className="min-w-0 text-app-cafe-profundo">

      <section className="w-full min-w-0">
        <div className="border-b border-app-baunilha-dourada/60 pb-6">
          <h2 className="text-3xl font-medium leading-tight text-app-cafe-profundo">{ui("Segurança e Acesso")}</h2>
        </div>

        <form onSubmit={submitForm} className="mt-10 grid gap-8">
          <aside className="grid gap-6">
            <section className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
              <h3 className="text-2xl font-medium text-app-cafe-profundo">{ui("Alterar senha")}</h3>
              <div className="mt-7 grid gap-5">
                <PasswordField label={ui("Senha atual")} value={form.currentPassword} onChange={(value) => updateField("currentPassword", value)}/>
                <PasswordField label={ui("Nova senha")} value={form.newPassword} onChange={(value) => updateField("newPassword", value)}/>
                <PasswordField label={ui("Confirmar nova senha")} value={form.confirmPassword} onChange={(value) => updateField("confirmPassword", value)}/>
              </div>
              {!passwordsMatch ? (<p className="mt-3 text-sm font-semibold text-app-vermelho-erro">{ui("A confirmação precisa repetir a nova senha.")}</p>) : null}
            </section>

            <section className="rounded-[8px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
              <h3 className="flex items-center gap-3 text-2xl font-medium text-app-cafe-profundo">
                <Icon type="user-plus" className="h-6 w-6 text-app-caramelo-torrado"/>{ui("Convidar equipe")}</h3>
              <div className="mt-6 grid gap-5">
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">{ui("Email do colaborador")}</span>
                  <input type="email" value={form.inviteEmail} onChange={(event) => updateField("inviteEmail", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado"/>
                </label>
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">{ui("Perfil de acesso")}</span>
                  <select value={form.inviteRole} onChange={(event) => updateField("inviteRole", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado">
                    {Object.keys(roleLabels).map((role) => (<option key={role} value={role}>
                        {ui(roleLabels[role])}
                      </option>))}
                  </select>
                </label>
              </div>
            </section>
          </aside>

          <section className="rounded-[8px] bg-app-baunilha-dourada p-5 shadow-sm ring-1 ring-app-caramelo-torrado/15 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-medium text-app-cafe-profundo">{ui("Políticas de acesso")}</h3>
                <p className="mt-2 text-sm leading-6 text-app-mocha">{ui("Restrinja decisoes criticas e reduza risco em turnos com muitos operadores.")}</p>
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
                      {ui(item.title)}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-app-cinza">
                      {ui(item.description)}
                    </p>
                  </div>
                  <Toggle checked={item.checked} onChange={item.action} label={ui("{0} {1}", [item.checked ? "Desativar" : "Ativar", item.title])}/>
                </article>))}
            </div>

            <label className="mt-6 grid gap-2 rounded-[8px] bg-white p-5 ring-1 ring-app-baunilha-dourada/50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">{ui("Encerrar sessão após inatividade")}</span>
              <select value={form.sessionTimeout} onChange={(event) => updateField("sessionTimeout", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado">
                <option value="15">{ui("15 minutos")}</option>
                <option value="30">{ui("30 minutos")}</option>
                <option value="60">{ui("1 hora")}</option>
                <option value="240">{ui("4 horas")}</option>
              </select>
            </label>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button type="button" onClick={onVoltar} className="flex h-12 items-center justify-center rounded-[8px] border border-app-mocha px-8 text-xs font-bold uppercase tracking-wide text-app-mocha transition hover:bg-app-creme-leve">{ui("Cancelar")}</button>
              <button type="submit" className="h-12 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado">{ui("Salvar segurança")}</button>
            </div>
            {message ? <p className="mt-4 text-sm font-semibold text-app-mocha">{ui(message)}</p> : null}
          </section>
        </form>
      </section>


    </div>);
}

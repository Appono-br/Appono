"use client";
import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useState } from "react";
const paymentOptions = [
    {
        id: "credit",
        title: "Cartão de crédito",
        description: "Confirmação de reservas e pedidos.",
        icon: "card",
    },
    {
        id: "debit",
        title: "Cartão de débito",
        description: "Pagamento direto no cartão.",
        icon: "card",
    },
    {
        id: "pix",
        title: "Pix",
        description: "Chave Pix ou QR Code.",
        icon: "pix",
    },
    {
        id: "meal",
        title: "Vale-refeição",
        description: "Benefícios aceitos no restaurante.",
        icon: "voucher",
    },
];
const initialForm = {
    kind: "credit",
    holderName: "",
    cardNumber: "",
    expiration: "",
    securityCode: "",
    pixKey: "",
    benefitProvider: "",
    nickname: "",
};
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "arrow-left": "M19 12H5M12 19l-7-7 7-7",
        card: "M4 7h16v10H4V7z M4 10h16M8 14h3",
        pix: "M12 3 21 12 12 21 3 12 12 3z M8 12l4-4 4 4-4 4-4-4z",
        voucher: "M5 5h14v14H5V5z M8 9h8M8 13h5M17 5v14",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function Field({ label, children, className = "", }) {
    return (<label className={`grid gap-1.5 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
        {label}
      </span>
      {children}
    </label>);
}
export default function PaymentSettingsPage() {
    const [form, setForm] = useState(initialForm);
    const [message, setMessage] = useState("");
    const selectedOption = paymentOptions.find((option) => option.id === form.kind);
    const isCard = form.kind === "credit" || form.kind === "debit";
    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setMessage("");
    }
    function submitForm(event) {
        event.preventDefault();
        window.localStorage.removeItem("appono:paymentDraft");
        setMessage("Os meios de pagamento sao escolhidos diretamente no checkout seguro do Mercado Pago.");
    }
    return (<main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="border-b border-app-baunilha-dourada/50 bg-app-creme-suave">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={72} height={72} className="h-11 w-11" priority/>
          </div>
          <div className="flex items-center justify-center gap-6">
            <Link href="/cliente/configuracoes" className="transition hover:text-app-caramelo-torrado" aria-label="Voltar para configurações">
              <Icon type="arrow-left" className="h-5 w-5"/>
            </Link>
            <h1 className="text-lg font-bold uppercase tracking-[0.14em] sm:text-2xl">
              Configurações
            </h1>
          </div>
          <div className="justify-self-end text-app-cafe-profundo">
            <ItemHeaderNotificacoes href="/cliente/notificacoes" />
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
        <div>
          <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
            Pagamentos
          </p>
          <h2 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">
            Métodos de Pagamento
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-app-mocha sm:text-base">
            Cadastre um método para usar nas próximas reservas. Os campos mudam
            conforme o tipo selecionado.
          </p>
        </div>

        <form onSubmit={submitForm} className="mt-10 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <fieldset aria-labelledby="payment-type-title" className="grid gap-3 rounded-[8px] bg-app-creme-leve p-5 pt-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-6 sm:pt-7">
            <div id="payment-type-title" className="pb-1 text-xs font-bold uppercase tracking-[0.2em] text-app-mocha">
              Tipo de pagamento
            </div>
            {paymentOptions.map((option) => {
            const isSelected = form.kind === option.id;
            return (<button key={option.id} type="button" onClick={() => updateField("kind", option.id)} className={`grid rounded-[8px] p-3 text-left transition sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3 ${isSelected
                    ? "bg-app-cafe-profundo text-app-creme-leve"
                    : "bg-app-chantilly text-app-cafe-profundo hover:bg-app-baunilha-dourada"}`}>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${isSelected
                    ? "bg-app-creme-leve text-app-cafe-profundo"
                    : "bg-app-baunilha-dourada text-app-caramelo-torrado"}`}>
                    <Icon type={option.icon}/>
                  </span>
                  <span className="mt-3 sm:mt-0">
                    <strong className="block text-sm">{option.title}</strong>
                    <span className={`mt-1 block text-xs leading-4 ${isSelected ? "text-app-creme-suave" : "text-app-cinza"}`}>
                      {option.description}
                    </span>
                  </span>
                  <span className={`mt-3 h-4 w-4 rounded-full border-2 sm:mt-0 ${isSelected
                    ? "border-app-dourado-mel bg-app-dourado-mel"
                    : "border-app-cinza/40"}`}/>
                </button>);
        })}
          </fieldset>

          <section className="rounded-[8px] bg-app-chantilly p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
                  {selectedOption?.title}
                </p>
                <h3 className="mt-1 text-2xl font-medium text-app-cafe-profundo">
                  Dados do método
                </h3>
              </div>
              {selectedOption ? (<span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-app-baunilha-dourada text-app-caramelo-torrado">
                  <Icon type={selectedOption.icon}/>
                </span>) : null}
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Field label="Apelido" className="sm:col-span-2">
                <input value={form.nickname} onChange={(event) => updateField("nickname", event.target.value)} placeholder="Ex: Cartão principal" className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve px-4 text-sm outline-none transition placeholder:text-app-cinza/50 focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"/>
              </Field>

              {isCard ? (<>
                  <Field label="Nome impresso" className="sm:col-span-2">
                    <input value={form.holderName} onChange={(event) => updateField("holderName", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve px-4 text-sm outline-none transition focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"/>
                  </Field>
                  <Field label="Número do cartão" className="sm:col-span-2">
                    <input inputMode="numeric" value={form.cardNumber} onChange={(event) => updateField("cardNumber", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve px-4 text-sm outline-none transition focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"/>
                  </Field>
                  <Field label="Validade">
                    <input placeholder="MM/AA" value={form.expiration} onChange={(event) => updateField("expiration", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve px-4 text-sm outline-none transition placeholder:text-app-cinza/50 focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"/>
                  </Field>
                  <Field label="CVV">
                    <input inputMode="numeric" value={form.securityCode} onChange={(event) => updateField("securityCode", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve px-4 text-sm outline-none transition focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"/>
                  </Field>
                </>) : null}

              {form.kind === "pix" ? (<Field label="Chave Pix" className="sm:col-span-2">
                  <input value={form.pixKey} onChange={(event) => updateField("pixKey", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve px-4 text-sm outline-none transition focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"/>
                </Field>) : null}

              {form.kind === "meal" ? (<Field label="Operadora do benefício" className="sm:col-span-2">
                  <input value={form.benefitProvider} onChange={(event) => updateField("benefitProvider", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve px-4 text-sm outline-none transition focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"/>
                </Field>) : null}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="h-11 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado">
                Salvar método
              </button>
              <Link href="/cliente/configuracoes" className="flex h-11 items-center justify-center rounded-[8px] border border-app-mocha px-8 text-xs font-bold uppercase tracking-wide text-app-mocha transition hover:bg-app-creme-leve">
                Cancelar
              </Link>
            </div>

            {message ? (<p className="mt-3 text-sm font-semibold text-app-caramelo-torrado">
                {message}
              </p>) : null}
          </section>
        </form>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-4 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={56} height={56} className="h-10 w-10 brightness-0 invert"/>
          <nav className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">
              Política de Privacidade
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Termos de Uso
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Contato
            </Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">
            &copy; 2026 APPONO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>);
}

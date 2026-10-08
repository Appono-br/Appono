"use client";

import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

const estilos = {
  sucesso: {
    icone: CheckCircle2,
    titulo: "Tudo certo",
    classe: "border-app-verde-sucesso/35 bg-app-verde-sucesso-claro text-app-cafe-profundo",
  },
  erro: {
    icone: XCircle,
    titulo: "Não foi possível concluir",
    classe: "border-app-vermelho-erro/35 bg-white text-app-cafe-profundo",
  },
  aviso: {
    icone: AlertCircle,
    titulo: "Atenção",
    classe: "border-app-baunilha-dourada bg-app-creme-leve text-app-cafe-profundo",
  },
  informacao: {
    icone: Info,
    titulo: "Informação",
    classe: "border-app-baunilha-dourada/70 bg-white text-app-cafe-profundo",
  },
};

function normalizarToast(entrada, tipoPadrao) {
  if (typeof entrada === "string") return { mensagem: entrada, tipo: tipoPadrao, duracao: 5000 };
  return {
    mensagem: entrada?.mensagem ?? entrada?.message ?? "Ocorreu uma atualização.",
    titulo: entrada?.titulo ?? entrada?.title,
    tipo: entrada?.tipo ?? entrada?.type ?? tipoPadrao,
    duracao: entrada?.duracao ?? entrada?.duration ?? 5000,
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [toastsSaindo, setToastsSaindo] = useState(() => new Set());
  const [montado, setMontado] = useState(false);
  const ultimaValidacao = useRef({ mensagem: "", tempo: 0 });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMontado(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const remover = useCallback((id) => {
    setToasts((atuais) => atuais.filter((toast) => toast.id !== id));
  }, []);

  const fechar = useCallback((id) => {
    setToastsSaindo((atuais) => new Set(atuais).add(id));
    window.setTimeout(() => {
      remover(id);
      setToastsSaindo((atuais) => {
        const proxima = new Set(atuais);
        proxima.delete(id);
        return proxima;
      });
    }, 240);
  }, [remover]);

  const exibir = useCallback((entrada, tipoPadrao = "informacao") => {
    const toast = { id: `${Date.now()}-${Math.random()}`, ...normalizarToast(entrada, tipoPadrao) };
    setToasts((atuais) => [...atuais.slice(-3), toast]);
    return toast.id;
  }, []);

  useEffect(() => {
    function exibirErroNativo(evento) {
      const elemento = evento.target;
      if (!(elemento instanceof HTMLInputElement || elemento instanceof HTMLSelectElement || elemento instanceof HTMLTextAreaElement)) return;
      const mensagem = elemento.validationMessage || "Revise os campos destacados antes de continuar.";
      const agora = Date.now();
      if (ultimaValidacao.current.mensagem === mensagem && agora - ultimaValidacao.current.tempo < 500) return;
      ultimaValidacao.current = { mensagem, tempo: agora };
      exibir(mensagem, "aviso");
    }
    document.addEventListener("invalid", exibirErroNativo, true);
    return () => document.removeEventListener("invalid", exibirErroNativo, true);
  }, [exibir]);

  useEffect(() => {
    const timers = toasts
      .filter((toast) => toast.duracao !== 0)
      .map((toast) => window.setTimeout(() => fechar(toast.id), toast.duracao));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [fechar, toasts]);

  const valor = useMemo(() => ({
    exibir,
    sucesso: (entrada) => exibir(entrada, "sucesso"),
    erro: (entrada) => exibir(entrada, "erro"),
    aviso: (entrada) => exibir(entrada, "aviso"),
    informacao: (entrada) => exibir(entrada, "informacao"),
    remover,
  }), [exibir, remover]);

  const viewport = (
    <div className="pointer-events-none fixed inset-x-4 top-4 flex flex-col items-end gap-3 sm:left-auto sm:w-[min(420px,calc(100vw-2rem))]" style={{ zIndex: 2147483647 }} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const estilo = estilos[toast.tipo] ?? estilos.informacao;
        const Icone = estilo.icone;
        return (
          <div key={toast.id} role={toast.tipo === "erro" ? "alert" : "status"} className={`pointer-events-auto flex w-full items-start gap-3 rounded-[16px] border p-4 shadow-[0_16px_45px_rgba(52,31,22,0.18)] ${estilo.classe} ${toastsSaindo.has(toast.id) ? "toast-saindo" : "toast-entrando"}`} style={{ minHeight: 72 }}>
            <Icone className={`mt-0.5 h-5 w-5 shrink-0 ${toast.tipo === "erro" ? "text-app-vermelho-erro" : "text-app-caramelo-torrado"}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{toast.titulo ?? estilo.titulo}</p>
              <p className="mt-1 text-sm leading-5 text-app-mocha">{toast.mensagem}</p>
            </div>
            <button type="button" onClick={() => fechar(toast.id)} className="rounded-full p-1 text-app-cinza transition hover:bg-app-chantilly hover:text-app-cafe-profundo" aria-label="Fechar aviso">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {montado ? createPortal(viewport, document.body) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error("useToast precisa ser usado dentro de ToastProvider.");
  return contexto;
}

export function mensagemValidacao(erros, fallback = "Revise os campos destacados antes de continuar.") {
  const fila = Object.values(erros ?? {});
  for (const erro of fila) {
    if (erro?.message) return String(erro.message);
    if (erro?.types) {
      const mensagem = Object.values(erro.types).find(Boolean);
      if (mensagem) return String(mensagem);
    }
  }
  return fallback;
}

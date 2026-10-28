"use client";

import React from "react";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { useInterface } from "@/lib/use-interface";

export function FormStepActions({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isSubmitting = false,
  nextLabel = "Continuar",
  submitLabel = "Finalizar cadastro",
  backLabel = "Voltar",
  showDivider = true,
  className = "",
  primaryClassName = "",
}) {
  const { ui } = useInterface();
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div
      className={`flex items-center justify-between gap-4 pt-6 ${showDivider ? "border-t border-app-baunilha-dourada/25" : ""} ${className}`}
    >
      {currentStep > 0 ? (
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-app-baunilha-dourada/50 bg-app-creme-suave text-sm font-semibold text-app-cafe-profundo hover:bg-app-chantilly-hover hover:border-app-caramelo-torrado transition-all focus:outline-none focus:ring-2 focus:ring-app-dourado-mel/20 disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{ui(backLabel)}</span>
        </button>
      ) : (
        <div />
      )}

      <button
        type={isLastStep ? "submit" : "button"}
        onClick={isLastStep ? undefined : (event) => {
          event.preventDefault();
          onNext?.(event);
        }}
        disabled={isSubmitting}
        className={`inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-app-dourado-mel hover:bg-app-caramelo-torrado text-white text-sm font-bold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-app-dourado-mel/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${primaryClassName}`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{ui("Processando...")}</span>
          </>
        ) : isLastStep ? (
          <>
            <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
            <span>{ui(submitLabel)}</span>
          </>
        ) : (
          <>
            <span>{ui(nextLabel)}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}

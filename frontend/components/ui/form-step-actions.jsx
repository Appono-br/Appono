"use client";

import React from "react";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";

export function FormStepActions({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isSubmitting = false,
  nextLabel = "Continuar",
  submitLabel = "Finalizar cadastro",
  backLabel = "Voltar",
  className = "",
  primaryClassName = "",
}) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div
      className={`flex items-center justify-between gap-4 pt-6 border-t border-slate-100 ${className}`}
    >
      {currentStep > 0 ? (
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{backLabel}</span>
        </button>
      ) : (
        <div />
      )}

      <button
        type={isLastStep ? "submit" : "button"}
        onClick={isLastStep ? undefined : onNext}
        disabled={isSubmitting}
        className={`inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${primaryClassName}`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Processando...</span>
          </>
        ) : isLastStep ? (
          <>
            <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
            <span>{submitLabel}</span>
          </>
        ) : (
          <>
            <span>{nextLabel}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}

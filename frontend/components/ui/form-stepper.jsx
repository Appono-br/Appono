"use client";

import React from "react";
import { Check } from "lucide-react";

export function FormStepper({
  steps,
  currentStep,
  onStepClick,
  completedClassName = "bg-red-500 text-white hover:bg-red-600",
  progressClassName = "bg-red-500",
}) {
  const totalSteps = steps.length;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="w-full mb-8">
      {/* Header com indicador textual e progresso percentual */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
        <span className="uppercase tracking-wider text-red-600">
          Passo {currentStep + 1} de {totalSteps}: {steps[currentStep]?.title}
        </span>
        <span className="text-slate-400">{progressPercent}%</span>
      </div>

      {/* Barra de progresso contínua */}
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-red-500 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Indicadores de etapas circulares */}
      <div className="relative isolate flex items-center justify-between">
        {/* Linha conectora de fundo */}
        <div className="absolute inset-x-0 top-4 z-0 h-0.5 -translate-y-1/2 bg-slate-200 sm:top-[18px]" />
        <div
          className={`absolute left-0 top-4 z-0 h-0.5 -translate-y-1/2 transition-all duration-300 sm:top-[18px] ${progressClassName}`}
          style={{ width: `${Math.max(currentStep, 0) / Math.max(totalSteps - 1, 1) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step.title || index}
              className="flex flex-col items-center relative z-10"
            >
              <button
                type="button"
                disabled={!isCompleted && !isCurrent}
                onClick={() => onStepClick && isCompleted && onStepClick(index)}
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted
                    ? `${completedClassName} cursor-pointer shadow-sm`
                    : isCurrent
                    ? "bg-white border-2 border-red-500 text-red-600 shadow-md ring-4 ring-red-500/10"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Passo ${index + 1}: ${step.title}`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </button>
              <span
                className={`hidden sm:block text-[11px] font-medium mt-1.5 max-w-[90px] text-center truncate ${
                  isCurrent
                    ? "text-slate-900 font-semibold"
                    : isCompleted
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

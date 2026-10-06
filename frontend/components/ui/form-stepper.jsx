"use client";

import React from "react";
import { Check } from "lucide-react";

export function FormStepper({
  steps,
  currentStep,
  onStepClick,
  showPercentage = true,
  stepsClassName = "",
  wrapLabels = false,
  integratedProgress = false,
  completedClassName = "bg-red-500 text-white hover:bg-red-600",
  progressClassName = "bg-red-500",
}) {
  const totalSteps = steps.length;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);
  const connectorPercent = integratedProgress
    ? progressPercent
    : Math.max(currentStep, 0) / Math.max(totalSteps - 1, 1) * 100;
  const connectorInset = integratedProgress && wrapLabels
    ? `min(45px, ${50 / Math.max(totalSteps, 1)}%)`
    : "0px";

  return (
    <div className="w-full mb-8">
      {/* Indicador textual da etapa */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
        <span className="uppercase tracking-wider text-red-600">
          Passo {currentStep + 1} de {totalSteps}: {steps[currentStep]?.title}
        </span>
        {showPercentage && (
          <span className="text-slate-400">{progressPercent}%</span>
        )}
      </div>

      <div className={stepsClassName}>
        {/* Barra de progresso contínua */}
        {!integratedProgress && (
          <div className={`h-1.5 w-full bg-slate-100 rounded-full overflow-hidden ${wrapLabels ? "mb-3" : "mb-6"}`}>
            <div
              className="h-full bg-red-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Indicadores de etapas circulares */}
        <div className="relative isolate flex items-start justify-between">
          {/* Linha conectora de fundo */}
          <div
            className={`absolute top-4 z-0 -translate-y-1/2 overflow-hidden sm:top-[18px] ${integratedProgress ? "h-1.5 rounded-full bg-slate-100" : "h-0.5 bg-slate-200"}`}
            style={{ left: connectorInset, right: connectorInset }}
          >
            <div
              className={`h-full transition-all duration-300 ${integratedProgress ? "rounded-full" : ""} ${progressClassName}`}
              style={{ width: `${connectorPercent}%` }}
            />
          </div>

          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div
                key={step.title || index}
                className={`flex flex-col items-center relative z-10 ${wrapLabels ? "min-w-0 basis-[90px]" : ""}`}
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
                  className={`text-[11px] font-medium mt-1.5 text-center ${
                    wrapLabels
                      ? "block w-[90px] max-w-full whitespace-normal break-words leading-4"
                      : "hidden sm:block max-w-[90px] truncate"
                  } ${
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
    </div>
  );
}

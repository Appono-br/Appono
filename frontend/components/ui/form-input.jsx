"use client";

import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export const FormInput = forwardRef(function FormInput(
  {
    label,
    error,
    required = false,
    leftIcon: LeftIcon,
    rightAction,
    helperText,
    className = "",
    containerClassName = "",
    id,
    ...props
  },
  ref
) {
  const inputId = id || props.name;
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center text-xs font-semibold text-app-cafe-profundo select-none"
        >
          <span>{label}</span>
          {required && (
            <span className="text-app-caramelo-torrado ml-1 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center text-app-cinza">
            <LeftIcon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          required={required}
          className={`h-11 sm:h-12 w-full rounded-xl border bg-app-creme-suave px-3.5 text-sm text-app-cafe-profundo transition-all placeholder:text-app-cinza/65 focus:outline-none focus:ring-2 disabled:bg-app-chantilly disabled:text-app-cinza ${
            LeftIcon ? "pl-11" : ""
          } ${rightAction ? "pr-11" : ""} ${
            error
              ? "border-app-vermelho-erro text-app-vermelho-erro focus:border-app-vermelho-erro focus:ring-app-vermelho-erro/15"
              : "border-app-baunilha-dourada/50 hover:border-app-caramelo-torrado focus:border-app-dourado-mel focus:ring-app-dourado-mel/20"
          } ${className}`}
          {...props}
        />

        {rightAction && (
          <div className="absolute right-3 flex items-center">
            {rightAction}
          </div>
        )}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-app-vermelho-erro animate-fadeIn"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error.message || error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-app-cinza">{helperText}</p>
      ) : null}
    </div>
  );
});

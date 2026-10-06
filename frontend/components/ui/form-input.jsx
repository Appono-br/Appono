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
          className="flex items-center text-xs font-semibold text-slate-700 select-none"
        >
          <span>{label}</span>
          {required && (
            <span className="text-red-500 ml-1 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
            <LeftIcon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          required={required}
          className={`h-11 sm:h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
            LeftIcon ? "pl-11" : ""
          } ${rightAction ? "pr-11" : ""} ${
            error
              ? "border-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-red-500/15"
              : "border-slate-200 hover:border-slate-300 focus:border-red-500 focus:ring-red-500/15"
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
          className="flex items-center gap-1.5 text-xs font-medium text-red-600 animate-fadeIn"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error.message || error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

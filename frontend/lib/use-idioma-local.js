"use client";

import { useIdiomaContexto } from "@/components/internacionalizacao/provedor-idioma";

export function useIdiomaLocal() {
  return useIdiomaContexto();
}

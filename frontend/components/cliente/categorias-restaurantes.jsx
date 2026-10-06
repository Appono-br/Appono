"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useInterface } from "@/lib/use-interface";

// Apenas imagens de apresentação. Os itens e nomes vêm exclusivamente do banco.
const fotos = {
  Japonesa: "photo-1579871494447-9811cf80d66c",
  Chinesa: "photo-1569058242253-92a9c755a0ec",
  Italiana: "photo-1473093295043-cdd812d0e601",
  Hamburgueria: "photo-1568901346375-23c9450c58cd",
  Pizzaria: "photo-1565299624946-b28f40a0ae38",
  Vegetariana: "photo-1512621776951-a57141f2eefd",
  Vegana: "photo-1512621776951-a57141f2eefd",
  Saudável: "photo-1547592180-85f173990554",
  Cafeteria: "photo-1442512595331-e89e73853f31",
  Padaria: "photo-1509440159596-0249088772ff",
  Doceria: "photo-1488477181946-6428a0291777",
};

function FotoCategoria({ categoria }) {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 text-app-caramelo-torrado" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 3v6a2 2 0 0 0 4 0V3M6 3v18M18 3v18M18 3c-4 2-4 9 0 9" /></svg>;
  return <Image src={`https://images.unsplash.com/${fotos[categoria] ?? "photo-1515003197210-e0cd71810b5f"}?auto=format&fit=crop&w=200&q=80`} alt="" fill sizes="96px" className="object-cover transition duration-300 group-hover:scale-110" onError={() => setFalhou(true)} />;
}

export function CategoriasRestaurantes() {
  const { ui } = useInterface();
  const [resultado, setResultado] = useState({ carregando: true, categorias: [], erro: "" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    apiRequest("/restaurantes/categorias", { auth: false, forceRefresh: true }).then((categorias) => {
      if (!cancelado) setResultado({ carregando: false, categorias, erro: "" });
    }).catch((error) => {
      if (!cancelado) setResultado({ carregando: false, categorias: [], erro: error.message });
    });
    return () => { cancelado = true; };
  }, [tentativa]);

  return <section aria-labelledby="categorias-restaurantes-titulo" className="mx-auto max-w-7xl px-5 py-6">
    <h2 id="categorias-restaurantes-titulo" className="text-2xl font-semibold text-app-cafe-profundo">{ui("Categorias culinárias")}</h2>
    <p className="mt-1 text-sm text-app-cinza">{ui("Encontre restaurantes pela culinária que você procura.")}</p>
    {resultado.carregando ? <div className="mt-5 flex gap-5 overflow-hidden" role="status" aria-label={ui("Carregando categorias...")}>
      {Array.from({ length: 8 }, (_, indice) => <div key={indice} className="h-28 w-24 shrink-0 animate-pulse rounded-2xl bg-app-chantilly" />)}
    </div> : resultado.erro ? <div role="status" className="mt-5 flex flex-wrap items-center gap-3 text-sm text-app-mocha">
      <p>{ui(resultado.erro)}</p>
      <button type="button" onClick={() => { setResultado({ carregando: true, categorias: [], erro: "" }); setTentativa((atual) => atual + 1); }} className="rounded-[8px] border border-app-baunilha-dourada px-4 py-2 font-semibold hover:bg-app-chantilly">{ui("Tentar novamente")}</button>
    </div> : resultado.categorias.length ? <nav aria-label={ui("Categorias culinárias")} className="mt-5 flex snap-x gap-5 overflow-x-auto pb-3 pt-1">
      {resultado.categorias.map(({ categoria, total_restaurantes }) => <Link key={categoria} href={`/cliente/restaurantes?${new URLSearchParams({ categoria }).toString()}`} className="group flex w-24 shrink-0 snap-start flex-col items-center gap-2 rounded-xl text-center outline-none focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado focus-visible:ring-offset-2" aria-label={ui("{0}: {1} restaurante(s)", [categoria, total_restaurantes])}>
        <span className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-app-chantilly ring-1 ring-app-baunilha-dourada/60"><FotoCategoria categoria={categoria} /></span>
        <span className="text-sm font-semibold text-app-cafe-profundo group-hover:text-app-caramelo-torrado">{categoria}</span>
      </Link>)}
    </nav> : <p className="mt-5 rounded-[12px] border border-dashed border-app-baunilha-dourada p-5 text-sm text-app-cinza">{ui("As categorias aparecerão quando os restaurantes informarem sua culinária.")}</p>}
  </section>;
}

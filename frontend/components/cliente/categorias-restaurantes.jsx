"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useInterface } from "@/lib/use-interface";

// Apenas imagens de apresentação. Os itens e nomes vêm exclusivamente do banco.
const fotos = {
  Brasileira: "/images/categorias/brasileira-feijoada.webp",
  Italiana: "/images/categorias/italiana.webp",
  Japonesa: "/images/categorias/japonesa.webp",
  Chinesa: "/images/categorias/chinesa-dim-sum.webp",
  "Árabe": "/images/categorias/arabe-homus.webp",
  Mexicana: "/images/categorias/mexicana-tacos.webp",
  Hamburgueria: "/images/categorias/hamburgueria.webp",
  Pizzaria: "/images/categorias/pizzaria.webp",
  Vegetariana: "/images/categorias/vegetariana.webp",
  Vegana: "/images/categorias/vegetariana.webp",
  Cafeteria: "/images/categorias/cafeteria.webp",
  Padaria: "/images/categorias/padaria.webp",
  Doceria: "/images/categorias/doceria.webp",
  Saudável: "/images/categorias/saudavel.webp",
  "Frutos do mar": "/images/categorias/frutos-do-mar.webp",
  Churrascaria: "/images/categorias/churrascaria.webp",
  "Contemporânea": "/images/categorias/contemporanea-salmao.webp",
  Outra: "/images/categorias/outra.webp",
};

function FotoCategoria({ categoria }) {
  const [falhou, setFalhou] = useState(false);
  const foto = fotos[categoria];
  if (!foto || falhou) return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 text-app-caramelo-torrado" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 3v6a2 2 0 0 0 4 0V3M6 3v18M18 3v18M18 3c-4 2-4 9 0 9" /></svg>;
  return <Image src={foto} alt="" fill sizes="96px" className="object-cover transition duration-300 group-hover:scale-110" onError={() => setFalhou(true)} />;
}

function normalizarCategorias(categorias) {
  const categoriasPorNome = new Map();

  for (const item of Array.isArray(categorias) ? categorias : []) {
    const categoria = String(item?.categoria ?? item?.nome ?? "").trim();
    if (!categoria) continue;

    const total = Number(item?.total_restaurantes);
    const categoriaAtual = categoriasPorNome.get(categoria);
    categoriasPorNome.set(categoria, {
      categoria,
      total_restaurantes: Number.isFinite(total) ? total : categoriaAtual?.total_restaurantes ?? 0,
    });
  }

  return [...categoriasPorNome.values()];
}

export function CategoriasRestaurantes() {
  const { ui } = useInterface();
  const [resultado, setResultado] = useState({ carregando: true, categorias: [], erro: "" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    apiRequest("/restaurantes/categorias", { auth: false, forceRefresh: true }).then((categorias) => {
      if (!cancelado) setResultado({ carregando: false, categorias: normalizarCategorias(categorias), erro: "" });
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

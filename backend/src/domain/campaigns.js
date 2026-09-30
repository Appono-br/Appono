"use strict";
const TIPOS = ["DESCONTO_PERCENTUAL","DESCONTO_FIXO","ITEM_CORTESIA","BEBIDA","ENTRADA","SOBREMESA","COMBO"];
function validarCampanha(body, actor, storageUrl) {
 const d = Object.fromEntries(["titulo","descricao","imagem_url","tipo_beneficio","valor_beneficio","regras","inicio_em","fim_em","limite_usos","minimo_pessoas","minimo_itens","status","beneficio_itens","preco_combo","produtos"].map(k => [k,body[k] ?? null]));
 if (!TIPOS.includes(d.tipo_beneficio) || String(d.titulo??"").trim().length<3) throw new Error("Informe título e benefício válidos.");
 for(const k of ["inicio_em","fim_em"]) {
  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(String(d[k])) || !Number.isFinite(Date.parse(d[k]))) throw new Error("Informe datas com fuso horário.");
 }
 if(Date.parse(d.fim_em)<=Date.parse(d.inicio_em)) throw new Error("O fim deve ser posterior ao início.");
 for(const k of ["limite_usos","minimo_pessoas","minimo_itens"]) {
  if(d[k]==="" || d[k]==null){d[k]=null;continue;}
  d[k]=Number(d[k]);if(!Number.isInteger(d[k]) || d[k]<1 || d[k]>(k==="limite_usos"?100000:k==="minimo_pessoas"?30:100)) throw new Error("Limites inválidos.");
 }
 if(!d.limite_usos)throw new Error("Informe o limite de usos.");
 for(const k of ["valor_beneficio","preco_combo"]) {d[k]=d[k]==null||d[k]===""?null:Number(d[k]);if(d[k]!=null && (!Number.isFinite(d[k])||d[k]<0))throw new Error("Valor inválido.");}
 d.produtos=d.produtos??[];d.beneficio_itens=d.beneficio_itens??[];
 if(!Array.isArray(d.produtos)||!Array.isArray(d.beneficio_itens))throw new Error("Selecione os produtos.");
 if(d.imagem_url) {
  const prefix=String(storageUrl).replace(/\/$/,"")+"/storage/v1/object/public/imagens-restaurantes/"+actor+"/cardapio/";
  if(!String(d.imagem_url).startsWith(prefix)||decodeURIComponent(d.imagem_url).includes(".."))throw new Error("Envie a imagem pela sua conta.");
 }
 return d;
}
function calcularMetricas(eventos,resgates,pagamentos) {
 const counts={};for(const e of eventos)counts[e.tipo]=(counts[e.tipo]??0)+1;
 const ids=new Set(resgates.map(r=>r.id_pedido).filter(Boolean));
 const pagos=new Set();let receita=0;
 for(const p of pagamentos)if(ids.has(p.id_pedido)&&["APROVADO","ESTORNADO"].includes(p.status_pagamento)) {
  const liquido=Math.max(0,Number(p.valor_pago??p.valor??0)-Number(p.valor_reembolsado??0));
  receita+=p.status_pagamento==="ESTORNADO"&& !Number(p.valor_reembolsado)?0:liquido;
  if(liquido>0 && p.status_pagamento==="APROVADO")pagos.add(p.id_pedido);
 }
 return {visualizacoes:counts.IMPRESSION??0,cliques:counts.CLICK??0,reservas_iniciadas:counts.RESERVA_INICIADA??0,
 resgates:resgates.filter(r=>r.status!=="CANCELADO").length,pedidos_pagos:pagos.size,
 faturamento_bruto:Math.round(receita*100)/100,valor_beneficios:resgates.filter(r=>r.status!=="CANCELADO").reduce((s,r)=>s+Number(r.valor_beneficio),0),
 taxa_clique:counts.IMPRESSION?(counts.CLICK??0)/counts.IMPRESSION:0,
 taxa_conversao:counts.RESERVA_INICIADA?pagos.size/counts.RESERVA_INICIADA:0,
 historico_limitado:eventos.some(e=>!e.chave_deduplicacao)};
}
module.exports={TIPOS,validarCampanha,calcularMetricas};

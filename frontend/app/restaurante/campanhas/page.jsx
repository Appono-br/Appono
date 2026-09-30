"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {apiRequest} from "@/lib/api";
import {enviarImagemCardapio} from "@/lib/imagem-cardapio";
const novo=()=>({titulo:"",descricao:"",tipo_beneficio:"DESCONTO_PERCENTUAL",valor_beneficio:5,preco_combo:"",inicio_em:"",fim_em:"",limite_usos:10,minimo_pessoas:"",minimo_itens:"",produtos:[],beneficio_itens:[],regras:"",imagem_url:"",status:"RASCUNHO"});
const tipos=["DESCONTO_PERCENTUAL","DESCONTO_FIXO","ITEM_CORTESIA","BEBIDA","ENTRADA","SOBREMESA","COMBO"];
const label=s=>s.replaceAll("_"," ").toLowerCase();
const local=d=>d?new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(d)).replace(" ","T"):"";
const classe="w-full rounded-lg border border-app-baunilha-dourada bg-white p-3";
export default function CampanhasPage(){
 const [dados,setDados]=useState({campanhas:[],produtos:[]}),[form,setForm]=useState(novo),[erro,setErro]=useState(""),[busy,setBusy]=useState(false),[sugestoes,setSugestoes]=useState([]),[erroSug,setErroSug]=useState(""),[preview,setPreview]=useState(false);
 const carregar=()=>apiRequest("/campanhas",{forceRefresh:true}).then(setDados).catch(e=>setErro(e.message));
 useEffect(()=>{carregar();apiRequest("/campanhas/sugestoes",{forceRefresh:true}).then(d=>setSugestoes(d.sugestoes)).catch(e=>setErroSug(e.message));},[]);
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const editar=c=>{setForm({...novo(),...c,inicio_em:local(c.inicio_em),fim_em:local(c.fim_em),produtos:c.produtos??c.campanhas_inteligentes_produtos?.map(p=>p.id_produto)??[]});window.scrollTo({top:0,behavior:"smooth"});};
 async function salvar(e,status=form.status){e?.preventDefault();setBusy(true);setErro("");try{
 const payload={...form,status,inicio_em:form.inicio_em+":00-03:00",fim_em:form.fim_em+":00-03:00"};
 await apiRequest("/campanhas"+(form.id_campanha?"/"+form.id_campanha:""),{method:form.id_campanha?"PATCH":"POST",body:JSON.stringify(payload)});
 setForm(novo());await carregar();setErro("Campanha salva.");
 }catch(e){setErro(e.message);}finally{setBusy(false);}}
 async function status(c,s){setBusy(true);try{await apiRequest("/campanhas/"+c.id_campanha,{method:"PATCH",body:JSON.stringify({...c,status:s,produtos:c.campanhas_inteligentes_produtos.map(p=>p.id_produto)})});await carregar();}catch(e){setErro(e.message);}finally{setBusy(false);}}
 const disponiveis=dados.produtos.filter(p=>p.disponivel&&!p.arquivado);
 return <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo"><section className="mx-auto max-w-6xl">
 <h1 className="text-3xl font-semibold">Campanhas inteligentes</h1><Link href="/restaurante/plano">Plano e faturamento</Link>
 {erro&&<p role="status" className="my-4 rounded-lg bg-app-creme-leve p-4">{erro}</p>}
 <form onSubmit={e=>salvar(e,"RASCUNHO")} className="my-6 grid gap-4 rounded-xl border p-6 md:grid-cols-2">
 <h2 className="text-xl md:col-span-2">{form.id_campanha?"Editar campanha":"Nova campanha"}</h2>
 {form.id_campanha&&<p className="md:col-span-2">Os resgates existentes mantêm as condições aceitas pelos clientes.</p>}
 <label>Título<input required maxLength={120} className={classe} value={form.titulo} onChange={e=>set("titulo",e.target.value)}/></label>
 <label>Benefício<select className={classe} value={form.tipo_beneficio} onChange={e=>set("tipo_beneficio",e.target.value)}>{tipos.map(t=><option key={t} value={t}>{label(t)}</option>)}</select></label>
 <label className="md:col-span-2">Descrição<textarea className={classe} value={form.descricao??""} onChange={e=>set("descricao",e.target.value)}/></label>
 {form.tipo_beneficio.startsWith("DESCONTO")&&<label>{form.tipo_beneficio==="DESCONTO_PERCENTUAL"?"Desconto (%)":"Desconto (R$)"}<input type="number" min=".01" step=".01" max={form.tipo_beneficio==="DESCONTO_PERCENTUAL"?100:undefined} required className={classe} value={form.valor_beneficio??""} onChange={e=>set("valor_beneficio",e.target.value)}/></label>}
 {form.tipo_beneficio==="COMBO"&&<label>Preço total do combo (R$)<input type="number" min="0" step=".01" required className={classe} value={form.preco_combo??""} onChange={e=>set("preco_combo",e.target.value)}/></label>}
 <fieldset className="rounded-lg border p-3"><legend>Produtos elegíveis (vazio: qualquer produto)</legend>{disponiveis.map(p=><label key={p.id_produto} className="block"><input type="checkbox" checked={form.produtos.includes(p.id_produto)} onChange={e=>set("produtos",e.target.checked?[...form.produtos,p.id_produto]:form.produtos.filter(id=>id!==p.id_produto))}/> {p.nome}</label>)}</fieldset>
 {!form.tipo_beneficio.startsWith("DESCONTO")&&<fieldset className="rounded-lg border p-3"><legend>{form.tipo_beneficio==="COMBO"?"Itens que o cliente deve incluir no pedido":"Itens gratuitos a entregar"}</legend>{disponiveis.map(p=>{const item=form.beneficio_itens.find(i=>i.id_produto===p.id_produto);return <label key={p.id_produto} className="flex items-center justify-between gap-2">{p.nome}<input aria-label={"Quantidade de "+p.nome} className="w-20 border p-2" type="number" min="0" max="100" value={item?.quantidade??0} onChange={e=>set("beneficio_itens",[...form.beneficio_itens.filter(i=>i.id_produto!==p.id_produto),...(Number(e.target.value)>0?[{id_produto:p.id_produto,quantidade:Number(e.target.value)}]:[])])}/></label>;})}</fieldset>}
 {["inicio_em","fim_em"].map(k=><label key={k}>{k==="inicio_em"?"Início":"Fim"} (horário de Brasília)<input required type="datetime-local" className={classe} value={form[k]} onChange={e=>set(k,e.target.value)}/></label>)}
 <p className="md:col-span-2 text-sm">A contratação e o horário da reserva devem estar dentro da validade da oferta.</p>
 {[["limite_usos","Limite de usos",100000],["minimo_pessoas","Mínimo de pessoas",30],["minimo_itens","Mínimo de itens",100]].map(([k,t,m])=><label key={k}>{t}<input className={classe} type="number" min="1" max={m} required={k==="limite_usos"} value={form[k]??""} onChange={e=>set(k,e.target.value)}/></label>)}
 <label>Imagem (JPG, PNG ou WebP até 5 MB)<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);try{set("imagem_url",await enviarImagemCardapio(file));}catch(e){setErro(e.message);}finally{setBusy(false);}}}/></label>
 <label className="md:col-span-2">Regras e termos<textarea className={classe} value={form.regras??""} onChange={e=>set("regras",e.target.value)}/></label>
 <div className="flex flex-wrap gap-3 md:col-span-2"><button disabled={busy} type="submit" className="rounded-lg border px-4 py-3">Salvar rascunho</button><button disabled={busy} type="button" onClick={e=>{if(e.currentTarget.form.reportValidity())salvar(e,"ATIVA");}} className="rounded-lg bg-app-cafe-profundo px-4 py-3 text-white">Publicar ou agendar</button><button type="button" onClick={()=>setPreview(!preview)}>Pré-visualizar</button><button type="button" onClick={()=>setForm(novo())}>Limpar</button></div>
 </form>
 {preview&&<article className="my-4 rounded-xl border p-5">{form.imagem_url&&<img alt="" src={form.imagem_url} className="h-40 w-full object-cover"/>}<h2>{form.titulo}</h2><p>{form.descricao}</p><p>{label(form.tipo_beneficio)} {form.valor_beneficio}</p><p>{form.regras}</p><p>{form.inicio_em} até {form.fim_em} (Brasília)</p></article>}
 <section className="my-8"><h2 className="text-xl">Sugestões para revisar</h2>{erroSug&&<p role="alert">{erroSug}</p>}{!erroSug&&!sugestoes.length&&<p>Ainda não há dados agregados suficientes.</p>}{sugestoes.map((s,i)=><article className="my-3 rounded-xl border p-4" key={i}><p>{s.mensagem}</p><p>{s.limitacao}</p><button onClick={()=>editar({...novo(),...s.rascunho})}>Usar sugestão</button></article>)}</section>
 <section className="grid gap-4 md:grid-cols-2">{dados.campanhas.map(c=><article key={c.id_campanha} className="rounded-xl border p-5"><h2 className="text-xl">{c.titulo}</h2><p>{label(c.status)} · {c.usos_confirmados}/{c.limite_usos} usos comprometidos</p>{c.precisa_configuracao&&<p role="alert">Configure os itens do benefício para liberar novos resgates.</p>}<div className="mt-3 flex flex-wrap gap-3">{!["ENCERRADA","EXPIRADA"].includes(c.status)&&<><button disabled={busy} onClick={()=>editar(c)}>Editar</button><button disabled={busy} onClick={()=>status(c,c.status==="PAUSADA"?"ATIVA":"PAUSADA")}>{c.status==="PAUSADA"?"Retomar":"Pausar"}</button><button disabled={busy} onClick={()=>status(c,"ENCERRADA")}>Encerrar</button></>}<Link href={"/restaurante/campanhas/"+c.id_campanha}>Resultados e entregas</Link></div></article>)}</section>
 </section></main>;
}

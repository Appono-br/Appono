"use strict";
const crypto=require("node:crypto");
const {Router}=require("express");
const {supabaseAdmin:db,createUserSupabaseClient}=require("../lib/supabase");
const {requireAuth,requireRole}=require("../middleware/auth");
const {exigirPlanoProfissional}=require("../services/planos-restaurante");
const {validarCampanha,calcularMetricas}=require("../domain/campaigns");
const campaignsRouter=Router();
const run=fn=>async(req,res)=>{try{res.set("Cache-Control","no-store");await fn(req,res);}catch(e){res.status(e.statusCode??(e.code==="PT409"?409:400)).json({error:e.message,code:e.code});}};
async function result(q){const {data,error}=await q;if(error)throw error;return data;}
async function restaurante(res){const r=await result(db.from("restaurantes").select("id_restaurante,configuracao_operacao").eq("id_auth",res.locals.user.id).single());await exigirPlanoProfissional(r.id_restaurante);return r;}
async function publicas(id) {
 let q=db.from("campanhas_inteligentes_restaurante").select("*,campanhas_inteligentes_produtos(id_produto)").in("status",["ATIVA","AGENDADA"]).eq("precisa_configuracao",false).lte("inicio_em",new Date().toISOString()).gt("fim_em",new Date().toISOString());
 if(id)q=q.eq("id_restaurante",id);
 const cs=await result(q.limit(200));
 if(!cs.length)return [];
 const ass=await result(db.from("assinaturas_restaurante").select("id_restaurante,periodo_fim_em").eq("codigo_plano","PROFISSIONAL").eq("status","ATIVA").in("id_restaurante",[...new Set(cs.map(c=>c.id_restaurante))]));
 const active=new Set(ass.filter(a=>!a.periodo_fim_em||Date.parse(a.periodo_fim_em)>Date.now()).map(a=>a.id_restaurante));
 const restaurantes=await result(db.from("restaurantes").select("id_restaurante").eq("ativo",true).in("id_restaurante",[...active]));
 const enabled=new Set(restaurantes.map(r=>r.id_restaurante));
 return cs.filter(c=>enabled.has(c.id_restaurante)&&c.usos_confirmados<c.limite_usos);
}
campaignsRouter.get("/publicas",run(async(req,res)=>res.json({campanhas:await publicas(req.query.restaurante_id)})));
campaignsRouter.get("/manutencao",run(async(req,res)=>{
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.authorization!=="Bearer "+secret)return res.status(401).json({error:"Não autorizado."});
 const alteradas=await result(db.rpc("atualizar_ciclo_campanhas"));console.info("Ciclo de campanhas",{alteradas});res.json({alteradas});
}));
campaignsRouter.use(requireAuth);
campaignsRouter.get("/consentimento",requireRole("cliente"),run(async(req,res)=>{
 const consentimento=await result(db.from("consentimentos_ofertas_cliente").select("*").eq("id_cliente",res.locals.profileId).maybeSingle());
 res.json({consentimento:consentimento??{habilitado:false,versao_texto:"ofertas-v1"}});
}));
campaignsRouter.put("/consentimento",requireRole("cliente"),run(async(req,res)=>{
 if(typeof req.body.habilitado!=="boolean")throw new Error("Informe sua escolha.");
 const habilitado=req.body.habilitado;
 const consentimento=await result(db.from("consentimentos_ofertas_cliente").upsert({id_cliente:res.locals.profileId,habilitado,versao_texto:"ofertas-v1",
 concedido_em:habilitado?new Date().toISOString():null,revogado_em:habilitado?null:new Date().toISOString(),atualizado_em:new Date().toISOString()}).select("*").single());
 res.json({consentimento});
}));
campaignsRouter.get("/ofertas",requireRole("cliente"),run(async(req,res)=>{
 const c=await result(db.from("consentimentos_ofertas_cliente").select("habilitado,atualizado_em").eq("id_cliente",res.locals.profileId).maybeSingle());
 if(!c?.habilitado)return res.json({campanhas:[]});
 // Somente escolhas explicitas de restaurantes favoritos; nenhum dado sensivel.
 const prefs=await result(db.from("preferencias_rotina_cliente").select("id_restaurante").eq("id_cliente",res.locals.profileId).eq("tipo","RESTAURANTE_FAVORITO"));
 const favoritos=new Set(prefs.map(p=>p.id_restaurante));
 const campanhas=(await publicas()).filter(x=>favoritos.has(x.id_restaurante)).slice(0,10).map(x=>({...x,explicacao:"Oferta de um restaurante que você marcou como favorito."}));
 const atual=await result(db.from("consentimentos_ofertas_cliente").select("habilitado,atualizado_em").eq("id_cliente",res.locals.profileId).maybeSingle());
 res.json({campanhas:atual?.habilitado&&atual.atualizado_em===c.atualizado_em?campanhas:[]});
}));
campaignsRouter.post("/:id/eventos",requireRole("cliente"),run(async(req,res)=>{
 const tipo=req.body.tipo;if(!["IMPRESSION","CLICK","RESERVA_INICIADA"].includes(tipo))throw new Error("Evento inválido.");
 const id=Number(req.params.id);
 if(!(await publicas()).some(c=>c.id_campanha===id))return res.json({registrado:false});
 const chave=crypto.createHash("sha256").update(res.locals.user.id+":"+new Date().toISOString().slice(0,10)).digest("hex");
 const {count,error}=await db.from("eventos_campanha_inteligente").select("id_evento",{count:"exact",head:true}).eq("id_cliente",res.locals.profileId).gte("criado_em",new Date(Date.now()-3600000).toISOString());
 if(error)throw error;if(count>=200)return res.status(429).json({error:"Limite de eventos atingido."});
 const {error:err}=await db.from("eventos_campanha_inteligente").insert({id_campanha:id,tipo,id_cliente:res.locals.profileId,chave_deduplicacao:chave});
 if(err&&err.code!=="23505")throw err;res.json({registrado:true});
}));
campaignsRouter.get("/meus-beneficios",requireRole("cliente"),run(async(req,res)=>{
 const reservas=await result(db.from("reservas").select("id_reserva").eq("id_cliente",res.locals.profileId));
 const beneficios=reservas.length?await result(db.from("resgates_campanha_inteligente").select("*").in("id_reserva",reservas.map(x=>x.id_reserva)).order("criado_em",{ascending:false}).limit(100)):[];
 res.json({beneficios});
}));
campaignsRouter.use(requireRole("restaurante"));
campaignsRouter.get("/",run(async(req,res)=>{
 const r=await restaurante(res);
 res.json({campanhas:await result(db.from("campanhas_inteligentes_restaurante").select("*,campanhas_inteligentes_produtos(id_produto)").eq("id_restaurante",r.id_restaurante).order("criado_em",{ascending:false})),
 produtos:await result(db.from("produtos").select("id_produto,nome,preco,disponivel,arquivado").eq("id_restaurante",r.id_restaurante))});
}));
campaignsRouter.post("/",run(async(req,res)=>{await salvar(req,res,null);}));
campaignsRouter.patch("/:id",run(async(req,res)=>{await salvar(req,res,Number(req.params.id));}));
async function salvar(req,res,id){
 await restaurante(res);
 const d=validarCampanha(req.body,res.locals.user.id,process.env.SUPABASE_URL);
 const campanha=await result(db.rpc("salvar_campanha_atomica",{p_actor:res.locals.user.id,p_id:id,p_versao:req.body.versao??null,p_dados:d}));
 res.json({campanha});
}
campaignsRouter.get("/sugestoes",run(async(req,res)=>{
 const r=await restaurante(res);
 const user=createUserSupabaseClient(res.locals.accessToken);
 const demanda=await result(user.rpc("metricas_demanda_rotina_restaurante",{p_inicio:new Date().toISOString().slice(0,10),p_fim:new Date(Date.now()+30*86400000).toISOString().slice(0,10)}));
 const produtos=await result(db.from("produtos").select("id_produto,nome,preco").eq("id_restaurante",r.id_restaurante).eq("disponivel",true).eq("arquivado",false).order("preco").limit(30));
 const sugestoes=(demanda?.itens??[]).filter(i=>i.demanda_estimada>=(demanda.coorte_minima??5)).slice(0,6).map(i=>{
 const faixa=String(i.faixa_horario).toLowerCase();const hora=faixa.includes("noite")||faixa.includes("jantar")?19:faixa.includes("tarde")?15:12;
 const produto=produtos[0];
 return {mensagem:"Demanda agregada em "+i.faixa_horario,limitacao:"Revise o benefício e o horário de funcionamento. Demanda não garante reservas.",
 rascunho:{titulo:"Oferta "+(produto?.nome??"especial"),tipo_beneficio:"DESCONTO_PERCENTUAL",valor_beneficio:5,produtos:produto?[produto.id_produto]:[],
 inicio_em:i.data+"T"+hora+":00:00-03:00",fim_em:i.data+"T"+(hora+2)+":00:00-03:00",status:"RASCUNHO",limite_usos:10}};
 });
 res.json({sugestoes});
}));
campaignsRouter.get("/:id/resgates",run(async(req,res)=>{
 const r=await restaurante(res);await result(db.from("campanhas_inteligentes_restaurante").select("id_campanha").eq("id_campanha",req.params.id).eq("id_restaurante",r.id_restaurante).single());
 res.json({resgates:await result(db.from("resgates_campanha_inteligente").select("*").eq("id_campanha",req.params.id).order("criado_em",{ascending:false}))});
}));
campaignsRouter.post("/resgates/:id/entregar",run(async(req,res)=>res.json({resgate:await result(db.rpc("entregar_beneficio_campanha",{p_actor:res.locals.user.id,p_resgate:Number(req.params.id)}))})));
campaignsRouter.get("/:id/metricas",run(async(req,res)=>{
 const r=await restaurante(res);
 const campanha=await result(db.from("campanhas_inteligentes_restaurante").select("*").eq("id_campanha",req.params.id).eq("id_restaurante",r.id_restaurante).single());
 const inicio=req.query.inicio?new Date(req.query.inicio).toISOString():"2000-01-01T00:00:00Z",fim=req.query.fim?new Date(req.query.fim).toISOString():new Date().toISOString();
 const eventos=await result(db.from("eventos_campanha_inteligente").select("tipo,chave_deduplicacao").eq("id_campanha",campanha.id_campanha).gte("criado_em",inicio).lte("criado_em",fim));
 const resgates=await result(db.from("resgates_campanha_inteligente").select("*").eq("id_campanha",campanha.id_campanha).gte("criado_em",inicio).lte("criado_em",fim));
 const ids=resgates.map(x=>x.id_pedido).filter(Boolean);
 const pagamentos=ids.length?await result(db.from("pagamentos").select("id_pedido,status_pagamento,valor,valor_pago,valor_reembolsado").in("id_pedido",ids)):[];
 res.json({...calcularMetricas(eventos,resgates,pagamentos),usos:campanha.usos_confirmados,limite_usos:campanha.limite_usos});
}));
module.exports={campaignsRouter,publicas};

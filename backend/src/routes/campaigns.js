"use strict";
const crypto=require("node:crypto");
const {Router}=require("express");
const {supabaseAdmin:db,createUserSupabaseClient}=require("../lib/supabase");
const {requireAuth,requireRole}=require("../middleware/auth");
const {exigirPlanoProfissional}=require("../services/planos-restaurante");
const {validarCampanha,validarPeriodoMetricas,analisarDemandaCampanha,gerarSugestoesCampanha,calcularMetricas}=require("../domain/campaigns");
const campaignsRouter=Router();
const run=fn=>async(req,res)=>{try{res.set("Cache-Control","no-store");await fn(req,res);}catch(e){res.status(e.statusCode??(e.code==="PT409"?409:e.code==="PT429"?429:400)).json({error:e.message,code:e.code});}};
async function result(q){const {data,error}=await q;if(error)throw error;return data;}
async function resultAll(makeQuery, pageSize = 1000, maxRows = 100000) {
 const rows=[];
 for(let from=0;from<maxRows;from+=pageSize){
  const page=await result(makeQuery().range(from,from+pageSize-1));
  rows.push(...(page??[]));
  if(!page||page.length<pageSize)return rows;
 }
 const error=new Error("Consulta excede o limite operacional. Reduza o período.");error.statusCode=422;throw error;
}
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
 const prefs=c?.habilitado?await result(db.from("preferencias_rotina_cliente").select("id_restaurante").eq("id_cliente",res.locals.profileId).eq("tipo","RESTAURANTE_FAVORITO")):[];
 const favoritos=new Set(prefs.map(p=>p.id_restaurante));
 const campanhasPublicas=await publicas();
 const restaurantes=campanhasPublicas.length?await result(db.from("restaurantes").select("id_restaurante,nome,logo_url").in("id_restaurante",[...new Set(campanhasPublicas.map(x=>x.id_restaurante))])):[];
 const idsProdutos=[...new Set(campanhasPublicas.flatMap(campanha=>[...(campanha.campanhas_inteligentes_produtos??[]).map(produto=>produto.id_produto),...(campanha.beneficio_itens??[]).map(produto=>produto.id_produto)]))];
 const produtos=idsProdutos.length?await result(db.from("produtos").select("id_produto,nome,imagem_url").in("id_produto",idsProdutos).eq("disponivel",true).eq("arquivado",false)):[];
 const porRestaurante=new Map(restaurantes.map(restaurante=>[restaurante.id_restaurante,restaurante]));
 const porProduto=new Map(produtos.map(produto=>[produto.id_produto,produto]));
 const campanhas=campanhasPublicas.map(campanha=>{const produtosElegiveis=[...(campanha.campanhas_inteligentes_produtos??[]),...(campanha.beneficio_itens??[])].map(produto=>porProduto.get(produto.id_produto)).filter((produto,indice,lista)=>produto&&lista.findIndex(item=>item.id_produto===produto.id_produto)===indice);return {...campanha,restaurante:porRestaurante.get(campanha.id_restaurante)??null,produtos:produtosElegiveis,personalizada:favoritos.has(campanha.id_restaurante)};}).sort((a,b)=>Number(b.personalizada)-Number(a.personalizada)).slice(0,12);
 res.json({campanhas,personalizacao_habilitada:Boolean(c?.habilitado)});
}));
campaignsRouter.post("/:id/eventos",requireRole("cliente"),run(async(req,res)=>{
 const tipo=req.body.tipo;if(!["IMPRESSION","CLICK","RESERVA_INICIADA"].includes(tipo))throw new Error("Evento inválido.");
 const id=Number(req.params.id);
 const hoje=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 const chave=crypto.createHash("sha256").update(res.locals.profileId+":"+hoje).digest("hex");
 const registrado=await result(db.rpc("registrar_evento_campanha_atomico",{p_actor:res.locals.user.id,p_id_cliente:res.locals.profileId,p_id_campanha:id,p_tipo:tipo,p_chave_deduplicacao:chave}));
 res.json({registrado:Boolean(registrado)});
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
 const formatarData=(data)=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(data);
 const fim=formatarData(new Date());
 const inicio=formatarData(new Date(Date.now()-89*86400000));
 const demanda=await result(user.rpc("metricas_demanda_rotina_restaurante",{p_inicio:inicio,p_fim:fim}));
 const produtos=await result(db.from("produtos").select("id_produto,nome,preco").eq("id_restaurante",r.id_restaurante).eq("disponivel",true).eq("arquivado",false).order("preco").limit(30));
 const analise=analisarDemandaCampanha(demanda);
 const sugestoes=gerarSugestoesCampanha(demanda,produtos);
 res.json({tipo:"REGRAS_FIXAS",periodo:{inicio,fim},coorte_minima:Math.max(5,Number(demanda?.coorte_minima)||5),analise,sugestoes,
  motivo_sem_sugestao:sugestoes.length?null:produtos.length?"Ainda não há sinais agregados suficientes dos últimos 90 dias para sugerir uma campanha.":"Cadastre produtos disponíveis para receber sugestões de campanha."});
}));
campaignsRouter.get("/:id/resgates",run(async(req,res)=>{
 const r=await restaurante(res);await result(db.from("campanhas_inteligentes_restaurante").select("id_campanha").eq("id_campanha",req.params.id).eq("id_restaurante",r.id_restaurante).single());
 res.json({resgates:await resultAll(()=>db.from("resgates_campanha_inteligente").select("*").eq("id_campanha",req.params.id).order("criado_em",{ascending:false}))});
}));
campaignsRouter.post("/resgates/:id/entregar",run(async(req,res)=>res.json({resgate:await result(db.rpc("entregar_beneficio_campanha",{p_actor:res.locals.user.id,p_resgate:Number(req.params.id)}))})));
campaignsRouter.get("/:id/metricas",run(async(req,res)=>{
 const r=await restaurante(res);
 const campanha=await result(db.from("campanhas_inteligentes_restaurante").select("*").eq("id_campanha",req.params.id).eq("id_restaurante",r.id_restaurante).single());
 const periodo=validarPeriodoMetricas(req.query.inicio,req.query.fim,campanha.criado_em);
 const eventos=await resultAll(()=>db.from("eventos_campanha_inteligente").select("tipo,id_cliente,chave_deduplicacao").eq("id_campanha",campanha.id_campanha).gte("criado_em",periodo.inicio).lte("criado_em",periodo.fim));
 const resgates=await resultAll(()=>db.from("resgates_campanha_inteligente").select("id_resgate,id_pedido,status,entregue_em,valor_beneficio,criado_em").eq("id_campanha",campanha.id_campanha).gte("criado_em",periodo.inicio).lte("criado_em",periodo.fim));
 const ids=[...new Set(resgates.map(x=>x.id_pedido).filter(Boolean))];
 const pagamentos=[];
 for(let i=0;i<ids.length;i+=100){pagamentos.push(...await resultAll(()=>db.from("pagamentos").select("id_pedido,status_pagamento,valor,valor_pago,valor_reembolsado").in("id_pedido",ids.slice(i,i+100)),100,10000));}
 res.json({...calcularMetricas(eventos,resgates,pagamentos),periodo,usos:campanha.usos_confirmados,limite_usos:campanha.limite_usos});
}));
module.exports={campaignsRouter,publicas};

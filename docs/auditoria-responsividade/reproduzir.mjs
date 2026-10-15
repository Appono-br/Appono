import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = process.cwd();
const out = resolve(root, 'docs/auditoria-responsividade');
mkdirSync(out, { recursive: true });
const pause = ms => new Promise(r => setTimeout(r, ms));
const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const tab = targets.find(t => t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', e => {
  const msg = JSON.parse(e.data);
  if (msg.id) { const p = pending.get(msg.id); if (p) { pending.delete(msg.id); msg.error ? p.reject(msg.error) : p.resolve(msg.result); } }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

function fixtureInit() {
  const type = location.pathname.startsWith('/restaurante') ? 'restaurante' : location.pathname.startsWith('/admin') ? 'admin' : 'cliente';
  const rest = { id_restaurante: 1, nome: 'Restaurante Sabor da Casa', descricao: 'Cozinha brasileira com ingredientes frescos e pratos preparados na hora.', categoria: 'Brasileira', categoria_culinaria: 'Brasileira', endereco: 'Rua das Flores, 123, Centro, São Paulo - SP', cidade: 'São Paulo', estado: 'SP', telefone: '11999999999', email: 'restaurante@example.test', favorito: true, media_avaliacoes: 4.8, total_avaliacoes: 38, valor_minimo_reserva_por_pessoa: 10, antecedencia_minima_minutos: 60, horario_funcionamento: 'Segunda a domingo: 11:00-23:00', foto_url: '/images/categorias/brasileira-feijoada.webp', imagem_url: '/images/categorias/brasileira-feijoada.webp', ativo: true, aceita_reservas: true };
  const product = { id_produto: 1, nome: 'Filé grelhado com arroz e legumes', descricao: 'Filé grelhado acompanhado de arroz, legumes frescos e molho da casa.', preco: 48.9, preco_base: 48.9, disponivel: true, ativo: true, destaque: true, id_categoria: 1, foto_url: '/images/categorias/brasileira-feijoada.webp', imagem_url: '/images/categorias/brasileira-feijoada.webp' };
  const menus = [{ id_cardapio: 1, nome: 'Cardápio principal', categorias: [{ id_categoria: 1, nome: 'Pratos principais', produtos: [product, { ...product, id_produto: 2, nome: 'Risoto de cogumelos com parmesão' }] }] }];
  const client = { id_cliente: 1, nome: 'Mariana Oliveira', email: 'cliente@example.test', telefone: '11999999999', cpf: '00000000000', endereco: rest.endereco };
  const reservation = { id_reserva: 1, id_restaurante: 1, id_cliente: 1, data_reserva: '2026-10-18', horario_inicio: '12:30:00', horario_fim: '14:00:00', quantidade_pessoas: 2, numero_pessoas: 2, status_reserva: 'CONFIRMADA', status: 'CONFIRMADA', status_presenca: 'PENDENTE', valor_reserva: 10, valor_total: 10, restaurantes: rest, clientes: client, mesas: { id_mesa: 1, numero_mesa: 3, capacidade: 4 }, criado_em: '2026-10-14T12:00:00Z', pedidos: [] };
  const order = { id_pedido: 1, id_reserva: 1, id_restaurante: 1, status_pedido: 'CONFIRMADO', valor_total: 97.8, criado_em: '2026-10-14T12:00:00Z', observacoes: 'Sem cebola, por favor.', restaurantes: rest, clientes: client, reserva: reservation, reservas: reservation, itens_pedido: [{ id_item_pedido: 1, quantidade: 2, preco_unitario: 48.9, subtotal: 97.8, produtos: product }], pagamentos: [] };
  rest.pratos = [product]; rest.produtos = [product]; rest.pratos_destaque = [product];
  const perfil = type === 'restaurante' ? { ...rest, configuracao_operacao: { days: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(id => ({ id, enabled: true, shifts: [{open:'11:00',close:'23:00'}] })) } } : type === 'admin' ? { nome: 'Admin Appono', email: 'admin@example.test' } : client;
  localStorage.setItem('appono:session', JSON.stringify({ type: type === 'cliente' ? 'client' : type === 'restaurante' ? 'restaurant' : 'admin', name: perfil.nome }));
  localStorage.setItem('appono:auth', JSON.stringify({ accessToken: 'local-layout-audit' }));
  const notification = { id_notificacao: 1, titulo: 'Sua reserva foi confirmada', mensagem: 'Sua mesa para duas pessoas está confirmada no Restaurante Sabor da Casa.', tipo: 'RESERVA', lida: false, favorito: false, criado_em: '2026-10-14T12:00:00Z', link: '/cliente/agenda' };
  rest.favorito_cliente = true;
  const conversation = { id_conversa: 1, titulo: type === 'restaurante' ? client.nome : rest.nome, restaurante: rest, restaurantes: rest, cliente: client, pedido: order, reserva: reservation, ultima_mensagem: 'Olá! A reserva está confirmada para domingo.', atualizado_em: '2026-10-14T12:00:00Z', nao_lidas: 1 };
  const campaign = { id_campanha: 1, titulo: 'Almoço especial de domingo', nome: 'Almoço especial de domingo', descricao: 'Desconto nos pratos selecionados.', tipo_beneficio: 'DESCONTO_PERCENTUAL', valor_beneficio: 10, status: 'ATIVA', inicio: '2026-10-01T12:00:00Z', fim: '2026-11-01T12:00:00Z', inicio_em: '2026-10-01T12:00:00Z', fim_em: '2026-11-01T12:00:00Z', data_inicio: '2026-10-01T12:00:00Z', data_fim: '2026-11-01T12:00:00Z', produtos: [1], restaurantes: rest, beneficio_itens: [], usos_confirmados: 10, limite_usos: 50 };
  const originalFetch = window.fetch.bind(window);
  window.__auditRequests = [];
  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!url.pathname.startsWith('/api/') && url.origin === location.origin) return originalFetch(input, options);
    const p = url.pathname.replace(/^\/api/, '');
    const method = options.method ?? 'GET';
    window.__auditRequests.push({ path: p, method });
    let data = {};
    let status = 200;
    if (method !== 'GET') { status = 403; data = { error: 'Auditoria visual: operação não executada.' }; }
    else if (p === '/me') data = { tipo: type, perfil };
    else if (p === '/restaurantes') data = [rest, { ...rest, id_restaurante: 2, nome: 'Cantina Jardim', favorito: false }];
    else if (p === '/restaurantes/categorias') data = [{nome:'Brasileira',categoria:'Brasileira',total:2}];
    else if (/\/restaurantes\/\d+\/cardapio/.test(p)) data = menus;
    else if (p === '/cardapio' || p === '/cardapio/meu') data = {cardapios:menus};
    else if (/\/restaurantes\/\d+\/disponibilidade/.test(p)) data = { mesas: [{ id_mesa: 1, numero_mesa: 3, capacidade: 4 }], horarios: ['12:00','12:30','13:00'], disponivel: true };
    else if (/^\/restaurantes\/\d+$/.test(p)) data = rest;
    else if (p === '/reservas') data = [reservation];
    else if (/\/reservas\/\d+\/cardapio/.test(p)) data = { reserva: reservation, restaurante: rest, cardapios: menus };
    else if (/^\/reservas\/\d+$/.test(p)) data = reservation;
    else if (p === '/pedidos' || p.includes('/pedidos/historico')) data = [order];
    else if (/\/pedidos\/\d+\/avaliacao/.test(p)) data = { pedido: { ...order, status_pedido: 'ENTREGUE' }, avaliacao: null };
    else if (/^\/pedidos\/\d+$/.test(p)) data = order;
    else if (p === '/notificacoes/contador') data = { total: 1, nao_lidas: 1 };
    else if (p === '/notificacoes') data = [notification];
    else if (p === '/mensagens') data = [conversation];
    else if (/^\/mensagens\/\d+$/.test(p)) data = { conversa: conversation, mensagens: [{ id_mensagem: 1, tipo_remetente: 'restaurante', conteudo: location.search.includes('stress=1') ? 'Veja este link: https://restaurante.example.test/cardapio/almoco-de-domingo-com-opcoes-vegetarianas-e-reservas-para-familias' : 'Olá! Sua mesa está confirmada. Podemos ajudar com mais alguma coisa?', criado_em: '2026-10-14T12:00:00Z' }] };
    else if (p === '/restaurante/dashboard/resumo') data = { metricas: [{ label:'Reservas hoje',value:'12',icon:'calendar' },{label:'Receita do dia',value:'R$ 1.240,00',icon:'wallet'},{label:'Pedidos ativos',value:'8',icon:'bag'},{label:'Clientes atendidos',value:'32',icon:'people'}], serieReservas: Array.from({length:7},(_,i)=>({data:`2026-10-${String(9+i).padStart(2,'0')}`,valor:5+i})), proximosPedidos:[order], produtoDestaque:product, pedidosAtivosCozinha:8 };
    else if (p === '/marketplace/mercado-pago/status') data = { conexao: { status:'CONECTADO', email: 'restaurante@example.test', conectado_em:'2026-10-01T12:00:00Z' } };
    else if (p === '/marketplace/financeiro/resumo') data = { resumo: {valor_transacionado:1240,valor_restaurante:1100,receita_app:140,valor_retido:400,valor_liberado:700,valor_estornado:0}, repasses:[{id_pagamento:1,id_pedido:1,pedido:order,status_repasse:'AGUARDANDO_ENTREGA',valor_restaurante:85.09,valor_pago:97.8,data_pagamento:'2026-10-14T12:00:00Z'}] };
    else if (p === '/admin/financeiro/resumo') data = { resumo: {}, metricas_gerais: {}, pagamentos:[],eventos:[],restaurantes:[{...rest,metricas:{valor_retido:400},conexao_mercado_pago:{status:'CONECTADO'}}],serie_financeira:[],pendencias:null,politica_financeira:null };
    else if (p === '/rotina/perfil') data = { id_perfil_rotina:1,nome:'Rotina principal',ativo:true,versao:1,endereco_base:rest.endereco,dias_semana:['monday','tuesday','wednesday','thursday','friday'],preferencias:['comida brasileira'],restricoes:[],alergias:[],janelas_alimentacao:[] };
    else if (p === '/rotina/planejamento') data = { planejamento:null,refeicoes:[] };
    else if (p === '/rotina/agenda') data = {provedores:[],conexoes:[],janelas_ocupadas:[]};
    else if (p === '/rotina/catalogo/busca') data = {restaurantes:[],pratos:[],items:[]};
    else if (p === '/suporte') data = {items:[]};
    else if (p.includes('/reembolsos')) data = p.includes('/pedido/') ? { reembolso:null } : [];
    else if (p === '/campanhas') data = { campanhas:[campaign],produtos:[product],restaurante:rest };
    else if (p === '/campanhas/sugestoes') data = {sugestoes:[],analise:null};
    else if (p === '/campanhas/ofertas') data = {ofertas:[],campanhas:[]};
    else if (/\/campanhas\/\d+\/metricas/.test(p)) data = {periodo:{inicio:'2026-10-01T12:00:00Z',fim:'2026-10-31T12:00:00Z'},resumo:{},campanha:campaign,receita_bruta_atribuida:100,receita_liquida_atribuida:90,reembolsos_atribuidos:10,descontos_registrados:5};
    else if (p.endsWith('/resgates')) data = {resgates:[]};
    else if (p === '/planos/campanhas-publicas') data = {campanhas:[]};
    else if (p === '/planos/assinatura') data = {assinatura:{plano:'PROFISSIONAL',status:'ATIVA'},plano_atual:'PROFISSIONAL',planos:[]};
    else if (p === '/cardapio/categorias') data = menus[0].categorias;
    else if (p === '/cardapio/produtos') data = [product];
    else if (p.includes('/desempenho')) data = {possui_amostra:false,serie:[],avaliacoes:[],produtos:[]};
    else if (p.includes('/avaliacoes')) data = {avaliacoes:[],media:0,total:0,distribuicao:[],produtos:[]};
    return new Response(JSON.stringify(data), {status,headers:{'Content-Type':'application/json'}});
  };
}

await send('Page.addScriptToEvaluateOnNewDocument', { source: `(${fixtureInit.toString()})()` });
function walk(dir) { return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(resolve(dir,d.name)):d.name==='page.jsx'?[resolve(dir,d.name)]:[]); }
const allRoutes = walk(resolve(root,'frontend/app')).map(f=>'/'+relative(resolve(root,'frontend/app'),f).replaceAll('\\','/').replace(/\/?page.jsx$/,'').replaceAll('[conversationId]','1').replaceAll('[id]','1'));
const metricsExpression = `(() => {
  const w = innerWidth;
  const all = [...document.querySelectorAll('body *')].filter(e => !e.closest('nextjs-portal,script,style,svg'));
  const visible = e => { const r=e.getBoundingClientRect(),s=getComputedStyle(e); return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'; };
  const describe = e => ({tag:e.tagName,text:(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\\s+/g,' ').slice(0,130),class:e.className,rect:{x:Math.round(e.getBoundingClientRect().x),y:Math.round(e.getBoundingClientRect().y),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)},client:e.clientWidth,scroll:e.scrollWidth,overflow:getComputedStyle(e).overflowX});
  const overs = all.filter(e=>visible(e)&&(e.getBoundingClientRect().right>w+2||e.getBoundingClientRect().left < -2));
  const scrolls = all.filter(e=>visible(e)&&e.scrollWidth>e.clientWidth+4&&['auto','scroll'].includes(getComputedStyle(e).overflowX));
  const clips = all.filter(e=>visible(e)&&e.scrollWidth>e.clientWidth+4&&['hidden','clip'].includes(getComputedStyle(e).overflowX));
  const controls=all.filter(e=>visible(e)&&e.matches('button,input,select,textarea,a')&&!e.closest('.restaurant-sidebar')&&e.getBoundingClientRect().y<innerHeight);
  const overlaps=[]; for(let i=0;i<controls.length;i++) for(let j=i+1;j<controls.length;j++){const a=controls[i],b=controls[j];if(a.contains(b)||b.contains(a))continue;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>5&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>5)overlaps.push([describe(a),describe(b)]);}
  return {url:location.pathname+location.search,width:w,clientWidth:document.documentElement.clientWidth,documentWidth:document.documentElement.scrollWidth,horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,height:document.documentElement.scrollHeight,title:document.querySelector('h1')?.innerText,bodyText:document.body.innerText.slice(0,350),overflow:overs.slice(0,18).map(describe),scrolls:scrolls.slice(0,12).map(describe),clips:clips.slice(0,8).map(describe),overlaps:overlaps.slice(0,8),requests:window.__auditRequests};
})()`;
async function viewport(width,height=900,mobile=false){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});}
async function navigate(route){errors.length=0;await send('Page.navigate',{url:'http://127.0.0.1:3000'+route});for(let i=0;i<180;i++){await pause(250);try{const ready=await evaluate(`document.readyState==='complete' && !document.body.innerText.includes('Compiling')`);if(ready){await pause(850);await evaluate(`scrollTo({top:0,behavior:'instant'});document.querySelectorAll('nextjs-portal').forEach(e=>e.style.display='none')`);return;}}catch{}}throw Error('Timeout '+route);}
async function screenshot(name){const data=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(resolve(out,name+'.png'),Buffer.from(data.data,'base64'));}
const mode=process.argv[2]??'scan';
if(mode==='scan'){
  const results=[];
  const routes=process.argv[3]?allRoutes.filter(x=>x.includes(process.argv[3])):allRoutes;
  for(const route of routes){
    try{
      await viewport(390); await navigate(route);
      for(const width of [320,390,768,1024,1440]){await viewport(width);await pause(100);const m=await evaluate(metricsExpression);m.route=route;m.errors=[...errors];results.push(m);}
      const r=results.filter(r=>r.route===route);console.log(JSON.stringify({route,titles:r[0].title,overflow:r.filter(x=>x.documentWidth>x.width+2).map(x=>[x.width,x.documentWidth]),errors:errors.slice(0,1)}));
      writeFileSync(resolve(out,process.argv[3]?'medicoes-revisao.json':'medicoes.json'),JSON.stringify(results,null,2));
    }catch(e){console.log(JSON.stringify({route,error:String(e)}));}
  }
}else if(mode==='inspect'){
  await viewport(Number(process.argv[4]??390),Number(process.argv[5]??900));await navigate(process.argv[3]??'/');
  if(process.argv[6]) await evaluate(process.argv[6]);
  await pause(500); console.log(JSON.stringify(await evaluate(metricsExpression),null,2));
  await screenshot(process.argv[7]??'inspecao');
}else if(mode==='scenarios'){
  const cases=JSON.parse(readFileSync(process.argv[3],'utf8'));
  const results=[];
  for(const c of cases){try{
    await viewport(c.width??390,c.height??900,c.mobile??false);await navigate(c.route);
    if(c.script)await evaluate(c.script);
    await pause(600);
    for(const width of c.widths??[c.width??390]){await viewport(width,c.height??900,c.mobile??false);await pause(200);const m=await evaluate(metricsExpression);m.scenario=c.name;m.route=c.route;m.requestedWidth=width;m.mobile=c.mobile??false;m.errors=[...errors];if(c.detail)m.detail=await evaluate(c.detail);results.push(m);if(c.capture!==false)await screenshot(c.name+'-'+width);console.log(JSON.stringify({scenario:c.name,width,doc:m.documentWidth,title:m.title,errors:m.errors.map(x=>x.slice(0,150)),detail:m.detail}));}
  }catch(e){console.log(JSON.stringify({scenario:c.name,error:String(e)}));}}
  writeFileSync(resolve(out,process.argv[4]??'interacoes.json'),JSON.stringify(results,null,2));
}else if(mode==='close'){
  await Promise.race([send('Browser.close'),pause(1000)]);
}else if(mode==='evalfile'){
  console.log(JSON.stringify(await evaluate(readFileSync(process.argv[3],'utf8')),null,2));
  if(process.argv[4])await screenshot(process.argv[4]);
}else if(mode==='eval'){
  console.log(JSON.stringify(await evaluate(process.argv[3]),null,2));
  if(process.argv[4])await screenshot(process.argv[4]);
}
ws.close();

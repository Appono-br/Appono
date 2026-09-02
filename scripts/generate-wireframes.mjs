import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const out = resolve("docs/wireframes/appono-wireframes.svg");

const screens = [
  { module: "Publico", title: "Home", route: "/", blocks: ["Header publico", "Hero", "Jornada Appono", "Como funciona", "FAQ"] },
  { module: "Publico", title: "Login", route: "/login", blocks: ["Logo", "Formulario", "Google", "Recuperar senha"] },
  { module: "Publico", title: "Cadastro cliente", route: "/cadastro/cliente", blocks: ["Formulario", "Dados pessoais", "Senha", "CTA"] },
  { module: "Publico", title: "Cadastro restaurante", route: "/cadastro/restaurante", blocks: ["Formulario", "Dados do restaurante", "Endereco", "CTA"] },
  { module: "Publico", title: "Recuperar senha", route: "/recuperar-senha", blocks: ["Email", "Instrucao curta", "Enviar link"] },
  { module: "Publico", title: "Completar perfil", route: "/completar-perfil", blocks: ["Escolha de perfil", "Cliente", "Restaurante"] },
  { module: "Cliente", title: "Home cliente", route: "/cliente/dashboard", blocks: ["Header cliente", "Busca de restaurantes", "Mais curtidos", "Restaurantes disponiveis"] },
  { module: "Cliente", title: "Perfil restaurante", route: "/cliente/restaurantes/[id]", blocks: ["Capa/logo", "Informacoes", "Reserva", "Cardapio", "Experiencias"] },
  { module: "Cliente", title: "Reservas", route: "/cliente/reservas", blocks: ["Filtros", "Cards de reserva", "Confirmar presenca", "Acoes"] },
  { module: "Cliente", title: "Pedido antecipado", route: "/cliente/reservas/[id]/pedido", blocks: ["Cardapio", "Itens", "Resumo", "Pagamento"] },
  { module: "Cliente", title: "Pagamento pedido", route: "/cliente/pagamentos/pedido/[id]", blocks: ["Resumo pedido", "Mercado Pago", "Status seguro"] },
  { module: "Cliente", title: "Retorno pagamento", route: "/cliente/pagamentos/retorno", blocks: ["Status", "Detalhes", "Acoes"] },
  { module: "Cliente", title: "Detalhe pedido", route: "/cliente/pedidos/[id]", blocks: ["Status", "Resumo", "Itens", "Cancelar/excluir"] },
  { module: "Cliente", title: "Todos os pedidos", route: "/cliente/detalhes-pedido", blocks: ["Lista", "Status", "Restaurante", "Acoes"] },
  { module: "Cliente", title: "Avaliar pedido", route: "/cliente/pedidos/[id]/avaliar", blocks: ["Nota", "Estrelas", "Comentario", "Salvar"] },
  { module: "Cliente", title: "Favoritos", route: "/cliente/favoritos", blocks: ["Restaurantes salvos", "Cards", "Remover"] },
  { module: "Cliente", title: "Notificacoes", route: "/cliente/notificacoes", blocks: ["Lista", "Favoritar", "Apagar", "Limpar"] },
  { module: "Cliente", title: "Mensagens", route: "/cliente/mensagens", blocks: ["Conversas", "Preview", "Status"] },
  { module: "Cliente", title: "Chat cliente", route: "/cliente/mensagens/[conversationId]", blocks: ["Historico", "Campo mensagem", "Anexos"] },
  { module: "Cliente", title: "Configuracoes", route: "/cliente/configuracoes", blocks: ["Conta", "Pagamentos", "Seguranca"] },
  { module: "Restaurante", title: "Home restaurante", route: "/restaurante/home", blocks: ["Resumo", "Fila", "Indicadores", "Atalhos"] },
  { module: "Restaurante", title: "Dashboard", route: "/restaurante/dashboard", blocks: ["KPIs", "Cozinha", "Destaques", "Agenda"] },
  { module: "Restaurante", title: "Reservas", route: "/restaurante/reservas", blocks: ["Agendamentos", "Fila por horario", "Check-in", "Concluir/cancelar"] },
  { module: "Restaurante", title: "Cozinha", route: "/restaurante/pedidos", blocks: ["Pedidos ordenados", "Itens", "Status", "Iniciar preparo"] },
  { module: "Restaurante", title: "Historico", route: "/restaurante/historico-pedidos", blocks: ["Busca", "Pedidos", "Reservas", "Imprimir notinha"] },
  { module: "Restaurante", title: "Financeiro", route: "/restaurante/financeiro", blocks: ["Recebido", "Comissao", "A receber", "Eventos"] },
  { module: "Restaurante", title: "Desempenho", route: "/restaurante/desempenho", blocks: ["Avaliacoes", "Grafico", "Top itens"] },
  { module: "Restaurante", title: "Cardapio", route: "/restaurante/cardapio", blocks: ["Categorias", "Itens", "Disponibilidade", "Editar/arquivar"] },
  { module: "Restaurante", title: "Editar item", route: "/restaurante/cardapio/editar", blocks: ["Produto", "Preco", "Categoria", "Imagem"] },
  { module: "Restaurante", title: "Configuracoes", route: "/restaurante/configuracoes", blocks: ["Perfil", "Operacao", "Endereco", "Financeiro"] },
  { module: "Restaurante", title: "Operacao", route: "/restaurante/configuracoes/operacao", blocks: ["Horarios", "Mesas", "Antecedencia", "Salvar"] },
  { module: "Restaurante", title: "Endereco", route: "/restaurante/configuracoes/endereco", blocks: ["Endereco", "Cidade", "Estado", "Mapa futuro"] },
  { module: "Restaurante", title: "Dados bancarios", route: "/restaurante/configuracoes/dados-bancarios", blocks: ["Mercado Pago", "Conectar", "Desconectar", "Status"] },
  { module: "Restaurante", title: "Preferencias notificacao", route: "/restaurante/configuracoes/notificacoes", blocks: ["Regras", "Canais", "Toggles"] },
  { module: "Restaurante", title: "Seguranca", route: "/restaurante/configuracoes/seguranca", blocks: ["Senha", "2FA futuro", "Permissoes"] },
  { module: "Restaurante", title: "Reembolsos", route: "/restaurante/reembolsos", blocks: ["Solicitacoes", "Pedido", "Motivo", "Status"] },
  { module: "Restaurante", title: "Mensagens", route: "/restaurante/mensagens", blocks: ["Conversas", "Cliente", "Ultima mensagem"] },
  { module: "Restaurante", title: "Chat restaurante", route: "/restaurante/mensagens/[conversationId]", blocks: ["Historico", "Pedido vinculado", "Campo mensagem"] },
  { module: "Admin", title: "Painel admin", route: "/admin", blocks: ["Resumo plataforma", "Restaurantes", "Clientes", "Atalhos"] },
  { module: "Admin", title: "Financeiro admin", route: "/admin/financeiro", blocks: ["GMV", "Comissao", "Repasses", "Pendencias"] },
  { module: "Admin", title: "Reembolsos admin", route: "/admin/reembolsos", blocks: ["Solicitacoes", "Aprovar", "Recusar", "Eventos"] },
  { module: "Admin", title: "Notificacoes admin", route: "/admin/notificacoes", blocks: ["Alertas", "Eventos", "Limpar"] },
];

const cols = 4;
const frameW = 360;
const frameH = 640;
const gap = 64;
const labelH = 54;
const margin = 64;
const rows = Math.ceil(screens.length / cols);
const width = margin * 2 + cols * frameW + (cols - 1) * gap;
const height = margin * 2 + rows * (frameH + labelH) + (rows - 1) * gap;

const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[ch]));

function rect(x, y, w, h, cls = "box", rx = 14) {
  return `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
}

function text(x, y, value, cls = "text") {
  return `<text class="${cls}" x="${x}" y="${y}">${esc(value)}</text>`;
}

function lines(x, y, count, widths = [240, 180, 120]) {
  return Array.from({ length: count }, (_, i) => rect(x, y + i * 18, widths[i % widths.length], 8, "line", 4)).join("");
}

function screenSvg(screen, index) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = margin + col * (frameW + gap);
  const y = margin + row * (frameH + labelH + gap);
  const innerX = x + 24;
  let cy = y + 86;
  const blockGap = 18;
  const headerDark = ["Restaurante", "Admin"].includes(screen.module);
  const blocks = screen.blocks.slice(0, 6);

  let svg = "";
  svg += text(x, y - 18, `${screen.module} / ${screen.title}`, "caption");
  svg += rect(x, y, frameW, frameH, "frame", 28);
  svg += rect(innerX, y + 24, 74, 18, "brand", 9);
  svg += rect(x + frameW - 132, y + 24, 108, 28, "nav", 14);
  svg += text(innerX, y + 66, screen.title, "title");
  svg += text(innerX, y + 92, screen.route, "route");

  if (screen.title.toLowerCase().includes("home") || screen.title.includes("Perfil restaurante")) {
    svg += rect(innerX, y + 118, frameW - 48, 128, headerDark ? "heroDark" : "hero", 24);
    svg += lines(innerX + 20, y + 146, 3, [190, 250, 140]);
    cy = y + 270;
  } else {
    cy = y + 124;
  }

  for (const [i, block] of blocks.entries()) {
    const h = i === 0 && !screen.title.toLowerCase().includes("home") ? 70 : 58;
    svg += rect(innerX, cy, frameW - 48, h, "panel", 18);
    svg += text(innerX + 18, cy + 28, block, "smallTitle");
    svg += rect(x + frameW - 86, cy + 20, 42, 16, i % 2 ? "pillAlt" : "pill", 8);
    cy += h + blockGap;
  }

  if (cy < y + frameH - 96) {
    svg += rect(innerX, y + frameH - 82, 132, 38, "button", 19);
    svg += rect(innerX + 148, y + frameH - 82, 132, 38, "buttonGhost", 19);
  }

  return `<g id="${esc(screen.module + "-" + screen.title).replace(/\s+/g, "-")}">${svg}</g>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .bg{fill:#f8f6f2}
      .frame{fill:#fff;stroke:#d9c4a8;stroke-width:1.2}
      .panel{fill:#fbfaf7;stroke:#e2d2bd;stroke-width:1}
      .hero{fill:#f3eee6;stroke:#d9c4a8;stroke-width:1}
      .heroDark{fill:#25130f;stroke:#5a3121;stroke-width:1}
      .brand{fill:#8f4b28}
      .nav{fill:#f3eee6;stroke:#d9c4a8;stroke-width:1}
      .line{fill:#d8c5ad}
      .pill{fill:#8f4b28}
      .pillAlt{fill:#2f1712}
      .button{fill:#2f1712}
      .buttonGhost{fill:#fff;stroke:#8f4b28;stroke-width:1}
      .caption{font:700 15px Arial, sans-serif;fill:#8f4b28;letter-spacing:1.2px}
      .title{font:700 25px Arial, sans-serif;fill:#1f120f}
      .route{font:400 12px Arial, sans-serif;fill:#7b6254}
      .smallTitle{font:700 13px Arial, sans-serif;fill:#2f1712}
      .text{font:400 12px Arial, sans-serif;fill:#2f1712}
    </style>
  </defs>
  <rect class="bg" width="100%" height="100%"/>
  ${text(margin, 36, "Appono - Wireframes de telas", "title")}
  ${text(margin, 58, "Mapa importavel no Figma: cada card representa uma rota/tela principal do MVP.", "route")}
  ${screens.map(screenSvg).join("\n  ")}
</svg>`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg, "utf8");
console.log(out);

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve("docs/figma-screenshots");
const output = resolve("docs/figma-screenshots/appono-telas-reais-publico-cliente-restaurante.svg");

function pngSize(buffer) {
  if (buffer.toString("ascii", 1, 4) !== "PNG") return { width: 1440, height: 900 };
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const shots = [
  ...[
    "01-home-publica.png",
    "02-login.png",
    "03-cadastro-cliente.png",
    "04-cadastro-restaurante.png",
    "05-recuperar-senha.png",
    "06-completar-perfil.png",
  ].map((file) => ({ module: "publico", file, path: join(root, "publico", file) })),
  ...[
    "01-home-cliente.png",
    "02-restaurante-outback.png",
    "03-restaurante-subway.png",
    "04-reservas.png",
    "05-todos-pedidos.png",
    "06-detalhe-pedido-54.png",
    "08-pagamento-pedido-54.png",
    "09-retorno-pagamento.png",
    "10-favoritos.png",
    "11-notificacoes.png",
    "12-mensagens.png",
    "13-configuracoes.png",
    "14-config-conta.png",
    "15-config-pagamentos.png",
  ].map((file) => ({ module: "cliente", file, path: join(root, "cliente", file) })),
  ...[
    "01-home-restaurante.png",
    "02-dashboard.png",
    "03-reservas.png",
    "04-cozinha.png",
    "05-historico.png",
    "06-financeiro.png",
    "07-desempenho.png",
    "08-cardapio.png",
    "09-editar-cardapio.png",
    "10-configuracoes.png",
    "11-config-operacao.png",
    "12-config-endereco.png",
    "13-config-dados-bancarios.png",
    "14-config-notificacoes.png",
    "15-config-seguranca.png",
    "16-reembolsos.png",
    "17-notificacoes.png",
    "18-mensagens.png",
  ].map((file) => ({ module: "restaurante", file, path: join(root, "restaurante", file) })),
];
const colWidth = 430;
const gap = 52;
const margin = 64;
const cols = 3;
const titleHeight = 72;
const cards = shots.map((shot) => {
  const bytes = readFileSync(shot.path);
  const size = pngSize(bytes);
  const scale = Math.min(1, 390 / size.width);
  const w = Math.round(size.width * scale);
  const h = Math.round(size.height * scale);
  return {
    ...shot,
    bytes,
    width: w,
    height: h,
    originalWidth: size.width,
    originalHeight: size.height,
    cardHeight: h + 92,
  };
});

const rowHeights = [];
for (let i = 0; i < cards.length; i += cols) {
  rowHeights.push(Math.max(...cards.slice(i, i + cols).map((card) => card.cardHeight)));
}

const width = margin * 2 + cols * colWidth + (cols - 1) * gap;
const height = margin * 2 + titleHeight + rowHeights.reduce((sum, h) => sum + h, 0) + (rowHeights.length - 1) * gap;
const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[ch]));

let y = margin + titleHeight;
const nodes = [];
for (let row = 0; row < rowHeights.length; row++) {
  const rowCards = cards.slice(row * cols, row * cols + cols);
  for (let col = 0; col < rowCards.length; col++) {
    const card = rowCards[col];
    const x = margin + col * (colWidth + gap);
    const imageX = x + 20;
    const imageY = y + 62;
    const label = card.file.replace(/^\d+-/, "").replace(/\.png$/, "").replace(/-/g, " ");
    const rel = relative(resolve("."), card.path);
    nodes.push(`
      <g id="${esc(`${card.module}-${card.file}`)}">
        <rect x="${x}" y="${y}" width="${colWidth}" height="${card.cardHeight}" rx="24" fill="#ffffff" stroke="#d9c4a8"/>
        <text x="${x + 20}" y="${y + 30}" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#25130f">${esc(label)}</text>
        <text x="${x + 20}" y="${y + 50}" font-family="Arial, sans-serif" font-size="11" fill="#8f4b28">${esc(card.module)} | ${card.originalWidth}x${card.originalHeight} | ${esc(rel)}</text>
        <rect x="${imageX - 1}" y="${imageY - 1}" width="${card.width + 2}" height="${card.height + 2}" rx="12" fill="#f8f6f2" stroke="#e5d7c5"/>
        <image x="${imageX}" y="${imageY}" width="${card.width}" height="${card.height}" href="data:image/png;base64,${card.bytes.toString("base64")}"/>
      </g>`);
  }
  y += rowHeights[row] + gap;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8f6f2"/>
  <text x="${margin}" y="${margin + 8}" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#25130f">Appono - telas reais para Figma</text>
  <text x="${margin}" y="${margin + 36}" font-family="Arial, sans-serif" font-size="14" fill="#6f5140">Capturas renderizadas da aplicação local. Importe este SVG no Figma para manter as telas iguais ao produto.</text>
  ${nodes.join("\n")}
</svg>`;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, svg, "utf8");
console.log(output);

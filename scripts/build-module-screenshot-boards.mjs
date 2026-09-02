import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve("docs/figma-screenshots");

const modules = {
  cliente: {
    output: resolve("docs/figma-screenshots/appono-telas-reais-cliente.svg"),
    title: "Appono - Telas reais do Cliente",
    files: [
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
    ],
  },
  restaurante: {
    output: resolve("docs/figma-screenshots/appono-telas-reais-restaurante.svg"),
    title: "Appono - Telas reais do Restaurante",
    files: [
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
    ],
  },
};

function pngSize(buffer) {
  if (buffer.toString("ascii", 1, 4) !== "PNG") return { width: 1440, height: 900 };
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[char]);
}

function buildBoard(moduleName, config) {
  const shots = config.files.map((file) => {
    const filePath = join(root, moduleName, file);
    const bytes = readFileSync(filePath);
    const size = pngSize(bytes);
    const scale = Math.min(1, 410 / size.width);
    const width = Math.round(size.width * scale);
    const height = Math.round(size.height * scale);
    return {
      file,
      path: filePath,
      bytes,
      width,
      height,
      originalWidth: size.width,
      originalHeight: size.height,
      cardHeight: height + 92,
    };
  });

  const cols = 3;
  const colWidth = 450;
  const gap = 52;
  const margin = 64;
  const titleHeight = 74;
  const rowHeights = [];
  for (let i = 0; i < shots.length; i += cols) {
    rowHeights.push(Math.max(...shots.slice(i, i + cols).map((shot) => shot.cardHeight)));
  }
  const width = margin * 2 + cols * colWidth + (cols - 1) * gap;
  const height = margin * 2 + titleHeight + rowHeights.reduce((sum, row) => sum + row, 0) + (rowHeights.length - 1) * gap;

  let y = margin + titleHeight;
  const nodes = [];
  for (let row = 0; row < rowHeights.length; row += 1) {
    const rowShots = shots.slice(row * cols, row * cols + cols);
    for (let col = 0; col < rowShots.length; col += 1) {
      const shot = rowShots[col];
      const x = margin + col * (colWidth + gap);
      const imageX = x + 20;
      const imageY = y + 62;
      const label = shot.file.replace(/^\d+-/, "").replace(/\.png$/, "").replace(/-/g, " ");
      const rel = relative(resolve("."), shot.path);
      nodes.push(`
      <g id="${escapeHtml(`${moduleName}-${shot.file}`)}">
        <rect x="${x}" y="${y}" width="${colWidth}" height="${shot.cardHeight}" rx="24" fill="#ffffff" stroke="#d9c4a8"/>
        <text x="${x + 20}" y="${y + 30}" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#25130f">${escapeHtml(label)}</text>
        <text x="${x + 20}" y="${y + 50}" font-family="Arial, sans-serif" font-size="11" fill="#8f4b28">${moduleName} | ${shot.originalWidth}x${shot.originalHeight} | ${escapeHtml(rel)}</text>
        <rect x="${imageX - 1}" y="${imageY - 1}" width="${shot.width + 2}" height="${shot.height + 2}" rx="12" fill="#f8f6f2" stroke="#e5d7c5"/>
        <image x="${imageX}" y="${imageY}" width="${shot.width}" height="${shot.height}" href="data:image/png;base64,${shot.bytes.toString("base64")}"/>
      </g>`);
    }
    y += rowHeights[row] + gap;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8f6f2"/>
  <text x="${margin}" y="${margin + 8}" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#25130f">${escapeHtml(config.title)}</text>
  <text x="${margin}" y="${margin + 36}" font-family="Arial, sans-serif" font-size="14" fill="#6f5140">Capturas reais da aplicação local. Arraste este SVG para o Figma para importar o módulo.</text>
  ${nodes.join("\n")}
</svg>`;

  mkdirSync(dirname(config.output), { recursive: true });
  writeFileSync(config.output, svg, "utf8");
  return { moduleName, output: config.output, screens: shots.length };
}

const results = Object.entries(modules).map(([moduleName, config]) => buildBoard(moduleName, config));
console.log(JSON.stringify(results, null, 2));

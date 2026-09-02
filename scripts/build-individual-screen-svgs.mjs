import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve("docs/figma-screenshots");
const outputRoot = resolve("docs/figma-export");

const modules = {
  cliente: [
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
  restaurante: [
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

function labelFromFile(file) {
  return file.replace(/^\d+-/, "").replace(/\.png$/, "").replace(/-/g, " ");
}

function buildSvg(moduleName, file) {
  const sourcePath = join(root, moduleName, file);
  const bytes = readFileSync(sourcePath);
  const { width, height } = pngSize(bytes);
  const titleHeight = 58;
  const padding = 20;
  const svgWidth = width + padding * 2;
  const svgHeight = height + titleHeight + padding * 2;
  const label = labelFromFile(file);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <rect width="100%" height="100%" fill="#f8f6f2"/>
  <text x="${padding}" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#25130f">${escapeHtml(label)}</text>
  <text x="${padding}" y="50" font-family="Arial, sans-serif" font-size="12" fill="#8f4b28">${escapeHtml(moduleName)} | ${width}x${height}</text>
  <rect x="${padding - 1}" y="${titleHeight + padding - 1}" width="${width + 2}" height="${height + 2}" rx="14" fill="#ffffff" stroke="#d9c4a8"/>
  <image x="${padding}" y="${titleHeight + padding}" width="${width}" height="${height}" href="data:image/png;base64,${bytes.toString("base64")}"/>
</svg>`;
}

const manifest = {};
rmSync(outputRoot, { recursive: true, force: true });

for (const [moduleName, files] of Object.entries(modules)) {
  const moduleDir = join(outputRoot, moduleName);
  mkdirSync(moduleDir, { recursive: true });
  manifest[moduleName] = [];

  for (const file of files) {
    const svgName = file.replace(/\.png$/, ".svg");
    const svgPath = join(moduleDir, svgName);
    writeFileSync(svgPath, buildSvg(moduleName, file), "utf8");
    manifest[moduleName].push(svgName);
  }

  writeFileSync(join(moduleDir, "manifest.json"), JSON.stringify(manifest[moduleName], null, 2), "utf8");
}

writeFileSync(join(outputRoot, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(JSON.stringify({
  outputRoot,
  cliente: manifest.cliente.length,
  restaurante: manifest.restaurante.length,
}, null, 2));

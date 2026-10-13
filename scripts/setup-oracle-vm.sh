#!/bin/bash
set -euo pipefail

echo "=== Setup do Appono na Oracle Cloud VM ==="
echo ""

# 1. Atualizar sistema
echo "[1/6] Atualizando sistema..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq

# 2. Instalar Docker
if ! command -v docker &> /dev/null; then
    echo "[2/6] Instalando Docker..."
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
    echo "Docker instalado. Faca logout e login para usar sem sudo."
else
    echo "[2/6] Docker ja instalado."
fi

# 3. Instalar Docker Compose plugin
if ! docker compose version &> /dev/null; then
    echo "[3/6] Instalando Docker Compose..."
    sudo apt-get install -y -qq docker-compose-plugin
else
    echo "[3/6] Docker Compose ja instalado."
fi

# 4. Clonar repositorio (se nao existir)
REPO_DIR="$HOME/appono"
if [ ! -d "$REPO_DIR" ]; then
    echo "[4/6] Clonando repositorio..."
    git clone https://github.com/Appono-br/Appono.git "$REPO_DIR"
else
    echo "[4/6] Repositorio ja existe em $REPO_DIR"
fi

cd "$REPO_DIR"

# 5. Configurar .env.production
if [ ! -f backend/.env.production ]; then
    echo "[5/6] Criando .env.production a partir do exemplo..."
    cp backend/.env.production.example backend/.env.production
    echo ""
    echo "  IMPORTANTE: Edite backend/.env.production com suas credenciais:"
    echo "    nano backend/.env.production"
    echo ""
else
    echo "[5/6] backend/.env.production ja existe."
fi

# 6. Abrir portas no firewall
echo "[6/6] Configurando firewall..."
sudo iptables -I INPUT -p tcp --dport 3001 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true

echo ""
echo "=== Setup concluido ==="
echo ""
echo "Proximos passos:"
echo "  1. Edite backend/.env.production com suas credenciais"
echo "  2. Faca logout e login (para usar Docker sem sudo)"
echo "  3. Execute: cd $REPO_DIR && docker compose up -d --build"
echo "  4. Baixe o modelo Ollama: docker compose exec ollama ollama pull gemma3:4b"
echo "  5. Ingira os documentos seed: docker compose exec backend node backend/scripts/seed-rag-documents.js"
echo "  6. Teste: curl http://localhost:3001/api/health"
echo ""
echo "Para ver logs: docker compose logs -f"
echo "Para parar: docker compose down"
echo ""
echo "LEMBRE-SE: Abra a porta 3001 nas Security Lists do Oracle Cloud!"
echo "  Networking > Virtual Cloud Networks > Subnet > Security Lists > Add Ingress Rule"
echo "  Source CIDR: 0.0.0.0/0 | Protocol: TCP | Destination Port: 3001"

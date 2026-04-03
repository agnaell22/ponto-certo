#!/bin/bash

# ==============================================================================
# SCRIPT DE SETUP PONTO-CERTO (UBUNTU)
# Foco: Otimização para máquinas de 1GB de RAM
# ==============================================================================

echo "🚀 Iniciando preparação do servidor para Ponto-Certo..."

# 1. Atualização do sistema
sudo apt update && sudo apt upgrade -y

# 2. Configuração de SWAP (CRÍTICO para 1GB RAM)
if [ ! -f /swapfile ]; then
    echo "💾 Configurando 2GB de SWAP para estabilidade..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ SWAP configurado."
else
    echo "ℹ️ SWAP já existe."
fi

# 3. Instalação do Docker
if ! [ -x "$(command -v docker)" ]; then
    echo "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado."
else
    echo "ℹ️ Docker já instalado."
fi

# 4. Instalação do Nginx e Certbot
echo "🌐 Instalando Nginx e SSL Tools..."
sudo apt install -y nginx certbot python3-certbot-nginx

# 5. Configuração básica do Nginx
sudo rm /etc/nginx/sites-enabled/default
sudo cp nginx.conf /etc/nginx/sites-available/pontocerto
sudo ln -s /etc/nginx/sites-available/pontocerto /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "===================================================="
echo "🎉 PRONTO! Próximos passos:"
echo "1. Configure o arquivo .env adequado na VPS."
echo "2. Rode: docker compose -f docker-compose.prod.yml up -d --build"
echo "3. Configure o SSL: sudo certbot --nginx -d seu-dominio.com"
echo "===================================================="

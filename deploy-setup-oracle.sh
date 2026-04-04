#!/bin/bash
# ==============================================================================
# SCRIPT DE SETUP PONTO-CERTO (ORACLE LINUX 9)
# Foco: Otimização para máquinas de 1GB de RAM no Oracle Cloud
# ==============================================================================

echo "🚀 Iniciando preparação do servidor (Oracle Linux 9)..."

# 1. Configuração de SWAP (CRÍTICO para 1GB RAM)
if [ ! -f /swapfile ]; then
    echo "💾 Configurando 2GB de SWAP..."
    # Oracle Linux as vezes não aceita fallocate em sistemas XFS, usamos dd por segurança
    sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ SWAP configurado."
else
    echo "ℹ️ SWAP já existe."
fi

# 2. Instalar Repositório Docker e Docker Engine
echo "🐳 Instalando Docker..."
sudo dnf install -y dnf-utils
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 3. Iniciar e Habilitar Docker
sudo systemctl enable --now docker
sudo usermod -aG docker opc

# 4. Configuração de Firewall (OCI Oracle Linux usa firewalld por padrão)
echo "🛡️ Configurando Firewall local (firewalld)..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# 5. Instalar Nginx
echo "🌐 Instalando Nginx..."
sudo dnf install -y nginx
sudo systemctl enable --now nginx

echo ""
echo "===================================================="
echo "🎉 SETUP CONCLUÍDO (Oracle Linux)!"
echo "Próximos passos:"
echo "1. Clone o projeto: git clone <url>"
echo "2. Entre na pasta e configure o .env"
echo "3. Rode: docker compose -f docker-compose.prod.yml up -d"
echo "===================================================="

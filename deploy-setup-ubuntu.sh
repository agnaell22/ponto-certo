#!/bin/bash
# ==============================================================================
# SCRIPT DE SETUP PONTO-CERTO (UBUNTU 22.04)
# Foco: Otimização para máquinas de 1GB de RAM (Always Free OCI)
# ==============================================================================

echo "🚀 Iniciando preparação do servidor (Ubuntu 22.04)..."

# 1. Configuração de SWAP (CRÍTICO para 1GB RAM)
if [ ! -f /swapfile ]; then
    echo "💾 Configurando 2GB de SWAP..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    
    # Ajustar swappiness para usar menos disco se possível
    sudo sysctl vm.swappiness=10
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    
    echo "✅ SWAP configurado."
else
    echo "ℹ️ SWAP já existe."
fi

# 2. Atualizar Sistema
echo "🔄 Atualizando pacotes locais..."
sudo apt update && sudo apt upgrade -y

# 3. Instalar dependências base e Nginx
echo "🌐 Instalando ferramentas base e Nginx..."
sudo apt install -y ca-certificates curl gnupg lsb-release nginx

# 4. Instalar Docker
echo "🐳 Instalando Docker via repositório oficial..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 5. Ajustar permissões e rodar no boot
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu

# 6. Configurar Firewall (UFW no Ubuntu)
# Na OCI, além da Security List na nuvem, você pode ter o firewall local
echo "🛡️ Ajustando Firewall interno..."
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3001/tcp
yes | sudo ufw enable

echo ""
echo "===================================================="
echo "🎉 SETUP CONCLUÍDO (Ubuntu 22.04)!"
echo "ATENÇÃO: Você precisa sair (exit) e entrar de novo para acessar o docker sem sudo."
echo "Próximos passos:"
echo "1. Clone o projeto: git clone <url do Ponto Certo>"
echo "2. Entre na pasta e configure as variáveis de ambiente (.env)"
echo "3. Suba o banco e a API: docker compose up -d"
echo "===================================================="

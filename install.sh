#!/bin/bash

echo "🚀 Starting piCast installation"

echo "📦 Installing required packages"
sudo apt-get install -y curl unzip python3-flask python3-flask-cors python3-dotenv pipx
pipx ensurepath

export PATH="$PATH:$HOME/.local/bin"

echo "📦 Installing catt and yt-dlp"
pipx install catt || echo "catt is already installed"
pipx install yt-dlp || echo "yt-dlp is already installed"

CATT_PATH=$(which catt)
YTDLP_PATH=$(which yt-dlp)

if [ -z "$CATT_PATH"] || [ -z "$YTDLP_PATH"]; then
  echo "❌ Error: Couldn't find path to catt or yt-dlp."
  echo "Make sure pipx is working correctly."
  exit 1
fi

echo "✅ Found catt: $CATT_PATH"
echo "✅ Found yt-dlp: $YTDLP_PATH"

DEFAULT_IP=$(hostname -I | awk '{print$1}')

echo ""
echo "⚙️ NETWORK SETTINGS"
read -p "Provide IP address of your Raspberry Pi (default: $DEFAULT_IP): " USER_IP
USER_IP=${USER_IP:-$DEFAULT_IP}

read -p "On which port should backend work (default: 8080): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-8080}

echo "📝 Generating configuration files (.env)..."

cat <<EOF > backend/.env
CATT_CMD=$CATT_PATH
YTDLP_CMD=$YTDLP_PATH
FLASK_PORT=$BACKEND_PORT
EOF

cat <<EOF > frontend/.env
VITE_API_URL=http://$USER_IP:$BACKEND_PORT/api
EOF

docker pull kwiasek/picast-frontend:latest

docker run -d \
  --name pilot-frontend \
  --restart always \
  -p 8081:80 \
  -e API_URL="http://$USER_IP:$BACKEND_PORT/api" \
  kwiasek/picast-frontend:latest

echo ""
echo "🛠️ STARTUP CONFIGURATION"
read -p "Do you want to install this program as system service? It will launch on the system startup (y/n): " INSTALL_SERVICE
INSTALL_SERVICE=${INSTALL_SERVICE:-T}

if [[ "$INSTALL_SERVICE" =~ ^[TtYy]$ ]]; then
    echo "🔧 Generating systemd service file..."
    
    BACKEND_DIR=$(realpath backend)
    CURRENT_USER=$USER
    SERVICE_FILE="/tmp/picast.service"

    cat <<EOF > $SERVICE_FILE
[Unit]
Description=Web remote for YouTube (Flask API)
After=network.target

[Service]
User=$CURRENT_USER
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/bin/python3 $BACKEND_DIR/server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    sudo mv $SERVICE_FILE /etc/systemd/system/picast.service
    
    sudo systemctl daemon-reload
    sudo systemctl enable picast.service
    sudo systemctl start picast.service
    
    echo "✅ Service installed and launched in background!"
    echo "You can check the status by typing: sudo systemctl status picast.service"
else
    echo "⏭️ Skipping installation of system service."
    echo "You can launch manually by typing:"
    echo "cd backend && python3 server.py"
fi
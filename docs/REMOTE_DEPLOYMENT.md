# SmartTask — Remote Server Deployment & Secure Access Guide

This guide covers deploying SmartTask to a remote cloud VPS (e.g. DigitalOcean, AWS EC2, Hetzner, Linode) or securely accessing your local server from outside your home network.

---

## 1. Secure Remote Access Without Exposing Dev Ports Directly

> [!CAUTION]
> **Never forward port 8000 on your home router directly to the public internet.**
> Exposing development servers without reverse proxy buffering, rate-limiting, and SSL creates significant security vulnerabilities.

### Option A: Cloudflare Tunnels (Recommended for Zero-Port Exposure)
Cloudflare Tunnel creates an encrypted outbound-only connection from your server to Cloudflare’s global network:
1. Install `cloudflared`:
   ```bash
   brew install cloudflared  # on macOS, or apt-get install cloudflared on Ubuntu
   ```
2. Log in and create a tunnel:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create smarttask-tunnel
   ```
3. Map your backend service:
   ```yaml
   # ~/.cloudflared/config.yml
   tunnel: <TUNNEL_UUID>
   credentials-file: /path/to/<TUNNEL_UUID>.json
   ingress:
     - hostname: api-smarttask.yourdomain.com
       service: http://localhost:8000
     - hostname: smarttask.yourdomain.com
       service: http://localhost:5173
     - service: http_status:404
   ```
4. Run the tunnel: `cloudflared tunnel run smarttask-tunnel`.
5. Point your Android APK and browser to `https://api-smarttask.yourdomain.com`.

### Option B: Tailscale VPN (Private Multi-Device Mesh)
If you only need personal access across your own devices:
1. Install Tailscale on your MacBook and Android phone.
2. Each device gets a secure private IP (e.g., `100.x.y.z`).
3. In the SmartTask Android App Settings, simply enter `http://100.x.y.z:8000`.

---

## 2. Production Cloud VPS Deployment (Ubuntu / Debian)

### 2.1 Database Setup (PostgreSQL)
Install PostgreSQL on the VPS:
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib libpq-dev
sudo -u postgres psql -c "CREATE DATABASE smarttask;"
sudo -u postgres psql -c "CREATE USER smarttask_user WITH PASSWORD 'StrongSecretPasswordHere';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE smarttask TO smarttask_user;"
```

Update your `backend/.env`:
```env
DATABASE_URL=postgresql+psycopg2://smarttask_user:StrongSecretPasswordHere@localhost:5432/smarttask
```
Run migrations:
```bash
python3 -m alembic upgrade head
```

### 2.2 Systemd Backend Service
Create `/etc/systemd/system/smarttask-backend.service`:
```ini
[Unit]
Description=SmartTask FastAPI Production Backend
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/var/www/SmartTask/backend
ExecStart=/var/www/SmartTask/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```
Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now smarttask-backend
```

### 2.3 Frontend Production Static Build
```bash
cd /var/www/SmartTask/frontend
npm install
npm run build
# Built files reside in /var/www/SmartTask/frontend/dist
```

### 2.4 Nginx Reverse Proxy with Let's Encrypt SSL
Create `/etc/nginx/sites-available/smarttask.conf`:
```nginx
server {
    server_name smarttask.yourdomain.com;

    # Frontend SPA
    location / {
        root /var/www/SmartTask/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger Documentation
    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```
Enable site and obtain SSL:
```bash
sudo ln -s /etc/nginx/sites-available/smarttask.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d smarttask.yourdomain.com
sudo systemctl restart nginx
```
Now SmartTask is accessible securely worldwide over HTTPS!

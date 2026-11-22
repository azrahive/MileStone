# MileStone — Remote Server Deployment & Secure Access Guide

This guide covers deploying MileStone to a remote cloud VPS (e.g. DigitalOcean, AWS EC2, Hetzner, Linode) or securely accessing your local server from outside your home network.

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
   cloudflared tunnel create milestone-tunnel
   ```
3. Map your backend service:
   ```yaml
   # ~/.cloudflared/config.yml
   tunnel: <TUNNEL_UUID>
   credentials-file: /path/to/<TUNNEL_UUID>.json
   ingress:
     - hostname: api-milestone.yourdomain.com
       service: http://localhost:8000
     - hostname: milestone.yourdomain.com
       service: http://localhost:5173
     - service: http_status:404
   ```
4. Run the tunnel: `cloudflared tunnel run milestone-tunnel`.
5. Point your Android APK and browser to `https://api-milestone.yourdomain.com`.

### Option B: Tailscale VPN (Private Multi-Device Mesh)
If you only need personal access across your own devices:
1. Install Tailscale on your MacBook and Android phone.
2. Each device gets a secure private IP (e.g., `100.x.y.z`).
3. In the MileStone Android App Settings, simply enter `http://100.x.y.z:8000`.

---

## 2. Production Cloud VPS Deployment (Ubuntu / Debian)

### 2.1 Database Setup (PostgreSQL)
Install PostgreSQL on the VPS:
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib libpq-dev
sudo -u postgres psql -c "CREATE DATABASE milestone;"
sudo -u postgres psql -c "CREATE USER milestone_user WITH PASSWORD 'StrongSecretPasswordHere';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE milestone TO milestone_user;"
```

Update your `backend/.env`:
```env
DATABASE_URL=postgresql+psycopg2://milestone_user:StrongSecretPasswordHere@localhost:5432/milestone
```
Run migrations:
```bash
python3 -m alembic upgrade head
```

### 2.2 Systemd Backend Service
Create `/etc/systemd/system/milestone-backend.service`:
```ini
[Unit]
Description=MileStone FastAPI Production Backend
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/var/www/MileStone/backend
ExecStart=/var/www/MileStone/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```
Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now milestone-backend
```

### 2.3 Frontend Production Static Build
```bash
cd /var/www/MileStone/frontend
npm install
npm run build
# Built files reside in /var/www/MileStone/frontend/dist
```

### 2.4 Nginx Reverse Proxy with Let's Encrypt SSL
Create `/etc/nginx/sites-available/milestone.conf`:
```nginx
server {
    server_name milestone.yourdomain.com;

    # Frontend SPA
    location / {
        root /var/www/MileStone/frontend/dist;
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
sudo ln -s /etc/nginx/sites-available/milestone.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d milestone.yourdomain.com
sudo systemctl restart nginx
```
Now MileStone is accessible securely worldwide over HTTPS!

# 🎬 StreamBDIX

**Stremio addon for streaming from BDIX sites.**

---

## 🔍 What It Does

• Fetches movies and series from BDIX sites based on what you select in Stremio  
• Shows available streams with quality info (1080p, 4K, BluRay, etc.)  
• Lets you play directly in Stremio from BDIX

---

## ⚡ Quick Start

```
npx streambdix
```

> Requires **[Stremio](https://www.stremio.com/downloads)**  
> Requires **[Node.js](https://nodejs.org/en/download)** 14+

---

## 🌐 Sources

- [DFLIX](https://discoveryftp.net/)
- [DhakaFlix](http://172.16.50.12)
- [RoarZone](https://roarzone.info)
- [FTPBD](https://ftpbd.net)
- [CircleFTP](http://new.circleftp.net)
- [ICC FTP](http://10.16.100.244)

---

## ☁️ Cloudflare Tunnel (Optional)

Access your addon from anywhere using Cloudflare Tunnel - no port forwarding needed!

### Setup Steps:

1. **Create Cloudflare Tunnel:**
    - Visit [Cloudflare Zero Trust](https://one.dash.cloudflare.com)
    - Go to: **Networks → Tunnels → Create a tunnel**
    - Select **Cloudflared** connector
    - Name your tunnel (e.g., `streambdix-tunnel`)

2. **Get Your Tunnel Token:**
    - During tunnel creation, you'll see an installation command like:
        ```bash
        cloudflared service install <YOUR_TOKEN_HERE>
        ```
    - Copy the token part (starts with `eyJ...`)

3. **Configure Your Application:**
    - Create a `.env` file in your project:
        ```bash
        cp .env.example .env
        ```
    - Edit `.env` and add your token:
        ```env
        CLOUDFLARE_TUNNEL_TOKEN=your_token_here
        ENABLE_CLOUDFLARE_TUNNEL=true
        ```

4. **Configure Public Hostname:**
    - In Cloudflare Dashboard, add a **Public Hostname**:
        - Subdomain: `streambdix` (or your choice)
        - Domain: Select your domain
        - Service: `http://localhost:7001`
    - Save the tunnel

5. **Install Dependencies & Start:**

    ```bash
    npm install
    npm start
    ```

6. **Access Your Addon:**
    - Visit: `https://streambdix.yourdomain.com`
    - Add to Stremio: `https://streambdix.yourdomain.com/manifest.json`

### Running Without Tunnel:

To run locally only (no Cloudflare Tunnel):

```bash
npm run dev
# or set in .env:
ENABLE_CLOUDFLARE_TUNNEL=false
```

---

## ⚠️ Important

• Run before Stremio startup — the addon must be running to fetch streams  
• Press Ctrl+C to stop the addon

---

## 🛠️ Troubleshooting

**No streams found?**  
• Make sure the addon is running (`npx streambdix`)  
• Check if the BDIX sites are reachable  
• The content might not be available

**Streams not playing?**  
• Try a different source/quality option

---

**Made for BDIX users**

# VPS deployment — SQ-Way IMS

This repo is a Next.js 16 app with SQLite and Prisma. It runs fine on a single VPS;
no database server is required. The VPS already runs nginx on 80/443 and an existing
Node app on port 3000 (KaAyos), so IMS is deployed on **port 3005** behind its own
subdomain, coexisting with the existing system.

## Files

| File | Purpose |
|------|---------|
| `deploy/nginx/ims.conf` | nginx server block (80 → 443 redirect + HTTPS proxy to :3005) |
| `deploy/pm2/ecosystem.config.js` | PM2 process manager: `ims-prod` (:3005) + `ims-test` (:3001) |
| `deploy/systemd/ims.service` | systemd unit (use PM2 OR systemd, not both) |

## Prerequisites on the VPS

- Node.js >= 20.9.0 and npm >= 10
- `npm install -g pm2`  (or use the systemd unit instead)
- A domain pointing at the VPS (e.g. `ims.your-domain.com`)

## 1. Clone and configure the app

```bash
ssh root@srv1998322
cd /opt
git clone <repo-url> ims
cd ims
npm ci
```

Create the environment files (they are gitignored — never committed):

```bash
# generate secrets
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

cat > .env <<'EOF'
DATABASE_URL="file:./dev.db"
SESSION_SECRET="<32+ char secret>"
EOF

cat > .env.test <<'EOF'
DATABASE_URL="file:./test.db"
SESSION_SECRET="<DIFFERENT 32+ char secret>"
EOF
```

## 2. Migrate and seed

```bash
npx prisma migrate deploy
npx prisma db seed
```

This creates `staff1`, `reviewer1`, `admin1` (development-only demo accounts).

## 3. Build

```bash
npm run build        # production build
npm run build:test   # test build (NODE_ENV=test, :3001)
```

## 4. Run with PM2 (recommended)

```bash
npm install -g pm2
pm2 start deploy/pm2/ecosystem.config.js
pm2 save
pm2 startup   # run the printed sudo command to enable auto-start on boot
```

Verify:
```bash
pm2 list
pm2 logs ims-prod --lines 20
```

## 5. nginx reverse proxy

```bash
sudo cp deploy/nginx/ims.conf /etc/nginx/sites-available/ims
# edit ims.your-domain.com and cert paths in the file
sudo ln -s /etc/nginx/sites-available/ims /etc/nginx/sites-enabled/ims
sudo nginx -t
sudo systemctl reload nginx

# HTTPS certificate
sudo certbot --nginx -d ims.your-domain.com
```

## 6. Run tests against the VPS

Edit `postman/IMS.local.postman_environment.json` → set `baseUrl` to
`https://ims.your-domain.com` (prod) or `https://test.your-domain.com` (test on :3001).

Then, from a second terminal (or locally pointing at the VPS):

```bash
npm run db:test:prepare
npm run test:smoke
npm run test:api
# or: npm run test:flow   (prepare + build + start + test end to end)
```

## Notes

- SQLite is a single file (`prisma/dev.db`, `prisma/test.db`). Back it up regularly;
  it is not designed for concurrent multi-user hosting — fine for testing.
- Next.js marks the session cookie `Secure` in production, so IMS must be served over
  HTTPS (nginx + certbot above).
- Do not commit `.env` or `.env.test`. Demo accounts (`staff1/staff123`, etc.) are
  development-only — do not use them anywhere real.

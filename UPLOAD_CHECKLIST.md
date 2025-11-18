# ✅ Checklist - Šta Uploadovati na cPanel

## 📦 Fajlovi koje OBAVEZNO treba da uploaduješ:

### 1️⃣ Backend fajlovi (Root folder)
```
☐ server.js              (11.9 KB - glavni backend fajl)
☐ package.json           (dependency lista)
☐ package-lock.json      (lock file za npm)
```

### 2️⃣ Frontend Build (Kompletan `build/` folder)
```
☐ build/index.html
☐ build/asset-manifest.json
☐ build/favicon.png
☐ build/manifest.json
☐ build/robots.txt
☐ build/static/css/     (svi CSS fajlovi)
☐ build/static/js/      (svi JavaScript fajlovi)
☐ build/static/media/   (sve slike i fontovi)
```

### 3️⃣ Uploads folder
```
☐ uploads/uptimioInvoice.jpg
```

### 4️⃣ .env fajl (Kreiraš NOVI na serveru)
```
☐ .env  (popuni sa svojim podacima - vidi CPANEL_UPLOAD_INSTRUKCIJE.txt)
```

---

## ❌ Fajlove koje NE treba da uploaduješ:

```
✗ node_modules/         (Instalira se sa npm install na serveru)
✗ src/                  (Source kod - već je kompajliran u build/)
✗ public/               (Raw fajlovi - već su u build/)
✗ .git/                 (Git istorija)
✗ *.log fajlovi         (Logovi - kreiraju se automatski)
✗ tsconfig.json         (TypeScript config - potreban samo lokalno)
✗ seed.js               (Database seeding - pokrećeš samo jednom)
✗ sendTestEmail.js      (Test script)
✗ verifyUser.js         (Test script)
✗ *.backup fajlovi      (Backup verzije)
✗ restart.sh            (Lokalni script)
✗ deploy-fix.sh         (Lokalni script)
```

---

## 🎯 Brzi koraci:

1. **Lokalno:** Pokreni `npm run build` (da osiguraš da imaš najnoviji build)

2. **Upload na server:**
   - `server.js`
   - `package.json`
   - `package-lock.json`
   - Ceo `build/` folder
   - Ceo `uploads/` folder

3. **Na serveru:**
   - Kreiraj `.env` fajl sa svojim podacima
   - Pokreni `npm install` u cPanel Node.js App
   - Start/Restart aplikaciju

---

## 📊 Ukupna veličina (aprox):

- Backend fajlovi: ~50 KB
- Build folder: ~1-3 MB
- Uploads: ~100 KB
- **UKUPNO: ~3-4 MB**

---

## 🔗 Vidi detaljna uputstva u:
→ `CPANEL_UPLOAD_INSTRUKCIJE.txt`


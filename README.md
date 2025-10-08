# Uptiomio - Aplikacija za upravljanje fakturima i plaćanjima

## Opis
Uptiomio je web aplikacija za upravljanje fakturima i plaćanjima. Omogućava administratorima da kreiraju fakture za klijente, a klijentima da označavaju kada su platili fakture.

## Funkcionalnosti

### Za sve korisnike:
- Registracija i prijava
- Pregled vlastitih faktura
- Označavanje faktura kao plaćenih
- Izbor načina plaćanja (Payoneer, Western Union)

### Za administratore:
- Kreiranje novih faktura
- Pregled svih faktura
- Upravljanje klijentima

## Tehnologije
- **Frontend**: React, TypeScript, PrimeReact
- **Backend**: Node.js, Express
- **Baza podataka**: MongoDB
- **Autentifikacija**: JWT

## Pokretanje aplikacije

### Preduslovi
- Node.js (v14 ili noviji)
- npm ili yarn

### Instalacija i pokretanje

1. Instaliraj zavisnosti:
```bash
npm install
```

2. Pokreni aplikaciju (frontend + backend):
```bash
npm run dev
```

Aplikacija će biti dostupna na:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Samostalno pokretanje

**Backend server:**
```bash
npm run server
```

**Frontend:**
```bash
npm start
```

## Struktura projekta

```
uptiomio/
├── src/
│   ├── components/          # React komponente
│   │   ├── AuthContext.tsx  # Kontekst za autentifikaciju
│   │   ├── Login.tsx        # Komponenta za prijavu
│   │   ├── Register.tsx     # Komponenta za registraciju
│   │   ├── Dashboard.tsx    # Glavna komponenta
│   │   ├── InvoiceList.tsx  # Lista faktura
│   │   └── CreateInvoice.tsx # Kreiranje fakture
│   ├── services/            # API servisi
│   │   └── api.ts
│   ├── types/               # TypeScript tipovi
│   │   └── index.ts
│   ├── App.tsx              # Glavna App komponenta
│   └── index.tsx            # Entry point
├── server.js                # Express server
├── package.json
└── README.md
```

## API Endpoints

### Autentifikacija
- `POST /api/register` - Registracija korisnika
- `POST /api/login` - Prijava korisnika

### Fakture
- `GET /api/invoices` - Sve fakture (admin)
- `GET /api/my-invoices` - Korisnikove fakture
- `POST /api/invoices` - Kreiranje fakture (admin)
- `PATCH /api/invoices/:id/pay` - Označavanje kao plaćeno

### Korisnici
- `GET /api/users` - Svi korisnici (admin)

## Konfiguracija

Aplikacija koristi MongoDB Atlas bazu podataka. Konfiguracija se nalazi u `server.js` fajlu.

Za produkciju, preporučuje se:
1. Postaviti JWT_SECRET u environment varijablama
2. Konfigurisati CORS za produkciju
3. Dodati validaciju podataka
4. Implementirati rate limiting

## Korišćenje

1. **Registracija**: Kreiraj nalog kao korisnik ili administrator
2. **Prijava**: Prijavi se sa email-om i lozinkom
3. **Kreiranje faktura** (admin): Idi na "Kreiraj fakturu" tab
4. **Pregled faktura**: Fakture se prikazuju u tabeli sa opcijama za plaćanje
5. **Plaćanje**: Klikni "Označi kao plaćeno" i izaberi način plaćanja

## Napomene

- Aplikacija je kreirana za demo/testiranje
- Za produkciju je potrebno dodati dodatne sigurnosne mere
- Preporučuje se korišćenje HTTPS-a
- Implementirati backup strategiju za bazu podataka

---

## 📱 Mobilna Optimizacija

Aplikacija je **potpuno optimizovana za mobilne uređaje**! 

### Ključne Karakteristike:
- ✅ Responzivni dizajn za sve veličine ekrana
- ✅ Touch-friendly dugmići (44x44px minimum)
- ✅ Slide-in sidebar menu na mobilnom
- ✅ Horizontalno scrollovanje tabela
- ✅ Optimizovane forme za mobilne uređaje
- ✅ Nema zoom-a pri kliku na input polja (iOS)
- ✅ Smooth animacije i touch feedback

### Testiranje na Mobilnom:

**Chrome DevTools:**
```bash
1. npm start
2. Pritisni F12
3. Toggle device toolbar (Ctrl+Shift+M)
4. Izaberi mobilni uređaj
```

**Pravi Mobilni Uređaj:**
```bash
1. npm start
2. Nađi IP: hostname -I
3. Na telefonu: http://[IP]:3000
```

### Dokumentacija:
- 📖 [MOBILE_OPTIMIZATION.md](./MOBILE_OPTIMIZATION.md) - Detaljne izmene
- 📖 [MOBILE_TESTING_GUIDE.md](./MOBILE_TESTING_GUIDE.md) - Vodič za testiranje
- 📖 [MOBILE_CHANGES_SUMMARY.md](./MOBILE_CHANGES_SUMMARY.md) - Brzi pregled
- 📖 [BRZI_VODIC_MOBILNA.md](./BRZI_VODIC_MOBILNA.md) - Brzi vodič

### Browser Kompatibilnost:
- ✅ Chrome Mobile 90+
- ✅ Safari iOS 13+
- ✅ Firefox Mobile 88+
- ✅ Samsung Internet 14+

### Responsive Breakpoint-i:
- Desktop: > 768px
- Tablet/Mobile: ≤ 768px
- Small Mobile: ≤ 480px

---

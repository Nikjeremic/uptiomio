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

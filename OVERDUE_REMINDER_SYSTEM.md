# Automatski Sistem za Dnevne Podsetnike o Neplaćenim Faktura + Admin Notifikacije

## Pregled

Implementiran je automatski sistem koji svakodnevno proverava i šalje podsetnike korisnicima koji imaju 2 ili više neplaćenih faktura u poslednjih 15 dana.

## Funkcionalnosti

### 🎯 **Automatsko slanje podsetnika**
- **Kriterijumi**: Korisnici sa 2+ neplaćenih faktura kreiranih u poslednjih 15 dana
- **Frekvencija**: Svakodnevno u 9:00 AM
- **Email sadržaj**: Detaljne informacije o broju faktura, ukupnom iznosu i link za izmirenje
- **Admin notifikacija**: Automatski se šalje email admin-u kada se pošalje podsetnik

### 🔧 **Manualni podsetnici**
- **Trigger**: Admin ručno pošalje podsetnik za pojedinačnu fakturu
- **Admin notifikacija**: Automatski se šalje email admin-u kada se pošalje manualni podsetnik

### 🔑 **Reset Password**
- **Trigger**: Admin resetuje korisničku šifru
- **Email sadržaj**:
  - Korisnik dobija novu šifru
  - Admin dobija notifikaciju o resetovanju šifre

### 📧 **Email template**
- **Naslov**: "Urgent: Multiple Unpaid Invoices"
- **Sadržaj**: 
  - Broj neplaćenih faktura
  - Ukupan iznos duga
  - Datum najstarije neplaćene fakture
  - Link za pristup sistemu
  - Obaveštenje o dnevnom slanju dok se ne plati

### ⚙️ **Tehnička implementacija**

#### **Nova funkcija**: `sendDailyOverdueReminderEmail()`
```javascript
// Šalje personalizovani email sa detaljima o neplaćenim faktura
async function sendDailyOverdueReminderEmail(toEmail, clientName, overdueInvoices, logoUrl, signatureUrl)
```

#### **Glavna funkcija**: `checkAndSendOverdueReminders()`
```javascript
// Proverava sve korisnike i šalje podsetnike onima koji zadovoljavaju kriterijume
async function checkAndSendOverdueReminders()
```

#### **Cron job**: 
```javascript
// Pokreće se svakog dana u 9:00 AM
cron.schedule('0 9 * * *', async () => {
  await checkAndSendOverdueReminders();
});
```

### 🔧 **API endpoint za testiranje**
- **URL**: `POST /api/admin/trigger-overdue-reminders`
- **Autorizacija**: Samo admin korisnici
- **Svrha**: Ručno pokretanje sistema za testiranje

## Kako funkcioniše

### 1. **Dnevna provera (9:00 AM)**
```
1. Dohvata sve neplaćene fakture kreirane u poslednjih 15 dana
2. Grupiše ih po email adresi klijenta
3. Pronalazi klijente sa 2+ neplaćenih faktura
4. Za svakog klijenta šalje personalizovani email
```

### 2. **Email sadržaj**
```
- Broj neplaćenih faktura
- Ukupan iznos duga
- Datum najstarije fakture
- Link za pristup sistemu
- Upozorenje o dnevnom slanju
```

### 3. **Automatsko zaustavljanje**
- Sistem se automatski zaustavlja kada korisnik plati sve fakture
- Nema potrebe za ručnim upravljanjem

## Konfiguracija

### **Environment varijable**
```env
# Email konfiguracija (već postoji)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
MAIL_FROM=no-reply@yourdomain.com

# Frontend URL za linkove
FRONTEND_BASE_URL=https://your-frontend-url.com
```

### **Logo i potpis**
- Sistem automatski koristi logo i potpis iz UserProfile tabele
- Fallback na environment varijable ako nisu dostupni

## Testiranje

### **Ručno testiranje**
```bash
# Kroz API endpoint (samo admin)
POST /api/admin/trigger-overdue-reminders
Authorization: Bearer <admin-token>
```

### **Logovi**
```
# Uspešno slanje
Daily overdue reminder sent to client@example.com for 3 invoices

# Greške
Failed to send overdue reminder to client@example.com: Error details
```

## Prednosti sistema

### ✅ **Automatsko upravljanje**
- Nema potrebe za ručnim slanjem podsetnika
- Sistem radi 24/7 u pozadini

### ✅ **Personalizovani pristup**
- Svaki email je prilagođen specifičnom klijentu
- Sadrži tačne informacije o neplaćenim faktura

### ✅ **Fleksibilnost**
- Lako se može prilagoditi (promena vremena, kriterijuma)
- Dodavanje novih funkcionalnosti

### ✅ **Sigurnost**
- Samo admin može ručno pokretati sistem
- Svi podsetnici se loguju za audit

## Monitoring

### **Logovi za praćenje**
```javascript
// Uspešno pokretanje
Running daily overdue reminder check...
Found 5 clients with 2+ unpaid invoices

// Pošiljka po korisniku
Daily overdue reminder sent to client@example.com for 3 invoices

// Završetak
Daily overdue reminder check completed
```

### **Error handling**
- Greške se loguju ali ne zaustavljaju sistem
- Nastavlja sa sledećim korisnikom čak i ako jedan ne uspe

## Admin Notifikacije

### 📧 **Admin Email Konfiguracija**
Dodajte u `.env` fajl:
```bash
ADMIN_EMAIL=your-admin@email.com
```

### 🔔 **Tipovi Admin Notifikacija**

#### 1. **Password Reset Notification**
- **Kada**: Admin resetuje korisničku šifru
- **Sadržaj**:
  - Detalji korisnika (ime, email)
  - Datum resetovanja
  - Link za admin panel
- **Prima**: Admin email adresa

#### 2. **Manual Reminder Notification**
- **Kada**: Admin ručno pošalje podsetnik
- **Sadržaj**:
  - Detalji korisnika i fakture
  - Datum slanja podsetnika
  - Link za admin panel
- **Prima**: Admin email adresa

#### 3. **Daily Overdue Reminder Notification**
- **Kada**: Automatski sistem pošalje dnevni podsetnik
- **Sadržaj**:
  - Detalji korisnika
  - Broj neplaćenih faktura
  - Ukupan iznos
  - Datum slanja
- **Prima**: Admin email adresa

### 🎯 **Prednosti Admin Notifikacija**

✅ **Transparentnost** - Admin vidi sve akcije koje se izvršavaju  
✅ **Praćenje** - Mogućnost praćenja aktivnosti sistema  
✅ **Bezbednost** - Notifikacije o resetovanju šifara  
✅ **Kontrola** - Uvek znaš kada se šalju podsetnici  
✅ **Audit Trail** - Kompletna istorija email aktivnosti

## Buduća poboljšanja

### 🔮 **Moguća proširenja**
- Različiti email template-ovi na osnovu broja faktura
- Eskalacija (različiti podsetnici nakon određenog broja dana)
- SMS podsetnici kao dodatak email-u
- Dashboard za praćenje statusa podsetnika

### 🔮 **Konfigurabilnost**
- Admin panel za upravljanje kriterijumima
- Prilagođavanje vremena slanja
- On/off prekidač za sistem

## Bezbednost

- Sistem koristi postojeću email infrastrukturu
- Svi podaci se dohvataju iz sigurne MongoDB baze
- Admin endpoint je zaštićen JWT token-om
- Nema direktnog pristupa korisničkim lozinkama

---

**Napomena**: Sistem je dizajniran da radi nezavisno i ne zahteva dodatnu konfiguraciju osim postojeće email setup-a.

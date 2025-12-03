# 🗄️ Supabase Setup - Kompletan Vodič

## Korak 1: Kreiraj Supabase Projekat

1. Idite na [https://supabase.com](https://supabase.com)
2. Kliknite **"Start your project"** ili **"Sign in"**
3. Kliknite **"New Project"**
4. Unesite:
   - **Name**: `termin-app` (ili bilo koje ime)
   - **Database Password**: napravite jaku lozinku (SAČUVAJTE JE!)
   - **Region**: izaberite najbližu regiju
5. Kliknite **"Create new project"**
6. Sačekajte 1-2 minuta dok se projekat kreira

## Korak 2: Dobij API Credentials

1. U Supabase dashboard-u, idite na **Settings** (ikonica zupčanika) u levom meniju
2. Kliknite na **API**
3. Pronađite sekciju **Project API keys**
4. Kopirajte:
   - **Project URL** (počinje sa `https://`)
   - **anon public** key (dugačak string koji počinje sa `eyJ...`)

## Korak 3: Ažuriraj .env.local

1. Otvori `.env.local` fajl u projektu
2. Zameni placeholder vrednosti sa pravim:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
ADMIN_PASSWORD=admin123
```

## Korak 4: Kreiraj Tabelu u Bazi

### Opcija A: Nova tabela (preporučeno ako nemate podatke)

1. U Supabase dashboard-u, idite na **SQL Editor** (ikonica baze podataka)
2. Kliknite **"New query"**
3. Otvori fajl `supabase-setup.sql` iz projekta
4. Kopiraj **CEO** sadržaj fajla
5. Nalepi u SQL Editor
6. Kliknite **"Run"** (ili pritisni Ctrl+Enter)
7. Trebalo bi da vidiš poruku: "Success. No rows returned"

### Opcija B: Ažuriraj postojeću tabelu (ako već imate podatke)

1. U Supabase dashboard-u, idite na **SQL Editor**
2. Kliknite **"New query"**
3. Otvori fajl `supabase-fix-table.sql` iz projekta
4. Kopiraj **CEO** sadržaj fajla
5. Nalepi u SQL Editor
6. Kliknite **"Run"**

## Korak 5: Proveri da li je tabela kreirana

1. U Supabase dashboard-u, idite na **Table Editor** (ikonica tabele)
2. Trebalo bi da vidiš tabelu **results**
3. Klikni na nju da vidiš strukturu - trebalo bi da ima kolone:
   - `id`
   - `home_team`
   - `away_team`
   - `home_score`
   - `away_score`
   - `date`
   - `created_at`

## Korak 6: Restartuj Next.js Server

1. Zaustavi server u terminalu (Ctrl+C)
2. Pokreni ponovo:
   ```bash
   npm run dev
   ```

## Korak 7: Testiraj

1. Otvori [http://localhost:3000](http://localhost:3000)
2. Trebalo bi da vidiš glavnu stranicu bez grešaka
3. Idite na [http://localhost:3000/admin](http://localhost:3000/admin)
4. Unesite lozinku: `admin123`
5. Dodajte test rezultat
6. Vratite se na glavnu stranicu - trebalo bi da se rezultat prikaže!

## 🐛 Troubleshooting

### Greška: "column results.date does not exist"

**Rešenje**: Pokreni `supabase-setup.sql` ili `supabase-fix-table.sql` u SQL Editor-u

### Greška: "relation 'results' does not exist"

**Rešenje**: Tabela nije kreirana. Pokreni `supabase-setup.sql` u SQL Editor-u

### Greška: "permission denied for table results"

**Rešenje**: 
1. Idite na **Authentication** → **Policies** u Supabase
2. Proverite da li je RLS omogućen
3. Ako jeste, dodajte policy za javni pristup ili isključite RLS

### Greška: 503 u terminalu

**Rešenje**: Proveri da li su environment variables ispravno postavljene u `.env.local` i restartuj server

## ✅ Provera da li sve radi

U terminalu bi trebalo da vidiš:
```
GET /api/results 200 in XXms
```

Umesto:
```
GET /api/results 503 in XXms
```

---

**Napomena**: Ako imaš problema, proveri da li su sve environment variables postavljene i da li je tabela kreirana sa ispravnom strukturom.


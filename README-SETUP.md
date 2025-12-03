# Setup Uputstva - Termin App

## 🚀 Brzi Start

### 1. Instalacija Dependencies

```bash
npm install
# ili
pnpm install
```

### 2. Supabase Setup (Besplatno)

1. Idite na [https://supabase.com](https://supabase.com) i napravite besplatan nalog
2. Kliknite "New Project"
3. Unesite ime projekta i lozinku za bazu
4. Sačekajte da se projekat kreira (1-2 minuta)
5. Idite na **Settings** → **API**
6. Kopirajte:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Kreiranje Tabele u Supabase

1. U Supabase dashboard-u, idite na **SQL Editor**
2. Kliknite **New Query**
3. Kopirajte i pokrenite SQL skriptu iz `supabase-setup.sql`
4. Kliknite **Run**

### 4. Environment Variables

1. Kopirajte `.env.example` u `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Otvorite `.env.local` i unesite vaše Supabase podatke:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_ADMIN_PASSWORD=admin123
   ADMIN_PASSWORD=admin123
   ```

### 5. Pokretanje Aplikacije

```bash
npm run dev
# ili
pnpm dev
```

Otvori [http://localhost:3000](http://localhost:3000)

## 📝 Korišćenje

### Admin Panel

1. Idite na `/admin`
2. Unesite lozinku (default: `admin123`)
3. Unesite rezultate utakmica
4. Rezultati će se automatski prikazati na glavnoj stranici

### Glavna Stranica

- Prikazuje najnoviji rezultat u hero sekciji
- Lista svih rezultata ispod, grupisana po datumu

## 🌐 Hosting (Besplatno)

### Vercel (Preporučeno)

1. Push-ujte kod na GitHub
2. Idite na [https://vercel.com](https://vercel.com)
3. Kliknite "Import Project"
4. Povežite GitHub repozitorijum
5. Dodajte environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_PASSWORD`
   - `ADMIN_PASSWORD`
6. Kliknite "Deploy"

**Vercel je besplatan za Next.js projekte!**

### Alternativa: Netlify

1. Push-ujte kod na GitHub
2. Idite na [https://netlify.com](https://netlify.com)
3. Kliknite "New site from Git"
4. Povežite repozitorijum
5. Dodajte environment variables
6. Deploy!

## 🔒 Bezbednost

- Admin password je zaštita za admin panel
- Za produkciju, promenite default lozinku
- Supabase RLS (Row Level Security) je opciono - možete ga omogućiti u SQL skripti

## 📦 Struktura Projekta

```
/app
  /api/results      # API routes za rezultate
  /admin            # Admin panel
  page.tsx          # Glavna stranica
/components
  latest-result.tsx      # Hero sekcija sa najnovijim rezultatom
  results-section.tsx    # Lista svih rezultata
/lib
  supabase.ts       # Supabase klijent
```

## 🐛 Troubleshooting

**Problem:** "Missing Supabase environment variables"
- Rešenje: Proverite da li su sve environment variables postavljene u `.env.local`

**Problem:** "Failed to fetch results"
- Rešenje: Proverite da li je tabela kreirana u Supabase i da li su API keys ispravni

**Problem:** "Unauthorized" pri dodavanju rezultata
- Rešenje: Proverite da li je `ADMIN_PASSWORD` ispravno postavljen

## 📚 Resursi

- [Next.js Dokumentacija](https://nextjs.org/docs)
- [Supabase Dokumentacija](https://supabase.com/docs)
- [Vercel Dokumentacija](https://vercel.com/docs)


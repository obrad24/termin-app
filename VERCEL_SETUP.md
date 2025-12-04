# Uputstvo za povezivanje Supabase sa Vercelom

Ovaj dokument objašnjava kako da povežete Supabase bazu podataka sa vašim Vercel deploymentom.

## Korak 1: Pronađite Supabase kredencijale

1. Idite na [Supabase Dashboard](https://app.supabase.com/)
2. Izaberite vaš projekat
3. Idite na **Settings** → **API**
4. Pronađite sledeće informacije:
   - **Project URL** - ovo je vaša `SUPABASE_URL`
   - **anon/public key** - ovo je vaša `SUPABASE_ANON_KEY`

## Korak 2: Dodajte Environment Varijable na Vercelu

1. Idite na [Vercel Dashboard](https://vercel.com/dashboard)
2. Izaberite vaš projekat
3. Idite na **Settings** → **Environment Variables**
4. Dodajte sledeće varijable:

### Obavezne varijable:

| Varijabla | Opis | Primer |
|-----------|------|--------|
| `SUPABASE_URL` | URL vašeg Supabase projekta | `https://abcdefghijklmnop.supabase.co` |
| `SUPABASE_ANON_KEY` | Anon/public ključ iz Supabase Settings | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `ADMIN_PASSWORD` | Lozinka za admin panel | `vasa-sigurna-lozinka` |

### Opciono (automatski postavljeno):

| Varijabla | Opis |
|-----------|------|
| `NODE_ENV` | Automatski postavljeno na `production` na Vercelu |

## Korak 3: Konfiguracija Environment Varijabli

Za svaku varijablu:
1. Kliknite **Add New**
2. Unesite **Name** (npr. `SUPABASE_URL`)
3. Unesite **Value** (vašu stvarnu vrednost)
4. Izaberite **Environments** gde želite da se koristi:
   - ✅ **Production** (obavezno)
   - ✅ **Preview** (preporučeno, za testiranje)
   - ✅ **Development** (opciono, ako koristite Vercel CLI)

## Korak 4: Redeploy projekta

Nakon dodavanja environment varijabli:

1. Idite na **Deployments** tab
2. Kliknite na tri tačke (⋯) pored najnovijeg deployment-a
3. Izaberite **Redeploy**
4. Potvrdite redeploy

**Ili** jednostavno:
- Push-ujte novi commit na GitHub (ako imate auto-deploy)
- Ili redeploy-ujte kroz Vercel dashboard

## Korak 5: Provera

Nakon redeploy-a, proverite da li aplikacija radi:

1. Otvorite vašu Vercel URL (npr. `https://your-app.vercel.app`)
2. Proverite da li se podaci učitavaju iz Supabase baze
3. Proverite admin panel (`/admin`) sa vašom `ADMIN_PASSWORD`

## Troubleshooting

### Ako aplikacija ne radi:

1. **Proverite Environment Varijable:**
   - Idite na Vercel Dashboard → Settings → Environment Variables
   - Proverite da li su sve tri varijable dodate
   - Proverite da li su vrednosti tačne (bez razmaka, bez navodnika)

2. **Proverite Supabase kredencijale:**
   - Idite na Supabase Dashboard → Settings → API
   - Proverite da li su URL i anon key ispravni
   - Proverite da li je vaš Supabase projekat aktivan

3. **Proverite Vercel Logs:**
   - Idite na Vercel Dashboard → Deployments
   - Kliknite na najnoviji deployment
   - Proverite **Logs** tab za greške

4. **Proverite Supabase RLS (Row Level Security):**
   - Ako imate RLS omogućen, proverite da li su vaše politike ispravno konfigurisane
   - Anon key ima ograničena prava, možda će vam trebati service role key za neke operacije

## Dodatne napomene

- **Security:** Nikada ne commit-ujte `.env` fajl u Git
- **Admin Password:** Koristite jaku lozinku za `ADMIN_PASSWORD`
- **Supabase Keys:** Anon key je javan i bezbedan za frontend, ali service role key nikada ne sme biti izložen

## Lokalni razvoj

Za lokalni razvoj, kreirajte `.env.local` fajl u root direktorijumu projekta:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
ADMIN_PASSWORD=your-secure-password-here
```

Ovaj fajl će automatski biti ignorisan od strane Gita (ako je u `.gitignore`).


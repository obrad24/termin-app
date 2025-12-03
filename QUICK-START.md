# ⚡ Brzi Start - 5 Minuta

## 1️⃣ Instalacija
```bash
npm install
```

## 2️⃣ Supabase (2 minuta)
1. [supabase.com](https://supabase.com) → New Project
2. Settings → API → kopiraj URL i anon key
3. SQL Editor → pokreni `supabase-setup.sql`

## 3️⃣ Environment Variables
Napravi `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
ADMIN_PASSWORD=admin123
```

## 4️⃣ Pokreni
```bash
npm run dev
```

## 5️⃣ Testiraj
- Glavna stranica: http://localhost:3000
- Admin panel: http://localhost:3000/admin (lozinka: admin123)

## 🚀 Deploy na Vercel
1. Push na GitHub
2. [vercel.com](https://vercel.com) → Import Project
3. Dodaj environment variables
4. Deploy!

**Gotovo! 🎉**


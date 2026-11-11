# Migracija na Neon — šta ti treba da uradiš

Kod je spreman za Neon. Ti radiš samo setup projekta i connection string.

## 1) Napravi Neon projekat

1. Idi na [https://console.neon.tech](https://console.neon.tech)
2. **Sign up / Log in**
3. **Create project**
   - Name: npr. `termin`
   - Region: biraj bližu (npr. Frankfurt / EU)
4. Sačekaj da se projekat kreira

## 2) Kopiraj connection string

1. U Neon projektu otvori **Dashboard → Connection Details**
2. Izaberi:
   - **Database**: `neondb` (default)
   - **Role**: default
   - **Connection**: **Pooled connection** (preporučeno za Next.js)
3. Kopiraj connection string tipa:

```text
postgresql://USER:PASSWORD@ep-xxxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

## 3) Ubaci u lokalni `.env.local`

U root foldera projekta (`termin/.env.local`) stavi:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
ADMIN_PASSWORD=tvoja-admin-lozinka
```

Stare `NEXT_PUBLIC_SUPABASE_*` više nisu potrebne.

## 4) Pokreni SQL schema

1. U Neon konzoli otvori **SQL Editor**
2. Otvori fajl iz projekta: `neon-schema.sql`
3. Kopiraj **cijeli** sadržaj
4. Run / Execute

Ovo kreira sve tabele:
- seasons, teams, players, results
- match_goals, match_players
- season_teams, player_season_teams
- next_match, next_match_players
- match_player_ratings, match_comments, match_comment_likes
- termin_news

## 5) (Opciono) Dodaj početne klubove

Ako želiš odmah Murinjo/Lalat u Sezoni 1:

```sql
INSERT INTO teams (name, short_name)
VALUES ('Murinjo', 'MUR'), ('Lalat', 'LAL')
ON CONFLICT (name) DO NOTHING;

INSERT INTO season_teams (season_id, team_id)
SELECT s.id, t.id
FROM seasons s
CROSS JOIN teams t
WHERE s.name = 'Sezona 1'
ON CONFLICT (season_id, team_id) DO NOTHING;
```

## 6) Restart app

```bash
npm run dev
```

Provjeri:
- `/admin` login
- dodaj sezonu / tim / igrača
- dodaj utakmicu

## 7) Vercel (produkcija)

U Vercel projektu → Settings → Environment Variables dodaj:
- `DATABASE_URL` = isti Neon pooled string
- `ADMIN_PASSWORD` = admin lozinka

Zatim Redeploy.

---

## Napomene

- **Slike** se sada snimaju lokalno u `public/uploads/` (ne više Supabase Storage).
- Stari Supabase host više nije potreban.
- Ako imaš stari export/backup podataka, mogu ti pomoći da ih importujemo u Neon.

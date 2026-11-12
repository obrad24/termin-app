-- Captain for fantasy user squads (points ×2 for that GW)
ALTER TABLE fantasy_user_squads
  ADD COLUMN IF NOT EXISTS captain_player_id BIGINT REFERENCES players(id) ON DELETE SET NULL;

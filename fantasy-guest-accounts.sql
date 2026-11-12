-- Allow fantasy accounts without a linked football player
ALTER TABLE player_accounts
  ALTER COLUMN player_id DROP NOT NULL;

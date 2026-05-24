-- MediTwin: Initial schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Profiles ───────────────────────────────────────────────────────────────
-- Extends auth.users (Supabase built-in). One row per user, created automatically
-- via the trigger below when a user signs up.

CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT,
  age            INTEGER,
  sex            TEXT,
  goals          TEXT[],
  sleep_hours    REAL    DEFAULT 7,
  exercise_freq  INTEGER DEFAULT 3,
  stress         INTEGER DEFAULT 5,
  diet           INTEGER DEFAULT 5,
  family_history TEXT[],
  wearable       TEXT    DEFAULT 'None',
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── Auto-create profile on sign-up ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Row-level security ──────────────────────────────────────────────────────
-- Users can only read and write their own profile row.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile" ON profiles;
CREATE POLICY "own profile" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── Keep updated_at current on every write ──────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

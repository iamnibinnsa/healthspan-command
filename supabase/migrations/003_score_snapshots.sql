-- MediTwin: Module 3 (unified server-side scoring)
-- Stores one row per scoring computation so latest/history endpoints
-- can return real persisted snapshots instead of in-memory state.

CREATE TABLE IF NOT EXISTS score_snapshots (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_id     TEXT UNIQUE NOT NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score   INTEGER NOT NULL,
  bio_age_gap     REAL NOT NULL,
  domain_scores   JSONB NOT NULL,
  bottlenecks     JSONB NOT NULL,
  interventions   TEXT[] DEFAULT '{}',
  intake          JSONB,
  biomarkers      JSONB,
  input_hash      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_score_snapshots_user_created
  ON score_snapshots (user_id, created_at DESC);

ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own score snapshots read" ON score_snapshots;
CREATE POLICY "own score snapshots read" ON score_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own score snapshots write" ON score_snapshots;
CREATE POLICY "own score snapshots write" ON score_snapshots
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

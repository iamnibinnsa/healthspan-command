-- MediTwin: Module 2 (lab parsing records)
-- Stores structured parse outputs for latest/history views.

CREATE TABLE IF NOT EXISTS lab_reports (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id            TEXT UNIQUE NOT NULL,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name            TEXT NOT NULL,
  extracted_characters INTEGER,
  used_fallback        BOOLEAN DEFAULT FALSE,
  parsed_payload       JSONB NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_user_created
  ON lab_reports (user_id, created_at DESC);

ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own lab reports read" ON lab_reports;
CREATE POLICY "own lab reports read" ON lab_reports
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own lab reports write" ON lab_reports;
CREATE POLICY "own lab reports write" ON lab_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON TABLE lab_reports TO authenticated;

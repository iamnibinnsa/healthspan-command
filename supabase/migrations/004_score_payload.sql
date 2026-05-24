-- Module 3: store full LLM/fallback score JSON for teammate parse contract.

ALTER TABLE score_snapshots
  ADD COLUMN IF NOT EXISTS score_payload JSONB,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'fallback';

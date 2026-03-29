-- ══════════════════════════════════════════════════════
-- HireSignal database schema
-- ══════════════════════════════════════════════════════

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name       TEXT,
  avatar_url      TEXT,
  target_roles    TEXT[]    DEFAULT '{}',
  target_locations TEXT[]   DEFAULT '{}',
  target_industries TEXT[]  DEFAULT '{}',
  base_resume     TEXT,         -- raw text of their resume
  llm_provider    TEXT         DEFAULT 'openai' CHECK (llm_provider IN ('openai','anthropic','gemini')),
  llm_api_key     TEXT,         -- stored encrypted; user-supplied
  google_tokens   JSONB,        -- OAuth tokens for Drive
  expo_push_token TEXT,         -- for mobile push notifications
  watchlist       TEXT[]    DEFAULT '{}', -- companies to watch for signals
  email_digest    BOOLEAN   DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-posting hiring signals (the novel feature)
CREATE TABLE IF NOT EXISTS signals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company       TEXT NOT NULL,
  signal_type   TEXT NOT NULL CHECK (signal_type IN (
                  'funding_round','headcount_growth','github_spike',
                  'glassdoor_review','exec_hire','product_launch')),
  signal_score  INTEGER NOT NULL CHECK (signal_score BETWEEN 0 AND 100),
  headline      TEXT,
  source_url    TEXT,
  raw_data      JSONB,
  detected_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT signals_company_signal_type_headline_key
    UNIQUE (company, signal_type, headline)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'signals_company_signal_type_headline_key'
  ) THEN
    DELETE FROM signals s
    USING (
      SELECT id
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY company, signal_type, headline
            ORDER BY detected_at DESC NULLS LAST, id DESC
          ) AS rn
        FROM signals
      ) ranked
      WHERE ranked.rn > 1
    ) duplicates
    WHERE s.id = duplicates.id;

    ALTER TABLE signals
    ADD CONSTRAINT signals_company_signal_type_headline_key
    UNIQUE (company, signal_type, headline);
  END IF;
END $$;

-- Scraped job listings
CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  company       TEXT NOT NULL,
  location      TEXT,
  remote        BOOLEAN DEFAULT false,
  description   TEXT,
  salary_min    INTEGER,
  salary_max    INTEGER,
  url           TEXT UNIQUE NOT NULL,
  source        TEXT NOT NULL,  -- 'linkedin' | 'indeed' | 'greenhouse' | 'lever'
  posted_at     TIMESTAMPTZ,
  signal_id     UUID REFERENCES signals(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Per-user application pipeline
CREATE TABLE IF NOT EXISTS user_jobs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_id                UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  status                TEXT DEFAULT 'saved' CHECK (status IN (
                          'saved','applied','interviewing','offer','rejected','withdrawn')),
  tailored_resume_text  TEXT,
  tailored_resume_url   TEXT,  -- Google Doc URL
  outreach_draft        TEXT,  -- hiring manager DM
  response_probability  INTEGER CHECK (response_probability BETWEEN 0 AND 100),
  notes                 TEXT,
  applied_at            TIMESTAMPTZ,
  next_follow_up        DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Hiring manager contacts found via LinkedIn search
CREATE TABLE IF NOT EXISTS hiring_managers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID REFERENCES jobs(id) ON DELETE CASCADE,
  name        TEXT,
  title       TEXT,
  linkedin_url TEXT,
  company     TEXT,
  found_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, linkedin_url)  -- dedup per job
);

-- ══════════════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════════════
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_jobs        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_profile" ON profiles;
CREATE POLICY "users_own_profile"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_own_jobs" ON user_jobs;
CREATE POLICY "users_own_jobs"
  ON user_jobs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Signals and jobs are public-read (all users see all signals)
DROP POLICY IF EXISTS "signals_public_read" ON signals;
CREATE POLICY "signals_public_read"  ON signals  FOR SELECT USING (true);

DROP POLICY IF EXISTS "jobs_public_read" ON jobs;
CREATE POLICY "jobs_public_read"     ON jobs     FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════
-- Auto-update updated_at
-- ══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_user_jobs_updated_at ON user_jobs;
CREATE TRIGGER trg_user_jobs_updated_at
  BEFORE UPDATE ON user_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════
-- Indexes
-- ══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_jobs_company         ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at       ON jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_company      ON signals(company);
CREATE INDEX IF NOT EXISTS idx_signals_score        ON signals(signal_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_jobs_status     ON user_jobs(status);
CREATE INDEX IF NOT EXISTS idx_user_jobs_user_id    ON user_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_hiring_managers_job_id ON hiring_managers(job_id);

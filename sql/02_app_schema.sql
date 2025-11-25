-- ============================================================================
-- PROMPT 10: Product Shell (Accounts + Persistence)
-- App schema for profiles, projects, and sessions
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Create index for faster owner queries
CREATE INDEX IF NOT EXISTS projects_owner_id_idx ON public.projects(owner_id);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- SESSIONS TABLE (Creative Sessions, not Auth Sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_text TEXT NOT NULL,

  -- Agent outputs stored as JSONB
  insight JSONB,
  story JSONB,
  prototype JSONB,
  symbol JSONB,
  consistency JSONB,
  ssic JSONB, -- SSIC state (optional, debug mode only)

  -- Metadata
  total_duration INTEGER, -- milliseconds
  preprocessing JSONB -- quotes, pronoun, keywords
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS sessions_project_id_idx ON public.sessions(project_id);
CREATE INDEX IF NOT EXISTS sessions_owner_id_idx ON public.sessions(owner_id);
CREATE INDEX IF NOT EXISTS sessions_created_at_idx ON public.sessions(created_at DESC);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions"
  ON public.sessions
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own sessions"
  ON public.sessions
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.sessions
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles - one per auth user';
COMMENT ON TABLE public.projects IS 'Creative projects - containers for sessions';
COMMENT ON TABLE public.sessions IS 'Creative acceleration sessions - full agent outputs';

COMMENT ON COLUMN public.sessions.user_text IS 'Original user input describing creative challenge';
COMMENT ON COLUMN public.sessions.insight IS 'Insight Agent output (emotional analysis)';
COMMENT ON COLUMN public.sessions.story IS 'Story Agent output (narrative structure)';
COMMENT ON COLUMN public.sessions.prototype IS 'Prototype Agent output (5-day sprint)';
COMMENT ON COLUMN public.sessions.symbol IS 'Symbol Agent output (visual language)';
COMMENT ON COLUMN public.sessions.consistency IS 'Cross-agent consistency check results';
COMMENT ON COLUMN public.sessions.ssic IS 'SSIC physics state (optional, debug mode)';

-- =====================================================
-- CV-Optima Row Level Security (RLS) Policies
-- Migration: 002_rls_policies
-- Description: Enable RLS and create policies for user-scoped data access
-- =====================================================

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
-- Enable RLS on all tables to enforce access control

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================
-- Users can only access their own profile (id = auth.uid())

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile (optional, usually handled by auth.users cascade)
CREATE POLICY "Users can delete own profile"
ON profiles
FOR DELETE
USING (auth.uid() = id);

-- =====================================================
-- RESUMES TABLE POLICIES
-- =====================================================
-- Users can only access resumes they own (user_id = auth.uid())

-- Policy: Users can view their own resumes
CREATE POLICY "Users can view own resumes"
ON resumes
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own resumes
CREATE POLICY "Users can insert own resumes"
ON resumes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own resumes
CREATE POLICY "Users can update own resumes"
ON resumes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON resumes
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- ANALYSES TABLE POLICIES
-- =====================================================
-- Users can only access analyses for their own resumes
-- This requires a join to the resumes table to check ownership

-- Policy: Users can view analyses for their own resumes
CREATE POLICY "Users can view own analyses"
ON analyses
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM resumes
        WHERE resumes.id = analyses.resume_id
        AND resumes.user_id = auth.uid()
    )
);

-- Policy: Users can insert analyses for their own resumes
CREATE POLICY "Users can insert own analyses"
ON analyses
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM resumes
        WHERE resumes.id = analyses.resume_id
        AND resumes.user_id = auth.uid()
    )
);

-- Policy: Users can update analyses for their own resumes
CREATE POLICY "Users can update own analyses"
ON analyses
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM resumes
        WHERE resumes.id = analyses.resume_id
        AND resumes.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM resumes
        WHERE resumes.id = analyses.resume_id
        AND resumes.user_id = auth.uid()
    )
);

-- Policy: Users can delete analyses for their own resumes
CREATE POLICY "Users can delete own analyses"
ON analyses
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM resumes
        WHERE resumes.id = analyses.resume_id
        AND resumes.user_id = auth.uid()
    )
);

-- =====================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================
-- Automatically create a profile when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, credits)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        5  -- Default 5 free credits
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- HELPER FUNCTION: Check if user owns resume
-- =====================================================
-- Reusable function to check resume ownership

CREATE OR REPLACE FUNCTION public.user_owns_resume(resume_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM resumes
        WHERE id = resume_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Get user's remaining credits
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_credits()
RETURNS INTEGER AS $$
DECLARE
    user_credits INTEGER;
BEGIN
    SELECT credits INTO user_credits
    FROM profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Deduct credits (for future use)
-- =====================================================

CREATE OR REPLACE FUNCTION public.deduct_credits(amount INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT credits INTO current_credits
    FROM profiles
    WHERE id = auth.uid();
    
    -- Check if user has enough credits
    IF current_credits IS NULL OR current_credits < amount THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits
    UPDATE profiles
    SET credits = credits - amount
    WHERE id = auth.uid();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view own profile" ON profiles IS 
'Allows users to view only their own profile data';

COMMENT ON POLICY "Users can view own resumes" ON resumes IS 
'Allows users to view only resumes they uploaded';

COMMENT ON POLICY "Users can view own analyses" ON analyses IS 
'Allows users to view only analyses for their own resumes via join';

COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates a profile with 5 free credits when a new user signs up';

COMMENT ON FUNCTION public.user_owns_resume(UUID) IS 
'Helper function to check if the current user owns a specific resume';

COMMENT ON FUNCTION public.get_user_credits() IS 
'Returns the number of remaining credits for the current user';

COMMENT ON FUNCTION public.deduct_credits(INTEGER) IS 
'Deducts credits from the current user. Returns FALSE if insufficient credits';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment these to verify RLS policies were created:

-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public';

-- SELECT * FROM profiles WHERE id = auth.uid();

-- Six Elements of Life Framework - Direct Table Creation
-- Run this SQL directly in Supabase SQL Editor or via psql

-- Create six_elements_frameworks table
CREATE TABLE IF NOT EXISTS public.six_elements_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create element_allocations table
CREATE TABLE IF NOT EXISTS public.element_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES public.six_elements_frameworks(id) ON DELETE CASCADE,
    element_name TEXT NOT NULL CHECK (element_name IN ('Work', 'Sleep', 'Friends & Family', 'Health & Fitness', 'Personal Development', 'Spiritual')),
    importance_level INTEGER NOT NULL CHECK (importance_level >= 1 AND importance_level <= 10),
    current_hours_per_week DECIMAL(4,1) NOT NULL DEFAULT 0,
    ideal_hours_per_week DECIMAL(4,1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work_happiness_assessment table
CREATE TABLE IF NOT EXISTS public.work_happiness_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES public.six_elements_frameworks(id) ON DELETE CASCADE,
    impact_current INTEGER NOT NULL CHECK (impact_current >= 1 AND impact_current <= 10),
    impact_desired INTEGER NOT NULL CHECK (impact_desired >= 1 AND impact_desired <= 10),
    enjoyment_current INTEGER NOT NULL CHECK (enjoyment_current >= 1 AND enjoyment_current <= 10),
    enjoyment_desired INTEGER NOT NULL CHECK (enjoyment_desired >= 1 AND enjoyment_desired <= 10),
    income_current INTEGER NOT NULL CHECK (income_current >= 1 AND income_current <= 10),
    income_desired INTEGER NOT NULL CHECK (income_desired >= 1 AND income_desired <= 10),
    remote_current INTEGER NOT NULL CHECK (remote_current >= 1 AND remote_current <= 10),
    remote_desired INTEGER NOT NULL CHECK (remote_desired >= 1 AND remote_desired <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_six_elements_frameworks_user_email ON public.six_elements_frameworks(user_email);
CREATE INDEX IF NOT EXISTS idx_element_allocations_framework_id ON public.element_allocations(framework_id);
CREATE INDEX IF NOT EXISTS idx_element_allocations_element_name ON public.element_allocations(element_name);
CREATE INDEX IF NOT EXISTS idx_work_happiness_framework_id ON public.work_happiness_assessment(framework_id);

-- Enable Row Level Security
ALTER TABLE public.six_elements_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.element_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_happiness_assessment ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
DROP POLICY IF EXISTS "Enable service role full access" ON public.six_elements_frameworks;
CREATE POLICY "Enable service role full access" ON public.six_elements_frameworks FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable service role full access" ON public.element_allocations;
CREATE POLICY "Enable service role full access" ON public.element_allocations FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable service role full access" ON public.work_happiness_assessment;
CREATE POLICY "Enable service role full access" ON public.work_happiness_assessment FOR ALL USING (true);

-- Verify tables were created
SELECT 'six_elements_frameworks' as table_name, count(*) as row_count FROM public.six_elements_frameworks
UNION ALL
SELECT 'element_allocations' as table_name, count(*) as row_count FROM public.element_allocations  
UNION ALL
SELECT 'work_happiness_assessment' as table_name, count(*) as row_count FROM public.work_happiness_assessment;
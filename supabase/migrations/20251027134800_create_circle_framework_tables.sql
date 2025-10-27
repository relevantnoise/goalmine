-- Create tables for 5 Circle Framework data capture
-- Table 1: Main framework record with time context
CREATE TABLE IF NOT EXISTS public.user_circle_frameworks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    work_hours_per_week INTEGER NOT NULL,
    sleep_hours_per_night DECIMAL(3,1) NOT NULL,
    commute_hours_per_week INTEGER NOT NULL,
    available_hours_per_week INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Circle allocations (one record per circle per framework)
CREATE TABLE IF NOT EXISTS public.circle_time_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    framework_id UUID NOT NULL REFERENCES public.user_circle_frameworks(id) ON DELETE CASCADE,
    circle_name TEXT NOT NULL,
    importance_level INTEGER NOT NULL CHECK (importance_level >= 1 AND importance_level <= 10),
    current_hours_per_week INTEGER NOT NULL,
    ideal_hours_per_week INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: Work happiness metrics
CREATE TABLE IF NOT EXISTS public.work_happiness_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    framework_id UUID NOT NULL REFERENCES public.user_circle_frameworks(id) ON DELETE CASCADE,
    impact_current INTEGER NOT NULL CHECK (impact_current >= 1 AND impact_current <= 10),
    impact_desired INTEGER NOT NULL CHECK (impact_desired >= 1 AND impact_desired <= 10),
    fun_current INTEGER NOT NULL CHECK (fun_current >= 1 AND fun_current <= 10),
    fun_desired INTEGER NOT NULL CHECK (fun_desired >= 1 AND fun_desired <= 10),
    money_current INTEGER NOT NULL CHECK (money_current >= 1 AND money_current <= 10),
    money_desired INTEGER NOT NULL CHECK (money_desired >= 1 AND money_desired <= 10),
    remote_current INTEGER NOT NULL CHECK (remote_current >= 1 AND remote_current <= 10),
    remote_desired INTEGER NOT NULL CHECK (remote_desired >= 1 AND remote_desired <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_circle_frameworks_email ON public.user_circle_frameworks(user_email);
CREATE INDEX IF NOT EXISTS idx_circle_allocations_framework ON public.circle_time_allocations(framework_id);
CREATE INDEX IF NOT EXISTS idx_work_happiness_framework ON public.work_happiness_metrics(framework_id);
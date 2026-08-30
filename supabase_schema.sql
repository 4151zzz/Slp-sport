-- ============================================================
-- 🏆 ระบบยืมอุปกรณ์กีฬา โรงเรียนสระหลวงพิทยาคม
-- SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ============================================================

-- 1. ตารางอุปกรณ์กีฬา (Equipment)
CREATE TABLE IF NOT EXISTS public.equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    total_qty INTEGER NOT NULL DEFAULT 1,
    available_qty INTEGER NOT NULL DEFAULT 1,
    image TEXT,
    barcode TEXT UNIQUE,
    condition TEXT DEFAULT 'good',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ตารางผู้ยืม (Borrowers)
CREATE TABLE IF NOT EXISTS public.borrowers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    room TEXT NOT NULL,
    phone TEXT,
    line_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ตารางการยืม-คืน (Loans)
CREATE TABLE IF NOT EXISTS public.loans (
    id TEXT PRIMARY KEY,
    borrower_id TEXT NOT NULL,
    borrower_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    room TEXT NOT NULL,
    phone TEXT,
    line_id TEXT,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_image TEXT,
    item_barcode TEXT,
    borrow_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    return_due TIMESTAMP WITH TIME ZONE,
    return_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'returned', 'overdue'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ตารางติดตามและส่งต่อสิทธิ์ (Followups)
CREATE TABLE IF NOT EXISTS public.followups (
    id TEXT PRIMARY KEY,
    loan_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'transfer', 'issue', 'reminder'
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (Allow Public Read & Write for School Terminal / Kiosk)
CREATE POLICY "Public Read Equipment" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Public Write Equipment" ON public.equipment FOR ALL USING (true);

CREATE POLICY "Public Read Borrowers" ON public.borrowers FOR SELECT USING (true);
CREATE POLICY "Public Write Borrowers" ON public.borrowers FOR ALL USING (true);

CREATE POLICY "Public Read Loans" ON public.loans FOR SELECT USING (true);
CREATE POLICY "Public Write Loans" ON public.loans FOR ALL USING (true);

CREATE POLICY "Public Read Followups" ON public.followups FOR SELECT USING (true);
CREATE POLICY "Public Write Followups" ON public.followups FOR ALL USING (true);

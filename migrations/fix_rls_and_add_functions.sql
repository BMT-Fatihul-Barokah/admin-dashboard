-- SQL Migration to fix RLS policies and add necessary functions
-- Run this in the Supabase SQL Editor to fix the Excel import functionality

-- 1. Create the update_anggota_balance function (bypasses RLS)
CREATE OR REPLACE FUNCTION update_anggota_balance(p_nomor_rekening TEXT, p_saldo NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE anggota
    SET 
        saldo = p_saldo,
        updated_at = NOW()
    WHERE 
        nomor_rekening = p_nomor_rekening;
        
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER; -- This will run with the privileges of the function creator

-- 2. Create the import_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS import_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    count INTEGER NOT NULL,
    status TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT
);

-- 3. Fix RLS policies for anggota table to allow updates
-- First, let's see what policies exist
SELECT * FROM pg_policies WHERE tablename = 'anggota';

-- Create a policy that allows updates to the anggota table
CREATE POLICY anggota_update_policy 
ON anggota 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE import_history TO anon, authenticated;
GRANT ALL ON TABLE anggota TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_anggota_balance(TEXT, NUMERIC) TO anon, authenticated;

-- 5. Add comments for documentation
COMMENT ON FUNCTION update_anggota_balance IS 'Updates the balance of an anggota by nomor_rekening, bypassing RLS policies';
COMMENT ON TABLE import_history IS 'Tracks history of Excel imports';

-- 6. Test the function with a sample update
-- Replace with an actual account number from your database
SELECT update_anggota_balance('02.1.0006', 123456789);

-- 7. Verify the update worked
SELECT nomor_rekening, saldo FROM anggota WHERE nomor_rekening = '02.1.0006';

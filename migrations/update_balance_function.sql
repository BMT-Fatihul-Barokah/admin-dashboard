-- Migration to create a function for updating anggota balance
-- This function will bypass RLS policies and allow direct balance updates

-- Create the function to update anggota balance
CREATE OR REPLACE FUNCTION update_anggota_balance(p_nomor_rekening TEXT, p_saldo NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE anggota
    SET 
        saldo = p_saldo,
        updated_at = NOW()
    WHERE 
        nomor_rekening = p_nomor_rekening;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER; -- This will run with the privileges of the function creator

-- Create the import_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS import_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    count INTEGER NOT NULL,
    status TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user TEXT
);

-- Grant access to the anon role
GRANT EXECUTE ON FUNCTION update_anggota_balance(TEXT, NUMERIC) TO anon;
GRANT ALL ON TABLE import_history TO anon;

-- Comment on the function
COMMENT ON FUNCTION update_anggota_balance IS 'Updates the balance of an anggota by nomor_rekening, bypassing RLS policies';

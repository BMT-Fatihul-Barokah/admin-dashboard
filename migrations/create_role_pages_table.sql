-- Create admin_role_pages table for managing page access permissions

CREATE TABLE IF NOT EXISTS admin_role_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    page_path VARCHAR(255) NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    page_description TEXT,
    is_accessible BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
    UNIQUE(role_id, page_path)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_role_pages_role_id ON admin_role_pages(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_pages_page_path ON admin_role_pages(page_path);
CREATE INDEX IF NOT EXISTS idx_admin_role_pages_is_accessible ON admin_role_pages(is_accessible);

-- Insert default page access for existing roles if they exist
-- This will run only if the roles exist
DO $$
DECLARE
    role_record RECORD;
    available_pages JSON[] := ARRAY[
        '{"path": "/dashboard", "name": "Dashboard", "description": "Halaman utama dashboard"}',
        '{"path": "/users", "name": "Kelola Anggota", "description": "Mengelola data anggota koperasi"}',
        '{"path": "/transactions", "name": "Transaksi", "description": "Melihat dan mengelola transaksi"}',
        '{"path": "/loans", "name": "Pinjaman", "description": "Mengelola data pinjaman"}',
        '{"path": "/loan-approvals", "name": "Persetujuan Pinjaman", "description": "Menyetujui atau menolak pinjaman"}',
        '{"path": "/reports", "name": "Laporan", "description": "Membuat dan melihat laporan"}',
        '{"path": "/analytics", "name": "Analitik", "description": "Melihat data analitik"}',
        '{"path": "/notifications", "name": "Notifikasi", "description": "Mengelola notifikasi"}',
        '{"path": "/import", "name": "Import Data", "description": "Import data dari file Excel"}',
        '{"path": "/role-management", "name": "Kelola Peran", "description": "Mengelola peran dan hak akses"}',
        '{"path": "/akun", "name": "Kelola Akun", "description": "Mengelola akun login anggota"}',
        '{"path": "/profile", "name": "Profil", "description": "Pengaturan profil admin"}'
    ];
    page_json JSON;
BEGIN
    -- Loop through all existing roles
    FOR role_record IN SELECT id, name FROM admin_roles LOOP
        -- Loop through all available pages
        FOREACH page_json IN ARRAY available_pages LOOP
            -- Insert page access record if not exists
            INSERT INTO admin_role_pages (role_id, page_path, page_name, page_description, is_accessible)
            VALUES (
                role_record.id,
                page_json->>'path',
                page_json->>'name',
                page_json->>'description',
                CASE 
                    WHEN role_record.name = 'admin' THEN true  -- Admin gets all access
                    WHEN role_record.name = 'ketua' AND page_json->>'path' IN ('/dashboard', '/reports') THEN true
                    WHEN role_record.name = 'sekretaris' AND page_json->>'path' IN ('/dashboard', '/users', '/notifications') THEN true
                    WHEN role_record.name = 'bendahara' AND page_json->>'path' IN ('/dashboard', '/transactions', '/loans') THEN true
                    ELSE false
                END
            )
            ON CONFLICT (role_id, page_path) DO NOTHING;  -- Skip if already exists
        END LOOP;
    END LOOP;
END $$; 
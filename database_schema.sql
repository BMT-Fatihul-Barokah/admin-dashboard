-- PostgreSQL DDL for Koperasi Fatihul Barokah Database
-- Generated on 2025-06-15

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS transaksi_notifikasi;
DROP TABLE IF EXISTS global_notifikasi_read;
DROP TABLE IF EXISTS transaksi;
DROP TABLE IF EXISTS tabungan;
DROP TABLE IF EXISTS pembiayaan;
DROP TABLE IF EXISTS akun;
DROP TABLE IF EXISTS global_notifikasi;
DROP TABLE IF EXISTS jenis_notifikasi;
DROP TABLE IF EXISTS jenis_tabungan;
DROP TABLE IF EXISTS jenis_pembiayaan;
DROP TABLE IF EXISTS anggota;
DROP TABLE IF EXISTS admin_sessions;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS admin_role_permissions;
DROP TABLE IF EXISTS admin_roles;
DROP TABLE IF EXISTS admin_permissions;

-- Create tables

-- Admin Permissions
CREATE TABLE admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin Roles
CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin Role Permissions
CREATE TABLE admin_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE
);

-- Admin Users
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE SET NULL
);

-- Admin Sessions
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Anggota (Members)
CREATE TABLE anggota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    nomor_anggota VARCHAR(50),
    alamat TEXT,
    nomor_telepon VARCHAR(20),
    email VARCHAR(255),
    tanggal_bergabung DATE,
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    nomor_rekening VARCHAR(50),
    nik VARCHAR(20),
    tanggal_lahir DATE,
    tempat_lahir VARCHAR(100),
    jenis_kelamin VARCHAR(20),
    pekerjaan VARCHAR(100),
    foto_url TEXT
);

-- Jenis Pembiayaan (Loan Types)
CREATE TABLE jenis_pembiayaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Jenis Tabungan (Savings Types)
CREATE TABLE jenis_tabungan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Jenis Notifikasi (Notification Types)
CREATE TABLE jenis_notifikasi (
    kode TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Global Notifikasi (Global Notifications)
CREATE TABLE global_notifikasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    pesan TEXT NOT NULL,
    jenis TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Akun (Accounts)
CREATE TABLE akun (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_telepon VARCHAR(20) NOT NULL,
    pin VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    anggota_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE
);

-- Pembiayaan (Loans/Financing)
CREATE TABLE pembiayaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anggota_id UUID NOT NULL,
    jenis_pembiayaan_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    jumlah NUMERIC NOT NULL,
    jatuh_tempo DATE,
    total_pembayaran NUMERIC,
    sisa_pembayaran NUMERIC,
    jangka_waktu INTEGER,
    sisa_bulan INTEGER,
    deskripsi TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE,
    FOREIGN KEY (jenis_pembiayaan_id) REFERENCES jenis_pembiayaan(id) ON DELETE RESTRICT,
    CONSTRAINT check_pembiayaan_status CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'defaulted'))
);

-- Tabungan (Savings)
CREATE TABLE tabungan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anggota_id UUID NOT NULL,
    jenis_tabungan_id UUID NOT NULL,
    saldo NUMERIC DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE,
    FOREIGN KEY (jenis_tabungan_id) REFERENCES jenis_tabungan(id) ON DELETE RESTRICT,
    CONSTRAINT check_tabungan_status CHECK (status IN ('active', 'inactive', 'closed'))
);

-- Transaksi (Transactions)
CREATE TABLE transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anggota_id UUID,
    tabungan_id UUID,
    pembiayaan_id UUID,
    jumlah NUMERIC NOT NULL,
    jenis VARCHAR(50) NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    source_type VARCHAR,
    FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE,
    FOREIGN KEY (tabungan_id) REFERENCES tabungan(id) ON DELETE SET NULL,
    FOREIGN KEY (pembiayaan_id) REFERENCES pembiayaan(id) ON DELETE SET NULL,
    CONSTRAINT check_jenis CHECK (jenis IN ('masuk', 'keluar')),
    CONSTRAINT check_source_type CHECK (source_type IN ('tabungan', 'pembiayaan', 'lainnya'))
);

-- Global Notifikasi Read (Read Global Notifications)
CREATE TABLE global_notifikasi_read (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    global_notifikasi_id UUID NOT NULL,
    anggota_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (global_notifikasi_id) REFERENCES global_notifikasi(id) ON DELETE CASCADE,
    FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE
);

-- Transaksi Notifikasi (Transaction Notifications)
CREATE TABLE transaksi_notifikasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    pesan TEXT NOT NULL,
    jenis TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    transaksi_id UUID,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_anggota_nomor_anggota ON anggota(nomor_anggota);
CREATE INDEX idx_anggota_nomor_rekening ON anggota(nomor_rekening);
CREATE INDEX idx_akun_nomor_telepon ON akun(nomor_telepon);
CREATE INDEX idx_akun_anggota_id ON akun(anggota_id);
CREATE INDEX idx_pembiayaan_anggota_id ON pembiayaan(anggota_id);
CREATE INDEX idx_pembiayaan_jenis_pembiayaan_id ON pembiayaan(jenis_pembiayaan_id);
CREATE INDEX idx_pembiayaan_status ON pembiayaan(status);
CREATE INDEX idx_tabungan_anggota_id ON tabungan(anggota_id);
CREATE INDEX idx_tabungan_jenis_tabungan_id ON tabungan(jenis_tabungan_id);
CREATE INDEX idx_transaksi_anggota_id ON transaksi(anggota_id);
CREATE INDEX idx_transaksi_tabungan_id ON transaksi(tabungan_id);
CREATE INDEX idx_transaksi_pembiayaan_id ON transaksi(pembiayaan_id);
CREATE INDEX idx_transaksi_jenis ON transaksi(jenis);
CREATE INDEX idx_transaksi_created_at ON transaksi(created_at);
CREATE INDEX idx_transaksi_notifikasi_transaksi_id ON transaksi_notifikasi(transaksi_id);

-- Create helper functions

-- Function to create a transaction for a savings account
CREATE OR REPLACE FUNCTION create_tabungan_transaction(
    p_anggota_id UUID,
    p_tabungan_id UUID,
    p_jumlah NUMERIC,
    p_jenis VARCHAR,
    p_deskripsi TEXT
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    -- Insert transaction
    INSERT INTO transaksi (
        anggota_id,
        tabungan_id,
        jumlah,
        jenis,
        deskripsi,
        source_type
    ) VALUES (
        p_anggota_id,
        p_tabungan_id,
        p_jumlah,
        p_jenis,
        p_deskripsi,
        'tabungan'
    ) RETURNING id INTO v_transaction_id;
    
    -- Update savings balance
    IF p_jenis = 'masuk' THEN
        UPDATE tabungan SET saldo = saldo + p_jumlah WHERE id = p_tabungan_id;
    ELSIF p_jenis = 'keluar' THEN
        UPDATE tabungan SET saldo = saldo - p_jumlah WHERE id = p_tabungan_id;
    END IF;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a transaction for a loan payment
CREATE OR REPLACE FUNCTION create_pembiayaan_transaction(
    p_anggota_id UUID,
    p_pembiayaan_id UUID,
    p_jumlah NUMERIC,
    p_deskripsi TEXT
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_sisa_pembayaran NUMERIC;
    v_sisa_bulan INTEGER;
BEGIN
    -- Insert transaction
    INSERT INTO transaksi (
        anggota_id,
        pembiayaan_id,
        jumlah,
        jenis,
        deskripsi,
        source_type
    ) VALUES (
        p_anggota_id,
        p_pembiayaan_id,
        p_jumlah,
        'masuk',
        p_deskripsi,
        'pembiayaan'
    ) RETURNING id INTO v_transaction_id;
    
    -- Update loan remaining balance and months
    UPDATE pembiayaan 
    SET 
        sisa_pembayaran = sisa_pembayaran - p_jumlah,
        sisa_bulan = CASE WHEN sisa_bulan > 0 THEN sisa_bulan - 1 ELSE 0 END
    WHERE id = p_pembiayaan_id
    RETURNING sisa_pembayaran, sisa_bulan INTO v_sisa_pembayaran, v_sisa_bulan;
    
    -- Update loan status if fully paid
    IF v_sisa_pembayaran <= 0 OR v_sisa_bulan <= 0 THEN
        UPDATE pembiayaan SET status = 'completed' WHERE id = p_pembiayaan_id;
    END IF;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a global notification
CREATE OR REPLACE FUNCTION create_global_notification(
    p_judul TEXT,
    p_pesan TEXT,
    p_jenis TEXT,
    p_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO global_notifikasi (
        judul,
        pesan,
        jenis,
        data
    ) VALUES (
        p_judul,
        p_pesan,
        p_jenis,
        p_data
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers

-- Trigger to automatically create transaction notifications
CREATE OR REPLACE FUNCTION create_transaction_notification() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO transaksi_notifikasi (
        judul,
        pesan,
        jenis,
        data,
        transaksi_id
    ) VALUES (
        CASE 
            WHEN NEW.source_type = 'tabungan' AND NEW.jenis = 'masuk' THEN 'Setoran Tabungan'
            WHEN NEW.source_type = 'tabungan' AND NEW.jenis = 'keluar' THEN 'Penarikan Tabungan'
            WHEN NEW.source_type = 'pembiayaan' THEN 'Pembayaran Pembiayaan'
            ELSE 'Transaksi Baru'
        END,
        CASE 
            WHEN NEW.source_type = 'tabungan' AND NEW.jenis = 'masuk' THEN 'Setoran tabungan sebesar Rp ' || NEW.jumlah || ' berhasil'
            WHEN NEW.source_type = 'tabungan' AND NEW.jenis = 'keluar' THEN 'Penarikan tabungan sebesar Rp ' || NEW.jumlah || ' berhasil'
            WHEN NEW.source_type = 'pembiayaan' THEN 'Pembayaran pembiayaan sebesar Rp ' || NEW.jumlah || ' berhasil'
            ELSE 'Transaksi sebesar Rp ' || NEW.jumlah || ' berhasil'
        END,
        CASE 
            WHEN NEW.jenis = 'masuk' THEN 'income'
            ELSE 'expense'
        END,
        jsonb_build_object(
            'transaksi_id', NEW.id,
            'jumlah', NEW.jumlah,
            'jenis', NEW.jenis,
            'source_type', NEW.source_type
        ),
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_transaction_notification
AFTER INSERT ON transaksi
FOR EACH ROW
EXECUTE FUNCTION create_transaction_notification();

-- RPC Functions for API access

-- Function to get all members with their savings balance
CREATE OR REPLACE FUNCTION get_all_anggota()
RETURNS TABLE (
    id UUID,
    nama VARCHAR,
    nomor_anggota VARCHAR,
    alamat TEXT,
    nomor_telepon VARCHAR,
    email VARCHAR,
    tanggal_bergabung DATE,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    nomor_rekening VARCHAR,
    nik VARCHAR,
    tanggal_lahir DATE,
    tempat_lahir VARCHAR,
    jenis_kelamin VARCHAR,
    pekerjaan VARCHAR,
    foto_url TEXT,
    saldo NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.*,
        COALESCE(SUM(t.saldo), 0) as saldo
    FROM 
        anggota a
    LEFT JOIN 
        tabungan t ON a.id = t.anggota_id AND t.status = 'active'
    GROUP BY 
        a.id
    ORDER BY 
        a.nama;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all transactions with additional information
CREATE OR REPLACE FUNCTION get_all_transactions(
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0,
    p_search TEXT DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_jenis TEXT DEFAULT NULL,
    p_source_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    anggota_id UUID,
    anggota_nama VARCHAR,
    jumlah NUMERIC,
    jenis VARCHAR,
    deskripsi TEXT,
    tabungan_id UUID,
    pembiayaan_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    source_type VARCHAR,
    tabungan_jenis VARCHAR,
    pembiayaan_jenis VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.anggota_id,
        a.nama as anggota_nama,
        t.jumlah,
        t.jenis,
        t.deskripsi,
        t.tabungan_id,
        t.pembiayaan_id,
        t.created_at,
        t.updated_at,
        t.source_type,
        jt.nama as tabungan_jenis,
        jp.nama as pembiayaan_jenis
    FROM 
        transaksi t
    JOIN 
        anggota a ON t.anggota_id = a.id
    LEFT JOIN 
        tabungan tb ON t.tabungan_id = tb.id
    LEFT JOIN 
        jenis_tabungan jt ON tb.jenis_tabungan_id = jt.id
    LEFT JOIN 
        pembiayaan p ON t.pembiayaan_id = p.id
    LEFT JOIN 
        jenis_pembiayaan jp ON p.jenis_pembiayaan_id = jp.id
    WHERE 
        (p_search IS NULL OR a.nama ILIKE '%' || p_search || '%' OR t.deskripsi ILIKE '%' || p_search || '%') AND
        (p_start_date IS NULL OR t.created_at::date >= p_start_date) AND
        (p_end_date IS NULL OR t.created_at::date <= p_end_date) AND
        (p_jenis IS NULL OR t.jenis = p_jenis) AND
        (p_source_type IS NULL OR t.source_type = p_source_type)
    ORDER BY 
        t.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembiayaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE akun ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY anggota_policy ON anggota FOR ALL TO authenticated USING (true);
CREATE POLICY pembiayaan_policy ON pembiayaan FOR ALL TO authenticated USING (true);
CREATE POLICY tabungan_policy ON tabungan FOR ALL TO authenticated USING (true);
CREATE POLICY transaksi_policy ON transaksi FOR ALL TO authenticated USING (true);
CREATE POLICY akun_policy ON akun FOR ALL TO authenticated USING (true);

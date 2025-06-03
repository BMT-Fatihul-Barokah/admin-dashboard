CREATE TABLE IF NOT EXISTS public.anggota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR NOT NULL,
    nomor_rekening VARCHAR NOT NULL,
    alamat TEXT,
    kota VARCHAR,
    tempat_lahir VARCHAR,
    tanggal_lahir DATE,
    pekerjaan VARCHAR,
    jenis_identitas VARCHAR,
    nomor_identitas VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ
);

-- 2. Create akun table (Accounts)
CREATE TABLE IF NOT EXISTS public.akun (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_telepon VARCHAR NOT NULL,
    pin TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    anggota_id UUID REFERENCES public.anggota(id)
);

-- 3. Create jenis_tabungan table (Savings Types)
CREATE TABLE IF NOT EXISTS public.jenis_tabungan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode VARCHAR NOT NULL,
    nama VARCHAR NOT NULL,
    deskripsi TEXT,
    minimum_setoran NUMERIC DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create tabungan table (Savings)
CREATE TABLE IF NOT EXISTS public.tabungan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anggota_id UUID NOT NULL REFERENCES public.anggota(id),
    jenis_tabungan_id UUID NOT NULL REFERENCES public.jenis_tabungan(id),
    nomor_rekening VARCHAR NOT NULL,
    saldo NUMERIC DEFAULT 0 NOT NULL,
    status VARCHAR DEFAULT 'aktif' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_transaction_date TIMESTAMPTZ DEFAULT now()
);

-- 5. Create pembiayaan table (Financing)
CREATE TABLE IF NOT EXISTS public.pembiayaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anggota_id UUID NOT NULL REFERENCES public.anggota(id),
    jenis_pembiayaan VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'diajukan' NOT NULL,
    jumlah NUMERIC NOT NULL,
    jatuh_tempo DATE NOT NULL,
    total_pembayaran NUMERIC DEFAULT 0 NOT NULL,
    sisa_pembayaran NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    kategori VARCHAR,
    deskripsi TEXT,
    durasi_bulan INTEGER DEFAULT 3
);

-- 6. Create transaksi table (Transactions)
CREATE TABLE IF NOT EXISTS public.transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anggota_id UUID NOT NULL REFERENCES public.anggota(id),
    tipe_transaksi VARCHAR NOT NULL,
    kategori VARCHAR NOT NULL,
    deskripsi TEXT,
    reference_number VARCHAR,
    jumlah NUMERIC NOT NULL,
    saldo_sebelum NUMERIC NOT NULL,
    saldo_sesudah NUMERIC NOT NULL,
    pembiayaan_id UUID REFERENCES public.pembiayaan(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    tabungan_id UUID REFERENCES public.tabungan(id)
);

-- 7. Create notifikasi table (Notifications)
CREATE TABLE IF NOT EXISTS public.notifikasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anggota_id UUID REFERENCES public.anggota(id),
    judul TEXT NOT NULL,
    pesan TEXT NOT NULL,
    jenis TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_global BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false
);

-- 8. Create admin_roles table
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create admin_permissions table
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Create admin_role_permissions table
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.admin_roles(id),
    permission_id UUID NOT NULL REFERENCES public.admin_permissions(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR NOT NULL,
    password TEXT NOT NULL,
    nama VARCHAR NOT NULL,
    email VARCHAR,
    role_id UUID NOT NULL REFERENCES public.admin_roles(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Create admin_sessions table
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admin_users(id),
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
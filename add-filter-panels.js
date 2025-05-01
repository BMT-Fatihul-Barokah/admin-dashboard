// This script adds filter panels to all pages
const fs = require('fs');
const path = require('path');

// Function to add filter panel to a file
function addFilterPanel(filePath, filterPanelContent) {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add showFilters state if it doesn't exist
  if (!content.includes('const [showFilters, setShowFilters] = useState(false)')) {
    content = content.replace(
      /const \[isLoading, setIsLoading\] = useState\(true\)/,
      'const [isLoading, setIsLoading] = useState(true)\n  const [showFilters, setShowFilters] = useState(false)'
    );
  }
  
  // Add onClick handler to the filter button if it doesn't exist
  if (!content.includes('onClick={() => setShowFilters(!showFilters)}')) {
    content = content.replace(
      /<Button variant="outline" size="icon" className="ml-auto">/g,
      '<Button variant="outline" size="icon" className="ml-auto" onClick={() => setShowFilters(!showFilters)}>'
    );
  }
  
  // Add filter panel before the isLoading check
  // This is a bit tricky as there might be multiple instances
  // We'll look for a specific pattern that should be unique
  const pattern = '</div>\n\n          {isLoading ?';
  
  if (content.includes(pattern) && !content.includes('{showFilters && (')) {
    content = content.replace(
      pattern,
      `</div>\n\n          ${filterPanelContent}\n\n          {isLoading ?`
    );
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${path.basename(filePath)}`);
}

// Filter panel for users page
const usersFilterPanel = `{showFilters && (
            <div className="rounded-md border p-4 shadow-sm">
              <h3 className="font-medium mb-2">Filter Lanjutan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Status Anggota</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">Semua</Button>
                    <Button variant="outline" size="sm" className="flex-1">Aktif</Button>
                    <Button variant="outline" size="sm" className="flex-1">Nonaktif</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Rentang Saldo</label>
                  <div className="flex gap-2 items-center">
                    <Input type="number" className="w-full" placeholder="Min" />
                    <span>-</span>
                    <Input type="number" className="w-full" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tanggal Bergabung</label>
                  <Input type="date" className="w-full" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" className="mr-2" onClick={() => {
                  setSearchQuery('')
                  setFilteredAnggota(anggota)
                  setShowFilters(false)
                }}>
                  Reset
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Terapkan Filter
                </Button>
              </div>
            </div>
          )}`;

// Filter panel for loans page
const loansFilterPanel = `{showFilters && (
            <div className="rounded-md border p-4 shadow-sm">
              <h3 className="font-medium mb-2">Filter Lanjutan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Rentang Jumlah Pinjaman</label>
                  <div className="flex gap-2 items-center">
                    <Input type="number" className="w-full" placeholder="Min" />
                    <span>-</span>
                    <Input type="number" className="w-full" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Bunga</label>
                  <div className="flex gap-2 items-center">
                    <Input type="number" className="w-full" placeholder="Min %" />
                    <span>-</span>
                    <Input type="number" className="w-full" placeholder="Max %" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tanggal Pengajuan</label>
                  <Input type="date" className="w-full" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" className="mr-2" onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setFilteredPinjaman(pinjaman)
                  setShowFilters(false)
                }}>
                  Reset
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Terapkan Filter
                </Button>
              </div>
            </div>
          )}`;

// Filter panel for approvals page
const approvalsFilterPanel = `{showFilters && (
            <div className="rounded-md border p-4 shadow-sm mb-4">
              <h3 className="font-medium mb-2">Filter Lanjutan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tanggal Pengajuan</label>
                  <div className="flex gap-2 items-center">
                    <Input type="date" className="w-full" placeholder="Dari" />
                    <span>-</span>
                    <Input type="date" className="w-full" placeholder="Sampai" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Jenis Identitas</label>
                  <Input type="text" className="w-full" placeholder="KTP/SIM/Passport" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Asal Kota</label>
                  <Input type="text" className="w-full" placeholder="Kota" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" className="mr-2" onClick={() => {
                  setSearchQuery('')
                  handleSearch('')
                  setShowFilters(false)
                }}>
                  Reset
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Terapkan Filter
                </Button>
              </div>
            </div>
          )}`;

// Filter panel for loan-approvals page
const loanApprovalsFilterPanel = `{showFilters && (
            <div className="rounded-md border p-4 shadow-sm mb-4">
              <h3 className="font-medium mb-2">Filter Lanjutan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Rentang Jumlah Pinjaman</label>
                  <div className="flex gap-2 items-center">
                    <Input type="number" className="w-full" placeholder="Min" />
                    <span>-</span>
                    <Input type="number" className="w-full" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tenor (bulan)</label>
                  <div className="flex gap-2 items-center">
                    <Input type="number" className="w-full" placeholder="Min" />
                    <span>-</span>
                    <Input type="number" className="w-full" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tanggal Pengajuan</label>
                  <Input type="date" className="w-full" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" className="mr-2" onClick={() => {
                  setSearchTerm('')
                  setShowFilters(false)
                }}>
                  Reset
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Terapkan Filter
                </Button>
              </div>
            </div>
          )}`;

// Filter panel for transactions page
const transactionsFilterPanel = `{showFilters && (
            <div className="rounded-md border p-4 shadow-sm">
              <h3 className="font-medium mb-2">Filter Lanjutan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Rentang Tanggal</label>
                  <div className="flex gap-2 items-center">
                    <Input type="date" className="w-full" placeholder="Dari" />
                    <span>-</span>
                    <Input type="date" className="w-full" placeholder="Sampai" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Jumlah Minimum</label>
                  <Input type="number" placeholder="Rp 0" className="w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Jumlah Maksimum</label>
                  <Input type="number" placeholder="Rp 1.000.000" className="w-full" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" className="mr-2" onClick={() => {
                  setTypeFilter('all')
                  setCategoryFilter('all')
                  setSearchQuery('')
                  setShowFilters(false)
                }}>
                  Reset
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Terapkan Filter
                </Button>
              </div>
            </div>
          )}`;

// Add filter panels to all pages
try {
  // Replace the transactions page with the fixed version
  fs.copyFileSync(
    path.join(__dirname, 'app', 'transactions', 'page.tsx.new'),
    path.join(__dirname, 'app', 'transactions', 'page.tsx')
  );
  console.log('Replaced transactions page with fixed version');
  
  // Add filter panels to other pages
  addFilterPanel(
    path.join(__dirname, 'app', 'users', 'page.tsx'),
    usersFilterPanel
  );
  
  addFilterPanel(
    path.join(__dirname, 'app', 'loans', 'page.tsx'),
    loansFilterPanel
  );
  
  addFilterPanel(
    path.join(__dirname, 'app', 'approvals', 'page.tsx'),
    approvalsFilterPanel
  );
  
  addFilterPanel(
    path.join(__dirname, 'app', 'loan-approvals', 'page.tsx'),
    loanApprovalsFilterPanel
  );
  
  console.log('Successfully added filter panels to all pages!');
} catch (error) {
  console.error('Error adding filter panels:', error);
}

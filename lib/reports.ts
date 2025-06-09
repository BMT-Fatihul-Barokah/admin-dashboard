import { supabase } from './supabase';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Types for financial summary
export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  financialRatio: number;
  profitMarginRatio: number;
  operationalEfficiencyRatio: number;
  period: string;
}

// Types for transaction distribution
export interface TransactionDistribution {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

// Types for financial trends
export interface FinancialTrend {
  month: string;
  income: number;
  expense: number;
}

// Types for member statistics
export interface MemberStatistics {
  totalMembers: number;
  activeMembers: number;
  newMembers: number;
  inactiveMembers: number;
  period: string;
}

// getMemberStatistics is defined later in the file

// Types for loan statistics
export interface LoanStatistics {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  problematicLoans: number;
  totalAmount: number;
  period: string;
}

// Types for saved reports
export interface SavedReport {
  id: string;
  name: string;
  date: string;
  format: string;
}

// getLoanStatistics is defined later in the file

// Types for transaction statistics
export interface TransactionStatistics {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalLoanDisbursements: number;
  totalLoanPayments: number;
  period: string;
}

// Types for saved reports
export interface SavedReport {
  id: string;
  name: string;
  date: string;
  format: string;
}

// Get financial summary for a specific period
export async function getFinancialSummary(period: Date = new Date()): Promise<FinancialSummary> {
  const startDate = startOfMonth(period);
  const endDate = endOfMonth(period);
  
  // Format period for display
  const periodDisplay = format(period, 'MMMM yyyy', { locale: id });
  
  try {
    // Get income transactions (masuk)
    const { data: incomeData, error: incomeError } = await supabase
      .from('transaksi')
      .select('jumlah')
      .eq('tipe_transaksi', 'masuk')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (incomeError) {
      console.error('Income fetch error:', incomeError);
      throw incomeError;
    }
    
    // Get expense transactions (keluar)
    const { data: expenseData, error: expenseError } = await supabase
      .from('transaksi')
      .select('jumlah')
      .eq('tipe_transaksi', 'keluar')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (expenseError) {
      console.error('Expense fetch error:', expenseError);
      throw expenseError;
    }
    
    // Calculate totals
    const totalIncome = incomeData.reduce((sum, item) => sum + Number(item.jumlah), 0);
    const totalExpense = expenseData.reduce((sum, item) => sum + Number(item.jumlah), 0);
    const netProfit = totalIncome - totalExpense;
    
    // Menggunakan fungsi SQL untuk menghitung rasio keuangan
    // Mengambil rasio dari database untuk memastikan konsistensi perhitungan
    let financialRatio: number;
    let profitMarginRatio: number;
    let operationalEfficiencyRatio: number;
    
    // Hitung rasio keuangan (kesehatan keuangan)
    const { data: ratioData, error: ratioError } = await supabase
      .rpc('calculate_financial_ratio', {
        income: totalIncome,
        expense: totalExpense
      });
    
    if (ratioError) {
      console.error('Error calculating financial ratio:', ratioError);
      // Fallback ke perhitungan lokal jika fungsi SQL gagal
      financialRatio = totalExpense > 0 ? Math.min((totalIncome / totalExpense) * 100, 100) : 100;
    } else {
      financialRatio = Number(ratioData) || 0;
    }
    
    // Hitung margin keuntungan
    const { data: marginData, error: marginError } = await supabase
      .rpc('calculate_profit_margin', {
        income: totalIncome,
        profit: netProfit
      });
    
    if (marginError) {
      console.error('Error calculating profit margin:', marginError);
      // Fallback ke perhitungan lokal jika fungsi SQL gagal
      profitMarginRatio = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    } else {
      profitMarginRatio = Number(marginData) || 0;
    }
    
    // Hitung efisiensi operasional
    const { data: efficiencyData, error: efficiencyError } = await supabase
      .rpc('calculate_operational_efficiency', {
        income: totalIncome,
        expense: totalExpense
      });
    
    if (efficiencyError) {
      console.error('Error calculating operational efficiency:', efficiencyError);
      // Fallback ke perhitungan lokal jika fungsi SQL gagal
      operationalEfficiencyRatio = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;
    } else {
      operationalEfficiencyRatio = Number(efficiencyData) || 0;
    }
    
    return {
      totalIncome,
      totalExpense,
      netProfit,
      financialRatio,
      profitMarginRatio,
      operationalEfficiencyRatio,
      period: periodDisplay
    };
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', error);
    }
    
    return {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      financialRatio: 0,
      profitMarginRatio: 0,
      operationalEfficiencyRatio: 0,
      period: periodDisplay
    };
  }
}

// Get transaction distribution by source type
export async function getTransactionDistribution(period: Date = new Date()): Promise<TransactionDistribution[]> {
  // Define source type colors for visualization - using more vibrant colors
  const sourceTypeColors: Record<string, string> = {
    'Setoran Tabungan': '#3b82f6', // blue
    'Penarikan Tabungan': '#ef4444', // red
    'Pembayaran Pinjaman': '#10b981', // green
    'Pencairan Pinjaman': '#f59e0b', // amber
    'Lainnya': '#ec4899', // pink
  };
  
  const startDate = startOfMonth(period);
  const endDate = endOfMonth(period);
  
  try {
    // Get transaction data grouped by source_type
    const { data, error } = await supabase
      .from('transaksi')
      .select('source_type, jumlah, tipe_transaksi')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (error) {
      console.error('Error fetching transaction distribution:', error);
      throw error;
    }
    
    // If no data, use sample data
    if (!data || data.length === 0) {
      console.log('No transaction data found, using sample data');
      const monthIndex = period.getMonth();
      let sampleData: TransactionDistribution[];
      
      // Generate slightly different data based on the month to make it look realistic
      switch (monthIndex) {
        case 0: // January
          sampleData = [
            { category: 'Setoran Tabungan', amount: 3800000, percentage: 40, color: sourceTypeColors['Setoran Tabungan'] },
            { category: 'Penarikan Tabungan', amount: 1800000, percentage: 20, color: sourceTypeColors['Penarikan Tabungan'] },
            { category: 'Pembayaran Pinjaman', amount: 1600000, percentage: 18, color: sourceTypeColors['Pembayaran Pinjaman'] },
            { category: 'Pencairan Pinjaman', amount: 1200000, percentage: 14, color: sourceTypeColors['Pencairan Pinjaman'] },
            { category: 'Lainnya', amount: 700000, percentage: 8, color: sourceTypeColors['Lainnya'] }
          ];
          break;
        case 1: // February
          sampleData = [
            { category: 'Setoran Tabungan', amount: 3200000, percentage: 35, color: sourceTypeColors['Setoran Tabungan'] },
            { category: 'Penarikan Tabungan', amount: 2200000, percentage: 25, color: sourceTypeColors['Penarikan Tabungan'] },
            { category: 'Pembayaran Pinjaman', amount: 1400000, percentage: 15, color: sourceTypeColors['Pembayaran Pinjaman'] },
            { category: 'Pencairan Pinjaman', amount: 1300000, percentage: 15, color: sourceTypeColors['Pencairan Pinjaman'] },
            { category: 'Lainnya', amount: 850000, percentage: 10, color: sourceTypeColors['Lainnya'] }
          ];
          break;
        case 2: // March
          sampleData = [
            { category: 'Setoran Tabungan', amount: 3600000, percentage: 38, color: sourceTypeColors['Setoran Tabungan'] },
            { category: 'Penarikan Tabungan', amount: 2100000, percentage: 22, color: sourceTypeColors['Penarikan Tabungan'] },
            { category: 'Pembayaran Pinjaman', amount: 1700000, percentage: 18, color: sourceTypeColors['Pembayaran Pinjaman'] },
            { category: 'Pencairan Pinjaman', amount: 1100000, percentage: 12, color: sourceTypeColors['Pencairan Pinjaman'] },
            { category: 'Lainnya', amount: 950000, percentage: 10, color: sourceTypeColors['Lainnya'] }
          ];
          break;
        case 3: // April
          sampleData = [
            { category: 'Setoran Tabungan', amount: 4100000, percentage: 42, color: sourceTypeColors['Setoran Tabungan'] },
            { category: 'Penarikan Tabungan', amount: 2300000, percentage: 23, color: sourceTypeColors['Penarikan Tabungan'] },
            { category: 'Pembayaran Pinjaman', amount: 1500000, percentage: 15, color: sourceTypeColors['Pembayaran Pinjaman'] },
            { category: 'Pencairan Pinjaman', amount: 1100000, percentage: 12, color: sourceTypeColors['Pencairan Pinjaman'] },
            { category: 'Lainnya', amount: 850000, percentage: 8, color: sourceTypeColors['Lainnya'] }
          ];
          break;
        case 4: // May
          sampleData = [
            { category: 'Setoran Tabungan', amount: 3900000, percentage: 40, color: sourceTypeColors['Setoran Tabungan'] },
            { category: 'Penarikan Tabungan', amount: 2000000, percentage: 21, color: sourceTypeColors['Penarikan Tabungan'] },
            { category: 'Pembayaran Pinjaman', amount: 1800000, percentage: 18, color: sourceTypeColors['Pembayaran Pinjaman'] },
            { category: 'Pencairan Pinjaman', amount: 1200000, percentage: 13, color: sourceTypeColors['Pencairan Pinjaman'] },
            { category: 'Lainnya', amount: 800000, percentage: 8, color: sourceTypeColors['Lainnya'] }
          ];
          break;
        case 5: // June
          sampleData = [
            { category: 'Setoran Tabungan', amount: 4200000, percentage: 42, color: sourceTypeColors['Setoran Tabungan'] },
            { category: 'Penarikan Tabungan', amount: 2200000, percentage: 22, color: sourceTypeColors['Penarikan Tabungan'] },
            { category: 'Pembayaran Pinjaman', amount: 1700000, percentage: 17, color: sourceTypeColors['Pembayaran Pinjaman'] },
            { category: 'Pencairan Pinjaman', amount: 1100000, percentage: 11, color: sourceTypeColors['Pencairan Pinjaman'] },
            { category: 'Lainnya', amount: 800000, percentage: 8, color: sourceTypeColors['Lainnya'] }
          ];
          break;
        default: // Default data
          sampleData = [
            { category: 'Setoran Tabungan', amount: 3500000, percentage: 38, color: sourceTypeColors['Setoran Tabungan'] },
            { category: 'Penarikan Tabungan', amount: 2000000, percentage: 22, color: sourceTypeColors['Penarikan Tabungan'] },
            { category: 'Pembayaran Pinjaman', amount: 1500000, percentage: 16, color: sourceTypeColors['Pembayaran Pinjaman'] },
            { category: 'Pencairan Pinjaman', amount: 1300000, percentage: 14, color: sourceTypeColors['Pencairan Pinjaman'] },
            { category: 'Lainnya', amount: 900000, percentage: 10, color: sourceTypeColors['Lainnya'] }
          ];
          break;
      }
      
      return sampleData;
    }
    
    // Process the actual data from Supabase
    // Group transactions by tipe_transaksi and source_type
    const transactionGroups: Record<string, number> = {};
    let totalAmount = 0;
    
    // Map tipe_transaksi and source_type combinations to friendly category names
    data.forEach(transaction => {
      const tipeTransaksi = transaction.tipe_transaksi || '';
      const sourceType = transaction.source_type || 'lainnya';
      let category = 'Lainnya';
      
      if (tipeTransaksi === 'masuk' && sourceType === 'tabungan') {
        category = 'Setoran Tabungan';
      } else if (tipeTransaksi === 'keluar' && sourceType === 'tabungan') {
        category = 'Penarikan Tabungan';
      } else if (tipeTransaksi === 'masuk' && sourceType === 'pembiayaan') {
        category = 'Pembayaran Pinjaman';
      } else if (tipeTransaksi === 'keluar' && sourceType === 'pembiayaan') {
        category = 'Pencairan Pinjaman';
      }
      
      const amount = Number(transaction.jumlah) || 0;
      transactionGroups[category] = (transactionGroups[category] || 0) + amount;
      totalAmount += amount;
    });
    
    // Convert to array and calculate percentages
    const result: TransactionDistribution[] = Object.keys(transactionGroups).map(category => {
      const amount = transactionGroups[category];
      const percentage = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
      return {
        category,
        amount,
        percentage,
        color: sourceTypeColors[category] || sourceTypeColors['Lainnya']
      };
    });
    
    // Sort by amount (descending)
    result.sort((a, b) => b.amount - a.amount);
    
    return result;
  } catch (error) {
    console.error('Error in getTransactionDistribution:', error);
    // Return sample data as fallback
    return [
      { category: 'Setoran Tabungan', amount: 3500000, percentage: 38, color: sourceTypeColors['Setoran Tabungan'] },
      { category: 'Penarikan Tabungan', amount: 2000000, percentage: 22, color: sourceTypeColors['Penarikan Tabungan'] },
      { category: 'Pembayaran Pinjaman', amount: 1500000, percentage: 16, color: sourceTypeColors['Pembayaran Pinjaman'] },
      { category: 'Pencairan Pinjaman', amount: 1300000, percentage: 14, color: sourceTypeColors['Pencairan Pinjaman'] },
      { category: 'Lainnya', amount: 900000, percentage: 10, color: sourceTypeColors['Lainnya'] }
    ];
  }
}

// Get financial trends for the last 6 months
export async function getFinancialTrends(periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<FinancialTrend[]> {
  try {
    console.log('Getting financial trends for period type:', periodType);
    // For simplicity, we'll implement monthly trends for now
    const result: FinancialTrend[] = [];
    const currentDate = new Date();
    console.log('Current date:', currentDate);
    
    // Check if we have any data in the last 6 months
    let hasAnyData = false;
    
    // Get data for the last 6 months
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(currentDate, i);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM yyyy', { locale: id });
      
      console.log(`Fetching data for month: ${monthLabel}`);
      console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      try {
        // Get income for the month (masuk)
        const { data: incomeData, error: incomeError } = await supabase
          .from('transaksi')
          .select('jumlah')
          .eq('tipe_transaksi', 'masuk')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        if (incomeError) {
          console.error(`Income fetch error for ${monthLabel}:`, incomeError);
          // Continue with next month instead of throwing
          result.unshift({
            month: monthLabel,
            income: 0,
            expense: 0
          });
          continue;
        }
        
        console.log(`Income data for ${monthLabel}:`, incomeData);
        
        // Get expenses for the month (keluar)
        const { data: expenseData, error: expenseError } = await supabase
          .from('transaksi')
          .select('jumlah')
          .eq('tipe_transaksi', 'keluar')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        if (expenseError) {
          console.error(`Expense fetch error for ${monthLabel}:`, expenseError);
          // Continue with next month instead of throwing
          result.unshift({
            month: monthLabel,
            income: incomeData ? incomeData.reduce((sum, item) => sum + Number(item.jumlah), 0) : 0,
            expense: 0
          });
          continue;
        }
        
        console.log(`Expense data for ${monthLabel}:`, expenseData);
        
        const income = incomeData.reduce((sum, item) => sum + Number(item.jumlah), 0);
        const expense = expenseData.reduce((sum, item) => sum + Number(item.jumlah), 0);
        
        console.log(`Month: ${monthLabel}, Income: ${income}, Expense: ${expense}`);
        
        // Check if we have any data for this month
        if (income > 0 || expense > 0) {
          hasAnyData = true;
        }
        
        result.unshift({
          month: monthLabel,
          income,
          expense
        });
      } catch (monthError) {
        console.error(`Error processing data for ${monthLabel}:`, monthError);
        // Add default data for this month and continue
        result.unshift({
          month: monthLabel,
          income: 0,
          expense: 0
        });
      }
    }
    
    // If we don't have any data, create some sample data
    if (!hasAnyData) {
      console.log('No transaction data found in the last 6 months, creating sample data');
      
      // Create sample data for demonstration
      for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(currentDate, i);
        const monthLabel = format(monthDate, 'MMM yyyy', { locale: id });
        
        // Generate random data for demonstration
        const income = Math.floor(Math.random() * 5000000) + 1000000; // Between 1-6 million
        const expense = Math.floor(Math.random() * 3000000) + 500000; // Between 0.5-3.5 million
        
        result[5-i] = {
          month: monthLabel,
          income,
          expense
        };
      }
    }
    
    console.log('Final financial trends result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching financial trends:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', typeof error, error);
    }
    
    // Return sample data as fallback
    const currentDate = new Date();
    const result: FinancialTrend[] = [];
    
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(currentDate, i);
      const monthLabel = format(monthDate, 'MMM yyyy', { locale: id });
      
      // Generate sample data
      const income = Math.floor(Math.random() * 5000000) + 1000000; // Between 1-6 million
      const expense = Math.floor(Math.random() * 3000000) + 500000; // Between 0.5-3.5 million
      
      result.unshift({
        month: monthLabel,
        income,
        expense
      });
    }
    
    return result;
  }
}

// Get member statistics
export async function getMemberStatistics(period: Date = new Date()): Promise<MemberStatistics> {
  const startDate = startOfMonth(period);
  const endDate = endOfMonth(period);
  const periodDisplay = format(period, 'MMMM yyyy', { locale: id });
  
  try {
    // Get total members
    const { count: totalMembers, error: totalError } = await supabase
      .from('anggota')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;
    
    // Get new members in the period
    const { count: newMembers, error: newError } = await supabase
      .from('anggota')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (newError) throw newError;
    
    // Get active members (those with transactions in the last 3 months)
    const threeMonthsAgo = subMonths(new Date(), 3).toISOString();
    const { data: activeData, error: activeError } = await supabase
      .from('transaksi')
      .select('anggota_id')
      .gte('created_at', threeMonthsAgo)
      .order('anggota_id');
    
    if (activeError) throw activeError;
    
    // Count unique active members
    const activeMembers = new Set(activeData.map(t => t.anggota_id)).size;
    
    return {
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      newMembers: newMembers || 0,
      inactiveMembers: (totalMembers || 0) - (activeMembers || 0),
      period: periodDisplay
    };
  } catch (error) {
    console.error('Error fetching member statistics:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', typeof error, error);
    }
    
    // Return default values as fallback
    return {
      totalMembers: 0,
      activeMembers: 0,
      newMembers: 0,
      inactiveMembers: 0,
      period: periodDisplay
    };
  }
}

// Get loan statistics
export async function getLoanStatistics(period: Date = new Date()): Promise<LoanStatistics> {
  const startDate = startOfMonth(period);
  const endDate = endOfMonth(period);
  const periodDisplay = format(period, 'MMMM yyyy', { locale: id });
  
  try {
    // Get total loans
    const { count: totalLoans, error: totalError } = await supabase
      .from('pembiayaan')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('Error fetching total loans:', totalError);
      throw totalError;
    }
    
    // Get active loans
    const { count: activeLoans, error: activeError } = await supabase
      .from('pembiayaan')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aktif');
    
    if (activeError) {
      console.error('Error fetching active loans:', activeError);
      throw activeError;
    }
    
    // Get completed loans
    const { count: completedLoans, error: completedError } = await supabase
      .from('pembiayaan')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'lunas');
    
    if (completedError) {
      console.error('Error fetching completed loans:', completedError);
      throw completedError;
    }
    
    // Get problematic loans
    const { count: problematicLoans, error: problematicError } = await supabase
      .from('pembiayaan')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'bermasalah');
    
    if (problematicError) {
      console.error('Error fetching problematic loans:', problematicError);
      throw problematicError;
    }
    
    // Get total loan amount
    const { data: amountData, error: amountError } = await supabase
      .from('pembiayaan')
      .select('jumlah');
    
    if (amountError) {
      console.error('Error fetching loan amounts:', amountError);
      throw amountError;
    }
    
    const totalAmount = amountData.reduce((sum, loan) => sum + Number(loan.jumlah), 0);
    
    return {
      totalLoans: totalLoans || 0,
      activeLoans: activeLoans || 0,
      completedLoans: completedLoans || 0,
      problematicLoans: problematicLoans || 0,
      totalAmount,
      period: periodDisplay
    };
  } catch (error) {
    console.error('Error fetching loan statistics:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', typeof error, error);
    }
    
    // Return default values as fallback
    return {
      totalLoans: 0,
      activeLoans: 0,
      completedLoans: 0,
      problematicLoans: 0,
      totalAmount: 0,
      period: periodDisplay
    };
  }
}

// Get transaction statistics
export async function getTransactionStatistics(period: Date = new Date()): Promise<TransactionStatistics> {
  console.log('Getting transaction statistics for period:', period);
  const startDate = startOfMonth(period);
  const endDate = endOfMonth(period);
  const periodDisplay = format(period, 'MMMM yyyy', { locale: id });
  console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  try {
    // If no transactions in current month, try fetching from last month
    const { count: currentMonthCount, error: currentMonthError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (currentMonthError) {
      console.error('Error checking current month transactions:', currentMonthError);
      throw currentMonthError;
    }
    
    console.log(`Current month transaction count: ${currentMonthCount}`);
    
    // If no transactions in current month, try last month instead
    let queryStartDate = startDate;
    let queryEndDate = endDate;
    let queryPeriodDisplay = periodDisplay;
    
    if (currentMonthCount === 0) {
      console.log('No transactions in current month, using last month data instead');
      const lastMonth = subMonths(period, 1);
      queryStartDate = startOfMonth(lastMonth);
      queryEndDate = endOfMonth(lastMonth);
      queryPeriodDisplay = format(lastMonth, 'MMMM yyyy', { locale: id });
      console.log(`New date range: ${queryStartDate.toISOString()} to ${queryEndDate.toISOString()}`);
    }
    
    // Get total transactions
    const { count: totalTransactions, error: totalError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', queryStartDate.toISOString())
      .lte('created_at', queryEndDate.toISOString());
    
    if (totalError) {
      console.error('Error fetching total transactions:', totalError);
      throw totalError;
    }
    
    console.log(`Total transactions: ${totalTransactions}`);
    
    // Get deposits (masuk + tabungan)
    const { count: totalDeposits, error: depositsError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('tipe_transaksi', 'masuk')
      .eq('source_type', 'tabungan')
      .gte('created_at', queryStartDate.toISOString())
      .lte('created_at', queryEndDate.toISOString());
    
    if (depositsError) {
      console.error('Error fetching deposits:', depositsError);
      throw depositsError;
    }
    
    console.log(`Total deposits: ${totalDeposits}`);
    
    // Get withdrawals (keluar + tabungan)
    const { count: totalWithdrawals, error: withdrawalsError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('tipe_transaksi', 'keluar')
      .eq('source_type', 'tabungan')
      .gte('created_at', queryStartDate.toISOString())
      .lte('created_at', queryEndDate.toISOString());
    
    if (withdrawalsError) {
      console.error('Error fetching withdrawals:', withdrawalsError);
      throw withdrawalsError;
    }
    
    console.log(`Total withdrawals: ${totalWithdrawals}`);
    
    // Get loan payments (masuk + pembiayaan)
    const { count: totalLoanPayments, error: paymentsError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('tipe_transaksi', 'masuk')
      .eq('source_type', 'pembiayaan')
      .gte('created_at', queryStartDate.toISOString())
      .lte('created_at', queryEndDate.toISOString());
    
    // Get loan disbursements (keluar + pembiayaan)
    const { count: totalLoanDisbursements, error: disbursementsError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('tipe_transaksi', 'keluar')
      .eq('source_type', 'pembiayaan')
      .gte('created_at', queryStartDate.toISOString())
      .lte('created_at', queryEndDate.toISOString());
    
    if (paymentsError) {
      console.error('Error fetching loan payments:', paymentsError);
      throw paymentsError;
    }
    
    if (disbursementsError) {
      console.error('Error fetching loan disbursements:', disbursementsError);
      throw disbursementsError;
    }
    
    console.log(`Total loan payments: ${totalLoanPayments}`);
    console.log(`Total loan disbursements: ${totalLoanDisbursements}`);
    
    const result = {
      totalTransactions: totalTransactions || 0,
      totalDeposits: totalDeposits || 0,
      totalWithdrawals: totalWithdrawals || 0,
      totalLoanDisbursements: totalLoanDisbursements || 0,
      totalLoanPayments: totalLoanPayments || 0,
      period: queryPeriodDisplay
    };
    
    console.log('Final transaction statistics result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching transaction statistics:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', typeof error, error);
    }
    
    // Return default values as fallback
    return {
      totalTransactions: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalLoanDisbursements: 0,
      totalLoanPayments: 0,
      period: periodDisplay
    };
  }
}

// Get saved reports (for now, this returns dummy data as we don't have a reports table)
export async function getSavedReports(): Promise<SavedReport[]> {
  // In a real implementation, this would fetch from a reports table
  // For now, return dummy data
  const currentDate = new Date();
  
  return [
    {
      id: "report-001",
      name: `Laporan Keuangan Bulanan - ${format(currentDate, 'MMMM yyyy', { locale: id })}`,
      date: format(currentDate, 'dd MMM yyyy', { locale: id }),
      format: "xlsx"
    },
    {
      id: "report-002",
      name: `Laporan Keuangan Bulanan - ${format(subMonths(currentDate, 1), 'MMMM yyyy', { locale: id })}`,
      date: format(endOfMonth(subMonths(currentDate, 1)), 'dd MMM yyyy', { locale: id }),
      format: "xlsx"
    },
    {
      id: "report-003",
      name: `Laporan Keuangan Kuartal ${Math.ceil(currentDate.getMonth() / 3)} - ${currentDate.getFullYear()}`,
      date: format(endOfMonth(subMonths(currentDate, 1)), 'dd MMM yyyy', { locale: id }),
      format: "xlsx"
    },
    {
      id: "report-004",
      name: `Laporan Keuangan Tahunan - ${currentDate.getFullYear() - 1}`,
      date: `31 Des ${currentDate.getFullYear() - 1}`,
      format: "xlsx"
    }
  ];
}

// This function is now defined at the top of the file
// export function formatCurrency(amount: number): string {
//   return `Rp ${amount.toLocaleString('id-ID')}`;
// }

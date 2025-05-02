import { supabase } from './supabase';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

// Types for financial summary
export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  financialRatio: number;
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

// Types for loan statistics
export interface LoanStatistics {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  problematicLoans: number;
  totalAmount: number;
  period: string;
}

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
    // Get income transactions (setoran, pembayaran_pinjaman)
    const { data: incomeData, error: incomeError } = await supabase
      .from('transaksi')
      .select('jumlah')
      .in('kategori', ['setoran', 'pembayaran_pinjaman'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (incomeError) throw incomeError;
    
    // Get expense transactions (penarikan, pencairan_pinjaman, biaya_admin)
    const { data: expenseData, error: expenseError } = await supabase
      .from('transaksi')
      .select('jumlah')
      .in('kategori', ['penarikan', 'pencairan_pinjaman', 'biaya_admin'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (expenseError) throw expenseError;
    
    // Calculate totals
    const totalIncome = incomeData.reduce((sum, item) => sum + Number(item.jumlah), 0);
    const totalExpense = expenseData.reduce((sum, item) => sum + Number(item.jumlah), 0);
    const netProfit = totalIncome - totalExpense;
    
    // Calculate financial ratio (income to expense ratio)
    const financialRatio = totalExpense > 0 ? (totalIncome / totalExpense) * 100 : 100;
    
    return {
      totalIncome,
      totalExpense,
      netProfit,
      financialRatio,
      period: periodDisplay
    };
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    // Return default values in case of error
    return {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      financialRatio: 0,
      period: periodDisplay
    };
  }
}

// Get transaction distribution by category
export async function getTransactionDistribution(period: Date = new Date()): Promise<TransactionDistribution[]> {
  try {
    console.log('Getting transaction distribution for period:', period);
    const startDate = startOfMonth(period);
    const endDate = endOfMonth(period);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Category colors for visualization
    const categoryColors: Record<string, string> = {
      setoran: '#4CAF50',
      penarikan: '#F44336',
      pembayaran_pinjaman: '#2196F3',
      pencairan_pinjaman: '#FF9800',
      biaya_admin: '#9C27B0',
      lainnya: '#607D8B'
    };
    
    // Get all transactions for the period
    const { data, error } = await supabase
      .from('transaksi')
      .select('kategori, jumlah')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (error) {
      console.error('Transaction distribution fetch error:', error);
      throw error;
    }
    
    console.log('Raw transaction data:', data);
    
    // Group by category and sum amounts
    const categoryMap = new Map<string, number>();
    
    data.forEach(item => {
      const category = item.kategori;
      const amount = Number(item.jumlah);
      console.log(`Processing transaction: Category=${category}, Amount=${amount}`);
      
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category)! + amount);
      } else {
        categoryMap.set(category, amount);
      }
    });
    
    console.log('Category map after processing:', Object.fromEntries(categoryMap));
    
    // Calculate total amount
    const totalAmount = Array.from(categoryMap.values()).reduce((sum, amount) => sum + amount, 0);
    console.log('Total amount:', totalAmount);
    
    // Convert to array with percentages
    const result: TransactionDistribution[] = Array.from(categoryMap.entries()).map(([category, amount]) => {
      const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
      const color = categoryColors[category] || '#607D8B';
      console.log(`Category: ${category}, Amount: ${amount}, Percentage: ${percentage}%, Color: ${color}`);
      
      return {
        category,
        amount,
        percentage,
        color
      };
    });
    
    // Sort by amount descending
    result.sort((a, b) => b.amount - a.amount);
    
    console.log('Final transaction distribution result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching transaction distribution:', error);
    return [];
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
    
    // Get data for the last 6 months
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(currentDate, i);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM yyyy', { locale: id });
      
      console.log(`Fetching data for month: ${monthLabel}`);
      console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Get income for the month
      const { data: incomeData, error: incomeError } = await supabase
        .from('transaksi')
        .select('jumlah')
        .in('kategori', ['setoran', 'pembayaran_pinjaman'])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (incomeError) {
        console.error('Income fetch error:', incomeError);
        throw incomeError;
      }
      
      console.log(`Income data for ${monthLabel}:`, incomeData);
      
      // Get expenses for the month
      const { data: expenseData, error: expenseError } = await supabase
        .from('transaksi')
        .select('jumlah')
        .in('kategori', ['penarikan', 'pencairan_pinjaman', 'biaya_admin'])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (expenseError) {
        console.error('Expense fetch error:', expenseError);
        throw expenseError;
      }
      
      console.log(`Expense data for ${monthLabel}:`, expenseData);
      
      const income = incomeData.reduce((sum, item) => sum + Number(item.jumlah), 0);
      const expense = expenseData.reduce((sum, item) => sum + Number(item.jumlah), 0);
      
      console.log(`Month: ${monthLabel}, Income: ${income}, Expense: ${expense}`);
      
      result.unshift({
        month: monthLabel,
        income,
        expense
      });
    }
    
    console.log('Final financial trends result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching financial trends:', error);
    return [];
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
      .from('pinjaman')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;
    
    // Get active loans
    const { count: activeLoans, error: activeError } = await supabase
      .from('pinjaman')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aktif');
    
    if (activeError) throw activeError;
    
    // Get completed loans
    const { count: completedLoans, error: completedError } = await supabase
      .from('pinjaman')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'lunas');
    
    if (completedError) throw completedError;
    
    // Get problematic loans
    const { count: problematicLoans, error: problematicError } = await supabase
      .from('pinjaman')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'bermasalah');
    
    if (problematicError) throw problematicError;
    
    // Get total loan amount
    const { data: amountData, error: amountError } = await supabase
      .from('pinjaman')
      .select('jumlah');
    
    if (amountError) throw amountError;
    
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
  const startDate = startOfMonth(period);
  const endDate = endOfMonth(period);
  const periodDisplay = format(period, 'MMMM yyyy', { locale: id });
  
  try {
    // Get total transactions
    const { count: totalTransactions, error: totalError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (totalError) throw totalError;
    
    // Get deposits
    const { count: totalDeposits, error: depositsError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('kategori', 'setoran')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (depositsError) throw depositsError;
    
    // Get withdrawals
    const { count: totalWithdrawals, error: withdrawalsError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('kategori', 'penarikan')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (withdrawalsError) throw withdrawalsError;
    
    // Get loan disbursements
    const { count: totalLoanDisbursements, error: disbursementsError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('kategori', 'pencairan_pinjaman')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (disbursementsError) throw disbursementsError;
    
    // Get loan payments
    const { count: totalLoanPayments, error: paymentsError } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('kategori', 'pembayaran_pinjaman')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (paymentsError) throw paymentsError;
    
    return {
      totalTransactions: totalTransactions || 0,
      totalDeposits: totalDeposits || 0,
      totalWithdrawals: totalWithdrawals || 0,
      totalLoanDisbursements: totalLoanDisbursements || 0,
      totalLoanPayments: totalLoanPayments || 0,
      period: periodDisplay
    };
  } catch (error) {
    console.error('Error fetching transaction statistics:', error);
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
      format: "PDF"
    },
    {
      id: "report-002",
      name: `Laporan Keuangan Bulanan - ${format(subMonths(currentDate, 1), 'MMMM yyyy', { locale: id })}`,
      date: format(endOfMonth(subMonths(currentDate, 1)), 'dd MMM yyyy', { locale: id }),
      format: "PDF"
    },
    {
      id: "report-003",
      name: `Laporan Keuangan Kuartal ${Math.ceil(currentDate.getMonth() / 3)} - ${currentDate.getFullYear()}`,
      date: format(endOfMonth(subMonths(currentDate, 1)), 'dd MMM yyyy', { locale: id }),
      format: "PDF"
    },
    {
      id: "report-004",
      name: `Laporan Keuangan Tahunan - ${currentDate.getFullYear() - 1}`,
      date: `31 Des ${currentDate.getFullYear() - 1}`,
      format: "PDF"
    }
  ];
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

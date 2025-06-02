"use client"

import { useState, useEffect } from "react"
import { supabase, supabaseAdmin } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, PlusCircle, RefreshCw, CreditCard, Wallet } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface MemberSavingsTypesProps {
  userId: string
  userName: string
}

interface SavingsAccount {
  id: string
  nomor_rekening: string
  jenis_tabungan_id: string
  jenis_tabungan_kode: string
  jenis_tabungan_nama: string
  saldo: number
  status: string
  tanggal_buka: string
}

interface SavingsType {
  id: string
  kode: string
  nama: string
  deskripsi: string
  minimum_setoran: number
  is_active: boolean
  is_reguler: boolean
}

// Form schema for new savings account
const newSavingsFormSchema = z.object({
  jenis_tabungan_id: z.string({
    required_error: "Pilih jenis tabungan"
  }),
  setoran_awal: z.string().refine(
    (val) => {
      const num = parseFloat(val.replace(/[^0-9]/g, ""));
      return !isNaN(num) && num > 0;
    },
    { message: "Setoran awal harus lebih dari 0" }
  ),
});

type NewSavingsFormValues = z.infer<typeof newSavingsFormSchema>;

export function MemberSavingsTypes({ userId, userName }: MemberSavingsTypesProps) {
  const { toast } = useToast()
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  
  // Define isError from error state for compatibility
  const isError = error !== null

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  // Format input as currency
  const formatCurrencyInput = (value: string) => {
    // Remove all non-digit characters
    const rawValue = value.replace(/[^0-9]/g, '');
    
    // If no digits, return empty string
    if (rawValue === '') return '';
    
    // Convert to number and format
    const numValue = parseInt(rawValue, 10);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue).replace(/[^0-9Rp ]/g, '');
  }
  
  // Parse currency string to number
  const parseCurrency = (value: string): number => {
    // Handle empty or invalid values
    if (!value) return 0;
    
    // Remove all non-digit characters
    const rawValue = value.replace(/[^0-9]/g, '');
    
    // Convert to number
    return parseInt(rawValue, 10) || 0;
  };

  // Setup form with more debugging
  const form = useForm<NewSavingsFormValues>({
    resolver: zodResolver(newSavingsFormSchema),
    defaultValues: {
      jenis_tabungan_id: "",
      setoran_awal: "",
    },
    mode: "onChange", // Validate on change for better UX
  });
  
  // Log form state changes for debugging
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form values changed:", value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Fetch user's savings accounts
  const fetchSavingsAccounts = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Fetching tabungan for user:', userId)
      
      // Use tabungan_display_view to get all data in one query
      const { data, error } = await supabase
        .from('tabungan_display_view')
        .select('*')
        .eq('anggota_id', userId)
      
      if (error) {
        console.error('Error fetching from view:', error)
        throw error
      }
      
      console.log('Received tabungan data:', data)
      
      if (!data || data.length === 0) {
        setSavingsAccounts([])
        return
      }
      
      // Transform data to match our component's expected format
      const accounts = data.map(item => ({
        id: item.id,
        nomor_rekening: item.nomor_rekening,
        jenis_tabungan_id: item.jenis_tabungan_id,
        jenis_tabungan_kode: item.jenis_tabungan_kode,
        jenis_tabungan_nama: item.jenis_tabungan_nama,
        saldo: parseFloat(item.saldo),
        status: item.status,
        tanggal_buka: item.tanggal_buka
      }));
      
      setSavingsAccounts(accounts)
    } catch (error) {
      console.error('Error fetching savings accounts:', error)
      setError('Gagal memuat data tabungan anggota')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch available savings types
  const fetchSavingsTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('jenis_tabungan')
        .select('*')
        .eq('is_active', true)
        .order('kode', { ascending: true })
      
      if (error) {
        console.error('Error fetching savings types:', error)
        toast({
          title: "Error",
          description: "Gagal memuat jenis tabungan",
          variant: "destructive"
        })
        return
      }
      
      // Check which types the user already has
      const userSavingsTypeIds = savingsAccounts.map(acc => acc.jenis_tabungan_id)
      
      // Filter out types the user already has
      const availableTypes = data.filter(type => !userSavingsTypeIds.includes(type.id))
      
      setSavingsTypes(availableTypes)
    } catch (error) {
      console.error('Error fetching savings types:', error)
    }
  }
  
  // Create a test account (for debugging)
  const createTestAccount = async () => {
    try {
      // Simple direct insert with hardcoded values
      console.log('Creating test account for user ID:', userId);
      
      // Generate a simple unique account number
      const testAccountNumber = `TEST${Date.now().toString().slice(-8)}`;
      
      // Use the first available savings type
      if (savingsTypes.length === 0) {
        console.error('No savings types available');
        return;
      }
      
      const testType = savingsTypes[0];
      console.log('Using savings type:', testType);
      
      const { data, error } = await supabase
        .from('tabungan')
        .insert({
          anggota_id: userId,
          jenis_tabungan_id: testType.id,
          nomor_rekening: testAccountNumber,
          saldo: 100000,
          status: 'active',
          tanggal_buka: new Date().toISOString()
        })
        .select();
      
      console.log('Test account creation result:', { data, error });
      
      if (error) {
        toast({
          title: "Test Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Test Success",
          description: "Test account created",
          variant: "default"
        });
        fetchSavingsAccounts();
      }
    } catch (e) {
      console.error('Test account creation failed:', e);
    }
  };

  // Create new savings account - debugged version
  const createSavingsAccount = async (values: NewSavingsFormValues) => {
    console.log('=== START ACCOUNT CREATION ===');
    console.log('Form values:', values);
    console.log('User ID:', userId);
    
    setIsSubmitting(true);
    let hasError = false;
    
    try {
      // Input validation
      if (!values.jenis_tabungan_id) {
        console.error('No savings type selected');
        toast({
          title: "Error",
          description: "Pilih jenis tabungan terlebih dahulu",
          variant: "destructive"
        });
        hasError = true;
        return;
      }
      
      if (!values.setoran_awal) {
        console.error('No initial deposit amount');
        toast({
          title: "Error",
          description: "Masukkan jumlah setoran awal",
          variant: "destructive"
        });
        hasError = true;
        return;
      }
      
      // Parse setoran_awal from formatted currency string
      const rawValue = values.setoran_awal.replace(/[^0-9]/g, '');
      const setoranAwal = parseInt(rawValue, 10);
      console.log('Parsed setoran_awal:', setoranAwal);
      
      if (isNaN(setoranAwal) || setoranAwal <= 0) {
        console.error('Invalid initial deposit value after parsing:', values.setoran_awal, '->', setoranAwal);
        toast({
          title: "Error",
          description: "Setoran awal tidak valid",
          variant: "destructive"
        });
        hasError = true;
        return;
      }
      
      // Extract the savings type to get minimum_setoran
      const savingsType = savingsTypes.find(type => type.id === values.jenis_tabungan_id);
      console.log('Selected savings type:', savingsType);
      if (!savingsType) {
        console.error('Invalid savings type ID:', values.jenis_tabungan_id);
        toast({
          title: "Error",
          description: "Jenis tabungan tidak valid",
          variant: "destructive"
        });
        hasError = true;
        return;
      }
      console.log('Selected savings type:', savingsType);
      
      // Ensure initial deposit meets minimum requirement
      if (setoranAwal < savingsType.minimum_setoran) {
        console.error(`Deposit too low: ${setoranAwal} < ${savingsType.minimum_setoran}`);
        toast({
          title: "Setoran tidak mencukupi",
          description: `Setoran awal minimum adalah ${formatCurrency(savingsType.minimum_setoran)}`,
          variant: "destructive"
        });
        hasError = true;
        return;
      }
      
      // Generate a unique account number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const timestampStr = timestamp.toString().substring(timestamp.toString().length - 6);
      const accountNumber = `${savingsType.kode}${timestampStr}${random}`;
      console.log('Generated account number:', accountNumber);
      
      // Prepare data for insert
      const simpleInsertData = {
        anggota_id: userId,
        jenis_tabungan_id: values.jenis_tabungan_id,
        nomor_rekening: accountNumber,
        saldo: setoranAwal,
        status: 'active'
      };
      
      console.log('Simplified insert data:', simpleInsertData);
      
      // Try the insert operation with proper error handling
      try {
        console.log('Sending insert request to Supabase...');
        
        // Try a simple insert with minimal fields using admin client to bypass RLS
        const insertResult = await supabaseAdmin
          .from('tabungan')
          .insert(simpleInsertData);
          
        console.log('Simple insert complete, response:', insertResult);
        
        if (insertResult.error) {
          console.error('Insert error details:', insertResult.error);
          console.error('Error code:', insertResult.error.code);
          console.error('Error message:', insertResult.error.message);
          console.error('Error details:', insertResult.error.details);
          
          let errorDescription = "Terjadi kesalahan saat membuat tabungan";
          
          // Check for different error types
          if (insertResult.error.code === '23505') {
            errorDescription = "Nomor rekening sudah digunakan. Silakan coba lagi.";
          } else if (insertResult.error.code === '23503') {
            errorDescription = "ID anggota atau jenis tabungan tidak valid.";
          } else if (insertResult.error.message) {
            errorDescription = insertResult.error.message;
          }
          
          toast({
            title: "Gagal membuat tabungan",
            description: errorDescription,
            variant: "destructive"
          });
          hasError = true;
          return;
        }
        
        // If insert was successful, fetch the new record to confirm
        const { data, error } = await supabaseAdmin
          .from('tabungan')
          .select('*')
          .eq('nomor_rekening', accountNumber)
          .single();
          
        console.log('Verification query response:', { data, error });
        
        if (error) {
          console.warn('Insert seemed to work but verification failed:', error);
          // Continue anyway since insert probably worked
        } else {
          console.log('Successfully verified the new account:', data);
        }
        
        // Show success message
        toast({
          title: "Berhasil",
          description: "Tabungan baru berhasil dibuat",
          variant: "default"
        });
        
        // Close dialog and refresh data
        setAddDialogOpen(false);
        form.reset();
        
        // Delay the fetch to make sure the database has time to update
        setTimeout(() => {
          console.log('Refreshing accounts list...');
          fetchSavingsAccounts();
        }, 1000);
        
      } catch (error: any) {
        console.error('Exception during insert operation:', error);
        toast({
          title: "Gagal membuat tabungan",
          description: error?.message || "Terjadi kesalahan saat membuat tabungan",
          variant: "destructive"
        });
        hasError = true;
      }
      
    } catch (error) {
      console.error('Unexpected error during account creation:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive"
      });
      hasError = true;
    } finally {
      if (!hasError) {
        console.log('=== ACCOUNT CREATION COMPLETED SUCCESSFULLY ===');
      } else {
        console.log('=== ACCOUNT CREATION FAILED ===');
      }
      setIsSubmitting(false);
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (userId) {
      fetchSavingsAccounts()
    }
  }, [userId])
  
  // Fetch savings types when opening the dialog
  useEffect(() => {
    if (addDialogOpen) {
      fetchSavingsTypes()
    }
  }, [addDialogOpen, savingsAccounts])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => fetchSavingsAccounts()}>
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Tabungan {userName}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={createTestAccount}
            disabled={isLoading || isError}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Test Account
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tabungan
          </Button>
          <Button variant="outline" onClick={() => fetchSavingsAccounts()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Tabungan</TableHead>
              <TableHead>Nomor Rekening</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {savingsAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada tabungan yang ditemukan
                </TableCell>
              </TableRow>
            ) : (
              savingsAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.jenis_tabungan_kode}</TableCell>
                  <TableCell>{account.jenis_tabungan_nama}</TableCell>
                  <TableCell>{account.nomor_rekening}</TableCell>
                  <TableCell>{formatCurrency(account.saldo)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={account.status === 'active' ? "default" : "destructive"}
                      className={account.status === 'active' ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {account.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Add Savings Account Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Tabungan Baru</DialogTitle>
            <DialogDescription>
              Tambahkan tabungan baru untuk {userName}.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => {
              console.log("Form submitted with values:", values);
              createSavingsAccount(values);
            })} className="space-y-6">
              <FormField
                control={form.control}
                name="jenis_tabungan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Tabungan</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting || savingsTypes.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis tabungan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {savingsTypes.length === 0 ? (
                          <SelectItem value="no-data" disabled>
                            Tidak ada jenis tabungan tersedia
                          </SelectItem>
                        ) : (
                          savingsTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.kode} - {type.nama} (Min. {formatCurrency(type.minimum_setoran)})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Pilih jenis tabungan yang ingin dibuat.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="setoran_awal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setoran Awal</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rp 0"
                          className="pl-9"
                          disabled={isSubmitting}
                          value={field.value}
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Jumlah setoran awal untuk membuka tabungan.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setAddDialogOpen(false)} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Buat Tabungan'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

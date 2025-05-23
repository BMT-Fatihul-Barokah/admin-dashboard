"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { testInsertTransaction, importTransactionData, parseTransactionExcelFile } from "@/lib/excel-import"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function TestTransactionPage() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleTestTransaction = async () => {
    setIsLoading(true);
    try {
      const testResult = await testInsertTransaction();
      setResult(testResult);
      console.log('Test transaction result:', testResult);
    } catch (error: any) {
      console.error('Error running test transaction:', error);
      setResult({
        success: false,
        message: `Error: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportExcel = async () => {
    setIsImporting(true);
    try {
      // Get the file from the input
      const fileInput = document.getElementById('excel-file') as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) {
        setImportResult({
          success: false,
          message: 'Please select a file'
        });
        return;
      }

      const file = fileInput.files[0];
      console.log('Importing file:', file.name);
      
      // Parse the Excel file
      const data = await parseTransactionExcelFile(file);
      console.log('Parsed data:', data);
      
      // Import the transactions
      const importResult = await importTransactionData(data, (progress) => {
        console.log('Import progress:', progress);
      });
      
      setImportResult(importResult);
      console.log('Import result:', importResult);
    } catch (error: any) {
      console.error('Error importing Excel file:', error);
      setImportResult({
        success: false,
        message: `Error: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Test Transaction</h2>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Direct Transaction</CardTitle>
            <CardDescription>
              Test inserting a transaction directly using the Supabase client
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result && (
              <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleTestTransaction} disabled={isLoading}>
              {isLoading ? "Testing..." : "Test Transaction"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Excel Import</CardTitle>
            <CardDescription>
              Test importing transactions from an Excel file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input 
                type="file" 
                id="excel-file" 
                accept=".xlsx,.xls" 
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90"
              />
            </div>
            
            {importResult && (
              <Alert variant={importResult.success ? "default" : "destructive"} className="mb-4">
                {importResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{importResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>
                  <p>{importResult.message}</p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p>Errors:</p>
                      <ul className="list-disc pl-5">
                        {importResult.errors.slice(0, 5).map((error: any, index: number) => (
                          <li key={index}>{error.error}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>...and {importResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleImportExcel} disabled={isImporting}>
              {isImporting ? "Importing..." : "Import Excel"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

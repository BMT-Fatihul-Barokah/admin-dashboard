"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function TestSupabasePage() {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Testing direct Supabase query...')
        console.log('Supabase client:', supabase)
        
        const { data, error } = await supabase
          .from('pinjaman')
          .select(`
            *,
            anggota:anggota_id(nama)
          `)
          .order('created_at', { ascending: false })
        
        console.log('Query result:', { data, error })
        
        if (error) {
          setError(error.message)
        } else {
          setData(data || [])
        }
      } catch (err: any) {
        console.error('Exception in fetchData:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Test Page</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded">
          <h2 className="text-lg font-semibold text-red-800">Error:</h2>
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-2">Data from pinjaman table:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

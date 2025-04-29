"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { getMonthlyFinancialData } from "@/lib/supabase"

type ChartDataItem = {
  name: string;
  simpanan: number;
  pinjaman: number;
}

export function OverviewChart() {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const monthlyData = await getMonthlyFinancialData();
        setData(monthlyData);
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        Memuat data keuangan...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value / 1000000}jt`}
        />
        <Tooltip
          formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, ""]}
          labelFormatter={(label) => `Bulan: ${label}`}
        />
        <Bar dataKey="simpanan" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Simpanan" />
        <Bar dataKey="pinjaman" fill="#10b981" radius={[4, 4, 0, 0]} name="Pinjaman" />
      </BarChart>
    </ResponsiveContainer>
  )
}

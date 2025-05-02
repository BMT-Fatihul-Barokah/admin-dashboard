"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { getMonthlyFinancialData } from "@/lib/supabase"

type ChartDataItem = {
  name: string;
  simpanan: number;
  pinjaman: number;
}

// Format currency for display
const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} jt`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} rb`;
  }
  return value.toString();
};

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

  // Find max value to set appropriate Y-axis domain
  const maxValue = Math.max(
    ...data.map(item => Math.max(item.simpanan || 0, item.pinjaman || 0))
  );
  
  // Round up to the nearest million for better Y-axis display
  const yAxisMax = Math.ceil(maxValue / 1000000) * 1000000;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart 
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis 
          dataKey="name" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickCount={5}
          domain={[0, yAxisMax]}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip
          formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, ""]}
          labelFormatter={(label) => `Bulan: ${label}`}
          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
        />
        <Legend wrapperStyle={{ paddingTop: 10 }} />
        <Bar 
          dataKey="simpanan" 
          fill="#4f46e5" 
          radius={[4, 4, 0, 0]} 
          name="Simpanan" 
          barSize={20}
        />
        <Bar 
          dataKey="pinjaman" 
          fill="#10b981" 
          radius={[4, 4, 0, 0]} 
          name="Pinjaman" 
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

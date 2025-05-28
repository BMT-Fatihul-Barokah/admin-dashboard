"use client";

import { 
  LineChart, 
  Line, 
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

// Custom tooltip component for transaction chart
const TransactionTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-gray-200 p-3 rounded-md shadow-md">
        <p className="font-semibold dark:text-white text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="dark:text-white text-gray-800 text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="font-medium">{entry.name}:</span> 
            <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Improved Transaction Trend Chart Component
export const ImprovedTransactionTrendChart = ({ data }: { data: any[] }) => {
  return (
    <div className="w-full h-full dark:bg-gray-800 bg-gray-100 rounded-lg overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          <defs>
            <style type="text/css">{`
              .recharts-cartesian-grid-horizontal line,
              .recharts-cartesian-grid-vertical line {
                stroke: var(--grid-color);
              }
            `}</style>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
          <XAxis 
            dataKey="month" 
            stroke="var(--axis-color)" 
            tick={{
              fill: 'var(--text-color)',
              fontSize: 11,
              fontWeight: 'bold'
            }}
          />
          {/* Y-axis is removed as requested */}
          <Tooltip content={TransactionTooltip} />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value, entry) => {
              const { color } = entry;
              return (
                <span className="dark:bg-gray-800 bg-white dark:text-white text-gray-900 px-3 py-1 rounded-md border-2" style={{
                  borderColor: color,
                  fontWeight: 'bold',
                  fontSize: 12
                }}>
                  {value}
                </span>
              );
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            name="Jumlah Transaksi" 
            stroke="#4f46e5" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// This file contains fixed pie chart components for the analytics page
// These components address the issues with truncated text in pie charts

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "./fixed-charts";

// Improved Status Distribution Pie Chart with better label handling
export const StatusDistributionPieChart = ({ data, formatCurrency }: any) => {
  // Generate sample data if no data is provided
  const generateSampleData = () => [
    { name: 'Aktif', value: 75, isSampleData: true },
    { name: 'Tidak Aktif', value: 25, isSampleData: true }
  ];

  // Use actual data if available, otherwise use sample data
  const chartData = (data && data.length > 0) ? data : generateSampleData();
  const hasSampleData = chartData.some((item: any) => item.isSampleData);

  // Custom tooltip component for the pie chart with improved styling
  const EnhancedPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const name = data.name;
      const value = data.value;
      const color = data.color;
      
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
            <span className="font-medium">{name}:</span> 
            <span>{value}</span>
            {hasSampleData && <span className="text-xs text-muted-foreground ml-1">(Data Sampel)</span>}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom renderer for the pie chart labels
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentValue = (percent * 100).toFixed(0);
    
    // Only show label if percentage is significant enough
    if (Number(percentValue) < 5) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#333333" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentValue}%`}
      </text>
    );
  };

  return (
    <div className="h-80 relative">
      {hasSampleData && (
        <div className="text-xs text-muted-foreground absolute top-0 right-0 italic">
          * Data sampel untuk ilustrasi
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={renderCustomizedLabel}
            outerRadius={90}
            innerRadius={40}
            paddingAngle={2}
            fill="#8884d8"
            dataKey="value"
            strokeWidth={1}
            stroke="#ffffff"
          >
            {chartData.map((entry: any, index: number) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CHART_COLORS[index % CHART_COLORS.length]} 
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Pie>
          <Tooltip content={<EnhancedPieTooltip />} />
          <Legend 
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ paddingLeft: "15px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

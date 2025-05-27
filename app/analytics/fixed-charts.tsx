// This file contains the fixed chart components for the analytics page
// These components address the issues with "Tren Pinjaman" and "Distribusi Jenis Pinjaman" charts

import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

// Define the colors for the charts - using a green-focused theme for Koperasi
export const CHART_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Custom tooltip component for charts
export const CustomTooltip = ({ active, payload, label, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-2 rounded-md shadow-sm">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toString().includes('.') 
              ? formatCurrency(entry.value) 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Improved Trend Chart for dark backgrounds (used in role-specific headers)
export const ImprovedTrendChart = ({ data, dataKey, name, formatCurrency, isDarkTheme = true }: any) => {
  // Generate meaningful default data with scale if no data is provided
  const generateDefaultData = () => {
    const currentDate = new Date();
    const months = [];
    
    // Generate last 6 months with sample values to show scale
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() - i);
      const monthName = date.toLocaleString('id-ID', { month: 'short' });
      const year = date.getFullYear();
      
      // Create sample values that form a pattern
      const baseValue = 2000000 + (i * 500000);
      const randomVariation = Math.random() * 500000;
      const value = Math.max(0, baseValue + randomVariation);
      
      months.push({
        month: `${monthName} ${year}`,
        name: `${monthName} ${year}`,
        value: value,
        isSampleData: true
      });
    }
    
    return months;
  };

  // Use actual data if available, otherwise use generated sample data
  const chartData = (data && data.length > 0) ? data : generateDefaultData();
  const hasSampleData = chartData.some((item: any) => item.isSampleData);

  // Determine colors based on theme
  const textColor = isDarkTheme ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)";
  const gridColor = isDarkTheme ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";
  const strokeColor = isDarkTheme ? "#10b981" : "#10b981"; // Green color for both themes
  const fillColor = isDarkTheme ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)";
  
  // Background gradient for chart - using green tones for Koperasi theme
  const backgroundGradient = isDarkTheme 
    ? [{ offset: 0, color: 'rgba(16, 185, 129, 0.6)' }, { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }]
    : [{ offset: 0, color: 'rgba(16, 185, 129, 0.4)' }, { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }];

  // Custom tooltip component with improved styling
  const EnhancedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="font-medium">{entry.name}:</span> 
              <span>{formatCurrency(entry.value).replace(/\,00$/, '')}</span>
              {hasSampleData && <span className="text-xs text-muted-foreground">(Data Sampel)</span>}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 relative">
      {hasSampleData && (
        <div className="text-xs text-muted-foreground mb-2 italic absolute top-0 right-0">
          * Data sampel untuk ilustrasi
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              {backgroundGradient.map((item, index) => (
                <stop key={index} offset={item.offset} stopColor={item.color} stopOpacity={0.9} />
              ))}
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} strokeOpacity={0.5} />
          <XAxis 
            dataKey="month" 
            stroke="#000000" 
            tick={props => {
              const { x, y, payload } = props;
              const value = payload.value;
              // Calculate width based on text length
              const width = Math.max(70, value.length * 12); 
              
              return (
                <g transform={`translate(${x},${y})`}>
                  <rect 
                    x={-width/2} 
                    y="-10" 
                    width={width} 
                    height="20" 
                    rx="4" 
                    fill="rgba(0,0,0,0.8)" 
                  />
                  <text 
                    x="0" 
                    y="4" 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    fontSize="10" 
                    fontWeight="bold"
                  >
                    {value}
                  </text>
                </g>
              );
            }}
            axisLine={{ strokeWidth: 1.5, stroke: "#000000" }}
            tickLine={{ strokeWidth: 1.5, stroke: "#000000" }}
            interval={0}
            height={60}
            padding={{ left: 20, right: 20 }}
            dy={10}
            angle={0}
          />
          <YAxis 
            stroke="#000000" 
            tick={props => {
              const { x, y, payload } = props;
              const formattedValue = formatCurrency(payload.value).split(',')[0];
              // Calculate width based on text length
              const width = Math.max(70, formattedValue.length * 9);
              
              return (
                <g transform={`translate(${x},${y})`}>
                  <rect 
                    x={-width} 
                    y="-10" 
                    width={width-5} 
                    height="20" 
                    rx="4" 
                    fill="rgba(0,0,0,0.7)" 
                  />
                  <text 
                    x={-(width/2)-2} 
                    y="4" 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    fontSize="11" 
                    fontWeight="bold"
                  >
                    {formattedValue}
                  </text>
                </g>
              );
            }}
            tickFormatter={(value) => formatCurrency(value).split(',')[0]}
            domain={[0, 'dataMax + 1000000']}
            axisLine={{ strokeWidth: 1.5, stroke: "#000000" }}
            tickLine={{ strokeWidth: 1.5, stroke: "#000000" }}
            width={80}
            padding={{ top: 10, bottom: 10 }}
          />
          <Tooltip content={<EnhancedTooltip />} />
          <Legend 
            wrapperStyle={{ color: "#000000", paddingTop: '10px' }}
            iconType="circle"
            iconSize={10}
            formatter={(value) => {
              return <span style={{ color: "#000000", backgroundColor: "rgba(255,255,255,0.7)", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>{value}</span>;
            }}
          />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            name={name} 
            stroke={strokeColor} 
            strokeWidth={2}
            fill="url(#colorValue)" 
            fillOpacity={1}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Improved Pie Chart with better label handling and normalized percentages
export const ImprovedPieChart = ({ data, formatCurrency }: any) => {
  // Normalize percentages to ensure they add up to 100%
  const normalizeData = (inputData: any[]) => {
    if (!inputData || inputData.length === 0) return [];
    
    // Calculate total value
    const total = inputData.reduce((sum, item) => sum + item.value, 0);
    
    // If total is 0, return empty data to prevent division by zero
    if (total === 0) return inputData;
    
    // Normalize values to ensure percentages add up to 100%
    return inputData.map(item => ({
      ...item,
      // Store original value for display purposes
      originalValue: item.value,
      // Normalized value for percentage calculation
      value: (item.value / total) * 100
    }));
  };

  const normalizedData = normalizeData(data);

  // Custom tooltip component for the pie chart with improved styling
  const EnhancedPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const name = data.name;
      const originalValue = data.payload.originalValue || 0;
      // Format the value without currency symbol
      const formattedValue = originalValue.toLocaleString('id-ID');
      const color = data.color;
      
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></span>
              <span className="font-medium text-base">{name}</span>
            </div>
            <div className="pl-6 flex justify-between gap-4">
              <span className="text-sm">Jumlah:</span>
              <span className="font-bold">{formattedValue}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom renderer for the pie chart labels
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, payload }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentValue = (percent * 100).toFixed(0);
    
    // Only show label if percentage is significant enough
    if (Number(percentValue) < 5) return null;
    
    return (
      <g>
        <rect 
          x={x > cx ? x : x - 30} 
          y={y - 10} 
          width={30} 
          height={20} 
          rx={4} 
          fill="rgba(0,0,0,0.8)" 
        />
        <text 
          x={x > cx ? x + 15 : x - 15} 
          y={y} 
          fill="#ffffff" 
          textAnchor="middle" 
          dominantBaseline="central"
          fontSize={10}
          fontWeight="bold"
        >
          {`${percentValue}%`}
        </text>
      </g>
    );
  };

  return (
    <div className="h-80 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={normalizedData}
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
            {normalizedData.map((entry: any, index: number) => (
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

// Improved Bar Chart for loan distribution
export const ImprovedBarChart = ({ data, dataKey, name, formatCurrency }: any) => {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={(props) => CustomTooltip({ ...props, formatCurrency })} />
          <Legend />
          <Bar 
            dataKey={dataKey} 
            name={name} 
            fill="#8884d8" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Improved Line Chart for registration trends
export const ImprovedLineChart = ({ data, dataKey, name, formatCurrency }: any) => {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={(props) => CustomTooltip({ ...props, formatCurrency })} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            name={name} 
            stroke="#8884d8" 
            strokeWidth={2}
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Improved Dark Line Chart for header sections
export const ImprovedDarkLineChart = ({ data, dataKey, name, formatCurrency }: any) => {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
          <XAxis dataKey="month" stroke="rgba(255,255,255,0.8)" />
          <YAxis stroke="rgba(255,255,255,0.8)" />
          <Tooltip content={(props) => CustomTooltip({ ...props, formatCurrency })} />
          <Legend wrapperStyle={{ color: "#fff" }} />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            name={name} 
            stroke="#ffffff" 
            strokeWidth={2}
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Improved Dual Axis Bar Chart for admin role
export const ImprovedDualAxisBarChart = ({ data, formatCurrency }: any) => {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
          <XAxis dataKey="month" stroke="rgba(255,255,255,0.8)" />
          <YAxis yAxisId="left" orientation="left" stroke="rgba(255,255,255,0.8)" />
          <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.8)" />
          <Tooltip content={(props) => CustomTooltip({ ...props, formatCurrency })} />
          <Legend wrapperStyle={{ color: "#fff" }} />
          <Bar yAxisId="left" dataKey="value" name="Jumlah Pinjaman" fill="rgba(136,132,216,0.8)" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="count" name="Jumlah Pendaftaran" fill="rgba(130,202,157,0.8)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

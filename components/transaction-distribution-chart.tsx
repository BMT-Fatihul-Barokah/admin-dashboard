"use client"

import React, { useEffect, useRef, useState } from 'react'
import { TransactionDistribution } from '@/lib/reports'
import { PieChart, BarChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TransactionDistributionChartProps {
  data: TransactionDistribution[]
  chartType?: 'pie' | 'bar'
  onChartTypeChange?: (type: 'pie' | 'bar') => void
  isLoading?: boolean
  period?: string
}

export function TransactionDistributionChart({
  data,
  chartType = 'pie',
  onChartTypeChange,
  isLoading = false,
  period = "Bulan Ini"
}: TransactionDistributionChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [chartReady, setChartReady] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  // Format category name for display
  const formatCategory = (category: string) => {
    // If the category is already properly formatted (from the new DB function)
    if (category.includes(' ')) {
      return category
    }
    
    // Otherwise format it
    switch (category.toLowerCase()) {
      case 'setoran':
        return 'Setoran'
      case 'penarikan':
        return 'Penarikan'
      case 'pembayaran_pinjaman':
        return 'Pembayaran Pinjaman'
      case 'pencairan_pinjaman':
        return 'Pencairan Pinjaman'
      case 'biaya_admin':
        return 'Biaya Admin'
      case 'lainnya':
        return 'Lainnya'
      default:
        return category
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
    }
  }

  // Define vibrant color palette for the chart
  const CHART_COLORS = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#14b8a6', // teal
    '#f97316'  // orange
  ]

  // Initialize Chart.js once on component mount
  useEffect(() => {
    // Load Chart.js and register all components
    const loadChartJs = async () => {
      try {
        const { Chart, registerables } = await import('chart.js')
        Chart.register(...registerables)
        setChartReady(true)
      } catch (err) {
        console.error('Failed to load Chart.js:', err)
        setError('Failed to load chart library')
      }
    }
    
    loadChartJs()
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [])
  
  // Create or update chart when data changes or chart is ready
  useEffect(() => {
    if (!chartReady || !chartRef.current || data.length === 0 || isLoading) return
    setError(null)
    
    const isDarkMode = resolvedTheme === 'dark'
    
    const createChart = async () => {
      try {
        // Clean up existing chart
        if (chartInstance.current) {
          chartInstance.current.destroy()
          chartInstance.current = null
        }
        
        const canvas = chartRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        // Import Chart class dynamically
        const { Chart } = await import('chart.js')
      
        const labels = data.map((item: TransactionDistribution) => formatCategory(item.category))
        const values = data.map((item: TransactionDistribution) => item.amount)
        
        // Use colors from data if available, or assign from our color palette
        const backgroundColors = data.map((item, index) => {
          // If the item has a color defined, use it
          if (item.color) return item.color
          // Otherwise use our color palette in sequence
          return CHART_COLORS[index % CHART_COLORS.length]
        })
      
        if (chartType === 'pie') {
          chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels,
              datasets: [
                {
                  data: values,
                  backgroundColor: backgroundColors,
                  borderColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                  borderWidth: 2,
                  hoverOffset: 10
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '65%',
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw as number
                      const percentage = data[context.dataIndex].percentage
                      return `${context.label}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`
                    }
                  }
                }
              },
              onClick: (event, elements) => {
                if (elements && elements.length > 0) {
                  const index = elements[0].index
                  setSelectedCategory(selectedCategory === data[index].category ? null : data[index].category)
                } else {
                  setSelectedCategory(null)
                }
              }
            }
          })
        } else {
          chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
              labels,
              datasets: [
                {
                  label: 'Jumlah',
                  data: values,
                  backgroundColor: backgroundColors,
                  borderColor: backgroundColors,
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw as number
                      return `${formatCurrency(value)}`
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    callback: (value) => {
                      return formatCurrency(value as number)
                    }
                  },
                  grid: {
                    color: isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.5)'
                  }
                },
                x: {
                  ticks: {
                    color: isDarkMode ? '#94a3b8' : '#64748b'
                  },
                  grid: {
                    color: isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.5)'
                  }
                }
              }
            }
          })
        }
      } catch (error) {
        console.error('Error creating transaction distribution chart:', error)
        setError('Error creating chart. Please try again later.')
      }
    }
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      createChart()
    }, 100)
    
    return () => {
      clearTimeout(timer)
    }
  }, [data, chartType, chartReady, resolvedTheme, isLoading, selectedCategory])

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle>Distribusi Transaksi</CardTitle>
        <CardDescription>Distribusi transaksi berdasarkan sumber untuk {period}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-[300px] flex items-center justify-center">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <p>Tidak ada data transaksi</p>
              </div>
            ) : error ? (
              <div className="text-center text-destructive">
                <p>{error}</p>
              </div>
            ) : (
              <div className="h-[300px] relative w-full">
                <canvas ref={chartRef} />
              </div>
            )}
          </div>
          <div className="w-full md:w-1/2 md:pl-4 mt-4 md:mt-0">
            <h4 className="text-sm font-medium mb-3">Sumber Transaksi</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {data.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer hover:bg-muted ${selectedCategory === item.category ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === item.category ? null : item.category)}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium">{formatCategory(item.category)}</span>
                  </div>
                  <div className="text-sm font-medium">
                    <div>{formatCurrency(item.amount)}</div>
                    <div className="text-xs text-muted-foreground text-right">{item.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

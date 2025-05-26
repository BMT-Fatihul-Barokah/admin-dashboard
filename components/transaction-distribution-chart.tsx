"use client"

import React, { useEffect, useRef, useState } from 'react'
import { TransactionDistribution } from '@/lib/reports'
import { PieChart, BarChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

interface TransactionDistributionChartProps {
  data: TransactionDistribution[]
  chartType?: 'pie' | 'bar'
  onChartTypeChange?: (type: 'pie' | 'bar') => void
}

export function TransactionDistributionChart({
  data,
  chartType = 'pie',
  onChartTypeChange
}: TransactionDistributionChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [chartReady, setChartReady] = useState(false)
  const { resolvedTheme } = useTheme()

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  // Format category name for display
  const formatCategory = (category: string) => {
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
    }
  }

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
    if (!chartReady || !chartRef.current || data.length === 0) return
    setError(null)
    
    // Get colors based on theme
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
      const backgroundColors = data.map((item: TransactionDistribution) => item.color)
      
      if (chartType === 'pie') {
        chartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: backgroundColors,
                borderColor: 'white',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: 'circle',
                  color: isDarkMode ? '#e2e8f0' : '#0f172a'
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number
                    const percentage = ((value / values.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)
                    return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
                  }
                }
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
  }, [data, chartType, chartReady, resolvedTheme])

  // If no data, show placeholder
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Tidak ada data distribusi transaksi
      </div>
    )
  }

  return (
    <div className="h-[300px] relative">
      <canvas ref={chartRef} />
    </div>
  )
}

"use client"

import React, { useEffect, useRef, useState } from 'react'
import { FinancialTrend } from '@/lib/reports'

// Use dynamic import for Chart.js
const FinancialChart = () => {
  const [chartLoaded, setChartLoaded] = useState(false)
  
  useEffect(() => {
    // Load Chart.js dynamically
    import('chart.js').then(({ Chart, registerables }) => {
      // Register all Chart.js components
      Chart.register(...registerables)
      setChartLoaded(true)
    })
  }, [])
  
  return chartLoaded
}

interface FinancialTrendsChartProps {
  data: FinancialTrend[]
}

export function FinancialTrendsChart({ data }: FinancialTrendsChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [chartReady, setChartReady] = useState(false)
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
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
        
        // Prepare data
        const labels = data.map((item: FinancialTrend) => item.month)
        const incomeData = data.map((item: FinancialTrend) => item.income)
        const expenseData = data.map((item: FinancialTrend) => item.expense)
        
        // Import Chart class dynamically
        const { Chart } = await import('chart.js')
        
        // Create new chart
        chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Pendapatan',
              data: incomeData,
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.2
            },
            {
              label: 'Pengeluaran',
              data: expenseData,
              borderColor: '#F44336',
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw as number
                  return `${context.dataset.label}: ${formatCurrency(value)}`
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  return formatCurrency(value as number)
                }
              }
            }
          }
        }
      })
      } catch (error) {
        console.error('Error creating financial trends chart:', error)
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
  }, [data, chartReady])

  // If no data, show placeholder
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Tidak ada data tren keuangan
      </div>
    )
  }

  return (
    <div className="h-[300px] relative">
      <canvas ref={chartRef} />
    </div>
  )
}

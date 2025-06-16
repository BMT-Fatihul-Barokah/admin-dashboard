"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface RupiahInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | undefined
  onChange: (value: number | undefined) => void
  placeholder?: string
  className?: string
}

export function RupiahInput({
  value,
  onChange,
  placeholder = "Masukkan jumlah",
  className,
  ...props
}: RupiahInputProps) {
  const [displayValue, setDisplayValue] = useState("")

  // Format the value when it changes externally
  useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(formatRupiah(value.toString()))
    } else {
      setDisplayValue("")
    }
  }, [value])

  // Format a string as Rupiah (add thousand separators)
  const formatRupiah = (str: string): string => {
    // Remove non-numeric characters
    const numericValue = str.replace(/\D/g, "")
    
    // Format with thousand separators
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Remove all non-numeric characters
    const numericValue = inputValue.replace(/\D/g, "")
    
    // Format for display
    setDisplayValue(formatRupiah(numericValue))
    
    // Pass the numeric value to the parent component
    const parsedValue = numericValue === "" ? undefined : Number(numericValue)
    onChange(parsedValue)
  }

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      className={className}
      onKeyDown={(e) => {
        // Prevent mathematical operators
        if (['+', '-', '*', '/', 'e', 'E'].includes(e.key)) {
          e.preventDefault()
        }
      }}
      {...props}
    />
  )
}

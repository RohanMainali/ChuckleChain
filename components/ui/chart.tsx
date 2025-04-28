"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ChartProps {
  data: Array<{ name: string; total: number }>
  categories: string[]
  index: string
  colors: string[]
  valueFormatter?: (value: number) => string
  className?: string
}

const colorMap: Record<string, string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  purple: "#a855f7",
  pink: "#ec4899",
  indigo: "#6366f1",
  gray: "#6b7280",
}

export function LineChart({
  data,
  categories,
  index,
  colors,
  valueFormatter = (value) => `${value}`,
  className,
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions
    const width = canvas.width
    const height = canvas.height
    const padding = { top: 20, right: 20, bottom: 40, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Find min and max values
    let minValue = Number.MAX_VALUE
    let maxValue = Number.MIN_VALUE

    data.forEach((item) => {
      categories.forEach((category) => {
        const value = item.total
        minValue = Math.min(minValue, value)
        maxValue = Math.max(maxValue, value)
      })
    })

    // Add some padding to the min/max values
    const valueRange = maxValue - minValue
    minValue = Math.max(0, minValue - valueRange * 0.1)
    maxValue = maxValue + valueRange * 0.1

    // Draw axes
    ctx.strokeStyle = "#666"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, height - padding.bottom)
    ctx.lineTo(width - padding.right, height - padding.bottom)
    ctx.stroke()

    // Draw y-axis labels
    ctx.fillStyle = "#888"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    const yLabelCount = 5
    for (let i = 0; i <= yLabelCount; i++) {
      const value = minValue + ((maxValue - minValue) * (yLabelCount - i)) / yLabelCount
      const y = padding.top + (i * chartHeight) / yLabelCount
      ctx.fillText(valueFormatter(Math.round(value)), padding.left - 10, y)

      // Draw horizontal grid lines
      ctx.strokeStyle = "#333"
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // Draw x-axis labels
    ctx.fillStyle = "#888"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    const xStep = chartWidth / (data.length - 1)
    data.forEach((item, i) => {
      const x = padding.left + i * xStep
      ctx.fillText(item.name, x, height - padding.bottom + 10)
    })

    // Draw data lines
    categories.forEach((category, categoryIndex) => {
      const color = colorMap[colors[categoryIndex]] || "#3b82f6"
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((item, i) => {
        const x = padding.left + i * xStep
        const normalizedValue = (item.total - minValue) / (maxValue - minValue)
        const y = height - padding.bottom - normalizedValue * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw data points
      ctx.fillStyle = color
      data.forEach((item, i) => {
        const x = padding.left + i * xStep
        const normalizedValue = (item.total - minValue) / (maxValue - minValue)
        const y = height - padding.bottom - normalizedValue * chartHeight

        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      })
    })

    // Draw legend
    const legendX = padding.left
    const legendY = padding.top - 10

    categories.forEach((category, i) => {
      const color = colorMap[colors[i]] || "#3b82f6"
      const x = legendX + i * 100

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.rect(x, legendY, 15, 15)
      ctx.fill()

      ctx.fillStyle = "#888"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(category, x + 20, legendY + 7)
    })
  }, [data, categories, colors, valueFormatter, mounted, index])

  if (!mounted) {
    return <div className={cn("h-[350px] w-full bg-muted/20 animate-pulse rounded-md", className)} />
  }

  return (
    <div className={cn("relative", className)}>
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto" />
    </div>
  )
}

export function BarChart({
  data,
  categories,
  index,
  colors,
  valueFormatter = (value) => `${value}`,
  className,
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions
    const width = canvas.width
    const height = canvas.height
    const padding = { top: 20, right: 20, bottom: 40, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Find min and max values
    let minValue = Number.MAX_VALUE
    let maxValue = Number.MIN_VALUE

    data.forEach((item) => {
      categories.forEach((category) => {
        const value = item.total
        minValue = Math.min(minValue, value)
        maxValue = Math.max(maxValue, value)
      })
    })

    // Add some padding to the min/max values
    const valueRange = maxValue - minValue
    minValue = Math.max(0, minValue - valueRange * 0.1)
    maxValue = maxValue + valueRange * 0.1

    // Draw axes
    ctx.strokeStyle = "#666"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, height - padding.bottom)
    ctx.lineTo(width - padding.right, height - padding.bottom)
    ctx.stroke()

    // Draw y-axis labels
    ctx.fillStyle = "#888"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    const yLabelCount = 5
    for (let i = 0; i <= yLabelCount; i++) {
      const value = minValue + ((maxValue - minValue) * (yLabelCount - i)) / yLabelCount
      const y = padding.top + (i * chartHeight) / yLabelCount
      ctx.fillText(valueFormatter(Math.round(value)), padding.left - 10, y)

      // Draw horizontal grid lines
      ctx.strokeStyle = "#333"
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // Calculate bar width
    const barGroupWidth = chartWidth / data.length
    const barWidth = (barGroupWidth * 0.8) / categories.length
    const barGroupPadding = barGroupWidth * 0.1

    // Draw bars and x-axis labels
    data.forEach((item, itemIndex) => {
      const groupX = padding.left + itemIndex * barGroupWidth + barGroupPadding

      // Draw x-axis label
      ctx.fillStyle = "#888"
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillText(item.name, groupX + (barGroupWidth - barGroupPadding * 2) / 2, height - padding.bottom + 10)

      // Draw bars for each category
      categories.forEach((category, categoryIndex) => {
        const value = item.total
        const normalizedValue = (value - minValue) / (maxValue - minValue)
        const barHeight = normalizedValue * chartHeight

        const x = groupX + categoryIndex * barWidth
        const y = height - padding.bottom - barHeight

        const color = colorMap[colors[categoryIndex]] || "#3b82f6"
        ctx.fillStyle = color
        ctx.fillRect(x, y, barWidth, barHeight)
      })
    })

    // Draw legend
    const legendX = padding.left
    const legendY = padding.top - 10

    categories.forEach((category, i) => {
      const color = colorMap[colors[i]] || "#3b82f6"
      const x = legendX + i * 100

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.rect(x, legendY, 15, 15)
      ctx.fill()

      ctx.fillStyle = "#888"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(category, x + 20, legendY + 7)
    })
  }, [data, categories, colors, valueFormatter, mounted, index])

  if (!mounted) {
    return <div className={cn("h-[350px] w-full bg-muted/20 animate-pulse rounded-md", className)} />
  }

  return (
    <div className={cn("relative", className)}>
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto" />
    </div>
  )
}


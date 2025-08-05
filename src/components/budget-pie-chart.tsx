"use client"

import * as React from "react"
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

export interface BudgetItem {
    name: string;
    value: number;
}

interface BudgetPieChartProps {
    data: BudgetItem[];
}

const COLORS = ["#FBCFE8", "#F0ABFC", "#E9D5FF", "#C4B5FD", "#A5B4FC", "#93C5FD", "#7DD3FC", "#67E8F9", "#99F6E4", "#A7F3D0"];

export function BudgetPieChart({ data }: BudgetPieChartProps) {
  const chartConfig = data.reduce((acc, item, index) => {
    acc[item.name.toLowerCase()] = {
        label: item.name,
        color: COLORS[index % COLORS.length]
    };
    return acc;
  }, {} as any);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[250px]"
    >
      <ResponsiveContainer>
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            strokeWidth={5}
          >
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

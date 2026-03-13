"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DataPoint {
  date: string;
  clicks: number;
  impressions: number;
  position: number;
}

interface InterventionMarker {
  date: string;
  description: string;
  type: string;
}

interface PerformanceChartProps {
  data: DataPoint[];
  interventions?: InterventionMarker[];
}

export function PerformanceChart({
  data,
  interventions = [],
}: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Brak danych
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(d) => {
            const date = new Date(d);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          }}
        />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
        <YAxis
          yAxisId="right"
          orientation="right"
          reversed
          tick={{ fontSize: 11 }}
          domain={[1, "auto"]}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
          formatter={(value, name) => {
            const v = Number(value);
            if (name === "position") return [v.toFixed(1), "Avg Position"];
            return [v, name === "clicks" ? "Clicks" : "Impressions"];
          }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="clicks"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="impressions"
          stroke="hsl(var(--chart-2))"
          strokeWidth={1.5}
          dot={false}
          opacity={0.6}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="position"
          stroke="hsl(var(--chart-3))"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 5"
        />
        {/* Intervention markers */}
        {interventions.map((intv, i) => (
          <ReferenceLine
            key={i}
            x={intv.date}
            yAxisId="left"
            stroke="hsl(var(--destructive))"
            strokeDasharray="3 3"
            label={{
              value: "!",
              position: "top",
              fill: "hsl(var(--destructive))",
              fontSize: 12,
            }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

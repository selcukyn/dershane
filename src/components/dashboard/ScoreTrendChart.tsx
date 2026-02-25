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
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import type { TrendPoint } from "@/types/analytics";
import { formatLgsScore } from "@/lib/analytics";

interface ScoreTrendChartProps {
  trend: TrendPoint[];
}

interface TooltipPayload {
  value: number;
  payload: TrendPoint & { lgsScore: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-300 text-xs mb-1">{data.payload.examName}</p>
      <p className="text-white font-bold text-lg">
        {formatLgsScore(data.value)}
      </p>
    </div>
  );
}

export function ScoreTrendChart({ trend }: ScoreTrendChartProps) {
  if (trend.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        Henüz sınav verisi yok
      </div>
    );
  }

  const chartData = trend.map((point) => ({
    ...point,
    dateLabel: format(parseISO(point.examDate), "d MMM", { locale: tr }),
  }));

  const scores = trend.map((p) => p.lgsScore);
  const minScore = Math.max(0, Math.min(...scores) - 20);
  const maxScore = Math.min(500, Math.max(...scores) + 20);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          axisLine={{ stroke: "#334155" }}
          tickLine={false}
        />
        <YAxis
          domain={[minScore, maxScore]}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          axisLine={{ stroke: "#334155" }}
          tickLine={false}
          tickFormatter={(v: number) => v.toFixed(0)}
        />
        <Tooltip content={<CustomTooltip />} />
        {trend.length >= 2 && (
          <ReferenceLine
            y={scores[scores.length - 1]}
            stroke="#3b82f6"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />
        )}
        <Line
          type="monotone"
          dataKey="lgsScore"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ fill: "#3b82f6", r: 5, strokeWidth: 2, stroke: "#1e3a5f" }}
          activeDot={{ r: 7, fill: "#60a5fa" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type TemplateStatsChartComponentProps = {
  data: Array<{ date: string; count: number }>;
};

export function TemplateStatsChartComponent({
  data,
}: TemplateStatsChartComponentProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "dashboard.charts.templateTimeline",
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [primaryColor, setPrimaryColor] = useState("hsl(221.2, 83.2%, 53.3%)");

  useEffect(() => {
    if (containerRef.current) {
      // Create a temporary element to get computed primary color
      const tempEl = document.createElement("div");
      tempEl.className = "text-primary";
      tempEl.style.position = "absolute";
      tempEl.style.visibility = "hidden";
      document.body.appendChild(tempEl);

      const computedColor = getComputedStyle(tempEl).color;
      document.body.removeChild(tempEl);

      if (computedColor && computedColor !== "rgba(0, 0, 0, 0)") {
        setPrimaryColor(computedColor);
      }
    }
  }, []);

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count: item.count,
  }));

  return (
    <Card ref={containerRef}>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer height={300} width="100%">
          <AreaChart
            data={chartData}
            margin={{ bottom: 5, left: 5, right: 5, top: 5 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.9} />
                <stop offset="50%" stopColor={primaryColor} stopOpacity={0.5} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--muted))" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Area
              dataKey="count"
              fill="url(#colorCount)"
              stroke={primaryColor}
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

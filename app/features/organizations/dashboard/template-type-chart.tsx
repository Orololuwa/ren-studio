import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type TemplateTypeChartComponentProps = {
  data: { resume: number; invoice: number; receipt: number };
};

const COLORS = [
  "hsl(221.2 83.2% 53.3%)", // Blue for resume
  "hsl(142.1 76.2% 36.3%)", // Green for invoice
  "hsl(346.8 77.2% 49.8%)", // Red/Pink for receipt
];

export function TemplateTypeChartComponent({
  data,
}: TemplateTypeChartComponentProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "dashboard.charts.templateTypes",
  });

  const chartData = [
    { name: t("resume"), value: data.resume },
    { name: t("invoice"), value: data.invoice },
    { name: t("receipt"), value: data.receipt },
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer height={300} width="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={chartData}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
              }
              outerRadius={80}
            >
              {chartData.map((entry, index) => (
                <Cell fill={COLORS[index % COLORS.length]} key={entry.name} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

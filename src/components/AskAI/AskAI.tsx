// src/pages/AskAI.tsx

import React, { useMemo, useState } from "react";
import {
  Send,
  AlertTriangle,
  FileText,
  History,
  Bot,
  WandSparkles,
  Loader2,
  BarChart3,
  MapPinned,
  Lightbulb,
  TrendingUp,
  PieChart as PieChartIcon,
  Table2,
  Presentation,
  FileDown,
  Trophy,
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { askGenie, buildGenieReport } from "../../services/GenieAPI";
import type {
  GenieStructuredReport,
  GenieTableData,
  GenieResponse,
  GenieImageAsset,
  RankingPayload,
} from "../../services/GenieAPI";
import ExportPptDialog from "../ExportPptDialog";
import { buildSyntheticReport } from "../../services/syntheticReport";
import { exportReportToPpt } from "../../services/pptExport";
import { exportReportToWord } from "../../services/wordExport";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const askSuggestions = [
  "Top stale-loss sites this month",
  "Damages versus forecast by site",
  "Products driving stales and damages",
  "Compliance-related loss patterns",
  "Inventory variance trends by site",
];

const reportSuggestions = [
  "Executive loss summary for North America",
  "Site-wise loss analysis with drivers",
  "Product and site waste breakdown",
  "Top and bottom sites for stales and damages",
];

const recentPrompts = [
  "Summarize stales trend for the last 3 months",
  "Which North America site had the highest damages this week?",
  "Give me the top 5 products driving inventory variance",
];

type Mode = "ask" | "report";

type UiResult =
  | { kind: "none" }
  | { kind: "text"; text: string; chartImage?: GenieImageAsset | null }
  | {
      kind: "table";
      text?: string;
      table: GenieTableData;
      chartImage?: GenieImageAsset | null;
      ranking?: RankingPayload | null;
    }
  | { kind: "report"; report: GenieStructuredReport }
  | { kind: "error"; message: string };

type SmartChartType =
  | "line"
  | "bar"
  | "grouped-bar"
  | "grouped-bar-dual-axis"
  | "stacked-bar"
  | "doughnut"
  | "table"
  | "none";

const chartPalette = [
  "#2563eb",
  "#0ea5e9",
  "#14b8a6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#6366f1",
];

const blue = "#2563eb";
const blueSoft = "rgba(37, 99, 235, 0.14)";

// Safely strip $, commas, and spaces before checking if it's a number
const isNumeric = (value: unknown) => {
  const cleaned = String(value ?? "").replace(/[$,]/g, "").trim();
  return cleaned !== "" && !Number.isNaN(Number(cleaned));
};

// Guarantee a valid number is returned (fallback to 0 instead of NaN)
const toNumber = (value: unknown) => {
  const cleaned = String(value ?? "").replace(/[$,]/g, "").trim();
  const num = Number(cleaned);
  return Number.isNaN(num) ? 0 : num;
};

const prettifyLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatReadableNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

const looksLikeTimeColumn = (name: string) => {
  const lower = name.toLowerCase();
  return ["date", "day", "week", "month", "quarter", "year", "period", "time"].some(
    (token) => lower.includes(token)
  );
};

const splitIntoBullets = (text: string, maxItems = 5): string[] => {
  if (!text) return [];

  let pieces = text
    .split(/\n+/)
    .map((item) => item.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);

  if (pieces.length <= 1) {
    pieces = text
      .replace(/\s+/g, " ")
      .trim()
      .split(/(?<=[.?!])\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (pieces.length <= 1 && pieces[0].includes(",")) {
    pieces = pieces[0]
      .split(/,\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 25);
  }

  return pieces.slice(0, maxItems);
};

const getNumericColumns = (table: GenieTableData) =>
  table.columns
    .map((column, index) => {
      const validCount = table.rows.filter((row) => isNumeric(row[index])).length;
      return { column, index, validCount };
    })
    .filter((item) => item.validCount > 0);

const getCategoricalColumns = (table: GenieTableData) =>
  table.columns
    .map((column, index) => ({ column, index }))
    .filter((item) => {
      const sample = table.rows.find((row) => {
        const value = row[item.index];
        return value !== null && value !== undefined && String(value).trim() !== "";
      })?.[item.index];

      return !isNumeric(String(sample ?? ""));
    });

const looksLikeDateValue = (value: string) => {
  const v = String(value).trim();
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(v) ||
    /^\d{2}\/\d{2}\/\d{4}$/.test(v) ||
    /^\d{4}\/\d{2}\/\d{2}$/.test(v) ||
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(v)
  );
};

const isChronologicalColumn = (table: GenieTableData, columnIndex: number) => {
  const values = table.rows.map((row) => String(row[columnIndex] ?? "").trim()).filter(Boolean);
  if (!values.length) return false;

  const uniqueValues = new Set(values);
  if (uniqueValues.size <= 1) return false;

  const samples = values.slice(0, 12);
  return samples.some(looksLikeDateValue);
};

const isVarianceMetric = (name: string): boolean => {
  const lower = name.toLowerCase().trim();
  return (
    lower.includes("variance") ||
    lower.includes("var ") ||
    lower.includes("var_") ||
    lower === "variance" ||
    lower.includes("movement") || 
    lower.includes("qty") ||
    lower.includes("volume")
  );
};

const getColumnMagnitudeStats = (
  table: GenieTableData,
  numericColumns: { column: string; index: number; validCount: number }[]
) => {
  return numericColumns.map((col) => {
    const values = table.rows
      .map((row) => toNumber(row[col.index]))
      .filter((v) => !Number.isNaN(v));

    if (!values.length) {
      return { column: col.column, index: col.index, maxAbs: 0, hasNegative: false };
    }

    const maxAbs = Math.max(...values.map((v) => Math.abs(v)));
    const hasNegative = values.some((v) => v < 0);

    return { column: col.column, index: col.index, maxAbs, hasNegative };
  });
};

const hasExtremeScaleMismatch = (
  table: GenieTableData,
  numericColumns: { column: string; index: number; validCount: number }[]
): boolean => {
  if (numericColumns.length < 2) return false;
  const stats = getColumnMagnitudeStats(table, numericColumns);
  const maxAbsValues = stats.map((s) => s.maxAbs).filter((v) => v > 0);
  if (maxAbsValues.length < 2) return false;

  const min = Math.min(...maxAbsValues);
  const max = Math.max(...maxAbsValues);
  return min > 0 && max / min >= 20;
};

const getExactMetricLabel = (columnName: string): string => {
  return prettifyLabel(columnName);
};

const detectSmartChartType = (table?: GenieTableData | null): SmartChartType => {
  if (!table || !table.rows.length || !table.columns.length) return "none";
  if (table.rows.length <= 1 || table.columns.length <= 1) return "table";

  const numericColumns = getNumericColumns(table);
  const categoricalColumns = getCategoricalColumns(table);
  if (!numericColumns.length) return "table";

  // THE FIX: Time-Series gets absolute priority over everything else
  const timeColumnIndex = table.columns.findIndex((col) => looksLikeTimeColumn(col));
  const isTimeSeries = timeColumnIndex >= 0 && isChronologicalColumn(table, timeColumnIndex);

  if (isTimeSeries) {
    return "line";
  }

  if (categoricalColumns.length >= 2 && numericColumns.length >= 1) {
    return "stacked-bar";
  }

  if (categoricalColumns.length >= 1 && numericColumns.length >= 2) {
    return "grouped-bar";
  }

  if (categoricalColumns.length >= 1 && numericColumns.length === 1) {
    if (table.rows.length <= 5) return "doughnut";
    return "bar";
  }

  return "table";
};

type LineModel = {
  chartType: "line";
  labels: string[];
  datasets: { label: string; data: number[] }[];
};

type GroupedBarModel = {
  chartType: "grouped-bar";
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderRadius: number;
    borderSkipped: false;
  }[];
};

type GroupedBarDualAxisModel = {
  chartType: "grouped-bar-dual-axis";
  labels: string[];
  leftAxisDatasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderRadius: number;
    borderSkipped: false;
    yAxisID: "y";
  }[];
  rightAxisDatasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderRadius: number;
    borderSkipped: false;
    yAxisID: "y1";
  }[];
};

type StackedBarModel = {
  chartType: "stacked-bar";
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderRadius: number;
  }[];
};

type BarOrDoughnutModel = {
  chartType: "bar" | "doughnut";
  labels: string[];
  values: number[];
  label: string;
};

type TableModel = { chartType: "table" | "none" };

type SmartChartModel = LineModel | GroupedBarModel | GroupedBarDualAxisModel | StackedBarModel | BarOrDoughnutModel | TableModel;

const buildChartModel = (table: GenieTableData): SmartChartModel => {
  const chartType = detectSmartChartType(table);
  const numericColumns = getNumericColumns(table);
  const categoricalColumns = getCategoricalColumns(table);

  if (!numericColumns.length) return { chartType: "table" } as SmartChartModel;

  // MULTI-LINE TIME SERIES PIVOT LOGIC
  if (chartType === "line") {
    const timeCat = categoricalColumns.find(c => looksLikeTimeColumn(c.column)) || categoricalColumns[0];
    const seriesCat = categoricalColumns.find(c => c.index !== timeCat.index);
    const metric = numericColumns[0]; 

    const uniqueX = Array.from(new Set(table.rows.map(r => String(r[timeCat.index]))));
    let datasets = [];

    if (seriesCat) {
      // MULTI-LINE: One line per Site
      const uniqueSeries = Array.from(new Set(table.rows.map(r => String(r[seriesCat.index]))));
      datasets = uniqueSeries.map((seriesLabel) => {
        const data = uniqueX.map(xLabel => {
          const rowMatch = table.rows.find(
            (row) => row[timeCat.index] === xLabel && row[seriesCat.index] === seriesLabel
          );
          return rowMatch ? toNumber(rowMatch[metric.index]) : 0;
        });
        return { label: prettifyLabel(seriesLabel), data };
      });
    } else {
      // SINGLE-LINE: Plot all numeric columns separately
      datasets = numericColumns.slice(0, 3).map((numCol) => {
        const data = uniqueX.map(xLabel => {
          const rowMatch = table.rows.find(row => row[timeCat.index] === xLabel);
          return rowMatch ? toNumber(rowMatch[numCol.index]) : 0;
        });
        return { label: getExactMetricLabel(numCol.column), data };
      });
    }

    return { chartType, labels: uniqueX, datasets };
  }

  if (chartType === "stacked-bar") {
    const xCategory = categoricalColumns[0];
    let seriesCategory = categoricalColumns[1];

    const preferredSeries = categoricalColumns.find(c => 
      /causal|driver|issue|reason/i.test(c.column)
    );

    if (preferredSeries) {
      seriesCategory = preferredSeries;
    } else {
      const validSeries = categoricalColumns.slice(1).find(c => {
        const uniqueVals = new Set(table.rows.map(r => r[c.index]));
        return uniqueVals.size > 1; 
      });
      if (validSeries) seriesCategory = validSeries;
    }
    
    const metric = numericColumns.find((c) => {
      const lower = c.column.toLowerCase();
      return !lower.includes('rank') && !lower.includes('total');
    }) || numericColumns[0];

    const uniqueX = Array.from(new Set(table.rows.map((row) => String(row[xCategory.index]))));
    const uniqueSeries = Array.from(new Set(table.rows.map((row) => String(row[seriesCategory.index]))));

    // --- NEW PIVOT LOGIC ---
    // If there is only 1 item on the X-axis (e.g., 1 Site), a stacked bar is useless.
    // Pivot it so the Causes become the main categories!
    if (uniqueX.length === 1) {
      const aggregatedValues: Record<string, number> = {};
      table.rows.forEach(r => {
        const sLabel = String(r[seriesCategory.index]);
        const val = toNumber(r[metric.index]);
        aggregatedValues[sLabel] = (aggregatedValues[sLabel] || 0) + val;
      });

      const labels = Object.keys(aggregatedValues).map(prettifyLabel);
      const values = Object.values(aggregatedValues);
      
      return {
        chartType: labels.length <= 5 ? "doughnut" : "bar",
        labels,
        values,
        label: getExactMetricLabel(metric.column)
      };
    }
    // -----------------------

    const datasets = uniqueSeries.map((seriesLabel, index) => {
      const data = uniqueX.map((xLabel) => {
        const rowMatch = table.rows.find(
          (row) => row[xCategory.index] === xLabel && row[seriesCategory.index] === seriesLabel
        );
        return rowMatch ? toNumber(rowMatch[metric.index]) : 0;
      });

      return {
        label: prettifyLabel(seriesLabel),
        data,
        backgroundColor: chartPalette[index % chartPalette.length],
        borderRadius: 0,
      };
    });

    return { chartType, labels: uniqueX, datasets };
  }

  if (chartType === "grouped-bar") {
    const category = categoricalColumns[0];
    const metricsToUse = numericColumns.slice(0, 4);

    if (hasExtremeScaleMismatch(table, metricsToUse)) {
      const leftMetrics = metricsToUse.filter(
        (m) => !isVarianceMetric(m.column)
      );
      const rightMetrics = metricsToUse.filter((m) =>
        isVarianceMetric(m.column)
      );

      if (leftMetrics.length > 0 && rightMetrics.length > 0) {
        return {
          chartType: "grouped-bar-dual-axis",
          labels: table.rows.map((row) => row[category.index]),
          leftAxisDatasets: leftMetrics.map((metric, index) => ({
            label: getExactMetricLabel(metric.column),
            data: table.rows.map((row) => toNumber(row[metric.index])),
            backgroundColor: chartPalette[index % chartPalette.length],
            borderRadius: 8,
            borderSkipped: false as const,
            yAxisID: "y",
          })),
          rightAxisDatasets: rightMetrics.map((metric, index) => ({
            label: getExactMetricLabel(metric.column),
            data: table.rows.map((row) => toNumber(row[metric.index])),
            backgroundColor: chartPalette[(leftMetrics.length + index) % chartPalette.length],
            borderRadius: 8,
            borderSkipped: false as const,
            yAxisID: "y1",
          })),
        };
      }
    }

    return {
      chartType: "grouped-bar",
      labels: table.rows.map((row) => row[category.index]),
      datasets: metricsToUse.map((metric, index) => ({
        label: getExactMetricLabel(metric.column),
        data: table.rows.map((row) => toNumber(row[metric.index])),
        backgroundColor: chartPalette[index % chartPalette.length],
        borderRadius: 8,
        borderSkipped: false as const,
      })),
    };
  }

  if (chartType === "bar" || chartType === "doughnut") {
    const category = categoricalColumns[0];
    const metric = numericColumns[0];

    return {
      chartType,
      labels: table.rows.map((row) => row[category.index]),
      values: table.rows.map((row) => toNumber(row[metric.index])),
      label: getExactMetricLabel(metric.column),
    };
  }

  return { chartType: "table" } as SmartChartModel;
};

const buildGroupedBarChartTitle = (datasets: { label: string }[]) => {
  const labels = datasets.map((dataset) => dataset.label);
  if (!labels.length) return "Grouped bar chart";
  if (labels.length === 1) return `${labels[0]} by Site`;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]} by Site`;

  const last = labels.pop();
  return `${labels.join(", ")}, and ${last} by Site`;
};

const getSectionInsight = (table?: GenieTableData | null): string | null => {
  if (!table) return null;

  const model = buildChartModel(table);
  if (!("labels" in model) || (!("values" in model) && !("datasets" in model))) return null;
  if (!model.labels) return null;

  const labels = model.labels as string[];
  const values = "values" in model
    ? (model.values as number[])
    : ((model as LineModel | GroupedBarModel).datasets?.[0]?.data ?? []);

  if (!values.length || !labels.length) return null;

  const maxValue = Math.max(...values);
  const maxIndex = values.findIndex((v) => v === maxValue);
  const total = values.reduce((sum: number, value: number) => sum + value, 0);

  if (model.chartType === "line") {
    return `${labels[maxIndex]} shows the highest observed value at ${formatReadableNumber(
      maxValue
    )}.`;
  }

  if (model.chartType === "bar" || model.chartType === "doughnut") {
    const share = total > 0 ? (maxValue / total) * 100 : 0;
    return `${labels[maxIndex]} is the largest contributor at ${formatReadableNumber(
      maxValue
    )}${share ? ` (${share.toFixed(1)}% of shown total)` : ""}.`;
  }

  return null;
};

const TableView: React.FC<{ table: GenieTableData }> = ({ table }) => (
  <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-200">
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {table.columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left font-medium text-slate-700"
              >
                {getExactMetricLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="bg-white">
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-slate-700"
                >
                  {isNumeric(cell) ? formatReadableNumber(toNumber(cell)) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const KpiStrip: React.FC<{ table?: GenieTableData | null; isGlobal?: boolean }> = ({ table, isGlobal = false }) => {
  if (!table) return null;

  const numericColumns = getNumericColumns(table);
  if (!numericColumns.length) return null;

  const kpis = numericColumns.slice(0, 4).map((item) => {
    const firstNumericValue = table.rows.find((row) => isNumeric(row[item.index]))?.[
      item.index
    ];
    const value = firstNumericValue ? toNumber(firstNumericValue) : 0;
    return { label: getExactMetricLabel(item.column), value };
  });

  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 ${isGlobal ? '' : 'mb-5'}`}>
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`rounded-2xl px-4 py-4 ring-1 ring-slate-200 ${
            isGlobal ? "bg-white shadow-sm" : "bg-slate-50"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {kpi.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {formatCompactNumber(kpi.value)}
          </p>
        </div>
      ))}
    </div>
  );
};

const InsightList: React.FC<{
  text: string;
  extraInsight?: string | null;
}> = ({ text, extraInsight }) => {
  const bullets = splitIntoBullets(text, 5);
  const items = extraInsight ? [extraInsight, ...bullets.slice(0, 4)] : bullets;

  if (!items.length) return null;

  return (
    <ul className="mb-5 space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
          <span className="text-sm leading-6 text-slate-700">{item}</span>
        </li>
      ))}
    </ul>
  );
};

const RankingView: React.FC<{
  ranking: RankingPayload;
  table?: GenieTableData | null;
}> = ({ ranking, table }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Ranked output
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              {ranking.title || "Top results"}
            </h3>
          </div>
        </div>

        <div className="space-y-3">
          {ranking.items.map((item) => (
            <div
              key={`${item.rank}-${item.label}`}
              className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {item.rank}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.label}
                  </p>
                </div>
              </div>
              <p className="ml-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {ranking.insight && (
          <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-4 ring-1 ring-blue-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              Insight
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{ranking.insight}</p>
          </div>
        )}
      </div>

      {table && (
        <details className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            View supporting table
          </summary>
          <TableView table={table} />
        </details>
      )}
    </div>
  );
};

const GenieVisualizationCard: React.FC<{
  image?: GenieImageAsset | null;
  title?: string;
}> = ({ image, title = "Genie visualization" }) => {
  const src = image?.data_url || image?.url;
  if (!src) return null;

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="mb-3 flex items-center gap-2 text-slate-700">
        <BarChart3 className="h-4 w-4 text-slate-700" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        <img
          src={src}
          alt={image?.caption || title}
          className="h-auto w-full object-contain"
        />
      </div>
      {image?.caption && (
        <p className="mt-3 text-xs leading-5 text-slate-500">{image.caption}</p>
      )}
    </div>
  );
};

const SmartChart: React.FC<{ table?: GenieTableData | null }> = ({ table }) => {
  if (!table) return null;

  const chartTable =
    table.rows.length > 40
      ? { columns: table.columns, rows: table.rows.slice(0, 40) }
      : table;

  const model = buildChartModel(chartTable);

  if (model.chartType === "table" || model.chartType === "none") {
    return (
      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <div className="mb-2 flex items-center gap-2 text-slate-600">
          <Table2 className="h-4 w-4" />
          <span className="text-sm font-medium">Table view retained</span>
        </div>
        <TableView table={table} />
      </div>
    );
  }

  if (model.chartType === "stacked-bar") {
    const labels = model.labels as string[];
    const datasets = model.datasets as StackedBarModel["datasets"];

    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <BarChart3 className="h-4 w-4 text-slate-700" />
          <span className="text-sm font-medium">Composition by Site</span>
        </div>
        <div className="h-[380px]">
          <Bar
            data={{ labels, datasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: "bottom" },
              },
              scales: {
                x: {
                  stacked: true,
                  ticks: { color: "#334155", maxRotation: 45, minRotation: 45 },
                  grid: { display: false },
                },
                y: {
                  stacked: true,
                  ticks: { color: "#475569" },
                  grid: { color: "#e2e8f0" },
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

  if (model.chartType === "grouped-bar") {
    const labels = model.labels as string[];
    const datasets = model.datasets as {
      label: string;
      data: number[];
      backgroundColor: string;
      borderRadius: number;
      borderSkipped: false;
    }[];
    const title = buildGroupedBarChartTitle(datasets);

    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <BarChart3 className="h-4 w-4 text-slate-700" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="h-[380px]">
          <Bar
            data={{ labels, datasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: "bottom" },
              },
              scales: {
                x: {
                  ticks: { color: "#334155", maxRotation: 45, minRotation: 45 },
                  grid: { display: false },
                },
                y: {
                  ticks: { color: "#475569" },
                  grid: { color: "#e2e8f0" },
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

  if (model.chartType === "grouped-bar-dual-axis") {
    const labels = model.labels as string[];
    const leftAxisDatasets = model.leftAxisDatasets;
    const rightAxisDatasets = model.rightAxisDatasets;
    const allDatasets = [...leftAxisDatasets, ...rightAxisDatasets];
    const title = buildGroupedBarChartTitle(allDatasets);

    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <BarChart3 className="h-4 w-4 text-slate-700" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="mb-2 text-xs text-slate-500">
          <span className="font-medium">Left axis:</span> {leftAxisDatasets.map((d) => d.label).join(", ")} |{" "}
          <span className="font-medium">Right axis:</span> {rightAxisDatasets.map((d) => d.label).join(", ")}
        </div>
        <div className="h-[380px]">
          <Bar
            data={{ labels, datasets: allDatasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: "bottom" },
              },
              scales: {
                x: {
                  ticks: { color: "#334155", maxRotation: 45, minRotation: 45 },
                  grid: { display: false },
                },
                y: {
                  type: "linear" as const,
                  display: true,
                  position: "left" as const,
                  ticks: { color: "#475569" },
                  grid: { color: "#e2e8f0" },
                  title: { display: true, text: leftAxisDatasets.map((d) => d.label).join(", ") },
                },
                y1: {
                  type: "linear" as const,
                  display: true,
                  position: "right" as const,
                  ticks: { color: "#475569" },
                  grid: { drawOnChartArea: false },
                  title: { display: true, text: rightAxisDatasets.map((d) => d.label).join(", ") },
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

  // --- NEW: Renders Multi-Line Charts correctly ---
  if (model.chartType === "line") {
    const labels = model.labels as string[];
    const datasets = (model as LineModel).datasets;

    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <TrendingUp className="h-4 w-4 text-slate-700" />
          <span className="text-sm font-medium">Trend Over Time</span>
        </div>
        <div className="h-[280px]">
          <Line
            data={{
              labels,
              datasets: datasets.map((ds, idx) => ({
                label: ds.label,
                data: ds.data,
                borderColor: chartPalette[idx % chartPalette.length],
                backgroundColor: chartPalette[idx % chartPalette.length] + '24', 
                fill: datasets.length === 1,
                tension: 0.35,
                pointRadius: 3,
                pointBackgroundColor: chartPalette[idx % chartPalette.length],
              })),
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: datasets.length > 1, position: 'bottom' } }, 
              scales: {
                x: { ticks: { color: "#475569" }, grid: { display: false } },
                y: { ticks: { color: "#475569" }, grid: { color: "#e2e8f0" } },
              },
            }}
          />
        </div>
      </div>
    );
  }

  if (model.chartType === "bar") {
    const labels = model.labels as string[];
    const values = (model as BarOrDoughnutModel).values;
    const datasetLabel = (model as BarOrDoughnutModel).label ?? "Value";

    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <BarChart3 className="h-4 w-4 text-slate-700" />
          <span className="text-sm font-medium">Comparison</span>
        </div>
        <div className="h-[320px]">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: datasetLabel,
                  data: values,
                  backgroundColor: labels.map(
                    (_label: string, index: number) => chartPalette[index % chartPalette.length]
                  ),
                  borderRadius: 10,
                  borderSkipped: false,
                },
              ],
            }}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "#475569" }, grid: { color: "#e2e8f0" } },
                y: { ticks: { color: "#334155" }, grid: { display: false } },
              },
            }}
          />
        </div>
      </div>
    );
  }

  if (model.chartType === "doughnut") {
    const labels = model.labels as string[];
    const values = (model as BarOrDoughnutModel).values;
    const datasetLabel = (model as BarOrDoughnutModel).label ?? "Value";

    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <PieChartIcon className="h-4 w-4 text-slate-700" />
          <span className="text-sm font-medium">Composition</span>
        </div>
        <div className="h-[280px]">
          <Doughnut
            data={{
              labels,
              datasets: [
                {
                  label: datasetLabel,
                  data: values,
                  backgroundColor: labels.map(
                    (_label: string, index: number) => chartPalette[index % chartPalette.length]
                  ),
                  borderColor: "#ffffff",
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "62%",
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { color: "#334155", boxWidth: 12 },
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

  return <TableView table={table} />;
};

const ReportSectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  text: string;
  table?: GenieTableData | null;
  ranking?: RankingPayload | null;
  chartPreferred?: boolean;
}> = ({ title, icon, text, table, ranking, chartPreferred = true }) => {
  const autoInsight = getSectionInsight(table);

  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>

      {ranking ? (
        <RankingView ranking={ranking} table={table} />
      ) : (
        <>
          {text && <InsightList text={text} extraInsight={autoInsight} />}
          {table ? (
            chartPreferred ? (
              <div className="space-y-4">
                <SmartChart table={table} />
                {detectSmartChartType(table) !== "table" && (
                  <details className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <summary className="cursor-pointer text-sm font-medium text-slate-700">
                      View supporting table
                    </summary>
                    <TableView table={table} />
                  </details>
                )}
              </div>
            ) : (
              <TableView table={table} />
            )
          ) : null}
        </>
      )}
    </section>
  );
};

const ReportView: React.FC<{ report: GenieStructuredReport }> = ({ report }) => {
  const executiveBullets = splitIntoBullets(report.executiveSummary.text, 3);

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-md">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          Executive report
        </p>
        <h3 className="text-2xl font-semibold tracking-tight">{report.title}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          {report.sourcePrompt}
        </p>

        {executiveBullets.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {executiveBullets.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200 ring-1 ring-white/10"
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {report.executiveSummary.table && (
        <KpiStrip table={report.executiveSummary.table} isGlobal={true} />
      )}

      <div className="grid gap-6">
        {report.executiveSummary.table && (
          <ReportSectionCard
            title="Overall Performance"
            icon={<PieChartIcon className="h-4 w-4" />}
            text="" 
            table={report.executiveSummary.table}
            ranking={report.executiveSummary.ranking}
          />
        )}

        <ReportSectionCard
          title="Trend Analysis"
          icon={<BarChart3 className="h-4 w-4" />}
          text={report.trendAnalysis.text}
          table={report.trendAnalysis.table}
          ranking={report.trendAnalysis.ranking}
        />

        <ReportSectionCard
          title="Top Drivers"
          icon={<AlertTriangle className="h-4 w-4" />}
          text={report.keyDrivers.text}
          table={report.keyDrivers.table}
          ranking={report.keyDrivers.ranking}
        />

        <ReportSectionCard
          title="Location Breakdown"
          icon={<MapPinned className="h-4 w-4" />}
          text={report.locationBreakdown.text}
          table={report.locationBreakdown.table}
          ranking={report.locationBreakdown.ranking}
        />

        <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Lightbulb className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Recommendations</h3>
          </div>
          
          {report.structuredRecommendations && report.structuredRecommendations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {report.structuredRecommendations.map((rec, index) => (
                <div key={index} className="flex flex-col justify-between rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        rec.priority?.toLowerCase() === 'critical' || rec.priority?.toLowerCase() === 'high' 
                          ? 'bg-red-50 text-red-700 ring-red-600/10' 
                          : 'bg-blue-50 text-blue-700 ring-blue-700/10'
                      }`}>
                        {rec.priority || "Medium"} Priority
                      </span>
                      <span className="text-xs font-medium text-slate-500">{rec.timeline || "Ongoing"}</span>
                    </div>
                    <h4 className="mb-2 text-sm font-semibold leading-6 text-slate-900">
                      {rec.title || "Recommended Action"}
                    </h4>
                    {rec.issue && (
                      <p className="mb-3 text-xs font-medium text-indigo-600">
                        Driver: {rec.issue}
                      </p>
                    )}
                    <div className="mb-4 space-y-1 text-xs leading-5 text-slate-600">
                      {rec.action.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                    <span className="font-medium text-slate-700">{rec.responsibility || "Site Manager"}</span>
                    {rec.expectedBenefit && (
                      <span className="font-semibold text-emerald-600">{rec.expectedBenefit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {report.recommendations.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Action {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const buildDynamicPptPayload = (report: GenieStructuredReport) => {
  // 1. Parse Executive Summary KPIs (Values AND Labels!)
  let kpi1 = "N/A", kpi2 = "N/A", kpi3 = "N/A";
  let label1 = "Metric 1", label2 = "Metric 2", label3 = "Metric 3";

  if (report.executiveSummary.table) {
    const numCols = getNumericColumns(report.executiveSummary.table);
    const row = report.executiveSummary.table.rows[0];

    if (numCols[0] && row) {
      kpi1 = formatCompactNumber(toNumber(row[numCols[0].index]));
      label1 = getExactMetricLabel(numCols[0].column);
    }
    if (numCols[1] && row) {
      kpi2 = formatCompactNumber(toNumber(row[numCols[1].index]));
      label2 = getExactMetricLabel(numCols[1].column);
    }
    if (numCols[2] && row) {
      kpi3 = formatCompactNumber(toNumber(row[numCols[2].index]));
      label3 = getExactMetricLabel(numCols[2].column);
    }
  }

  // 2. Parse Trend Chart Data
  let trendLabels: string[] = [];
  let trendDamages: number[] = [];
  let trendStales: number[] = [];
  if (report.trendAnalysis.table) {
    const t = report.trendAnalysis.table;
    const catCols = getCategoricalColumns(t);
    const numCols = getNumericColumns(t);
    const rows = [...t.rows].reverse();

    if (catCols.length > 0) trendLabels = rows.map(r => String(r[catCols[0].index]));
    if (numCols[0]) trendDamages = rows.map(r => toNumber(r[numCols[0].index]));
    if (numCols[1]) trendStales = rows.map(r => toNumber(r[numCols[1].index]));
    else trendStales = trendDamages.map(() => 0);
  }

  // 3. Parse Top Drivers Chart Data
  let driverLabels: string[] = [];
  let driverValues: number[] = [];
  if (report.keyDrivers.table) {
    const t = report.keyDrivers.table;
    const catCols = getCategoricalColumns(t);
    const seriesCol = catCols.length > 1 ? catCols[1] : catCols[0];
    const numCols = getNumericColumns(t);

    if (seriesCol && numCols.length > 0) {
      const driverTotals: Record<string, number> = {};
      t.rows.forEach(r => {
        const driver = prettifyLabel(String(r[seriesCol.index]));
        const val = toNumber(r[numCols[0].index]);
        driverTotals[driver] = (driverTotals[driver] || 0) + val;
      });

      const sorted = Object.entries(driverTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);
      driverLabels = sorted.map(d => d[0]);
      driverValues = sorted.map(d => d[1]);
    }
  }

  // Format the date dynamically
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(report.generatedAt));

  // --- NEW: Helper to format arrays into a single bulleted string ---
  // --- NEW: Helper to extract short arrays instead of one giant string ---
  const extractShortBullets = (text: string, count: number) => {
    const items = splitIntoBullets(text, count);
    if (!items.length) return ["No insights generated for this section."];
    
    // Truncate overly long sentences to prevent slide overflow
    return items.map(item => 
      item.length > 150 ? item.substring(0, 147) + "..." : item
    );
  };

  return {
    s1_request: report.sourcePrompt,
    s1_generated_on: `Generated: ${formattedDate}`,
    
    // Arrays sent directly to Python
    s2_body: extractShortBullets(report.executiveSummary.text, 3),
    
    s2_kpi1_label: label1,
    s2_kpi2_label: label2,
    s2_kpi3_label: label3,
    s2_kpi1_value: kpi1,
    s2_kpi2_value: kpi2,
    s2_kpi3_value: kpi3,
    
    // Send as array so Trend Analysis gets proper bullets
    s3_insights: extractShortBullets(report.trendAnalysis.text, 2), 
    
    s3_chart_trend: {
      labels: trendLabels.length > 0 ? trendLabels : ["No Data"],
      damages: trendDamages.length > 0 ? trendDamages : [0],
      stales: trendStales.length > 0 ? trendStales : [0],
    },
    
    s4_body_bullets: extractShortBullets(report.keyDrivers.text, 3),
    
    s4_chart_top_drivers: {
      labels: driverLabels.length > 0 ? driverLabels : ["No Data"],
      values: driverValues.length > 0 ? driverValues : [0],
    },
    
    // Strictly limit to Top 3 recommendations and format concisely
    s5_recommendations: report.structuredRecommendations && report.structuredRecommendations.length > 0
      ? report.structuredRecommendations.slice(0, 3).map(
          (rec) => `${rec.title || "Action"}: ${rec.action.split('\n')[0]}`
        )
      : extractShortBullets(report.recommendations.join("\n"), 3)
  };
};

const AskAI: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("ask");
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  
  // --- NEW: Replaced isPptDialogOpen with unified isExportDialogOpen & exportType
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<"ppt" | "word">("ppt");

  const [selectedRequest, setSelectedRequest] = useState(
    "Executive loss summary for North America"
  );
  const [result, setResult] = useState<UiResult>({ kind: "none" });

  const reportTitle = useMemo(
    () => selectedRequest?.trim() || "Executive report",
    [selectedRequest]
  );

  const activeSuggestions = useMemo(
    () => (mode === "ask" ? askSuggestions : reportSuggestions),
    [mode]
  );

  const handleRecentPromptClick = (value: string) => {
    setPrompt(value);
    setSelectedRequest(value);
    setShowHistory(false);
  };

  const handleSendMessage = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    setIsLoading(true);
    setResult({ kind: "none" });

    try {
      if (mode === "report") {
        const report = await buildGenieReport(trimmedPrompt);
        setResult({ kind: "report", report });
      } else {
        const response = (await askGenie(trimmedPrompt)) as GenieResponse;

        if (response.type === "ranking") {
          setResult({
            kind: "table",
            text: response.text,
            table: response.table ?? { columns: [], rows: [] },
            chartImage: response.chartImage ?? null,
            ranking: response.ranking,
          });
        } else if (response.type === "table") {
          setResult({
            kind: "table",
            text: response.text,
            table: response.table,
            chartImage: response.chartImage ?? null,
          });
        } else {
          setResult({ kind: "text", text: response.text, chartImage: response.chartImage ?? null });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while fetching the AI response.";
      setResult({ kind: "error", message });
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: Unified click handler that triggers the modal
  const handleExportClick = (type: "ppt" | "word") => {
    setExportType(type);
    setIsExportDialogOpen(true);
  };

  // --- NEW: Unified confirmation handler
  const handleConfirmExport = async () => {
    if (exportType === "ppt") {
      setIsExportingPpt(true);
      try {
        let payloadToExport;
        if (result.kind === "report") {
          payloadToExport = buildDynamicPptPayload(result.report);
        } else {
          payloadToExport = buildSyntheticReport(reportTitle);
        }
        
        await exportReportToPpt(payloadToExport, {
          companyName: "C5i",
          requestName: reportTitle,
        });
      } finally {
        setIsExportingPpt(false);
        setIsExportDialogOpen(false);
      }
    } else {
      if (result.kind !== "report") return;
      setIsExportingWord(true);
      try {
        await exportReportToWord(result.report);
      } finally {
        setIsExportingWord(false);
        setIsExportDialogOpen(false);
      }
    }
  };

  return (
    <>
      <ExportPptDialog
        open={isExportDialogOpen}
        exportType={exportType}
        requestName={reportTitle}
        onClose={() => setIsExportDialogOpen(false)}
        onConfirm={handleConfirmExport}
      />

      <div className="h-[calc(100vh-5rem)] overflow-hidden bg-slate-50">
        <style>{`
          @keyframes suggestionFadeIn {
            0%   { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .suggestion-enter {
            animation: suggestionFadeIn 280ms ease-out both;
          }
          @media (prefers-reduced-motion: reduce) {
            .suggestion-enter { animation: none; }
          }
        `}</style>

        <div className="h-full overflow-auto">
          <div className="mx-auto flex h-full max-w-6xl flex-col px-6 py-8">
            <div className="min-h-0 flex-1">
              <div className="flex h-full flex-col">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                      Analyze stales, damages, inventory variance, and forecast performance
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                      Ask direct business questions or generate an executive-ready report
                      with charts, tables, insights, and recommendations.
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
                    onClick={() => setShowHistory((prev) => !prev)}
                  >
                    <History className="h-4 w-4" />
                    Recent
                  </button>
                </div>

                {showHistory && (
                  <div className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Recent prompts
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentPrompts.map((item) => (
                        <button
                          key={item}
                          onClick={() => handleRecentPromptClick(item)}
                          className="rounded-full px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-5 inline-flex w-fit rounded-full bg-slate-100 p-1">
                  <button
                    onClick={() => setMode("ask")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      mode === "ask"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Ask
                    </span>
                  </button>
                  <button
                    onClick={() => setMode("report")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      mode === "report"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <WandSparkles className="h-4 w-4" />
                      Report
                    </span>
                  </button>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {activeSuggestions.map((item, index) => (
                    <button
                      key={`${mode}-${item}`}
                      onClick={() => {
                        setPrompt(item);
                        setSelectedRequest(item);
                      }}
                      className="suggestion-enter rounded-full bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-900"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      setSelectedRequest(e.target.value);
                    }}
                    placeholder={
                      mode === "report"
                        ? "Create an executive-ready North America report covering stales, damages, inventory variance, forecast vs actuals, top sites, top products, and recommendations"
                        : "Ask about site, product, route, sales class, stales, damages, inventory variance, or forecast performance"
                    }
                    className="min-h-[140px] w-full resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-500">
                      {mode === "report"
                        ? "Structured report with charts, tables, and recommendations."
                        : "Direct answers and tables from North America analytics context."}
                    </p>
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !prompt.trim()}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {mode === "report" ? "Generate report" : "Ask"}
                    </button>
                  </div>
                </div>

                <div className="mt-8 min-h-0 flex-1">
                  {result.kind === "none" && !isLoading && (
                    <div className="grid h-full place-items-center rounded-3xl bg-white/70 text-center ring-1 ring-slate-200">
                      <div className="px-8">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <FileText className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">
                          Ready for North America analysis
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                          Generate a structured business report from one prompt, with
                          charts, tables, and recommendations for site, product, and
                          executive review.
                        </p>
                      </div>
                    </div>
                  )}

                  {result.kind === "text" && (
                    <div className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                      <p className="text-sm leading-7 text-slate-700">{result.text}</p>
                      {result.chartImage && (
                        <GenieVisualizationCard
                          image={result.chartImage}
                          title="Genie chart"
                        />
                      )}
                    </div>
                  )}

                  {result.kind === "table" && (
                    <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                      {result.text && (
                        <p className="mb-4 text-sm text-slate-700">{result.text}</p>
                      )}

                      <div className="space-y-4">
                        {result.ranking && (
                          <RankingView ranking={result.ranking} table={result.table} />
                        )}

                        {!result.ranking && (
                          result.chartImage ? (
                            <>
                              <GenieVisualizationCard
                                image={result.chartImage}
                                title="Genie chart"
                              />
                              <details className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                                <summary className="cursor-pointer text-sm font-medium text-slate-700">
                                  View generated fallback chart and supporting table
                                </summary>
                                <div className="mt-4">
                                  <SmartChart table={result.table} />
                                </div>
                              </details>
                            </>
                          ) : (
                            <SmartChart table={result.table} />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {result.kind === "report" && (
                    <>
                      <div className="mb-4 flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleExportClick("ppt")}
                          disabled={isExportingPpt || isExportingWord}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          {isExportingPpt ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Presentation className="h-4 w-4" />
                          )}
                          Export PPT
                        </button>
                        <button
                          onClick={() => handleExportClick("word")}
                          disabled={isExportingWord || isExportingPpt}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          {isExportingWord ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4" />
                          )}
                          Export Word
                        </button>
                      </div>
                      <ReportView report={result.report} />
                    </>
                  )}

                  

                  {result.kind === "error" && (
                    <div className="rounded-3xl bg-red-50 p-5 text-sm text-red-700 ring-1 ring-red-200">
                      {result.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AskAI;
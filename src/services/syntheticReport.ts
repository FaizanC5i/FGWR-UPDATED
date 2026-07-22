// src/services/syntheticReport.ts
import type { GenieStructuredReport, GenieTableData } from "./GenieAPI";

const makeTable = (columns: string[], rows: Array<Array<string | number>>): GenieTableData => ({
  columns,
  rows: rows.map((r) => r.map((v) => String(v))),
});

export function buildSyntheticReport(requestName: string): GenieStructuredReport {
  return {
    title: `North America CPG Report: ${requestName}`,
    sourcePrompt: requestName,
    generatedAt: new Date().toISOString(),
    executiveSummary: {
      text: "North America total loss remained elevated this period, driven by damages, stales, and inventory variance across a concentrated group of sites. The worst-performing sites accounted for a disproportionate share of losses, while forecast miss widened in the final weeks.",
      table: makeTable(
        ["Metric", "Value"],
        [
          ["Total Loss", "2,480,000"],
          ["Damages", "1,140,000"],
          ["Stales", "910,000"],
          ["Inventory Variance", "430,000"],
        ]
      ),
    },
    trendAnalysis: {
      text: "Losses increased steadily over the latest periods, with a clear spike in damages late in the cycle. Stales remained persistent, while inventory variance showed periodic volatility.",
      table: makeTable(
        ["Month", "Loss"],
        [
          ["Jan", 320000],
          ["Feb", 355000],
          ["Mar", 388000],
          ["Apr", 401000],
          ["May", 472000],
          ["Jun", 544000],
        ]
      ),
    },
    keyDrivers: {
      text: "The top loss drivers were concentrated in a few products and operating conditions, especially high-damage beverage SKUs and forecast misalignment in high-volume routes.",
      table: makeTable(
        ["Driver", "Loss"],
        [
          ["Damaged cases", 1140000],
          ["Expired inventory", 910000],
          ["Forecast variance", 430000],
          ["Handling issue", 265000],
          ["Route exceptions", 198000],
        ]
      ),
    },
    locationBreakdown: {
      text: "A small number of sites contributed the majority of losses, with the leading locations showing both high damages and weak forecast adherence.",
      table: makeTable(
        ["Site", "Loss"],
        [
          ["Toronto", 420000],
          ["Chicago", 395000],
          ["Dallas", 372000],
          ["Atlanta", 331000],
          ["Calgary", 287000],
          ["Phoenix", 244000],
        ]
      ),
    },
    recommendations: [
      "Prioritize weekly reviews for the top five loss sites and track corrective actions.",
      "Investigate damage-heavy SKUs with repeated route and handling exceptions.",
      "Tighten forecast calibration for high-volume locations with recurring miss patterns.",
      "Escalate sites where stales and damages rise simultaneously for two consecutive periods.",
    ],
  };
}
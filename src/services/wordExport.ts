// src/services/wordExport.ts

import {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    HeightRule,
    ImageRun,
    Packer,
    PageOrientation,
    Paragraph,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
} from "docx";
import { saveAs } from "file-saver";
import Chart from "chart.js/auto";
import type { GenieStructuredReport, GenieTableData } from "./GenieAPI";

type ExportWordOptions = {
    companyName?: string;
    logoPath?: string;
};

const defaultOptions: Required<ExportWordOptions> = {
    companyName: "C5i",
    logoPath: "../../src/assets/c5i_logo_for_white_BG.png",
};

type SmartChartType = "line" | "bar" | "grouped-bar" | "stacked-bar" | "doughnut" | "table" | "none";

type SmartChartModel =
    | { chartType: "line"; labels: string[]; values: number[]; label: string; }
    | { chartType: "bar"; labels: string[]; values: number[]; label: string; }
    | { chartType: "doughnut"; labels: string[]; values: number[]; label: string; }
    | { chartType: "stacked-bar"; labels: string[]; datasets: { label: string; data: number[] }[]; }
    | { chartType: "table" | "none" };

const BRAND_BLUE = "0D4E9B";
const TEXT_DARK = "1F2937";
const TEXT_MUTED = "64748B";
const BORDER = "D9E2EC";
const HEADER_FILL = "EAF2FF";
const LIGHT_FILL = "F8FAFC";

const isNumeric = (value: unknown) => {
    const cleaned = String(value ?? "").replace(/,/g, "").trim();
    return cleaned !== "" && !Number.isNaN(Number(cleaned));
};

const toNumber = (value: unknown) =>
    Number(String(value ?? "").replace(/,/g, "").trim()) || 0;

const formatReadableNumber = (value: unknown) => {
    if (!isNumeric(value)) return String(value ?? "");
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
    }).format(toNumber(value));
};

const prettifyLabel = (value: string) =>
    String(value ?? "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
        const getExactMetricLabel = (columnName: string): string => {
    return prettifyLabel(columnName);
};

const looksLikeTimeColumn = (name: string) => {
    const lower = name.toLowerCase();
    return [
        "date",
        "day",
        "week",
        "month",
        "quarter",
        "year",
        "period",
        "time",
    ].some((token) => lower.includes(token));
};

const getNumericColumns = (table: GenieTableData) =>
    table.columns
        .map((column, index) => ({
            column,
            index,
            validCount: table.rows.filter((row) => isNumeric(row[index])).length,
        }))
        .filter((item) => item.validCount > 0);

const detectSmartChartType = (
    table?: GenieTableData | null
): SmartChartType => {
    if (!table || !table.rows.length || !table.columns.length) return "none";

    const numericColumns = getNumericColumns(table);
    if (!numericColumns.length) return "table";

    const categoricalColumns = table.columns
        .map((column, index) => ({ column, index }))
        .filter((item) => !numericColumns.some(n => n.index === item.index));

    if (categoricalColumns.length >= 2 && numericColumns.length >= 1) {
        return "stacked-bar";
    }

    const firstNumeric = numericColumns[0];
    const timeColumn = table.columns.findIndex((col) => looksLikeTimeColumn(col));

    if (timeColumn >= 0 && firstNumeric.index !== 0) return "line";
    if (categoricalColumns.length > 0 && table.rows.length <= 5) return "doughnut";
    if (categoricalColumns.length > 0) return "bar";

    return "table";
};

const buildChartModel = (table: GenieTableData): SmartChartModel => {
    const chartType = detectSmartChartType(table);
    const numericColumns = getNumericColumns(table);

    if (!numericColumns.length) return { chartType: "table" };

    const categoricalColumns = table.columns
        .map((column, index) => ({ column, index }))
        .filter((item) => !numericColumns.some(n => n.index === item.index));

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

        const datasets = uniqueSeries.map((seriesLabel) => {
            return {
                label: prettifyLabel(seriesLabel),
                data: uniqueX.map((xLabel) => {
                    const rowMatch = table.rows.find(
                        (row) => row[xCategory.index] === xLabel && row[seriesCategory.index] === seriesLabel
                    );
                    return rowMatch ? toNumber(rowMatch[metric.index]) : 0;
                })
            };
        });

        return { chartType, labels: uniqueX, datasets };
    }

    const firstNumeric = numericColumns[0];
    const timeColumnIndex = table.columns.findIndex((col) =>
        looksLikeTimeColumn(col)
    );

    const firstCategoryIndex = table.columns.findIndex(
        (_, index) => index !== firstNumeric.index
    );

    if (chartType === "line" && timeColumnIndex >= 0) {
        return {
            chartType,
            labels: table.rows.map((row) => String(row[timeColumnIndex])),
            values: table.rows.map((row) => toNumber(row[firstNumeric.index])),
            label: firstNumeric.column,
        };
    }

    if ((chartType === "bar" || chartType === "doughnut") && firstCategoryIndex >= 0) {
        const limit = chartType === "doughnut" ? 5 : 8;
        return {
            chartType,
            labels: table.rows.slice(0, limit).map((row) => String(row[firstCategoryIndex])),
            values: table.rows.slice(0, limit).map((row) => toNumber(row[firstNumeric.index])),
            label: firstNumeric.column,
        };
    }

    return { chartType: "table" };
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
            .filter((item) => item.length > 20);
    }

    return pieces.slice(0, maxItems);
};

async function fetchImageAsUint8Array(path: string): Promise<Uint8Array | null> {
    try {
        const response = await fetch(path);

        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch {
        return null;
    }
}

async function renderChartToBuffer(
    table: GenieTableData | null | undefined
): Promise<Uint8Array | null> {
    if (!table || table.columns.length < 2 || table.rows.length === 0) return null;

    const model = buildChartModel(table);
    if (model.chartType === "table" || model.chartType === "none") return null;

    if (!("labels" in model)) return null;
    const labels = model.labels;
    if (!labels.length) return null;

    const isStacked = model.chartType === "stacked-bar";
    const chartjsType: "doughnut" | "line" | "bar" =
        model.chartType === "doughnut"
            ? "doughnut"
            : model.chartType === "line"
                ? "line"
                : "bar";

    const width = 1200;
    const height = chartjsType === "bar" ? 640 : 520;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const palette = [
        "#2563eb",
        "#0ea5e9",
        "#14b8a6",
        "#8b5cf6",
        "#f59e0b",
        "#ef4444",
        "#10b981",
        "#6366f1",
    ];

    let chartDatasets: any[] = [];

    if (model.chartType === "stacked-bar") {
        chartDatasets = model.datasets.map((ds, index: number) => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: palette[index % palette.length],
        }));
    } else if ("values" in model && "label" in model) {
        chartDatasets = [
            {
                label: prettifyLabel(model.label ?? "Value"),
                data: model.values,
                borderColor: "#2563eb",
                backgroundColor: chartjsType === "line"
                    ? "rgba(37, 99, 235, 0.15)"
                    : labels.map((_label: string, index: number) => palette[index % palette.length]),
                fill: chartjsType === "line",
                tension: 0.35,
                pointRadius: chartjsType === "line" ? 3 : undefined,
                pointBackgroundColor: chartjsType === "line" ? "#2563eb" : undefined,
                borderWidth: 2,
                borderRadius: chartjsType === "bar" && !isStacked ? 10 : undefined,
            },
        ];
    }

    const chartOptions: any = {
        responsive: false,
        animation: false,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: chartjsType === "doughnut" || isStacked,
                position: chartjsType === "doughnut" ? "bottom" : "top",
                labels: {
                    color: "#334155",
                    boxWidth: 12,
                },
            },
        },
    };

    if (chartjsType !== "doughnut") {
        chartOptions.scales = {
            x: {
                stacked: isStacked,
                ticks: { color: "#475569" },
                grid: {
                    display: chartjsType === "line" ? false : true,
                    color: "#E2E8F0",
                },
            },
            y: {
                stacked: isStacked,
                beginAtZero: true,
                ticks: { color: "#475569" },
                grid: { color: "#E2E8F0" },
            },
        };
    }

    const chart = new Chart(ctx, {
        type: chartjsType,
        data: {
            labels,
            datasets: chartDatasets,
        },
        options: chartOptions,
    });

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
    );

    chart.destroy();

    if (!blob) return null;

    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

function buildBulletParagraphs(text: string): Paragraph[] {
    return splitIntoBullets(text, 5).map(
        (line) =>
            new Paragraph({
                text: line,
                bullet: { level: 0 },
                spacing: { after: 90, line: 276 },
            })
    );
}

function buildSupportingTable(table: GenieTableData | null | undefined): Table | null {
    if (!table || table.columns.length === 0 || table.rows.length === 0) return null;

    const columnCount = table.columns.length;
    const widthPerCol = Math.floor(100 / columnCount);

    const headerRow = new TableRow({
        tableHeader: true,
        height: {
            value: 420,
            rule: HeightRule.ATLEAST,
        },
        children: table.columns.map(
            (col) =>
                new TableCell({
                    shading: { fill: HEADER_FILL },
                    verticalAlign: VerticalAlign.CENTER,
                    width: {
                        size: widthPerCol,
                        type: WidthType.PERCENTAGE,
                    },
                    margins: {
                        top: 90,
                        bottom: 90,
                        left: 100,
                        right: 100,
                    },
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: prettifyLabel(String(col)),
                                    bold: true,
                                    color: TEXT_DARK,
                                    size: 21,
                                }),
                            ],
                        }),
                    ],
                })
        ),
    });

    const bodyRows = table.rows.slice(0, 10).map(
        (row, rowIndex) =>
            new TableRow({
                height: {
                    value: 360,
                    rule: HeightRule.ATLEAST,
                },
                children: row.map(
                    (cell) =>
                        new TableCell({
                            shading: { fill: rowIndex % 2 === 0 ? "FFFFFF" : LIGHT_FILL },
                            verticalAlign: VerticalAlign.CENTER,
                            width: {
                                size: widthPerCol,
                                type: WidthType.PERCENTAGE,
                            },
                            margins: {
                                top: 80,
                                bottom: 80,
                                left: 100,
                                right: 100,
                            },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: formatReadableNumber(cell),
                                            color: TEXT_DARK,
                                            size: 20,
                                        }),
                                    ],
                                }),
                            ],
                        })
                ),
            })
    );

    return new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
        layout: TableLayoutType.FIXED,
        rows: [headerRow, ...bodyRows],
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
            left: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
            right: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
        },
    });
}

async function buildSection(
    title: string,
    text: string,
    table?: GenieTableData | null
): Promise<(Paragraph | Table)[]> {
    const children: (Paragraph | Table)[] = [
        new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 220, after: 140 },
            thematicBreak: false,
        }),
        ...buildBulletParagraphs(text),
    ];

    const chartBuffer = await renderChartToBuffer(table);

    if (chartBuffer) {
        const detectedChartType = table ? detectSmartChartType(table) : "none";
        const isTall = detectedChartType === "bar" || detectedChartType === "stacked-bar";

        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 120 },
                children: [
                    new ImageRun({
                        data: chartBuffer,
                        type: "png",
                        transformation: {
                            width: 560,
                            height: isTall ? 300 : 245,
                        },
                    }),
                ],
            })
        );
    }

    const supportingTable = buildSupportingTable(table);

    if (supportingTable) {
        children.push(
            new Paragraph({
                text: "Supporting Table",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 120, after: 80 },
            }),
            supportingTable
        );
    }

    return children;
}

function buildRecommendationsSection(report: GenieStructuredReport): (Paragraph | Table)[] {
    const children: (Paragraph | Table)[] = [
        new Paragraph({
            text: "Recommendations",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 220, after: 140 },
        }),
    ];

    if (report.structuredRecommendations && report.structuredRecommendations.length > 0) {
        report.structuredRecommendations.forEach((rec, index) => {
            const cardContent: Paragraph[] = [
                new Paragraph({
                    text: `${index + 1}. ${rec.title || "Recommended Action"}`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { after: 100 },
                }),
            ];

            if (rec.issue) {
                cardContent.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Driver: ", bold: true, color: TEXT_MUTED }),
                            new TextRun({ text: rec.issue, color: BRAND_BLUE, bold: true }),
                        ],
                        spacing: { after: 100 },
                    })
                );
            }

            rec.action.split('\n').forEach((line) => {
                const cleanLine = line.replace(/^\d+[\.\)]\s*/, '').trim();
                if (cleanLine) {
                    cardContent.push(
                        new Paragraph({
                            text: cleanLine,
                            bullet: { level: 0 },
                            spacing: { after: 60, line: 276 },
                        })
                    );
                }
            });

            const metaRuns = [];
            if (rec.priority) {
                metaRuns.push(new TextRun({ text: `Priority: ${rec.priority}`, bold: true, color: "EF4444" }));
            }
            if (rec.responsibility) {
                if (metaRuns.length > 0) metaRuns.push(new TextRun({ text: " | ", color: TEXT_MUTED }));
                metaRuns.push(new TextRun({ text: `Owner: ${rec.responsibility}`, bold: true, color: TEXT_MUTED }));
            }
            if (rec.expectedBenefit) {
                if (metaRuns.length > 0) metaRuns.push(new TextRun({ text: " | ", color: TEXT_MUTED }));
                metaRuns.push(new TextRun({ text: `Benefit: ${rec.expectedBenefit}`, bold: true, color: "10B981" }));
            }
            
            if (metaRuns.length > 0) {
                cardContent.push(
                    new Paragraph({
                        children: metaRuns,
                        spacing: { before: 120, after: 0 },
                    })
                );
            }

            const card = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
                    left: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
                    right: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                shading: { fill: LIGHT_FILL },
                                margins: { top: 150, bottom: 150, left: 150, right: 150 },
                                children: cardContent,
                            })
                        ]
                    })
                ]
            });

            children.push(card);
            children.push(new Paragraph({ spacing: { after: 120 } }));
        });
    } else {
        report.recommendations.forEach((item) => {
            children.push(
                new Paragraph({
                    text: item,
                    bullet: { level: 0 },
                    spacing: { after: 100, line: 276 },
                })
            );
        });
    }

    return children;
}

async function buildHeaderTable(
    report: GenieStructuredReport,
    companyName: string,
    logoPath: string
): Promise<Table> {
    const logoBuffer = await fetchImageAsUint8Array(logoPath);

    return new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
        layout: TableLayoutType.FIXED,
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 72, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        },
                        children: [
                            new Paragraph({
                                text: report.title,
                                heading: HeadingLevel.TITLE,
                                spacing: { after: 80 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: companyName,
                                        bold: true,
                                        color: BRAND_BLUE,
                                        size: 24,
                                    }),
                                ],
                                spacing: { after: 70 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Generated: ${new Date(report.generatedAt).toLocaleDateString()}`,
                                        italics: true,
                                        color: TEXT_MUTED,
                                        size: 20,
                                    }),
                                ],
                                spacing: { after: 90 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: report.sourcePrompt,
                                        color: TEXT_DARK,
                                        size: 21,
                                    }),
                                ],
                                spacing: { after: 80 },
                            }),
                        ],
                    }),
                    new TableCell({
                        width: { size: 28, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        borders: {
                            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: logoBuffer
                                    ? [
                                        new ImageRun({
                                            data: logoBuffer,
                                            type: "png",
                                            transformation: {
                                                width: 110,
                                                height: 58,
                                            },
                                        }),
                                    ]
                                    : [
                                        new TextRun({
                                            text: companyName,
                                            bold: true,
                                            color: BRAND_BLUE,
                                            size: 26,
                                        }),
                                    ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}

export async function exportReportToWord(
    report: GenieStructuredReport,
    options?: ExportWordOptions
) {
    const opts = { ...defaultOptions, ...options };

    try {
        const headerTable = await buildHeaderTable(
            report,
            opts.companyName,
            opts.logoPath
        );

        const executiveSummaryChildren = await buildSection(
            "Executive Summary",
            report.executiveSummary.text,
            report.executiveSummary.table
        );

        const trendAnalysisChildren = await buildSection(
            "Trend Analysis",
            report.trendAnalysis.text,
            report.trendAnalysis.table
        );

        const keyDriversChildren = await buildSection(
            "Top Drivers",
            report.keyDrivers.text,
            report.keyDrivers.table
        );

        const locationBreakdownChildren = await buildSection(
            "Location Breakdown",
            report.locationBreakdown.text,
            report.locationBreakdown.table
        );

        const recommendationParagraphs = buildRecommendationsSection(report);

        const doc = new Document({
            creator: "AI Analyst",
            title: report.title,
            description: report.sourcePrompt,
            sections: [
                {
                    properties: {
                        page: {
                            size: {
                                orientation: PageOrientation.PORTRAIT,
                            },
                            margin: {
                                top: 720,
                                right: 720,
                                bottom: 720,
                                left: 720,
                            },
                        },
                    },
                    children: [
                        headerTable,
                        new Paragraph({
                            spacing: { after: 120 },
                            border: {
                                bottom: {
                                    color: BORDER,
                                    style: BorderStyle.SINGLE,
                                    size: 1,
                                },
                            },
                        }),

                        ...executiveSummaryChildren,
                        ...trendAnalysisChildren,
                        ...keyDriversChildren,
                        ...locationBreakdownChildren,
                        ...recommendationParagraphs,
                    ],
                },
            ],
            styles: {
                default: {
                    heading1: {
                        run: {
                            color: BRAND_BLUE,
                            bold: true,
                            size: 28,
                        },
                        paragraph: {
                            spacing: {
                                before: 180,
                                after: 120,
                            },
                        },
                    },
                    heading2: {
                        run: {
                            color: TEXT_DARK,
                            bold: true,
                            size: 22,
                        },
                        paragraph: {
                            spacing: {
                                before: 100,
                                after: 80,
                            },
                        },
                    },
                    document: {
                        run: {
                            font: "Aptos",
                            color: TEXT_DARK,
                            size: 21,
                        },
                        paragraph: {
                            spacing: {
                                line: 276,
                                after: 80,
                            },
                        },
                    },
                    title: {
                        run: {
                            bold: true,
                            color: TEXT_DARK,
                            size: 34,
                        },
                        paragraph: {
                            spacing: {
                                after: 120,
                            },
                        },
                    },
                },
            },
        });

        const blob = await Packer.toBlob(doc);
const dateStr = new Date(report.generatedAt).toISOString().replace(/[:.]/g, "-").split("T").join("_").slice(0, 16);
        const fileName = `C5i_NA_Report_${dateStr}.docx`;

        saveAs(blob, fileName);
    } catch (error) {
        console.error("exportReportToWord error:", error);
        throw error;
    }
}
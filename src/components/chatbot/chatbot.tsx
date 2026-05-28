import React, { useRef, useState } from "react";
import { ChevronDown, Send, X } from "lucide-react";
import { toPng } from "html-to-image";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  askGenie,
  askGenieRich,
  type GenieResponse,
  type GenieTableData,
} from "../../services/GenieAPI";
import aichat from "../../assets/aichat.gif";

interface Message {
  id?: string;
  title?: string;
  text?: string;
  table?: {
    columns: string[];
    rows: string[][];
  };
  type: "text" | "table";
  sender: "user" | "ai";
}

interface ReportDocument {
  fileName: string;
  html: string;
}

interface AIAssistantProps {
  isFloating?: boolean;
  onClose?: () => void;
  className?: string;
  defaultTab?: "chatbot" | "faq";
}

const faqs = [
  {
    question: "What is the purpose of this tool?",
    answer:
      "This tool is designed to monitor, analyze, and compare key business performance metrics over time. It helps teams identify trends, track progress against goals, and make data-driven decisions.",
  },
  {
    question: "How do I use the dashboard effectively?",
    answer:
      "Use filters to customize your view, track metrics relevant to your role, and review alerts regularly. The dashboard helps identify critical issues quickly.",
  },
  {
    question: "What business problem does this tool solve?",
    answer:
      "It reduces waste, improves efficiency, and ensures better monitoring of business performance across regions and products.",
  },
  {
    question: "Who should use this tool?",
    answer:
      "Managers, analysts, and decision-makers who need real-time insights into performance and waste analytics.",
  },
  {
    question: "How does this tool support decision-making?",
    answer:
      "By providing real-time analytics and alerts, the tool empowers teams to take quick, data-driven actions.",
  },
];

const reportSections = [
  {
    title: "Executive Summary",
    buildPrompt: (basePrompt: string) =>
      `Create an executive summary for: ${basePrompt}. Keep it concise (80-100 words). Include key metrics, business impact, top risks, and immediate actions.`,
  },
  {
    title: "Damage Trend and Locations",
    buildPrompt: (basePrompt: string) =>
      `For this request: ${basePrompt}, provide top damage locations and trend analysis in 70-90 words. Include at least one structured table suitable for charting.`,
  },
  {
    title: "Stales and Waste Drivers",
    buildPrompt: (basePrompt: string) =>
      `For this request: ${basePrompt}, analyze stales and waste drivers by site/product in 70-90 words. Include at least one structured table suitable for charting.`,
  },
  {
    title: "Action Plan",
    buildPrompt: (basePrompt: string) =>
      `For this request: ${basePrompt}, provide a prioritized 30-60-90 day action plan in 60-80 words with measurable KPIs. Keep the entire report around 300 words total.`,
  },
];

const parseNumericValue = (rawValue: unknown): number | null => {
  const raw = String(rawValue ?? "").trim();
  if (!raw) return null;

  const normalized = raw
    .replace(/,/g, "")
    .replace(/\$/g, "")
    .replace(/%/g, "")
    .replace(/\((.*)\)/, "-$1")
    .replace(/[^0-9.+-]/g, "");

  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};

const toChartRows = (table: GenieTableData) => {
  if (!table.columns.length || !table.rows.length) return null;

  let valueIndex = -1;
  for (let c = 0; c < table.columns.length; c += 1) {
    const hasNumericValue = table.rows.some((row) => {
      return parseNumericValue(row[c]) !== null;
    });
    if (hasNumericValue) {
      valueIndex = c;
      break;
    }
  }

  if (valueIndex < 0) return null;

  const labelIndex = table.columns.length > 1 ? (valueIndex === 0 ? 1 : 0) : 0;

  const rows = table.rows
    .map((row) => {
      const numericValue = parseNumericValue(row[valueIndex]);
      if (numericValue === null) return null;

      const fallbackLabel = table.columns.length > 1 ? "Item" : `Row ${table.rows.indexOf(row) + 1}`;
      return {
        label: String(row[labelIndex] ?? fallbackLabel),
        value: numericValue,
      };
    })
    .filter((item): item is { label: string; value: number } => Boolean(item))
    .slice(0, 12);

  return rows.length ? rows : null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildWordReportHtml = (
  basePrompt: string,
  reportMessages: Message[],
  chartImages: Record<string, string>
) => {
  const sections = reportMessages.filter((msg) => msg.sender === "ai");
  const generatedAt = new Date().toLocaleString();

  const sectionHtml = sections
    .map((msg) => {
      if (msg.type === "table" && msg.table) {
        const embeddedImage = msg.id ? chartImages[msg.id] : undefined;

        if (embeddedImage) {
          return `
            <h3>${escapeHtml(msg.title || "Chart")}</h3>
            <div class="chart-image-wrap">
              <img class="chart-image" src="${embeddedImage}" alt="${escapeHtml(
            msg.title || "Chart"
          )}" />
            </div>
          `;
        }

        const chartRows = toChartRows(msg.table);

        if (!chartRows) {
          return `
            <h3>${escapeHtml(msg.title || "Chart")}</h3>
            <p>Chart data was not available for this section.</p>
          `;
        }

        const maxValue = Math.max(...chartRows.map((item) => item.value), 1);
        const bars = chartRows
          .map((item) => {
            const width = Math.max((item.value / maxValue) * 100, 2);
            return `
              <div class="chart-row">
                <div class="chart-label">${escapeHtml(item.label)}</div>
                <div class="chart-track">
                  <div class="chart-bar" style="width:${width}%"></div>
                </div>
                <div class="chart-value">${escapeHtml(item.value.toLocaleString())}</div>
              </div>
            `;
          })
          .join("");

        return `
          <h3>${escapeHtml(msg.title || "Chart")}</h3>
          <div class="chart-box">${bars}</div>
        `;
      }

      return `
        <h3>${escapeHtml(msg.title || "Section")}</h3>
        <p>${escapeHtml(msg.text || "")}</p>
      `;
    })
    .join("\n");

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Genie Report</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; color: #222; line-height: 1.45; padding: 24px; }
          h1 { color: #0F1F3D; margin-bottom: 6px; }
          .meta { color: #5a6472; margin-bottom: 20px; font-size: 12px; }
          h3 { color: #0f3d78; margin-top: 20px; margin-bottom: 8px; }
          p { margin: 0 0 12px 0; white-space: pre-wrap; }
          .chart-box { margin: 8px 0 16px 0; border: 1px solid #d8e3f0; border-radius: 8px; padding: 10px; background: #f9fbff; }
          .chart-image-wrap { margin: 8px 0 16px 0; border: 1px solid #d8e3f0; border-radius: 8px; padding: 10px; background: #ffffff; }
          .chart-image { width: 100%; height: auto; display: block; border-radius: 6px; }
          .chart-row { display: table; width: 100%; margin: 6px 0; table-layout: fixed; }
          .chart-label { display: table-cell; width: 34%; font-size: 12px; color: #2b3c55; vertical-align: middle; padding-right: 8px; }
          .chart-track { display: table-cell; width: 50%; background: #e9f0fb; border-radius: 6px; height: 14px; vertical-align: middle; }
          .chart-bar { background: linear-gradient(90deg, #057ceb, #43C6F9); height: 14px; border-radius: 6px; }
          .chart-value { display: table-cell; width: 16%; text-align: right; font-size: 12px; color: #1d4f8c; padding-left: 8px; vertical-align: middle; }
        </style>
      </head>
      <body>
        <h1>Genie Report</h1>
        <div class="meta"><strong>User Prompt:</strong> ${escapeHtml(basePrompt)}<br/><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
        ${sectionHtml}
      </body>
    </html>
  `;
};

const AIAssistant: React.FC<AIAssistantProps> = ({
  isFloating = false,
  onClose,
  className = "",
  defaultTab = "chatbot",
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Thinking...");
  const [error, setError] = useState<string | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [reportMode, setReportMode] = useState(false);
  const [latestReportDoc, setLatestReportDoc] = useState<ReportDocument | null>(
    null
  );
  const messageIdRef = useRef(0);
  const chartContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const createMessageId = () => {
    messageIdRef.current += 1;
    return `m-${Date.now()}-${messageIdRef.current}`;
  };

  const captureChartImages = async (reportMessages: Message[]) => {
    const chartMessages = reportMessages.filter((msg) => msg.type === "table" && msg.id);
    if (!chartMessages.length) return {} as Record<string, string>;

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(() => resolve(), 300);
      });
    });

    const captured: Record<string, string> = {};

    for (const message of chartMessages) {
      if (!message.id) continue;
      const node = chartContainerRefs.current[message.id];
      if (!node) continue;

      try {
        captured[message.id] = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
      } catch (captureError) {
        console.error("Failed to capture chart image:", captureError);
      }
    }

    return captured;
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleDownloadReport = () => {
    if (!latestReportDoc) return;

    const blob = new Blob([latestReportDoc.html], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = latestReportDoc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (currentPrompt: string) => {
    if (!currentPrompt.trim() || isLoading) return;

    if (showQuickStart) setShowQuickStart(false);

    setMessages((prev) => [
      ...prev,
      { text: currentPrompt, type: "text", sender: "user" },
    ]);
    setPrompt("");
    setIsLoading(true);
    setLoadingMessage(reportMode ? "Preparing report sections..." : "Thinking...");
    setError(null);
    if (reportMode) {
      setLatestReportDoc(null);
    }

    try {
      if (reportMode) {
        const reportMessages: Message[] = [];

        for (let i = 0; i < reportSections.length; i += 1) {
          const section = reportSections[i];
          setLoadingMessage(
            `Report mode: generating section ${i + 1}/${reportSections.length} (${section.title})...`
          );

          const response = await askGenieRich(section.buildPrompt(currentPrompt));
          reportMessages.push({
            sender: "ai",
            type: "text",
            title: section.title,
            text: response.text || "Section generated successfully.",
          });

          response.tables.forEach((table, tableIndex) => {
            reportMessages.push({
              id: createMessageId(),
              sender: "ai",
              type: "table",
              title: `${section.title} - Table ${tableIndex + 1}`,
              table,
            });
          });
        }

        setMessages((prev) => [...prev, ...reportMessages]);

        const chartImages = await captureChartImages(reportMessages);
        const reportHtml = buildWordReportHtml(currentPrompt, reportMessages, chartImages);
        const stamp = new Date().toISOString().slice(0, 10);
        setLatestReportDoc({
          fileName: `genie-report-${stamp}.doc`,
          html: reportHtml,
        });
      } else {
        const response: GenieResponse = await askGenie(currentPrompt);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            type: response.type,
            text: response.type === "text" ? response.text : response.text,
            table: response.type === "table" ? response.table : undefined,
          },
        ]);
      }
    } catch (err) {
      setError("Sorry, something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const baseClasses = isFloating
    ? `fixed bottom-6 right-6 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 transition-all duration-300 w-[360px] h-[500px]`
    : "bg-white rounded-2xl h-[460px] shadow flex flex-col ";

  return (
    <div className={`${baseClasses} ${className} flex flex-col`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#057ceb] to-[#43C6F9] p-3 rounded-t-2xl mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-full">
              <img
                src={aichat}
                alt="AI Assistant"
                className="w-4 h-4"
              />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white flex items-center gap-1">
                AI Assistant
              </h2>
              <p className="text-xs text-white">Intelligent Data Analysis</p>
            </div>
          </div>

          {/* Header Controls */}
          {isFloating && (
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabs - Only show when not minimized */}

        <div className="flex gap-2 mt-3 ml-2 border border-gray-300 bg-[#FBFEFF] p-1 mr-[8px] pl-1 rounded-lg">
          <button
            onClick={() => setActiveTab("chatbot")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition w-40 ${
              activeTab === "chatbot"
                ? "bg-[#2185e3] text-white shadow"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Chatbot
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`px-4 pr-1 py-1.5 rounded-lg text-sm font-medium transition w-40 ${
              activeTab === "faq"
                ? "bg-[#2185e3] text-white shadow"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            General FAQ
          </button>
        </div>

        {/* Bottom line with gradient */}
        <div className="h-0.5 w-full mt-3 rounded-full bg-white" />
      </div>

      {/* Content - Only show when not minimized */}

      <>
        {/* Chatbot Tab */}
        {activeTab === "chatbot" && (
          <div className="flex-1 flex flex-col p-4 pt-0 overflow-hidden">
            {/* Messages Display Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-sm">
              {messages.length === 0 && (
                <p className="text-xs text-gray-600 mb-2 px-4 py-2 bg-[#E8F7FB] border border-[#BFE8F6] rounded-lg">
                  {reportMode
                    ? "Report Mode is on. Ask for a full report and multiple sections will be generated automatically."
                    : "Ask intelligent questions about waste management data"}
                </p>
              )}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg max-w-[85%] whitespace-pre-wrap break-words ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white self-end ml-auto"
                      : "bg-gray-200 text-gray-800 self-start"
                  }`}
                >
                  {msg.type === "table" && msg.table ? (
                    <div className="space-y-2">
                      {msg.title && <p className="font-semibold text-xs">{msg.title}</p>}
                      {msg.text && <p>{msg.text}</p>}
                      {(() => {
                        const chartRows = toChartRows(msg.table);
                        if (!chartRows) {
                          return (
                            <p className="text-xs text-slate-600">
                              Chart data is not available for this response.
                            </p>
                          );
                        }

                        return (
                          <div
                            ref={(node) => {
                              if (msg.id) {
                                chartContainerRefs.current[msg.id] = node;
                              }
                            }}
                            className="h-48 w-full rounded-md border border-gray-300 bg-white p-2"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartRows}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar
                                  dataKey="value"
                                  fill="#2185e3"
                                  radius={[4, 4, 0, 0]}
                                  isAnimationActive={false}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div>
                      {msg.title && <p className="font-semibold text-xs mb-1">{msg.title}</p>}
                      <p>{msg.text}</p>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="bg-gray-200 text-gray-800 self-start p-2 rounded-lg">
                  {loadingMessage}
                </div>
              )}
              {error && (
                <div className="text-red-500 text-xs p-2 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              {!isLoading && reportMode && latestReportDoc && (
                <div className="self-start rounded-lg border border-[#BFE8F6] bg-[#E8F7FB] p-2">
                  <p className="text-xs text-[#0F1F3D] mb-2">
                    All report responses are combined. Download the final Word document.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    className="rounded-md bg-gradient-to-r from-[#057ceb] to-[#43C6F9] px-3 py-1.5 text-xs font-medium text-white hover:from-[#0459c7] hover:to-[#2bb8eb]"
                  >
                    Download Word Report
                  </button>
                </div>
              )}
            </div>

            {/* Quick Start Questions */}
            {showQuickStart && (
              <div className="mt-auto pt-2">
                <p className="font-semibold mb-2 text-sm">
                  Quick Start Questions:
                </p>
                <ul className="space-y-2 text-sm mb-3">
                  {[
                    "Which location has the highest total damage?",
                    "What is the total sum of all damages recorded?",
                    "Show me top 5 damage locations",
                  ].map((q, i) => (
                    <li
                      key={i}
                      className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 cursor-pointer"
                      onClick={() => handleSendMessage(q)}
                    >
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Input Field */}
            <div className="mt-auto pt-2">
              <div className="mb-2 rounded-lg border border-[#BFE8F6] bg-[#E8F7FB] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#0F1F3D]">
                      {reportMode ? "Report Mode" : "Quick Chat Mode"}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {reportMode
                        ? "Runs multiple prompts and builds chartable report sections"
                        : "Single prompt response with summary and table"}
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={reportMode}
                      onChange={(e) => setReportMode(e.target.checked)}
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-[#2185e3] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
                  </label>
                </div>
              </div>
              <div className="flex">
                <input
                  type="text"
                  placeholder={
                    reportMode
                      ? "Example: give report for damages in previous quarter"
                      : "Ask me anything..."
                  }
                  className="flex-1 border rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSendMessage(prompt)
                  }
                  disabled={isLoading}
                />
                <button
                  className={`text-white px-4 rounded-r-lg transition-all duration-200 ${
                    isLoading || !prompt.trim()
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#057ceb] to-[#43C6F9] hover:from-[#0459c7] hover:to-[#2bb8eb]"
                  }`}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading || !prompt.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === "faq" && (
          <div className="space-y-2 p-4 overflow-y-auto">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border rounded-lg p-2 cursor-pointer"
                onClick={() => toggleFAQ(i)}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium text-sm">{faq.question}</p>
                  <ChevronDown
                    className={`w-4 h-4 transform transition-transform ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {openIndex === i && (
                  <p className="mt-2 text-xs text-gray-600 h-8 overflow-y-auto">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    </div>
  );
};

export default AIAssistant;

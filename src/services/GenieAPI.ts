// src/services/GenieAPI.ts

export type GenieTableData = {
  columns: string[];
  rows: string[][];
};

export type GenieImageAsset = {
  url?: string | null;
  data_url?: string | null;
  mime_type?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
};

export type RankedItem = {
  rank: number;
  label: string;
  value: string;
  numericValue: number;
};

export type RankingPayload = {
  title?: string;
  items: RankedItem[];
  insight?: string | null;
};

export type GenieResponse =
  | { type: "text"; text: string; chartImage?: GenieImageAsset | null }
  | {
      type: "table";
      text?: string;
      table: GenieTableData;
      chartImage?: GenieImageAsset | null;
    }
  | {
      type: "ranking";
      text: string;
      ranking: RankingPayload;
      table?: GenieTableData | null;
      chartImage?: GenieImageAsset | null;
    };

export type GenieSection = {
  text: string;
  table?: GenieTableData | null;
  ranking?: RankingPayload | null;
};

export type StructuredRecommendation = {
  title?: string;
  issue: string;
  action: string;
  responsibility?: string;
  timeline?: string;
  expectedBenefit?: string;
  priority?: string;
};

export type GenieStructuredReport = {
  title: string;
  sourcePrompt: string;
  generatedAt: string;
  executiveSummary: GenieSection;
  trendAnalysis: GenieSection;
  keyDrivers: GenieSection;
  locationBreakdown: GenieSection;
  recommendations: string[];
  structuredRecommendations?: StructuredRecommendation[];
};

export type ReportSectionPlanItem = {
  key: string;
  title: string;
  genieQuestion: string;
};

export type GenieReportSection = GenieSection & {
  key: string;
  title: string;
};

export type GenieRichResponse = {
  text: string;
  tables: GenieTableData[];
  hasSql: boolean;
  ranking?: RankingPayload | null;
  chartImage?: GenieImageAsset | null;
};

type AzureFunctionTableColumn = {
  name: string;
};

type AzureFunctionResultPayload = {
  manifest?: {
    schema?: {
      columns?: AzureFunctionTableColumn[];
    };
  };
  result?: {
    data_array?: unknown[][];
    data_typed_array?: unknown[][];
  };
};

type AzureFunctionResultTable = AzureFunctionResultPayload & {
  statement_response?: AzureFunctionResultPayload & {
    statement_id?: string;
    status?: unknown;
  };
};

type AzureFunctionAttachmentResult = {
  attachment_id?: string | null;
  type?: string | null;
  title?: string | null;
  text?: string | null;
  sql?: string | null;
  statement_id?: string | null;
  data?: AzureFunctionResultTable;
  image?: GenieImageAsset | null;
  visualization?: GenieImageAsset | null;
  data_error?: {
    status?: number;
    details?: string;
  };
};

type AzureFunctionResponse = {
  error?: string;
  details?: string;
  request_id?: string;
  conversation_id?: string;
  message_id?: string;
  status?: string;
  question?: string;
  results?: AzureFunctionAttachmentResult[];
  metadata?: {
    attachment_count?: number;
    duration_ms?: number;
  };
  debug?: unknown;
};

const GENIE_API_URL =
  import.meta.env.VITE_GENIE_API_URL || "/api/genie-query";

const ASK_MODE_CONTEXT = `
You are answering for a frontend chat experience for North America CPG analytics.
Behavior rules:
- Never ask clarifying questions
- Always attempt an answer
- If ambiguous, state the assumption briefly and proceed
- Prefer concise, business-ready language
- When structured data is available, present it in table-friendly form
- If the user asks for a chart, include chart-friendly structured output when available
- Avoid filler such as "based on the result shown", "a table can be provided", "a chart can be provided", or "would you like to see"

Formatting rules:
- Use plain business language
- Format numeric values with commas and up to 2 decimal places when possible
- For top/bottom/ranking questions, return the ranked items first, each on a separate 
line, followed by one short explanatory insight sentence only if useful
- The explanatory insight must not repeat the ranked list verbatim
`.trim();

const REPORT_MODE_CONTEXT = `
You are answering for a structured report experience for North America CPG analytics.
Behavior rules:
- Always attempt an answer
- Use clear business-ready language
- Prefer section-friendly analysis with supporting tables
- Avoid conversational follow-up questions and filler
- Summarize patterns, trends, drivers, and actions where available

Formatting rules:
- Use concise executive-friendly language
- Format numeric values with commas and up to 2 decimal places when possible
- Include structured tables whenever available
`.trim();

function buildAskPrompt(prompt: string) {
  return `${ASK_MODE_CONTEXT}\n\nChat mode user request:\n${prompt}`.trim();
}

function buildReportPrompt(prompt: string) {
  return `${REPORT_MODE_CONTEXT}\n\nReport mode user request:\n${prompt}`.trim();
}

function getResultPayload(
  result: AzureFunctionAttachmentResult
): AzureFunctionResultPayload | null {
  if (result?.data?.statement_response) {
    return result.data.statement_response;
  }
  if (result?.data) {
    return result.data;
  }
  return null;
}

function getResultRows(payload: AzureFunctionResultPayload | null): unknown[][] {
  if (!payload?.result) return [];
  return payload.result.data_array || payload.result.data_typed_array || [];
}

function isTableResult(result: AzureFunctionAttachmentResult): boolean {
  const payload = getResultPayload(result);
  const columns = payload?.manifest?.schema?.columns || [];
  const rows = getResultRows(payload);
  return Boolean(columns.length && rows.length);
}

function toGenieTableData(
  result: AzureFunctionAttachmentResult
): GenieTableData | null {
  const payload = getResultPayload(result);
  const columns = payload?.manifest?.schema?.columns || [];
  const rows = getResultRows(payload);

  if (!columns.length || !rows.length) {
    return null;
  }

  return {
    columns: columns.map((c) => String(c.name)),
    rows: rows.map((row) => row.map((cell) => String(cell ?? ""))),
  };
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isClarificationPrompt(text: string): boolean {
  if (!text) return false;
  const cleaned = normalizeWhitespace(text).toLowerCase();
  return [
    "would you prefer",
    "do you want",
    "would you like",
    "should i show",
    "instead of just that single week",
    "range of weeks",
    "prior period or prior year instead of prior week",
    "clarify",
  ].some((phrase) => cleaned.includes(phrase));
}

function firstNonEmptyText(results: AzureFunctionAttachmentResult[] = []): string {
  let fallbackText = "";

  for (const result of results) {
    if (typeof result?.text === "string" && result.text.trim()) {
      const rawText = result.text.trim();
      
      if (!isClarificationPrompt(rawText)) {
        return rawText;
      }
      
      if (!fallbackText) {
        fallbackText = rawText;
      }
    }
  }
  
  return fallbackText;
}

function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1");
}

function toNumericValue(value: string): number | null {
  const cleaned = String(value).replace(/,/g, "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function formatNumericString(value: string): string {
  const num = toNumericValue(value);
  if (num === null) {
    return String(value).trim();
  }
  const cleaned = String(value).replace(/,/g, "").trim();
  const decimals = cleaned.includes(".")
    ? Math.min((cleaned.split(".")[1] || "").length, 2)
    : 0;

  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  });
}

function cleanupGenericPhrases(text: string): string {
  return normalizeWhitespace(
    stripMarkdownBold(text)
      .replace(/Based on the result shown,?\s*/gi, "")
      .replace(/According to the result shown,?\s*/gi, "")
      .replace(/It can be seen that\s*/gi, "")
      .replace(/The result shows that\s*/gi, "")
      .replace(/A table and chart can be provided to visualize .*?changes\.?/gi, "")
      .replace(/A table can be provided .*?\./gi, "")
      .replace(/A chart can be provided .*?\./gi, "")
      .replace(/can be provided to visualize .*?\./gi, "")
      .replace(/Would you like to see .*?\?/gi, "")
      .replace(/Do you want to see .*?\?/gi, "")
      .replace(/Would you prefer .*?\?/gi, "")
      .replace(/Should I show .*?\?/gi, "")
      .replace(/\s+\.\s*/g, ". ")
  ).trim();
}

function stripMarkdownTables(text: string): string {
  if (!text) return "";
  let stripped = text.replace(/(?:Summary table|Below is a(?: ranked)? table|Here is a summary).*?:[\s\S]*/gi, "");
  stripped = stripped.replace(/\|[^|\n]+\|[^|\n]+\|[\s\S]*/g, "");
  return stripped.trim();
}

function isDirectFactQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return /which|what|who|highest|lowest|top|bottom|most|least|largest|smallest/.test(q);
}

function isTopBottomQuestion(question: string): boolean {
  return /\b(top|bottom|highest|lowest|most|least|largest|smallest)\b/i.test(question);
}

function isBottomQuestion(question: string): boolean {
  return (
    /\bbottom\b/i.test(question) ||
    /\blowest\b/i.test(question) ||
    /\bleast\b/i.test(question) ||
    /\bsmallest\b/i.test(question)
  );
}

function extractRequestedCount(question: string): number | null {
  const q = question.toLowerCase();
  const digitMatch = q.match(/\b(top|bottom)\s+(\d+)\b/);
  if (digitMatch) return Number(digitMatch[2]);

  const wordToNumber: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };
  const wordMatch = q.match(/\b(top|bottom)\s+(one|two|three|four|five|six|seven|eight|nine|ten)\b/);
  if (wordMatch) return wordToNumber[wordMatch[2]] ?? null;

  return null;
}

function normalizeDashBullets(text: string): string {
  return text
    .replace(/(?:\r\n|\r|\n)/g, "\n")
    .replace(/\s+-\s+(?=[A-Za-z0-9][^:\n]{0,120}:\s*[\d,]+(?:\.\d+)?)/g, "\n- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inferRankingTitle(question: string): string {
  const count = extractRequestedCount(question) ?? 3;
  const direction = isBottomQuestion(question) ? "Bottom" : "Top";
  
  // NEW: Helper to strip the duplicate number from the captured text
  const cleanMatch = (match: string) => match.replace(/^\d+\s+/, "").trim();

  const byMatch = question.match(/\bby\s+(.+)$/i);
  if (byMatch?.[1]) return `${direction} ${count} by ${cleanMatch(byMatch[1])}`;

  const ofMatch = question.match(/\b(?:highest|lowest|top|bottom|most|least|largest|smallest)\s+(.+)$/i);
  if (ofMatch?.[1]) return `${direction} ${count} ${cleanMatch(ofMatch[1])}`;

  return `${direction} ${count} results`;
}

function splitBulletBlockAndInsight(text: string): { bulletBlock: string; insight: string | null; } {
  const normalized = normalizeDashBullets(text);
  const bulletMatches = [...normalized.matchAll(/(?:^|\n)-\s+[^:\n]+:\s*[\d,]+(?:\.\d+)?/g)];
  if (!bulletMatches.length) return { bulletBlock: "", insight: normalized.trim() || null };

  const bulletBlock = bulletMatches.map((m) => m[0].replace(/^\n/, "").trim()).join("\n");
  const lastMatch = bulletMatches[bulletMatches.length - 1];
  const lastIndex = lastMatch.index ?? 0;
  const tail = normalized.slice(lastIndex + lastMatch[0].length).trim();
  return {
    bulletBlock,
    insight: tail ? tail.replace(/^[\s\-–—:]+/, "").trim() || null : null,
  };
}

function sanitizeInsight(text?: string | null): string | null {
  if (!text) return null;
  const cleaned = cleanupGenericPhrases(text).replace(/^[-•]\s*/, "").trim();
  if (!cleaned) return null;
  if (/^the top \d+/i.test(cleaned) || /^the bottom \d+/i.test(cleaned)) return null;

  const firstSentence = cleaned.split(/(?<=[.?!])\s+/).map((x) => x.trim()).filter(Boolean)[0];
  return firstSentence || null;
}

function parseRankedItems(text: string): Array<Omit<RankedItem, "rank">> {
  const normalized = normalizeDashBullets(text);
  const matches = [...normalized.matchAll(/(?:^|\n)-\s+([^:\n]+):\s*([\d,]+(?:\.\d+)?)/g)];
  return matches
    .map((m) => {
      const numericValue = toNumericValue(m[2]);
      if (numericValue === null) return null;
      return { label: m[1].trim(), value: formatNumericString(m[2]), numericValue };
    })
    .filter((item): item is Omit<RankedItem, "rank"> => Boolean(item));
}

function findMetricColumnIndex(columns: string[]): number {
  const normalized = columns.map((c) => c.toLowerCase().trim());
  
  // NEW: Moved "total" to the very top so it always wins if multiple metrics exist
  const preferredPatterns = [
    /total.*impact/, /total.*financial/, /total/, 
    /total.*damage/, /damage.*total/, /^damage$/, /damages/,
    /stales/, /variance/, /loss/, /amount/, /value/
  ];
  
  for (const pattern of preferredPatterns) {
    const idx = normalized.findIndex((c) => pattern.test(c));
    if (idx > 0) return idx; 
  }
  for (let i = 1; i < columns.length; i++) {
    if (columns[i]) return i;
  }
  return -1;
}
function extractRankedItemsFromTable(table: GenieTableData): Array<Omit<RankedItem, "rank">> {
  if (!table.columns?.length || !table.rows?.length) return [];
  
  // NEW: Intelligently find the Label column by skipping any column named "rank" or "id"
  let labelIndex = 0;
  for (let i = 0; i < table.columns.length; i++) {
    const colName = table.columns[i].toLowerCase();
    if (!colName.includes("rank") && !colName.includes("id")) {
      labelIndex = i;
      break;
    }
  }
  
  const metricIndex = findMetricColumnIndex(table.columns);
  if (metricIndex === -1) return [];
  
  return table.rows
    .map((row) => {
      const label = String(row[labelIndex] ?? "").trim();
      const rawValue = String(row[metricIndex] ?? "").trim();
      const numericValue = toNumericValue(rawValue);
      if (!label || numericValue === null) return null;
      return { label, value: formatNumericString(rawValue), numericValue };
    })
    .filter((item): item is Omit<RankedItem, "rank"> => Boolean(item));
}

function buildRankingPayload(question: string, items: Array<Omit<RankedItem, "rank">>, insight?: string | null): RankingPayload | null {
  if (!items.length) return null;
  const requestedCount = extractRequestedCount(question) ?? 3;
  const sortDescending = !isBottomQuestion(question);
  const sorted: RankedItem[] = [...items]
    .sort((a, b) => sortDescending ? b.numericValue - a.numericValue : a.numericValue - b.numericValue)
    .slice(0, requestedCount)
    .map((item, index) => ({ rank: index + 1, ...item }));
  return { title: inferRankingTitle(question), items: sorted, insight: sanitizeInsight(insight) };
}

function rankingToText(ranking: RankingPayload): string {
  const list = ranking.items.map((item) => `- ${item.label}: ${item.value}`).join("\n");
  return ranking.insight ? `${list}\n\nInsight: ${ranking.insight}` : list;
}

function extractRankingPayload(question: string, text: string, table?: GenieTableData | null): RankingPayload | null {
  const cleaned = cleanupGenericPhrases(text);
  if (table) {
    const tableItems = extractRankedItemsFromTable(table);
    if (tableItems.length) {
      const { insight } = splitBulletBlockAndInsight(cleaned);
      return buildRankingPayload(question, tableItems, insight);
    }
  }
  const { bulletBlock, insight } = splitBulletBlockAndInsight(cleaned);
  const parsedItems = parseRankedItems(bulletBlock);
  if (parsedItems.length >= 2) return buildRankingPayload(question, parsedItems, insight);
  return null;
}

function formatSingleEntityAnswer(question: string, text: string): string | null {
  const cleaned = cleanupGenericPhrases(text);
  const locationDamageMatch = cleaned.match(
    /(?:highest total damage.*?is|location with the highest total damage is|top[- ]damage location is)\s+([A-Za-z0-9\s&/'().-]+?)\s*\(location\s*(\d+)\)\s*(?:with total damage of|at)\s*([\d,]+(?:\.\d+)?)/i
  );
  if (locationDamageMatch) {
    const [, location, code, value] = locationDamageMatch;
    return [
      `Highest total damage: ${location.trim()}`,
      `Location code: ${code.trim()}`,
      `Total damage: ${formatNumericString(value)}`,
    ].join("\n");
  }

  const genericMetricMatch = cleaned.match(
    /(?:is|was)\s+([A-Za-z0-9\s&/'().-]+?)\s*\((?:location|site|product)?\s*([A-Za-z0-9-]+)?\)?\s*(?:with|at)?\s*([\d,]+(?:\.\d+)?)/i
  );
  if (genericMetricMatch && /highest|lowest|top|bottom|most|least|largest|smallest/.test(question.toLowerCase())) {
    const [, entity, code, value] = genericMetricMatch;
    const lines = [`Answer: ${entity.trim()}`];
    if (code) lines.push(`Code: ${code.trim()}`);
    lines.push(`Value: ${formatNumericString(value)}`);
    return lines.join("\n");
  }
  return null;
}

function formatDirectFactAnswer(question: string, text: string, table?: GenieTableData | null): string {
  const cleaned = cleanupGenericPhrases(text);
  if (isTopBottomQuestion(question)) {
    const ranking = extractRankingPayload(question, cleaned, table);
    if (ranking) return rankingToText(ranking);
    return normalizeDashBullets(cleaned);
  }
  const single = formatSingleEntityAnswer(question, cleaned);
  if (single) return single;

  const normalizedBullets = normalizeDashBullets(cleaned);
  if (/\n-\s+/.test(normalizedBullets)) return normalizedBullets;

  const firstSentence = cleaned.split(/(?<=[.?!])\s+/).map((x) => x.trim()).filter(Boolean)[0];
  return firstSentence || cleaned;
}

function formatAskText(question: string, rawText: string, table?: GenieTableData | null): string {
  let cleaned = cleanupGenericPhrases(rawText);
  if (table && /can be provided|could be provided|would you prefer|would you like to see|do you want to see|should i show/i.test(cleaned)) {
    cleaned = cleaned.split(/(?<=[.?!])\s+/)
      .filter((sentence) => !/can be provided|could be provided|would you prefer|would you like to see|do you want to see|should i show/i.test(sentence))
      .join(" ").trim();
  }

  if (!cleaned && table && isTopBottomQuestion(question)) {
    const ranking = extractRankingPayload(question, "", table);
    if (ranking) return rankingToText(ranking);
  }

  if (!cleaned) return table ? "" : "No response was returned from Genie.";
  if (isClarificationPrompt(cleaned) && table) return "";
  if (isDirectFactQuestion(question)) return formatDirectFactAnswer(question, cleaned, table);

  const normalizedBullets = normalizeDashBullets(cleaned);
  if (/\n-\s+/.test(normalizedBullets)) return normalizedBullets;

  const sentences = cleaned.split(/(?<=[.?!])\s+/).map((x) => x.trim()).filter(Boolean);
  return sentences.slice(0, 2).join(" ");
}

function hasRenderableImage(asset?: GenieImageAsset | null): boolean {
  return Boolean(asset?.data_url || asset?.url);
}

function firstVisualization(results: AzureFunctionAttachmentResult[] = []): GenieImageAsset | null {
  for (const result of results) {
    if (hasRenderableImage(result?.visualization)) return result.visualization ?? null;
    if (hasRenderableImage(result?.image)) return result.image ?? null;
  }
  return null;
}

function toGenieResponse(body: AzureFunctionResponse, originalPrompt: string): GenieResponse {
  const results = Array.isArray(body.results) ? body.results : [];
  const firstTableResult = results.find(isTableResult);
  const table = firstTableResult ? toGenieTableData(firstTableResult) : null;
  const rawText = firstNonEmptyText(results);
  const chartImage = firstVisualization(results);
  const ranking = isTopBottomQuestion(originalPrompt) ? extractRankingPayload(originalPrompt, rawText, table) : null;

  if (ranking) return { type: "ranking", text: rankingToText(ranking), ranking, table, chartImage };

  const formattedText = formatAskText(originalPrompt, rawText, table);
  if (table) return { type: "table", text: formattedText, table, chartImage };
  return { type: "text", text: formattedText, chartImage };
}

async function callAzureGenie(question: string): Promise<AzureFunctionResponse> {
  const res = await fetch(GENIE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  let body: AzureFunctionResponse | null = null;
  let rawText = "";
  try {
    body = (await res.json()) as AzureFunctionResponse;
  } catch {
    try { rawText = await res.text(); } catch { rawText = ""; }
  }

  if (!res.ok) {
    const message = body?.details || body?.error || rawText || `Genie request failed (${res.status})`;
    throw new Error(message);
  }

  if (!body) throw new Error("Genie returned an empty response.");

  try {
    console.group("Genie raw response");
    console.log("HTTP status:", res.status);
    console.log("Prompt sent:", question);
    console.log("Raw body:", body);
    console.log("Results array:", body?.results);
    if (Array.isArray(body?.results)) {
      body.results.forEach((item, index) => {
        console.group(`Result[${index}]`);
        console.log("type:", item?.type);
        console.log("sql:", item?.sql);
        console.log("full item:", item);
        console.groupEnd();
      });
    }
    console.groupEnd();
  } catch {
    // Ignore logging errors
  }

  if (Array.isArray(body?.results)) logSqlAggregationWarning(body.results);
  return body;
}

export async function askGenie(prompt: string): Promise<GenieResponse> {
  if (!prompt?.trim()) throw new Error("Prompt is required");
  const compiledPrompt = buildAskPrompt(prompt);
  const body = await callAzureGenie(compiledPrompt);
  return toGenieResponse(body, prompt);
}

export async function askGenieRich(prompt: string): Promise<GenieRichResponse> {
  if (!prompt?.trim()) throw new Error("Prompt is required");
  const compiledPrompt = buildAskPrompt(prompt);
  const body = await callAzureGenie(compiledPrompt);
  const results = Array.isArray(body.results) ? body.results : [];
  const tables = results.map(toGenieTableData).filter((table): table is GenieTableData => Boolean(table));
  const ranking = isTopBottomQuestion(prompt) ? extractRankingPayload(prompt, firstNonEmptyText(results), tables[0] ?? null) : null;
  return {
    text: ranking ? rankingToText(ranking) : formatAskText(prompt, firstNonEmptyText(results), tables[0] ?? null),
    tables,
    hasSql: results.some((result) => Boolean(result?.sql)),
    ranking,
    chartImage: firstVisualization(results),
  };
}

function formatReportSectionText(rawText: string): string {
  const cleaned = cleanupGenericPhrases(rawText);
  if (!cleaned) return "";
  if (isClarificationPrompt(cleaned)) return "";
  const noTables = stripMarkdownTables(cleaned);
  return normalizeDashBullets(noTables);
}

const AGGREGATION_SENSITIVE_TABLES = [
  "rpt_agg_summary", "rpt_agg_product", "rpt_agg_location",
  "rpt_agg_causal_summary", "rpt_agg_stl_actual_vs_forecast", "rpt_agg_actual_vs_forecast",
];
const AGGREGATION_SENSITIVE_COLUMNS = [
  "damages", "damages_p_wk", "stales", "stales_unit_qty_cases",
  "damages_unit_qty_cases", "over_short_amt",
];
const PER_WEEK_JOIN_SENSITIVE_TABLES = [
  "rpt_agg_causal_summary", "vw_recommendations_granular", "rpt_recommendations_granular",
];

export type SqlAggregationWarning = { sql: string; table: string; reason: string; };

function sqlReferencesTable(sql: string, table: string): boolean {
  return new RegExp(`\\b${table}\\b`, "i").test(sql);
}

function sqlReferencesSensitiveColumn(sql: string): boolean {
  return AGGREGATION_SENSITIVE_COLUMNS.some((col) => new RegExp(`\\b${col}\\b`, "i").test(sql));
}

function sqlHasAggregation(sql: string): boolean {
  return /\b(SUM|AVG|COUNT|MAX|MIN)\s*\(/i.test(sql) && /\bGROUP\s+BY\b/i.test(sql);
}

function sqlGroupsByDimension(sql: string): boolean {
  return /\b(site|site_name|location|loc_nbr|location_dim)\b/i.test(sql);
}

function sqlJoinsPerWeekTableWithoutWeekKey(sql: string, table: string): boolean {
  if (!sqlReferencesTable(sql, table)) return false;
  const joinClauseMatch = sql.match(new RegExp(`JOIN\\s+[\\w.]*${table}\\s+(?:\\w+\\s+)?ON\\s+([^\\n]+?)(?:\\s+(?:JOIN|WHERE|GROUP|ORDER|$))`, "i"));
  if (!joinClauseMatch) return false;
  const onClause = joinClauseMatch[1];
  const hasWeekKey = /yrpdwk|greg_wk_begin_dt|week_dim/i.test(onClause) || (/fiscal_year/i.test(onClause) && /fiscal_period/i.test(onClause) && /fiscal_week/i.test(onClause));
  return !hasWeekKey;
}

export function checkSqlAggregation(sql?: string | null): SqlAggregationWarning | null {
  if (!sql || !sql.trim()) return null;
  for (const table of PER_WEEK_JOIN_SENSITIVE_TABLES) {
    if (sqlJoinsPerWeekTableWithoutWeekKey(sql, table)) {
      return {
        sql, table,
        reason: `Query joins ${table} without matching the full week key (yrpdwk, or fiscal_year+fiscal_period+fiscal_week).\nThis can fan out across unrelated time periods, inflating or duplicating values.`,
      };
    }
  }
  const matchedTable = AGGREGATION_SENSITIVE_TABLES.find((table) => sqlReferencesTable(sql, table));
  if (!matchedTable) return null;
  if (!sqlReferencesSensitiveColumn(sql) || !sqlGroupsByDimension(sql) || sqlHasAggregation(sql)) return null;
  return {
    sql, table: matchedTable,
    reason: `Query references ${matchedTable} with a per-site/location grouping intent but no SUM()/GROUP BY.\nThis table has multiple rows per site per week - results may be understated partial values rather than true totals.`,
  };
}

function logSqlAggregationWarning(results: AzureFunctionAttachmentResult[] = []) {
  for (const result of results) {
    const warning = checkSqlAggregation(result?.sql);
    if (warning) console.warn(`[Genie SQL check] Possible data accuracy issue in generated SQL (table: ${warning.table}).\n${warning.reason}\nSQL:\n${warning.sql}`);
  }
}

function findColumnIndex(columns: string[], patterns: RegExp[]): number {
  const normalized = columns.map((c) => c.toLowerCase().trim());
  for (const pattern of patterns) {
    const idx = normalized.findIndex((c) => pattern.test(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

function tableToStructuredRecommendations(table: GenieTableData): StructuredRecommendation[] {
  if (!table.columns?.length || !table.rows?.length) return [];

  const titleIdx = findColumnIndex(table.columns, [/recommendation_title/, /title/, /^recommendation$/]);
  const issueIdx = findColumnIndex(table.columns, [/what_happened/, /^issue/, /issue/, /description/, /causal/]);
  const actionIdx = findColumnIndex(table.columns, [/what_to_do_now/, /action.*step/, /^action$/, /guidance/]);
  const responsibilityIdx = findColumnIndex(table.columns, [/who_should_act/, /responsib/, /owner/, /^role$/]);
  const timelineIdx = findColumnIndex(table.columns, [/when_to_act/, /timeline/, /when/, /urgency/]);
  const benefitIdx = findColumnIndex(table.columns, [/expected_benefit/, /benefit/, /savings/, /impact/]);
  const priorityIdx = findColumnIndex(table.columns, [/priority_level/, /priorit/]);

  if (actionIdx === -1 && titleIdx === -1) return [];

  const uniqueRecs: StructuredRecommendation[] = [];
  const seen = new Set<string>();

  for (const row of table.rows) {
    const title = titleIdx !== -1 ? String(row[titleIdx] ?? "").trim() : "";
    const action = actionIdx !== -1 ? String(row[actionIdx] ?? "").trim() : "";
    const issue = issueIdx !== -1 ? String(row[issueIdx] ?? "").trim() : "";

    if (!title && !action) continue;

    const dedupKey = (title || action).toLowerCase();

    if (!seen.has(dedupKey)) {
      seen.add(dedupKey);
      uniqueRecs.push({
        title: title || "", 
        issue,
        action,
        responsibility: responsibilityIdx !== -1 ? String(row[responsibilityIdx] ?? "").trim() : undefined,
        timeline: timelineIdx !== -1 ? String(row[timelineIdx] ?? "").trim() : undefined,
        expectedBenefit: benefitIdx !== -1 ? String(row[benefitIdx] ?? "").trim() : undefined,
        priority: priorityIdx !== -1 ? String(row[priorityIdx] ?? "").trim() : undefined,
      });
    }
  }

  return uniqueRecs.slice(0, 5);
}

async function fetchStructuredRecommendations(userPrompt: string): Promise<StructuredRecommendation[]> {
  const compiledPrompt = buildReportPrompt(
    `Based on the analysis for "${userPrompt}", using vw_recommendations_granular (or rpt_recommendations_granular), pull the most relevant recommendations, prioritized by priority level (Critical first) and urgency score. You MUST return exactly these column names (do NOT use aliases): recommendation_title, what_happened, what_to_do_now, who_should_act, when_to_act, expected_benefit, priority_level. Limit to the top 5 distinct actions.`
  );
  try {
    const body = await callAzureGenie(compiledPrompt);
    const results = Array.isArray(body.results) ? body.results : [];
    const firstTableResult = results.find(isTableResult);
    const table = firstTableResult ? toGenieTableData(firstTableResult) : null;

    if (!table) return [];
    return tableToStructuredRecommendations(table);
  } catch (error) {
    console.warn("Structured recommendations fetch failed, will fall back.", error);
    return [];
  }
}

function cleanReportTitle(prompt: string): string {
  const maxLength = 70;
  const trimmed = prompt.trim();
  if (trimmed.length <= maxLength) return `North America CPG Report: ${trimmed}`;
  const truncated = trimmed.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  const safeTruncated = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return `North America CPG Report: ${safeTruncated}...`;
}

async function fetchSection(sectionPrompt: string): Promise<GenieSection> {
  const compiledPrompt = buildReportPrompt(sectionPrompt);
  const body = await callAzureGenie(compiledPrompt);
  const results = Array.isArray(body.results) ? body.results : [];
  const firstTableResult = results.find(isTableResult);
  const table = firstTableResult ? toGenieTableData(firstTableResult) : null;
  const rawText = firstNonEmptyText(results);
  const text = formatReportSectionText(rawText);
  return { text, table, ranking: null };
}

async function fetchRecommendations(userPrompt: string): Promise<string[]> {
  const compiledPrompt = buildReportPrompt(
    `Based on the analysis for "${userPrompt}", list 4 concise, specific, actionable recommendations. Return only a plain numbered list with no extra commentary.`
  );
  const body = await callAzureGenie(compiledPrompt);
  const results = Array.isArray(body.results) ? body.results : [];
  const rawText = formatReportSectionText(firstNonEmptyText(results));
  return (rawText ?? "")
    .split(/\n+/)
    .map((line) => line.replace(/^\d+[.)]\s*/, "").replace(/^Insight:\s*/i, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

export async function buildGenieReport(prompt: string): Promise<GenieStructuredReport> {
  if (!prompt?.trim()) throw new Error("Prompt is required");

  const [executiveSummary, trendAnalysis, keyDrivers, locationBreakdown] = await Promise.all([
    // FIX 1: Tell Genie to focus on the specific metric requested, not general "loss and waste"
    fetchSection(`For the query "${prompt}", provide an executive summary focusing specifically on the metric requested (e.g., damages, stales, or overall waste). You MUST include a summary data table of key metrics.`),
    
    fetchSection(`For the query "${prompt}", show the trend of stales, damages, and inventory variance. You MUST group the data by week (e.g., greg_wk_begin_dt) AND site. The final table MUST include a specific date column for the X-axis.`),
    
    // FIX 2: Explicitly tell Genie to filter vw_recommendations_granular by wastage_type to match the user's intent!
    fetchSection(`For the query "${prompt}", using vw_recommendations_granular, identify the top causal drivers specifically for the metric requested (e.g., if the user asked for damages, filter WHERE wastage_type ILIKE '%Damages%'). Rank by dollar impact (limit to the top 3 drivers per site). You MUST join on the full week key, but the final output MUST be grouped ONLY by site and causal name. Do NOT include week, date, or yrpdwk columns in the final SELECT or GROUP BY so the causes aggregate properly across the time period. Include a ranked table.`),
    
    fetchSection(`For the query "${prompt}", break down stales, damages, and inventory variance by site or location. Include a table.`),
    fetchSection(`
      For the query "${prompt}", provide a site-wise breakdown of financial impact. 
      Use this specific logic to avoid duplication:
      WITH DisappearanceAgg AS (
        SELECT loc_nbr, SUM(inventory_variance_amt) as inventory_variance 
        FROM daalabs_adb_001.dis_pfna_fgwr.rpt_agg_disapperances_causal_summary
        GROUP BY loc_nbr
      )
      SELECT 
        l.site_name, 
        SUM(s.stales) as stales, 
        SUM(s.damages) as damages, 
        SUM(d.inventory_variance) as inventory_variance,
        SUM(s.stales) + SUM(s.damages) + SUM(d.inventory_variance) as total_impact
      FROM daalabs_adb_001.dis_pfna_fgwr.rpt_agg_summary s
      JOIN daalabs_adb_001.dis_pfna_fgwr.location_dim l ON s.loc_nbr = l.loc_nbr
      JOIN daalabs_adb_001.dis_pfna_fgwr.week_dim wd ON s.yrpdwk = wd.yrpdwk
      JOIN DisappearanceAgg d ON s.loc_nbr = d.loc_nbr
      WHERE wd.current_week_flag = 1
      GROUP BY l.site_name
    `),
  ]);

  const structuredRecommendations = await fetchStructuredRecommendations(prompt);


  let recommendations: string[] = [];

  if (structuredRecommendations.length > 0) {
    recommendations = structuredRecommendations.map((rec) => {
      if (rec.title) return rec.title;
      return rec.action.split('\n')[0].replace(/^\d+[\.\)]\s*/, '').trim();
    });
  } else {
    const fallbackRecommendations = await fetchRecommendations(prompt);
    recommendations = fallbackRecommendations.length > 0
      ? fallbackRecommendations
      : [
          "Review top-loss sites weekly and compare actuals versus forecast.",
          "Drill into site-product combinations with repeated loss variance.",
          "Investigate route, sales class, and order-level drivers behind high-loss pockets.",
          "Track recurring inventory variance and exception patterns for escalation.",
        ];
  }

  return {
    title: cleanReportTitle(prompt),
    sourcePrompt: prompt,
    generatedAt: new Date().toISOString(),
    executiveSummary,
    trendAnalysis,
    keyDrivers,
    locationBreakdown,
    recommendations,
    structuredRecommendations: structuredRecommendations.length > 0 ? structuredRecommendations : undefined,
  };
}
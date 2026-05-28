interface GenieColumn {
  name: string;
}

interface GenieStatementResponse {
  manifest?: {
    schema?: {
      columns?: GenieColumn[];
    };
  };
  result?: {
    data_array?: Array<Array<string | number | null>>;
  };
}

interface GenieResult {
  text?: string | null;
  sql?: string | null;
  data?: {
    statement_response?: GenieStatementResponse;
  } | null;
}

interface GenieApiResponse {
  results?: GenieResult[];
}

export interface GenieTableData {
  columns: string[];
  rows: string[][];
}

export interface GenieRichResponse {
  text: string;
  tables: GenieTableData[];
  hasSql: boolean;
}

export type GenieResponse =
  | { type: "text"; text: string }
  | { type: "table"; text?: string; table: GenieTableData };

const BASE_URL ="https://genie-g6atf2bzegdeh4gj.canadacentral-01.azurewebsites.net/api/genie-query"

const normalizePlainText = (input?: string | null): string => {
  if (!input) return "";

  const lines = input
    .replace(/\r/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let listIndex = 1;
  const normalizedLines = lines.map((line) => {
    if (/^[-*•]\s+/.test(line)) {
      const content = line.replace(/^[-*•]\s+/, "").trim();
      return `${listIndex++}. ${content}`;
    }
    return line;
  });

  return normalizedLines.join("\n");
};

const extractTableData = (statement?: GenieStatementResponse): GenieTableData | null => {
  const columns = statement?.manifest?.schema?.columns ?? [];
  const rows = statement?.result?.data_array ?? [];

  if (!columns.length || !rows.length) return null;

  const header = columns.map((col) => col.name);
  const normalizedRows = rows.slice(0, 20).map((row) => {
    return header.map((_, colIndex) => String(row[colIndex] ?? "-"));
  });

  return {
    columns: header,
    rows: normalizedRows,
  };
};

const parseGenieResponse = (data: GenieApiResponse): GenieRichResponse => {
  const results = data.results ?? [];
  const bestText = results
    .map((result) => result.text?.trim())
    .find((text) => Boolean(text));

  const plainBestText = normalizePlainText(bestText);

  const tables = results
    .map((result) => extractTableData(result.data?.statement_response))
    .filter((table): table is GenieTableData => Boolean(table));

  const hasSql = results.some((result) => Boolean(result.sql));

  return {
    text: plainBestText,
    tables,
    hasSql,
  };
};

async function fetchGenie(prompt: string): Promise<GenieApiResponse> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question: prompt }),
  });

  if (!res.ok) {
    throw new Error(`Genie API failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as GenieApiResponse;
  console.log("Genie raw response:", data);
  return data;
}

export async function askGenieRich(prompt: string): Promise<GenieRichResponse> {
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  try {
    const data = await fetchGenie(prompt);

    if (!data.results || data.results.length === 0) {
      throw new Error("No results returned from API");
    }

    return parseGenieResponse(data);
  } catch (error) {
    console.error("Error calling Genie API:", error);
    throw error;
  }
}

export async function askGenie(prompt: string): Promise<GenieResponse> {
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  try {
    const parsed = await askGenieRich(prompt);

    if (parsed.tables.length > 0) {
      return {
        type: "table",
        text: parsed.text,
        table: parsed.tables[0],
      };
    }

    if (parsed.text) {
      return {
        type: "text",
        text: parsed.text,
      };
    }

    if (parsed.hasSql) {
      return {
        type: "text",
        text: "Query executed successfully. No text summary was returned.",
      };
    }

    return {
      type: "text",
      text: "No readable response text was returned by the API.",
    };
  } catch (error) {
    console.error("Error calling Genie API:", error);
    throw error;
  }
}
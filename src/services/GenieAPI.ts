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

export type GenieResponse =
  | { type: "text"; text: string }
  | { type: "table"; text?: string; table: GenieTableData };

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

export async function askGenie(prompt: string): Promise<GenieResponse> {
  const BASE_URL =
    "https://genie-api-fgwr-b3a3fng3hge2geb2.centralindia-01.azurewebsites.net/api/genie-query";

  if (!prompt) {
    throw new Error("Prompt is required");
  }

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: prompt }), // ✅ IMPORTANT
    });

    if (!res.ok) {
      throw new Error(`Genie API failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as GenieApiResponse;
    console.log("Genie raw response:", data);

    if (data.results && data.results.length > 0) {
      const bestText = data.results
        .map((result) => result.text?.trim())
        .find((text) => Boolean(text));
      const plainBestText = normalizePlainText(bestText);

      const firstTable = data.results
        .map((result) => extractTableData(result.data?.statement_response))
        .find((table) => Boolean(table));

      if (firstTable) {
        return {
          type: "table",
          text: plainBestText,
          table: firstTable,
        };
      }

      if (plainBestText) {
        return {
          type: "text",
          text: plainBestText,
        };
      }

      const hasSql = data.results.some((result) => Boolean(result.sql));
      if (hasSql) {
        return {
          type: "text",
          text: "Query executed successfully. No text summary was returned.",
        };
      }

      return {
        type: "text",
        text: "No readable response text was returned by the API.",
      };
    }

    throw new Error("No results returned from API");
  } catch (error) {
    console.error("Error calling Genie API:", error);
    throw error;
  }
}
import React, { useState } from "react";
import { askGenie, type GenieResponse } from "../../services/GenieAPI";

const GenieDemo: React.FC = () => {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<GenieResponse | null>(null);

  const handleAsk = async () => {
    try {
      const res = await askGenie(input);
      setAnswer(res);
    } catch (err) {
      setAnswer({
        type: "text",
        text: "Error fetching response. Check console/logs.",
      });
    }
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask Genie something..."
      />
      <button onClick={handleAsk}>Ask</button>
      <div>
        <p>Response:</p>
        {answer?.type === "table" && answer.table ? (
          <div>
            {answer.text && <p>{answer.text}</p>}
            <table>
              <thead>
                <tr>
                  {answer.table.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {answer.table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{answer?.text ?? ""}</p>
        )}
      </div>
    </div>
  );
};

export default GenieDemo;

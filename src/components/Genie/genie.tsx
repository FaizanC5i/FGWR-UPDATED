import React, { useState } from "react";
import { askGenie } from "../../services/GenieAPI";

const GenieDemo: React.FC = () => {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = async () => {
    try {
      const res = await askGenie(input);
      setAnswer(res);
    } catch (err) {
      setAnswer("Error fetching response. Check console/logs.");
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
      <p>Response: {answer}</p>
    </div>
  );
};

export default GenieDemo;

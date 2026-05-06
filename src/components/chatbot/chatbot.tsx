import React, { useState } from "react";
import {ChevronDown, Send, X } from "lucide-react";
import { askGenie, type GenieResponse } from "../../services/GenieAPI";
import aichat from "../../assets/aichat.gif";

interface Message {
  text?: string;
  table?: {
    columns: string[];
    rows: string[][];
  };
  type: "text" | "table";
  sender: "user" | "ai";
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
  const [error, setError] = useState<string | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(true);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
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
    setError(null);

    try {
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
                  Ask intelligent questions about waste management data
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
                      {msg.text && <p>{msg.text}</p>}
                      <div className="overflow-x-auto">
                        <table className="text-xs min-w-full border border-gray-300 bg-white text-gray-800">
                          <thead className="bg-gray-100">
                            <tr>
                              {msg.table.columns.map((column) => (
                                <th key={column} className="px-2 py-1 border border-gray-300 text-left font-semibold">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.table.rows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                  <td key={`${rowIndex}-${cellIndex}`} className="px-2 py-1 border border-gray-300">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div>{msg.text}</div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="bg-gray-200 text-gray-800 self-start p-2 rounded-lg">
                  Thinking...
                </div>
              )}
              {error && (
                <div className="text-red-500 text-xs p-2 bg-red-50 rounded-lg">
                  {error}
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
              <div className="flex">
                <input
                  type="text"
                  placeholder="Ask me anything..."
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

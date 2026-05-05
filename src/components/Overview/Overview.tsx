import React from "react";
import { PieChart, Pie, Cell } from "recharts";
import {
  MapPin,
  Send,
  MessageCircle,
  ChevronDown,
  Activity,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { askGenie } from "../../services/GenieAPI";

interface Message {
  text: string;
  sender: "user" | "ai";
}

const data = [
  { name: "Stales", value: 2800, color: "#facc15" }, // yellow
  { name: "Damages", value: 433, color: "#f87171" }, // red
];

// const geoCities = [
//     { name: "Boston", x: "85%", y: "15%" },
//     { name: "New York", x: "82%", y: "25%" },
//     { name: "Chicago", x: "60%", y: "30%" },
//     { name: "Denver", x: "45%", y: "45%" },
//     { name: "Los Angeles", x: "15%", y: "55%" },
//     { name: "Phoenix", x: "25%", y: "65%" },
//     { name: "Atlanta", x: "70%", y: "65%" }
//   ];

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

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("chatbot");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // 👇 3. ADD STATE FOR THE CHATBOT
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showQuickStart, setShowQuickStart] = useState(true);
  const [showAlertPopup, setShowAlertPopup] = useState(false);

  const [showActionPopup, setShowActionPopup] = useState(false);
  const [actionAlertId, setActionAlertId] = useState("");

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSendAlert = () => {
    setShowAlertPopup(true);
  };

  const handleTakeAction = (alertId: string, alertType: string) => {
    setActionAlertId(`${alertId} - ${alertType}`);
    setShowActionPopup(true);
  };

  useEffect(() => {
    if (showAlertPopup) {
      const timer = setTimeout(() => {
        setShowAlertPopup(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlertPopup]);

  useEffect(() => {
    if (showActionPopup) {
      const timer = setTimeout(() => {
        setShowActionPopup(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showActionPopup]);

  const handleSendMessage = async (currentPrompt: string) => {
    if (!currentPrompt.trim() || isLoading) return;

    if (showQuickStart) setShowQuickStart(false);

    // Add user's message to the chat
    setMessages((prev) => [...prev, { text: currentPrompt, sender: "user" }]);
    setPrompt(""); // Clear input field
    setIsLoading(true);
    setError(null);

    try {
      const response = await askGenie(currentPrompt);
      // Add AI's response to the chat
      setMessages((prev) => [...prev, { text: response, sender: "ai" }]);
    } catch (err) {
      setError("Sorry, something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-h-screen bg-gray-50">
      {/* Filters */}
      <div className="flex gap-4 mb-3">
        {["Region", "Business", "Site Name", "Sales class"].map((label) => {
          const id = label.toLowerCase().replace(/\s+/g, "-");
          return (
            <div key={label} className="flex flex-row items-center gap-2">
              <label htmlFor={id} className="text-xs text-gray-600 mb-1">
                {label}
              </label>
              <select
                id={id}
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
              >
                <option>All</option>
              </select>
            </div>
          );
        })}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Overall */}
            <div className="h-[220px] bg-white rounded-2xl shadow flex flex-col">
              {/* Header */}
              <div className="bg-[#F3F9FD] p-3 pb-2 rounded-t-2xl">
                {/* Icon + Text */}
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-[#1180E6] to-[#43C6F9] p-2 rounded-full">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 3v18h18" />
                      <path d="M8 17v-7" />
                      <path d="M12 17v-4" />
                      <path d="M16 17V9" />
                    </svg>
                  </div>

                  <div>
                    <h2 className="font-semibold text-sm text-gray-800">
                      Overall
                    </h2>
                    <p className="text-xs text-gray-500">
                      Comprehensive waste analytics dashboard
                    </p>
                  </div>
                </div>
                {/* Blue line (gradient) */}
                <div className="h-0.5 w-full bg-[#1180E6] mt-2 mb-1" />
              </div>

              {/* Chart + Center value */}
              <div className="flex-1 flex flex-col justify-center items-center relative">
                <PieChart width={100} height={100}>
                  <Pie
                    data={data}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={50}
                    paddingAngle={0}
                  >
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                {/* Centered value */}
                <p className="absolute text-sm font-bold">$3,233</p>
              </div>

              {/* Footer with stats */}
              <div className="flex flex-col items-center">
                <span className="text-green-600 text-xs">-14.7% vs 2024</span>
                <div className="flex gap-4 mt-1 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    Stales
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    Damages
                  </span>
                </div>
              </div>
            </div>

            {/* Alert */}
            <div className="h-[220px] bg-white rounded-2xl shadow flex flex-col">
              <div className="bg-[#F3F9FD] p-3 rounded-t-lg mb-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  {/* Left side */}
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-[#1180E6] to-[#43C6F9] p-2 rounded-full">
                      <Activity className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-800 text-sm">
                        Alert
                      </h2>
                      <p className="text-xs text-gray-500">
                        Real-time product alerts
                      </p>
                    </div>
                  </div>

                  {/* Button */}
                  <button
                    onClick={handleSendAlert}
                    className="bg-[#1180E6] hover:bg-blue-600 text-white px-4 py-1 rounded-lg text-xs font-semibold shadow"
                  >
                    Send Alert
                  </button>
                </div>

                {/* Bottom line */}
                <div className="h-0.5 w-full bg-[#1180E6] mt-3 rounded-full" />
              </div>

              {/* Scrollable container (fix height here) */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-3">
                {/* Alert Cards */}
                {[
                  {
                    id: "#0006373456",
                    amount: "$18,560.45",
                    location: "Miami",
                    type: "Weight",
                    alert: "Stale Alert",
                    color: "orange",
                  },
                  {
                    id: "#0006372829",
                    amount: "$24,789.90",
                    location: "New York",
                    type: "Expiry Date",
                    alert: "Damage Alert",
                    color: "red",
                  },
                  {
                    id: "#0006375893",
                    amount: "$15,892.33",
                    location: "Seattle",
                    type: "Quality Issue",
                    alert: "Damage Alert",
                    color: "red",
                  },
                  {
                    id: "#0006374782",
                    amount: "$32,145.78",
                    location: "Washington",
                    type: "Low Demand",
                    alert: "Variance Alert",
                    color: "blue",
                  },
                ].map((alert, index) => (
                  <div
                    key={index}
                    className="border rounded-md p-2 m-4 mt-1 flex flex-col justify-between relative h-[100px] text-xs"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-${alert.color}-400 rounded-l-md`}
                    ></div>
                    <div className="flex justify-between items-center">
                      <p className="text-blue-600 font-medium text-[11px]">
                        {alert.id}
                      </p>
                      <p className="text-red-500 text-sm font-bold">
                        {alert.amount}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-1 text-gray-600 text-[11px]">
                        <MapPin className="w-3 h-3" /> {alert.location}
                      </div>
                      <span
                        className={`bg-${alert.color}-400 text-white text-[10px] px-2 py-0.5 rounded-md`}
                      >
                        {alert.type}
                      </span>
                    </div>
                    <hr className="my-1" />
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1 text-[11px] text-gray-700">
                        <span
                          className={`w-1.5 h-1.5 rounded-full bg-${alert.color}-400`}
                        ></span>
                        {alert.alert}
                      </span>
                      <div className="flex gap-2">
                        <button className="text-[11px] text-gray-700 hover:text-blue-600">
                          Details
                        </button>
                        <button
                          onClick={() => handleTakeAction(alert.id, alert.type)}
                          className="bg-blue-500 text-white px-2 py-0.5 rounded-md text-[11px]"
                        >
                          Take Action
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Geographic Distribution */}
          <div className="h-[230px] col-span-8 bg-white rounded-2xl shadow">
            <div className="bg-[#F3F9FD] p-3 rounded-t-lg mb-1">
              <div className="flex items-center justify-between">
                {/* Left side: Icon + text */}
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-r from-[#1180E6] to-[#43C6F9] p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 11c.828 0 1.5-.672 1.5-1.5S12.828 8 12 8s-1.5.672-1.5 1.5S11.172 11 12 11z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 22s8-4.5 8-11a8 8 0 10-16 0c0 6.5 8 11 8 11z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800 text-sm">
                      Geographic Distribution
                    </h2>
                    <p className="text-xs text-gray-500">
                      Interactive US map with real-time waste analytics
                    </p>
                  </div>
                </div>

                {/* Right side: Live data */}
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 bg-[#6AC9EA] rounded-full"></span>
                  <span className="text-xs text-gray-600 font-medium">
                    Live Data
                  </span>
                </div>
              </div>

              {/* Bottom border/line */}
              <div className="h-0.5 w-full bg-[#1180E6] mt-3 rounded-full" />
            </div>

            {/* Power BI iframe */}
            <div className="relative border rounded-lg h-[160px] overflow-hidden overflow-y-auto">
              <iframe
                title="chocolate_sales_final"
                width="100%"
                height="100%"
                src="https://app.powerbi.com/view?r=eyJrIjoiYThhZjFjNDktNmQxNi00YTA0LWJhZTktOTY5ODQwODA4MzdhIiwidCI6ImI1YWYyNDUxLWUyMWItNGFhMi1iNGI1LWRjNTkwNzkwOGRkOCJ9"
                frameBorder="0"
                allowFullScreen={true}
              />
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="col-span-4 bg-white rounded-2xl h-[460px] shadow flex flex-col">
          <div className="bg-[#F3F9FD] p-3 rounded-t-lg mb-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-[#1180E6] to-[#43C6F9] p-2 rounded-full">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-gray-800 flex items-center gap-1">
                  AI Assistant
                </h2>
                <p className="text-xs text-gray-500">
                  Intelligent Data Analysis
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-3 ml-2 border border-gray-300 bg-[#FBFEFF] p-1 mr-[8px] pl-1 rounded-lg">
              <button
                onClick={() => setActiveTab("chatbot")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition w-36 ${
                  activeTab === "chatbot"
                    ? "bg-blue-500 text-white shadow"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Chatbot
              </button>
              <button
                onClick={() => setActiveTab("faq")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition w-36 ${
                  activeTab === "faq"
                    ? "bg-blue-500 text-white shadow"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                General FAQ
              </button>
            </div>

            {/* Bottom line with gradient */}
            <div className="h-0.5 w-full mt-3 rounded-full bg-gradient-to-r from-[#1180E6] to-[#43C6F9]" />
          </div>

          {/* Chatbot */}
          {/* 👇 5. UPDATE THE CHATBOT UI */}
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
                    className={`p-2 rounded-lg max-w-[85%] ${
                      msg.sender === "user"
                        ? "bg-blue-500 text-white self-end ml-auto"
                        : "bg-gray-200 text-gray-800 self-start"
                    }`}
                  >
                    {msg.text}
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
                      "Show me the total number of tables",
                      "Provide a summary of the week_dim table",
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
                    className="bg-blue-500 text-white px-4 rounded-r-lg disabled:bg-blue-300"
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading || !prompt.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* FAQ */}
          {activeTab === "faq" && (
            <div className="space-y-2 p-4">
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
        </div>
      </div>
      {showAlertPopup && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[300px] animate-in slide-in-from-right-5 fade-in-0 duration-300 z-50">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-sm">
                Alert Sent
              </h3>
            </div>
            <button
              onClick={() => setShowAlertPopup(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Notifications sent to relevant teams
          </p>
          {/* Progress bar for auto-hide */}
        </div>
      )}

      {showActionPopup && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[300px] animate-in slide-in-from-right-5 fade-in-0 duration-300 z-50">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-sm">
                Action Initiated
              </h3>
            </div>
            <button
              onClick={() => setShowActionPopup(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Taking action on alert {actionAlertId}
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

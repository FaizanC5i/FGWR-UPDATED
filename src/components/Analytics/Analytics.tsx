"use client";
import React, { useState, useEffect } from "react";
import AIAssistant from "../chatbot/chatbot";
import FloatingAlerts from "../Alert/Alert";
import { HiOutlineSparkles } from "react-icons/hi2";

const Analytics: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  
  // Disable body scroll when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Re-enable on unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, []);
  
  return (
    <div className="w-full h-screen overflow-hidden">
      <iframe
        title="PowerBI Report"
        src="https://app.powerbi.com/view?r=eyJrIjoiYTgwZDRkNWYtMmE2OC00MDI2LTg5YjItNDhmODE3ZWZjMjcwIiwidCI6ImI1YWYyNDUxLWUyMWItNGFhMi1iNGI1LWRjNTkwNzkwOGRkOCJ9&pageName=33dd7ddcc0277832cc45"
        style={{ border: "none" }}
        className="w-full h-full"
        allowFullScreen
      />

      <button
        onClick={() => setIsChatOpen(true)}
        className="border-4 border-white fixed bottom-4 right-4 bg-gradient-to-r from-[#0a7be4] to-[#43C6F9] text-white rounded-full px-4 py-4 shadow-lg z-40 transition-colors duration-200"
        aria-label="Open AI Assistant Chat"
      >
        <HiOutlineSparkles className="h-6 w-6" />
      </button>

      {isChatOpen && (
        <AIAssistant
          isFloating={true}
          onClose={() => setIsChatOpen(false)}
          defaultTab="chatbot"
        />
      )}

      <FloatingAlerts
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />
    </div>
  );
};

export default Analytics;
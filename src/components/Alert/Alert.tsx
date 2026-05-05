import React, { useState, useEffect } from "react";
import { MapPin, Activity, X } from "lucide-react";

interface FloatingAlertsProps {
  isOpen: boolean;
  onClose: () => void;
}

const FloatingAlerts: React.FC<FloatingAlertsProps> = ({ isOpen, onClose }) => {
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [actionAlertId, setActionAlertId] = useState("");

//   const handleSendAlert = () => {
//     setShowAlertPopup(true);
//   };

  const handleTakeAction = (alertId: string, alertType: string) => {
    setActionAlertId(`${alertId} - ${alertType}`);
    setShowActionPopup(true);
  };

  useEffect(() => {
    if (showAlertPopup) {
      const timer = setTimeout(() => setShowAlertPopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlertPopup]);

  useEffect(() => {
    if (showActionPopup) {
      const timer = setTimeout(() => setShowActionPopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showActionPopup]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-50 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed top-1/2 right-0 transform -translate-y-1/2 w-96 h-full bg-white rounded-l-2xl shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-[#F3F9FD] p-3 rounded-t-lg">
          <div className="flex items-center justify-between mb-2">
            {/* Left side */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-[#1180E6] to-[#43C6F9] p-2 rounded-full">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">Real-time Alerts</h2>
                <p className="text-xs text-gray-500">Product monitoring & alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* <button
                onClick={handleSendAlert}
                className="bg-[#1180E6] hover:bg-blue-600 text-white px-1 py-1 rounded-lg text-sm font-semibold shadow transition-colors"
              >
                Send Alert
              </button> */}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="h-0.5 w-full bg-[#1180E6] mt-4 rounded-full" />
        </div>

        {/* Alert List */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ height: "calc(100% - 110px)" }}
        >
          {[
            {
              id: "#0006373456",
              amount: "$18,560.45",
              location: "Miami",
              type: "Weight",
              alert: "Stale Alert",
              color: "#FFECD2",
              bgColor: "#005CC9",
            },
            {
              id: "#0006372829",
              amount: "$24,789.90",
              location: "New York",
              type: "Expiry Date",
              alert: "Damage Alert",
              color: "#FEEFEF",
              bgColor: "#6DB7FA",
            },
            {
              id: "#0006375893",
              amount: "$15,892.33",
              location: "Seattle",
              type: "Quality Issue",
              alert: "Damage Alert",
              color: "#FEEFEF",
              bgColor: "#6DB7FA",
            },
            {
              id: "#0006374782",
              amount: "$32,145.78",
              location: "Washington",
              type: "Low Demand",
              alert: "Damage Alert",
              color: "#FFECD2",
              bgColor: "#6DB7FA",
            },
            {
              id: "#0006375124",
              amount: "$27,340.12",
              location: "Chicago",
              type: "Temperature",
              alert: "Stale Alert",
              color: "#FEEFEF",
              bgColor: "#005CC9",
            },
            {
              id: "#0006376789",
              amount: "$19,875.67",
              location: "Denver",
              type: "Packaging",
              alert: "Damage Alert",
              color: "#FEEFEF",
              bgColor: "#6DB7FA",
            },
          ].map((alert, index) => (
            <div
              key={index}
              className="border rounded-md p-2 m-4 mt-1 flex flex-col justify-between relative h-[100px] text-xs"
            >
              <div
                style={{ backgroundColor: alert.bgColor }}
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg`}
              ></div>
              <div className="flex justify-between items-center">
                <p className="text-blue-600 font-medium text-[11px]">{alert.id}</p>
                <p className="text-red-500 text-sm font-bold">{alert.amount}</p>
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="flex items-center gap-1 text-gray-600 text-[11px]">
                  <MapPin className="w-3 h-3" /> {alert.location}
                </div>
                <span
                  style={{ backgroundColor: alert.color }}
                  className={` text-gray-700 text-[10px] px-2 py-0.5 rounded-md`}
                >
                  {alert.type}
                </span>
              </div>
              <hr className="my-1" />
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-[11px] text-gray-700">
                  <span
                  style={{ backgroundColor: alert.bgColor }}
                    className={`w-1.5 h-1.5 rounded-full `}
                  ></span>
                  {alert.alert}
                </span>
                <div className="flex gap-2">
                  <button className="text-[11px] text-gray-700 hover:text-blue-600">
                    Details
                  </button>
                  <button
                    onClick={() => handleTakeAction(alert.id, alert.type)}
                    className="bg-gradient-to-r from-[#1180E6] to-[#43C6F9] text-white px-2 py-0.5 rounded-md text-[11px]"
                  >
                    Send Alert
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast-like popups */}
      {showAlertPopup && (
        <div className="fixed top-6 left-[500px] bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[300px] z-50 animate-in slide-in-from-right-5 fade-in-0 duration-300">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-800 text-sm">
              Alert Sent Successfully
            </h3>
            <button
              onClick={() => setShowAlertPopup(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-600 text-xs">
            Notifications sent to all relevant teams
          </p>
        </div>
      )}

      {showActionPopup && (
        <div className="fixed top-6 left-[500px] bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[300px] z-50 animate-in slide-in-from-right-5 fade-in-0 duration-300">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-800 text-sm">Action Initiated</h3>
            <button
              onClick={() => setShowActionPopup(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-600 text-xs">
            Taking action on alert {actionAlertId}
          </p>
        </div>
      )}
    </>
  );
};

export default FloatingAlerts;

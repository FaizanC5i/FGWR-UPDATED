import React from "react";

const GENIE_SPACE_URL =
  "https://adb-7465636157854702.2.azuredatabricks.net/genie/rooms/01f07807f128108f8d11129cbe175fe7?utm_source=databricks-one&o=7465636157854702";

const quickPrompts = [
  "Give me a detailed report on Total damages in latest quarter",
  "Analyse stales performance across all locations",
  "What are the root causes of waste increase this period?",
];

const ReportsPage: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4 md:p-5">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-[#eaf5ff] to-[#f3fbff] p-4 md:p-5">
          <h2 className="text-xl font-semibold text-[#0F1F3D]">AI Report Builder</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ask any question to generate a detailed report with charts and PDF export.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-slate-700">Quick Prompts</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-[#d5e6ff] bg-[#f4f9ff] px-4 py-2 text-xs font-medium text-[#1f5ea8] transition-colors hover:bg-[#e8f3ff]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <iframe
            src={GENIE_SPACE_URL}
            title="Genie AI Report Builder"
            className="h-[800px] w-full"
            style={{ border: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

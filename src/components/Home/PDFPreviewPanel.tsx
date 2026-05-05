import { RefreshCw, Download, ChevronLeft, ChevronRight, BarChart2, LayoutDashboard } from 'lucide-react';

interface PDFPreviewPanelProps {
  includeCharts: boolean;
  includeAI: boolean;
  includeAnomalies: boolean;
  includeScreenshots: boolean;
  selectedPages: {
    executiveSummary: boolean;
    stales: boolean;
    damages: boolean;
  };
}

export function PDFPreviewPanel({
  includeCharts,
  includeAI,
  includeAnomalies,
  includeScreenshots,
  selectedPages,
}: PDFPreviewPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Preview</span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-slate-100 rounded transition-colors" title="Refresh preview">
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded transition-colors" title="Download PDF">
              <Download className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">Reflects your current settings</p>
      </div>

      {/* PDF Preview Area */}
      <div className="flex-1 bg-[#F5F5F5] rounded-lg p-4 overflow-y-auto">
        <div className="bg-white rounded shadow-lg mx-auto" style={{ width: '380px', aspectRatio: '8.5/11' }}>
          <div className="p-6 text-[10px]">
            {/* PDF Header */}
            <div className="mb-4 pb-3 border-b-2 border-blue-600">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-blue-600 text-xs">C5i</div>
              </div>
              <h2 className="font-bold text-slate-900 text-sm mb-0.5">Weekly Waste Management Briefing</h2>
              <p className="text-[9px] text-slate-500">Week of May 5, 2026 | Prepared by AI</p>
            </div>

            {/* AI Key Highlights Section */}
            {includeAI && (
              <div className="mb-4">
                <h3 className="font-bold text-[11px] text-slate-900 mb-2">AI Key Highlights</h3>
                <div className="space-y-1 text-[9px] text-slate-700 leading-relaxed">
                  <p>• Damages ↑17.6% to $889K — Braintree DC, Product 1234</p>
                  <p>• Stales ↓37.3% to $1,699K — FEFO compliance improving</p>
                  <p>• Total Waste $2,588K — 25.3% improvement vs 2025</p>
                </div>
              </div>
            )}

            {/* Anomaly Recap Section */}
            {includeAnomalies && (
              <div className="mb-4">
                <h3 className="font-bold text-[11px] text-slate-900 mb-2">Active Anomalies</h3>
                <div className="space-y-1 text-[9px] text-slate-700 leading-relaxed">
                  <p className="flex items-start gap-1">
                    <span className="text-red-600">●</span>
                    <span>Loose Case Shipping — $362K · Braintree DC</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-amber-600">●</span>
                    <span>FEFO Misrotation — $742K · All Plants</span>
                  </p>
                </div>
              </div>
            )}

            {/* Chart Placeholder */}
            <div className="mb-4">
              {includeCharts ? (
                <div className="bg-blue-50 rounded overflow-hidden border border-blue-200 flex items-center justify-center" style={{ height: '80px' }}>
                  <div className="flex flex-col items-center gap-1">
                    <BarChart2 className="w-8 h-8 text-blue-400" />
                    <span className="text-[8px] text-blue-500">YTD Comparison Chart</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded overflow-hidden border border-slate-300 opacity-40 flex items-center justify-center" style={{ height: '80px' }}>
                  <div className="flex flex-col items-center gap-1">
                    <BarChart2 className="w-8 h-8 text-slate-300" />
                    <span className="text-[8px] text-slate-400 line-through">YTD Comparison Chart</span>
                  </div>
                </div>
              )}
            </div>

            {/* Screenshots Indicator */}
            <div className="mb-4">
              {includeScreenshots ? (
                <div>
                  <h3 className="font-bold text-[11px] text-slate-900 mb-2">Dashboard Screenshots</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedPages.executiveSummary && (
                      <div className="bg-blue-50 rounded border border-blue-200 flex flex-col items-center justify-center gap-0.5" style={{ height: '50px' }}>
                        <LayoutDashboard className="w-4 h-4 text-blue-400" />
                        <span className="text-[7px] text-blue-500">Exec Summary</span>
                      </div>
                    )}
                    {selectedPages.stales && (
                      <div className="bg-green-50 rounded border border-green-200 flex flex-col items-center justify-center gap-0.5" style={{ height: '50px' }}>
                        <LayoutDashboard className="w-4 h-4 text-green-400" />
                        <span className="text-[7px] text-green-500">Stales</span>
                      </div>
                    )}
                    {selectedPages.damages && (
                      <div className="bg-red-50 rounded border border-red-200 flex flex-col items-center justify-center gap-0.5" style={{ height: '50px' }}>
                        <LayoutDashboard className="w-4 h-4 text-red-400" />
                        <span className="text-[7px] text-red-500">Damages</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="opacity-40">
                  <h3 className="font-bold text-[11px] text-slate-400 mb-2 line-through">Dashboard Screenshots</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Exec Summary', 'Stales', 'Damages'] as const).map((label) => (
                      <div key={label} className="bg-slate-50 rounded border border-slate-300 flex flex-col items-center justify-center gap-0.5" style={{ height: '50px' }}>
                        <LayoutDashboard className="w-4 h-4 text-slate-300" />
                        <span className="text-[7px] text-slate-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PDF Footer */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400">
              <span>Generated by C5i AI · 5/5/2026 · Confidential</span>
              <span>Page 1 of 3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-3 mt-3">
        <button className="p-1 hover:bg-slate-100 rounded transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <span className="text-[11px] text-slate-500">Page 1 of 3</span>
        <button className="p-1 hover:bg-slate-100 rounded transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="mt-2 text-center">
        <span className="text-[10px] text-slate-400">Preview updates live as settings change</span>
      </div>
    </div>
  );
}
